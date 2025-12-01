import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Utensils, Tent, Waves, Mountain, Users } from "lucide-react";

const Experiences = () => {
  const experiences = [
    {
      icon: Mountain,
      title: "Trekking Adventures",
      description: "Conquer challenging trails with experienced guides",
      duration: "3-7 days",
      difficulty: "Moderate to Hard",
      gradient: "from-primary to-travel-ocean",
    },
    {
      icon: Waves,
      title: "Water Sports",
      description: "Surfing, diving, and kayaking in pristine waters",
      duration: "Half day to Full day",
      difficulty: "Easy to Moderate",
      gradient: "from-travel-teal to-primary",
    },
    {
      icon: Camera,
      title: "Photography Tours",
      description: "Capture stunning landscapes with professional photographers",
      duration: "1-5 days",
      difficulty: "Easy",
      gradient: "from-secondary to-accent",
    },
    {
      icon: Utensils,
      title: "Culinary Experiences",
      description: "Taste authentic local cuisine and cooking classes",
      duration: "2-4 hours",
      difficulty: "Easy",
      gradient: "from-accent to-secondary",
    },
    {
      icon: Tent,
      title: "Camping & Glamping",
      description: "Sleep under the stars in luxury or traditional camping",
      duration: "1-3 nights",
      difficulty: "Easy to Moderate",
      gradient: "from-travel-ocean to-travel-teal",
    },
    {
      icon: Users,
      title: "Cultural Immersion",
      description: "Live with locals and learn traditional crafts",
      duration: "2-7 days",
      difficulty: "Easy",
      gradient: "from-secondary to-travel-coral",
    },
  ];

  return (
    <section id="experiences" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Unique <span className="gradient-text">Experiences</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Go beyond sightseeing with immersive activities designed for every type of traveler
          </p>
        </div>

        {/* Experiences Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiences.map((experience, index) => {
            const Icon = experience.icon;
            return (
              <Card
                key={index}
                className="group p-8 border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-card/80 backdrop-blur-sm relative overflow-hidden"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${experience.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${experience.gradient} mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {experience.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {experience.description}
                  </p>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="bg-muted text-foreground">
                      {experience.duration}
                    </Badge>
                    <Badge variant="secondary" className="bg-muted text-foreground">
                      {experience.difficulty}
                    </Badge>
                  </div>

                  {/* CTA */}
                  <Button
                    variant="ghost"
                    className="w-full border border-border hover:border-primary hover:bg-primary/5 group-hover:translate-x-1 transition-all"
                  >
                    Learn More →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Experiences;
