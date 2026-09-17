import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Compass, MessageCircle, Mic, MicOff, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-chat`;
const CHAT_STORAGE_KEY = "virtueyatra.chat.messages";

const starterMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey there, travel buddy! 🌍✈️ I'm **Yatra Buddy** — your personal travel friend. Ask me anything about destinations, bookings, budgets, or hidden gems across India. Let's plan something awesome! 🎉",
};

const offlineReply = (question: string) => {
  const text = question.toLowerCase();
  if (text.includes("goa")) {
    return "Goa on a budget? Here’s the simple plan:\n\n1. Stay around **Arambol, Anjuna, or Baga** for more affordable rooms and easy beach access.\n2. Visit **Baga Beach, Anjuna Flea Market, Fort Aguada, and Old Goa**.\n3. Rent a scooter only from a licensed rental shop, and keep some cash for local cafés.\n4. Try local food at small family-run restaurants instead of beach shacks.\n\nThis offline tip is based on Yatra Buddy’s saved travel guide. I’ll give you live options when your connection returns.";
  }
  if (text.includes("manali") || text.includes("mountain")) {
    return "For a budget Manali trip, start with **Old Manali**, **Hidimba Temple**, **Vashisht hot springs**, and **Solang Valley**. Travel by overnight bus, stay in a hostel or guesthouse, and group taxi rides for nearby sights. I can check live routes and current details when you’re back online.";
  }
  if (text.includes("budget") || text.includes("cheap")) {
    return "My quick budget rule: choose a bus or train, stay slightly outside the busiest center, eat where locals eat, and group nearby sights into one day. Tell me your destination and I’ll make a simple day-by-day plan when live AI is available again.";
  }
  return "I’m offline right now, so I can’t reach the live travel assistant. I can still help with saved Goa and Manali tips, offline planning, and your map destination. Try asking about Goa, Manali, or a budget trip.";
};

const readSavedMessages = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [starterMessage];
    const valid = parsed.filter(
      (message): message is ChatMessage =>
        message &&
        typeof message.id === "string" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
    );
    return valid.length > 0 ? valid : [starterMessage];
  } catch {
    return [starterMessage];
  }
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(readSavedMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

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

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Chat still works for the current session when storage is unavailable.
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const win = window as unknown as SpeechRecognitionWindow;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in this browser. Try Chrome.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setInputValue(
        Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("")
      );
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        toast({
          title: "Voice error",
          description: `Couldn't hear you: ${event.error}`,
          variant: "destructive",
        });
      }
      stopListening();
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [stopListening, toast]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((previous) => [...previous, userMessage]);
    setInputValue("");
    setIsLoading(true);

    if (!online) {
      setMessages((previous) => [
        ...previous,
        { id: `offline-${Date.now()}`, role: "assistant", content: offlineReply(trimmed) },
      ]);
      setIsLoading(false);
      inputRef.current?.focus();
      return;
    }

    let assistantSoFar = "";
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in to chat with Yatra Buddy.");

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      const appendAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((previous) => {
          const last = previous[previous.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("assistant-")) {
            return previous.map((message) =>
              message.id === last.id ? { ...message, content: assistantSoFar } : message
            );
          }
          return [
            ...previous,
            { id: `assistant-${Date.now()}`, role: "assistant", content: assistantSoFar },
          ];
        });
      };

      const processLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          finished = true;
          return;
        }
        try {
          const parsed = JSON.parse(json);
          const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (chunk) appendAssistant(chunk);
        } catch {
          // Incomplete SSE data is retained for the next read.
        }
      };

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        lines.forEach((line) => processLine(line.replace(/\r$/, "")));
      }
      if (buffer.trim()) processLine(buffer.trim());
    } catch (error) {
      console.error("Chat error:", error);
      const fallback = offlineReply(trimmed);
      setMessages((previous) => [
        ...previous,
        {
          id: `offline-${Date.now()}`,
          role: "assistant",
          content: online
            ? `${fallback}\n\nI couldn’t reach live AI just now, so I shared the saved travel guidance instead.`
            : fallback,
        },
      ]);
      toast({
        title: "Live assistant unavailable",
        description: "Your message was kept, and an offline travel answer is available.",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = ({ text }: PromptInputMessage) => {
    void handleSend(text);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-r from-primary to-travel-ocean shadow-2xl transition-all duration-300 hover:scale-110"
          size="icon"
          aria-label="Open Yatra Buddy"
        >
          <MessageCircle className="h-7 w-7" />
          <span className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full bg-secondary" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden border-border/50 bg-card shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-travel-ocean p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <Compass className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Yatra Buddy 🧳</h3>
                <p className="text-xs text-primary-foreground/80">
                  {online ? "Your AI travel friend" : "Offline travel guide"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              aria-label="Close Yatra Buddy"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {!online && (
            <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
              Offline mode: your chat is saved on this device and travel tips still work.
            </div>
          )}

          <Conversation className="min-h-0 flex-1 bg-muted/20">
            <ConversationContent className="gap-4 p-4">
              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent
                    className={
                      message.role === "user"
                        ? "bg-secondary px-4 py-3 text-secondary-foreground"
                        : "text-foreground"
                    }
                  >
                    <MessageResponse>{message.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))}
              {isLoading && (
                <Message from="assistant">
                  <MessageContent className="text-foreground">
                    <Shimmer>Thinking...</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput onSubmit={handleSubmit} className="rounded-none border-x-0 border-b-0">
            <PromptInputTextarea
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.currentTarget.value)}
              placeholder={isListening ? "Listening..." : t("chatbot.placeholder")}
              disabled={isLoading}
              className={isListening ? "border-destructive" : ""}
            />
            <PromptInputFooter className="justify-end">
              <PromptInputButton
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                variant={isListening ? "destructive" : "ghost"}
                tooltip={isListening ? "Stop voice input" : "Speak your question"}
                aria-label={isListening ? "Stop voice input" : "Speak your question"}
              >
                {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </PromptInputButton>
              <PromptInputSubmit
                status={isLoading ? "submitted" : "ready"}
                disabled={!inputValue.trim() || isLoading}
              />
            </PromptInputFooter>
          </PromptInput>
        </Card>
      )}
    </>
  );
};

export default Chatbot;