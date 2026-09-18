import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, MessageCircle, Loader2, Mic, MicOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Extend Window for Speech Recognition API
interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-chat`;
const HISTORY_KEY = "virtueyatra.chat.history";
const ANSWER_CACHE_KEY = "virtueyatra.chat.answers";

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

// Offline travel tips — works with zero internet
const OFFLINE_TIPS: { keys: string[]; answer: string }[] = [
  {
    keys: ["goa", "beach", "beaches"],
    answer: `**Goa, offline cheat-sheet** 🏖️\n\n1. **North Goa** — Baga, Calangute, Anjuna (lively, markets, nightlife).\n2. **South Goa** — Palolem, Agonda, Colva (quiet, cleaner, great for families).\n3. **Must-see** — Basilica of Bom Jesus, Fort Aguada, Dudhsagar Falls.\n4. **Best time** — November to February.\n5. **Pro tip** — Rent a scooter (~₹400/day) and always carry your licence.`,
  },
  {
    keys: ["manali", "himachal", "snow", "mountain", "himalaya"],
    answer: `**Manali on a budget** 🏔️\n\n1. **Getting there** — Overnight Volvo bus from Delhi (~₹1,200–1,800).\n2. **Stay** — Old Manali hostels ₹500–900/night.\n3. **Do** — Solang Valley, Hadimba Temple, Jogini Falls trek, Kasol day trip.\n4. **Rohtang/Atal Tunnel** — needs a permit for Rohtang; the tunnel side is free.\n5. **Pack** — Layers + gloves; nights are cold even in summer.`,
  },
  {
    keys: ["budget", "cheap", "money", "cost", "save"],
    answer: `**Budget travel rules of thumb (India)** 💸\n\n1. **Stay** — Hostels ₹500–1,000, budget hotels ₹1,200–2,000.\n2. **Food** — Local thali ₹100–250 beats restaurants every time.\n3. **Transport** — Sleeper trains and state buses are cheapest; book 30+ days ahead.\n4. **Daily budget** — ₹1,500–2,500/day covers most backpacking trips.\n5. **Pro tip** — Travel midweek; weekend prices jump 30–50%.`,
  },
  {
    keys: ["pack", "packing", "luggage", "bag", "carry"],
    answer: `**Packing checklist** 🎒\n\n1. ID proof + printed/offline copies of tickets.\n2. Power bank, charger, universal adapter.\n3. Medicines, ORS, basic first-aid.\n4. Layered clothing + rain jacket in monsoon.\n5. Refillable bottle, sunscreen, sunglasses.\n6. Some cash — UPI fails in remote hill and desert areas.`,
  },
  {
    keys: ["book", "booking", "ticket", "train", "bus", "flight", "hotel", "cab"],
    answer: `**How to book (do this once you're online)** 🎟️\n\n1. **Trains** — IRCTC; open Tatkal at 10am (AC) / 11am (sleeper).\n2. **Buses** — RedBus or the state transport site; pick front seats for less bumps.\n3. **Flights** — Book 3–6 weeks out, Tuesday/Wednesday departures are cheapest.\n4. **Hotels** — Compare MakeMyTrip/Booking, then call the hotel to match the price.\n5. **Cabs** — Ola/Uber in cities; prepaid taxis at airports and stations.`,
  },
  {
    keys: ["best time", "season", "weather", "monsoon", "when to visit"],
    answer: `**When to travel in India** 🗓️\n\n1. **Oct–Mar** — Best overall for most of India.\n2. **Apr–Jun** — Hills (Manali, Ladakh, Sikkim) shine; plains are very hot.\n3. **Jul–Sep** — Monsoon magic in Kerala, Meghalaya, Western Ghats.\n4. **Pro tip** — Ladakh roads usually open late May to early October.`,
  },
  {
    keys: ["safe", "safety", "solo", "woman", "women"],
    answer: `**Staying safe on the road** 🛡️\n\n1. Share your live location with a friend daily.\n2. Reach new towns before dark; avoid empty night roads.\n3. Use registered taxis/app cabs; note the number plate.\n4. Keep a cash reserve separate from your wallet.\n5. Emergency numbers: **112** (all), **1363** (tourist helpline).`,
  },
  {
    keys: ["food", "eat", "restaurant", "cuisine"],
    answer: `**Eating well and safely** 🍛\n\n1. Choose busy stalls — high turnover means fresh food.\n2. Stick to bottled/filtered water and skip raw salads at street stalls.\n3. Try the local speciality: Goan fish curry, Rajasthani dal baati, Kerala sadya.\n4. Thalis give the best value for money at lunch.`,
  },
];

const offlineAnswer = (question: string, cache: Record<string, string>): string => {
  const q = normalize(question);
  // Exact/close match from previously received online answers
  if (cache[q]) return `📴 *Offline — saved answer from earlier:*\n\n${cache[q]}`;
  const cachedKey = Object.keys(cache).find((k) => k.includes(q) || q.includes(k));
  if (cachedKey && q.length > 8) return `📴 *Offline — saved answer from earlier:*\n\n${cache[cachedKey]}`;

  const hit = OFFLINE_TIPS.find((t) => t.keys.some((k) => q.includes(k)));
  if (hit) return `📴 *Offline mode — here's what I know by heart:*\n\n${hit.answer}`;

  return `📴 *You're offline right now*, so I'm answering from my saved travel notes.\n\nI can still help with: **Goa**, **Manali & the hills**, **budget planning**, **packing**, **booking steps**, **best time to travel**, **safety** and **food**. Ask about any of those!\n\nOnce you're back online I'll be my full chatty self again. 🌍`;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const saved = raw ? (JSON.parse(raw) as Message[]) : null;
      if (saved?.length) return saved;
    } catch { /* ignore */ }
    return [
      { role: "assistant", content: "Hey there, travel buddy! 🌍✈️ I'm **Yatra Buddy** — your personal travel friend. Ask me anything about destinations, bookings, budgets, or hidden gems across India. I also work offline with saved travel notes. Let's plan something awesome! 🎉" },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track connectivity
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Keep the conversation available offline / after reloads
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-40)));
    } catch { /* ignore */ }
  }, [messages]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const win = window as unknown as SpeechRecognitionWindow;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast({ title: "Not supported", description: "Speech recognition is not supported in your browser. Try Chrome.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setInputValue(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted") {
        toast({ title: "Voice error", description: `Couldn't hear you: ${event.error}`, variant: "destructive" });
      }
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [toast, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to chat with Yatra Buddy.");
      }
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const upsertAssistant = (nextChunk: string) => {
        assistantSoFar += nextChunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      toast({
        title: "Oops!",
        description: e instanceof Error ? e.message : "Something went wrong. Try again!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-primary to-travel-ocean hover:scale-110 transition-all duration-300 z-50 group"
          size="icon"
        >
          <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full animate-pulse" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-border/50 bg-card overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-travel-ocean p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Yatra Buddy 🧳</h3>
                <p className="text-xs text-white/80">Your AI travel friend</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"} animate-slide-up`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-primary/10 to-travel-teal/10 border border-primary/20"
                    : "bg-gradient-to-br from-secondary to-accent text-white"
                }`}>
                  {message.role === "assistant" ? (
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-primary/10 to-travel-teal/10 border border-primary/20 rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "🎤 Listening..." : t("chatbot.placeholder")}
                className={`flex-1 border-border/50 focus:border-primary ${isListening ? "border-red-400 animate-pulse" : ""}`}
                disabled={isLoading}
              />
              <Button
                onClick={toggleListening}
                disabled={isLoading}
                variant={isListening ? "destructive" : "outline"}
                className={`transition-all ${isListening ? "animate-pulse" : "hover:scale-105"}`}
                size="icon"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-transform"
                size="icon"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
