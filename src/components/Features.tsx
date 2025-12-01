import { Card } from "@/components/ui/card";
import { Bot, Map, Sparkles, Shield, Globe, Heart } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Travel Assistant",
      description: "Get personalized recommendations and instant answers to all your travel questions",
      gradient: "from-primary to-travel-ocean",
    },
    {
      icon: Map,
      title: "Smart Itinerary Planning",
      description: "Create perfect travel plans with AI-optimized routes and schedules",
      gradient: "from-secondary to-accent",
    },
    {
      icon: Sparkles,
      title: "Immersive Experiences",
      description: "Preview destinations with AR/VR technology before you visit",
      gradient: "from-travel-teal to-primary",
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Travel with confidence with our verified partners and secure booking",
      gradient: "from-accent to-secondary",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Explore destinations across continents with local insights",
      gradient: "from-travel-ocean to-travel-teal",
    },
    {
      icon: Heart,
      title: "Personalized Just for You",
      description: "Tailored recommendations based on your preferences and travel style",
      gradient: "from-secondary to-travel-coral",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose{" "}
            <span className="gradient-text">VirtueYatra</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience travel planning reimagined with cutting-edge technology and personalized service
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-card/50 backdrop-blur-sm"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <div className="relative p-8">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Decorative Element */}
                  <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${feature.gradient} group-hover:w-full transition-all duration-500`} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
