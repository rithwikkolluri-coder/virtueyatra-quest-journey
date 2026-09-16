import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Utensils, Tent, Waves, Mountain, Users, Bike, Music, Sparkles, type LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExperiences } from "@/hooks/useExperiences";

const Experiences = () => {
  const [activeTab, setActiveTab] = useState("All");
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { data: liveExperiences = [] } = useExperiences();

  const tabs = [
    { key: "All", label: t('experiences.all') },
    { key: "Adventure", label: t('tag.adventure') },
    { key: "Leisure", label: t('experiences.leisure') },
    { key: "Culture", label: t('tag.culture') },
    { key: "Nature", label: t('tag.nature') },
  ];

  const fallbackExperiences = [
    {
      icon: Mountain,
      titleKey: "exp.trekkingAdventures",
      descKey: "exp.trekkingAdventures.desc",
      durationKey: "duration.3-7days",
      difficultyKey: "difficulty.moderateToHard",
      gradient: "from-primary to-travel-ocean",
      category: "Adventure",
      price: "₹8,999",
    },
    {
      icon: Waves,
      titleKey: "exp.waterSports",
      descKey: "exp.waterSports.desc",
      durationKey: "duration.halfToFull",
      difficultyKey: "difficulty.easyToModerate",
      gradient: "from-travel-teal to-primary",
      category: "Adventure",
      price: "₹3,499",
    },
    {
      icon: Camera,
      titleKey: "exp.photographyTours",
      descKey: "exp.photographyTours.desc",
      durationKey: "duration.1-5days",
      difficultyKey: "difficulty.easy",
      gradient: "from-secondary to-accent",
      category: "Leisure",
      price: "₹5,999",
    },
    {
      icon: Utensils,
      titleKey: "exp.culinaryExperiences",
      descKey: "exp.culinaryExperiences.desc",
      durationKey: "duration.2-4hours",
      difficultyKey: "difficulty.easy",
      gradient: "from-accent to-secondary",
      category: "Culture",
      price: "₹2,499",
    },
    {
      icon: Tent,
      titleKey: "exp.campingGlamping",
      descKey: "exp.campingGlamping.desc",
      durationKey: "duration.1-3nights",
      difficultyKey: "difficulty.easyToModerate",
      gradient: "from-travel-ocean to-travel-teal",
      category: "Nature",
      price: "₹4,999",
    },
    {
      icon: Users,
      titleKey: "exp.culturalImmersion",
      descKey: "exp.culturalImmersion.desc",
      durationKey: "duration.2-7days",
      difficultyKey: "difficulty.easy",
      gradient: "from-secondary to-travel-coral",
      category: "Culture",
      price: "₹6,499",
    },
    {
      icon: Bike,
      titleKey: "exp.cyclingTours",
      descKey: "exp.cyclingTours.desc",
      durationKey: "duration.1-5days",
      difficultyKey: "difficulty.moderate",
      gradient: "from-primary to-travel-teal",
      category: "Adventure",
      price: "₹4,299",
    },
    {
      icon: Music,
      titleKey: "exp.musicDance",
      descKey: "exp.musicDance.desc",
      durationKey: "duration.2-3hours",
      difficultyKey: "difficulty.easy",
      gradient: "from-travel-coral to-secondary",
      category: "Culture",
      price: "₹1,999",
    },
  ];

  const iconByName: Record<string, LucideIcon> = {
    Camera,
    Utensils,
    Tent,
    Waves,
    Mountain,
    Users,
    Bike,
    Music,
    Sparkles,
  };

  const getLocalizedText = (english: string, hindi: string | null, telugu: string | null) => {
    if (language === "hi") return hindi || english;
    if (language === "te") return telugu || english;
    return english;
  };

  const experiences = useMemo(() => {
    if (liveExperiences.length > 0) {
      return liveExperiences.map((experience) => ({
        key: experience.id,
        icon: iconByName[experience.icon] || Sparkles,
        title: getLocalizedText(experience.title_en, experience.title_hi, experience.title_te),
        description: getLocalizedText(experience.description_en || "", experience.description_hi, experience.description_te),
        duration: getLocalizedText(experience.duration_en || "", experience.duration_hi, experience.duration_te),
        difficulty: getLocalizedText(experience.difficulty_en || "", experience.difficulty_hi, experience.difficulty_te),
        gradient: experience.gradient,
        category: experience.category,
      }));
    }

    return fallbackExperiences.map((experience) => ({
      key: experience.titleKey,
      icon: experience.icon,
      title: t(experience.titleKey),
      description: t(experience.descKey),
      duration: t(experience.durationKey),
      difficulty: t(experience.difficultyKey),
      gradient: experience.gradient,
      category: experience.category,
    }));
  }, [fallbackExperiences, language, liveExperiences, t]);

  const filteredExperiences = activeTab === "All"
    ? experiences
    : experiences.filter(e => e.category === activeTab);

  const handleBookExperience = (title: string) => {
    toast({
      title: `${t('experiences.selected')} 🎉`,
      description: `${title} ${t('experiences.addedMessage')}`,
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
            {t('experiences.title')} <span className="gradient-text">{t('experiences.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('experiences.subtitle')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-6 transition-all duration-300 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-primary to-travel-ocean text-white shadow-lg scale-105"
                  : "border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Experiences Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExperiences.map((experience, index) => {
            const Icon = experience.icon;
            return (
              <Card
                key={experience.key}
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

                  {/* CTA */}
                  <Button
                    onClick={() => handleBookExperience(experience.title)}
                    className="w-full bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-all"
                  >
                    {t('experiences.bookNow')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* No Results Message */}
        {filteredExperiences.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">{t('experiences.noResults')}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Experiences;
