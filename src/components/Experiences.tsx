import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Utensils, Tent, Waves, Mountain, Users, Bike, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Experiences = () => {
  const [activeTab, setActiveTab] = useState("All");
  const { toast } = useToast();

  const tabs = ["All", "Adventure", "Leisure", "Culture", "Nature"];

  const experiences = [
    {
      icon: Mountain,
      title: "Trekking Adventures",
      description: "Conquer challenging trails with experienced guides through breathtaking landscapes",
      duration: "3-7 days",
      difficulty: "Moderate to Hard",
      gradient: "from-primary to-travel-ocean",
      category: "Adventure",
      price: "₹8,999",
    },
    {
      icon: Waves,
      title: "Water Sports",
      description: "Surfing, diving, and kayaking in pristine waters with certified instructors",
      duration: "Half day to Full day",
      difficulty: "Easy to Moderate",
      gradient: "from-travel-teal to-primary",
      category: "Adventure",
      price: "₹3,499",
    },
    {
      icon: Camera,
      title: "Photography Tours",
      description: "Capture stunning landscapes with professional photographers as your guides",
      duration: "1-5 days",
      difficulty: "Easy",
      gradient: "from-secondary to-accent",
      category: "Leisure",
      price: "₹5,999",
    },
    {
      icon: Utensils,
      title: "Culinary Experiences",
      description: "Taste authentic local cuisine and learn cooking secrets from master chefs",
      duration: "2-4 hours",
      difficulty: "Easy",
      gradient: "from-accent to-secondary",
      category: "Culture",
      price: "₹2,499",
    },
    {
      icon: Tent,
      title: "Camping & Glamping",
      description: "Sleep under the stars in luxury tents or traditional camping setups",
      duration: "1-3 nights",
      difficulty: "Easy to Moderate",
      gradient: "from-travel-ocean to-travel-teal",
      category: "Nature",
      price: "₹4,999",
    },
    {
      icon: Users,
      title: "Cultural Immersion",
      description: "Live with locals and learn traditional crafts, dance, and customs",
      duration: "2-7 days",
      difficulty: "Easy",
      gradient: "from-secondary to-travel-coral",
      category: "Culture",
      price: "₹6,499",
    },
    {
      icon: Bike,
      title: "Cycling Tours",
      description: "Explore scenic routes on two wheels with expert-guided cycling adventures",
      duration: "1-5 days",
      difficulty: "Moderate",
      gradient: "from-primary to-travel-teal",
      category: "Adventure",
      price: "₹4,299",
    },
    {
      icon: Music,
      title: "Music & Dance",
      description: "Experience traditional music performances and learn folk dance forms",
      duration: "2-3 hours",
      difficulty: "Easy",
      gradient: "from-travel-coral to-secondary",
      category: "Culture",
      price: "₹1,999",
    },
  ];

  const filteredExperiences = activeTab === "All"
    ? experiences
    : experiences.filter(e => e.category === activeTab);

  const handleBookExperience = (title: string, price: string) => {
    toast({
      title: "Experience Selected! 🎉",
      description: `${title} (${price}) has been added. Head to Trip Planner to complete your booking.`,
    });
    const planSection = document.getElementById('plan');
    planSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="experiences" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Unique <span className="gradient-text">Experiences</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Go beyond sightseeing with immersive activities designed for every type of traveler
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-6 transition-all duration-300 ${
                activeTab === tab
                  ? "bg-gradient-to-r from-primary to-travel-ocean text-white shadow-lg scale-105"
                  : "border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Experiences Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExperiences.map((experience, index) => {
            const Icon = experience.icon;
            return (
              <Card
                key={experience.title}
                className="group p-6 border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-card/80 backdrop-blur-sm relative overflow-hidden animate-slide-up"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${experience.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${experience.gradient} mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                    {experience.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">
                    {experience.description}
                  </p>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="bg-muted text-foreground text-xs">
                      {experience.duration}
                    </Badge>
                    <Badge variant="secondary" className="bg-muted text-foreground text-xs">
                      {experience.difficulty}
                    </Badge>
                  </div>

                  {/* Price */}
                  <div className="text-xl font-bold text-secondary mb-4">
                    {experience.price}
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => handleBookExperience(experience.title, experience.price)}
                    className="w-full bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-all"
                  >
                    Book Now
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* No Results Message */}
        {filteredExperiences.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No experiences found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Experiences;
