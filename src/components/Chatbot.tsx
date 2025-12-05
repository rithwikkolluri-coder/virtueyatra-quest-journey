import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setMessages([{
        text: t('chatbot.greeting'),
        isBot: true,
        timestamp: new Date(),
      }]);
      setInitialized(true);
    }
  }, [t, initialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("नमस्ते") || lowerMessage.includes("నమస్కారం")) {
      return t('chatbot.response.hello');
    }
    if (lowerMessage.includes("beach") || lowerMessage.includes("coastal") || lowerMessage.includes("समुद्र") || lowerMessage.includes("బీచ్")) {
      return t('chatbot.response.beach');
    }
    if (lowerMessage.includes("mountain") || lowerMessage.includes("himalaya") || lowerMessage.includes("पहाड़") || lowerMessage.includes("పర్వతం")) {
      return t('chatbot.response.mountain');
    }
    if (lowerMessage.includes("budget") || lowerMessage.includes("price") || lowerMessage.includes("बजट") || lowerMessage.includes("బడ్జెట్")) {
      return t('chatbot.response.budget');
    }
    if (lowerMessage.includes("wildlife") || lowerMessage.includes("safari") || lowerMessage.includes("वन्यजीव") || lowerMessage.includes("వన్యప్రాణి")) {
      return t('chatbot.response.wildlife');
    }
    if (lowerMessage.includes("book") || lowerMessage.includes("reserve") || lowerMessage.includes("बुक") || lowerMessage.includes("బుక్")) {
      return t('chatbot.response.book');
    }
    if (lowerMessage.includes("culture") || lowerMessage.includes("heritage") || lowerMessage.includes("संस्कृति") || lowerMessage.includes("సంస్కృతి")) {
      return t('chatbot.response.culture');
    }
    if (lowerMessage.includes("thank") || lowerMessage.includes("धन्यवाद") || lowerMessage.includes("ధన్యవాదాలు")) {
      return t('chatbot.response.thank');
    }
    
    return t('chatbot.response.default');
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Simulate bot thinking and response
    setTimeout(() => {
      const botMessage: Message = {
        text: getBotResponse(inputValue),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
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

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-border/50 bg-card overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-travel-ocean p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('chatbot.title')}</h3>
                <p className="text-xs text-white/80">{t('chatbot.subtitle')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-slide-up`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.isBot
                      ? 'bg-gradient-to-br from-primary/10 to-travel-teal/10 border border-primary/20'
                      : 'bg-gradient-to-br from-secondary to-accent text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.isBot ? 'text-muted-foreground' : 'text-white/70'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chatbot.placeholder')}
                className="flex-1 border-border/50 focus:border-primary"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-transform"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
