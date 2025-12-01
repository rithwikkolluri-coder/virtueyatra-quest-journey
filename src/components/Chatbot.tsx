import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, MessageCircle } from "lucide-react";

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! 👋 I'm your VirtueYatra travel assistant. How can I help you plan your perfect trip today?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! I'm excited to help you discover amazing destinations. What kind of experience are you looking for?";
    }
    if (lowerMessage.includes("beach") || lowerMessage.includes("coastal")) {
      return "Our Coastal Paradise destinations are perfect for beach lovers! With crystal clear waters and golden sands, you'll find relaxation and adventure. The package starts from ₹18,499. Would you like to know more?";
    }
    if (lowerMessage.includes("mountain") || lowerMessage.includes("himalaya")) {
      return "The Himalayan Trails offer breathtaking mountain vistas and adventure sports! It's perfect for trekking and experiencing serene monasteries. Packages start from ₹25,999. Interested in booking?";
    }
    if (lowerMessage.includes("budget") || lowerMessage.includes("price")) {
      return "We have options for every budget! Our packages range from ₹16,999 to ₹32,999. Budget travelers love our Tea Gardens package at ₹16,999, while adventure seekers enjoy the Wildlife Safari at ₹32,999. What's your budget range?";
    }
    if (lowerMessage.includes("wildlife") || lowerMessage.includes("safari")) {
      return "Our Wildlife Safari packages offer incredible encounters with majestic tigers, elephants, and rare wildlife in their natural habitat. Perfect for photographers! Starting at ₹32,999. Shall I help you plan this adventure?";
    }
    if (lowerMessage.includes("book") || lowerMessage.includes("reserve")) {
      return "Great! To book your trip, I recommend using our Trip Planner below. Just fill in your details, and we'll create a personalized itinerary for you. You can also click 'Explore' on any destination card for quick booking!";
    }
    if (lowerMessage.includes("culture") || lowerMessage.includes("heritage")) {
      return "Our Heritage Wonders tour takes you through ancient temples, royal palaces, and rich cultural traditions. It's rated 4.7 stars with over 3,000 reviews! Starting from ₹22,999. Would you like more details?";
    }
    if (lowerMessage.includes("thank")) {
      return "You're very welcome! If you need any more help planning your trip, I'm always here. Happy travels! 🌍✈️";
    }
    
    return "That's a great question! I can help you with destinations, pricing, booking information, and travel recommendations. Feel free to ask about beaches, mountains, wildlife, cultural experiences, or any specific travel needs!";
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
                <h3 className="font-semibold text-white">VirtueYatra Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
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
                placeholder="Ask me anything..."
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
