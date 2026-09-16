import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, TrendingUp, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDestinations } from "@/hooks/useDestinations";
import himalayasImage from "@/assets/dest-himalayas.jpg";
import coastImage from "@/assets/dest-coast.jpg";
import heritageImage from "@/assets/dest-heritage.jpg";
import wildlifeImage from "@/assets/dest-wildlife.jpg";
import teaImage from "@/assets/dest-tea.jpg";
import desertImage from "@/assets/dest-desert.jpg";
import goaImage from "@/assets/dest-goa.jpg";
import varanasiImage from "@/assets/dest-varanasi.jpg";
import kazirangaImage from "@/assets/dest-kaziranga.jpg";

const Destinations = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardFlash, setKeyboardFlash] = useState(false);
  const { language, t } = useLanguage();
  const { data: liveDestinations = [] } = useDestinations();
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs = [
    { key: "All", label: t('destinations.all') },
    { key: "Adventure", label: t('tag.adventure') },
    { key: "Beach", label: t('tag.beach') },
    { key: "Culture", label: t('tag.culture') },
    { key: "Wildlife", label: t('tag.wildlife') },
    { key: "Nature", label: t('tag.nature') },
  ];

  const fallbackDestinations = [
    {
      nameKey: "dest.himalayanTrails",
      locationKey: "dest.himalayanTrails.location",
      descKey: "dest.himalayanTrails.desc",
      rating: 4.9,
      reviews: 2847,
      price: "₹25,999",
      tags: ["tag.adventure", "tag.nature", "tag.trekking"],
      category: "Adventure",
      trending: true,
      image: himalayasImage,
    },
    {
      nameKey: "dest.coastalParadise",
      locationKey: "dest.coastalParadise.location",
      descKey: "dest.coastalParadise.desc",
      rating: 4.8,
      reviews: 1923,
      price: "₹18,499",
      tags: ["tag.beach", "tag.relaxation", "tag.waterSports"],
      category: "Beach",
      trending: false,
      image: coastImage,
    },
    {
      nameKey: "dest.heritageWonders",
      locationKey: "dest.heritageWonders.location",
      descKey: "dest.heritageWonders.desc",
      rating: 4.7,
      reviews: 3156,
      price: "₹22,999",
      tags: ["tag.culture", "tag.history", "tag.architecture"],
      category: "Culture",
      trending: true,
      image: heritageImage,
    },
    {
      nameKey: "dest.wildlifeSafari",
      locationKey: "dest.wildlifeSafari.location",
      descKey: "dest.wildlifeSafari.desc",
      rating: 4.9,
      reviews: 1654,
      price: "₹32,999",
      tags: ["tag.wildlife", "tag.photography", "tag.safari"],
      category: "Wildlife",
      trending: false,
      image: wildlifeImage,
    },
    {
      nameKey: "dest.teaGardens",
      locationKey: "dest.teaGardens.location",
      descKey: "dest.teaGardens.desc",
      rating: 4.6,
      reviews: 987,
      price: "₹16,999",
      tags: ["tag.nature", "tag.peaceful", "tag.scenic"],
      category: "Nature",
      trending: false,
      image: teaImage,
    },
    {
      nameKey: "dest.desertAdventure",
      locationKey: "dest.desertAdventure.location",
      descKey: "dest.desertAdventure.desc",
      rating: 4.8,
      reviews: 1432,
      price: "₹21,499",
      tags: ["tag.adventure", "tag.culture", "tag.unique"],
      category: "Adventure",
      trending: true,
      image: desertImage,
    },
    {
      nameKey: "dest.goaBeaches",
      locationKey: "dest.goaBeaches.location",
      descKey: "dest.goaBeaches.desc",
      rating: 4.7,
      reviews: 4521,
      price: "₹15,999",
      tags: ["tag.beach", "tag.nightlife", "tag.food"],
      category: "Beach",
      trending: true,
      image: goaImage,
    },
    {
      nameKey: "dest.varanasiGhats",
      locationKey: "dest.varanasiGhats.location",
      descKey: "dest.varanasiGhats.desc",
      rating: 4.8,
      reviews: 2134,
      price: "₹12,999",
      tags: ["tag.culture", "tag.spiritual", "tag.heritage"],
      category: "Culture",
      trending: false,
      image: varanasiImage,
    },
    {
      nameKey: "dest.kazirangaSafari",
      locationKey: "dest.kazirangaSafari.location",
      descKey: "dest.kazirangaSafari.desc",
      rating: 4.9,
      reviews: 876,
      price: "₹28,999",
      tags: ["tag.wildlife", "tag.nature", "tag.safari"],
      category: "Wildlife",
      trending: false,
      image: kazirangaImage,
    },
  ];

  const destinationImages: Record<string, string> = {
    "himalayan-trails": himalayasImage,
    "coastal-paradise": coastImage,
    "heritage-wonders": heritageImage,
    "wildlife-safari": wildlifeImage,
    "tea-gardens": teaImage,
    "desert-adventure": desertImage,
    "goa-beaches": goaImage,
    "varanasi-ghats": varanasiImage,
    "kaziranga-safari": kazirangaImage,
  };

  const tagTranslationKeys: Record<string, string> = {
    Adventure: "tag.adventure",
    Nature: "tag.nature",
    Trekking: "tag.trekking",
    Beach: "tag.beach",
    Relaxation: "tag.relaxation",
    "Water Sports": "tag.waterSports",
    Culture: "tag.culture",
    History: "tag.history",
    Architecture: "tag.architecture",
    Wildlife: "tag.wildlife",
    Photography: "tag.photography",
    Safari: "tag.safari",
    Peaceful: "tag.peaceful",
    Scenic: "tag.scenic",
    Unique: "tag.unique",
    Nightlife: "tag.nightlife",
    Food: "tag.food",
    Spiritual: "tag.spiritual",
    Heritage: "tag.heritage",
  };

  const getLocalizedText = (english: string, hindi: string | null, telugu: string | null) => {
    if (language === "hi") return hindi || english;
    if (language === "te") return telugu || english;
    return english;
  };

  const destinations = useMemo(() => {
    if (liveDestinations.length > 0) {
      return liveDestinations.map((destination) => ({
        key: destination.id,
        name: getLocalizedText(destination.name_en, destination.name_hi, destination.name_te),
        location: getLocalizedText(destination.location_en, destination.location_hi, destination.location_te),
        description: getLocalizedText(destination.description_en || "", destination.description_hi, destination.description_te),
        tags: destination.tags.map((tag) => t(tagTranslationKeys[tag] || tag)),
        category: destination.category,
        trending: destination.trending,
        image: destinationImages[destination.slug] || himalayasImage,
      }));
    }

    return fallbackDestinations.map((destination) => ({
      key: destination.nameKey,
      name: t(destination.nameKey),
      location: t(destination.locationKey),
      description: t(destination.descKey),
      tags: destination.tags.map((tagKey) => t(tagKey)),
      category: destination.category,
      trending: destination.trending,
      image: destination.image,
    }));
  }, [fallbackDestinations, language, liveDestinations, t]);

  const filteredDestinations = useMemo(() => {
    let result = activeTab === "All" 
      ? destinations 
      : destinations.filter(d => d.category === activeTab);
    
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(d => {
        const name = d.name.toLowerCase();
        const location = d.location.toLowerCase();
        // Match if name/location starts with the query, any word starts with it,
        // or it appears anywhere — so typing "H" surfaces Himalayan, Heritage, etc.
        const nameWords = name.split(/\s+/);
        const locWords = location.split(/\s+/);
        return (
          name.startsWith(query) ||
          location.startsWith(query) ||
          nameWords.some(w => w.startsWith(query)) ||
          locWords.some(w => w.startsWith(query)) ||
          name.includes(query) ||
          location.includes(query)
        );
      });
    }
    
    
    return result;
  }, [activeTab, searchQuery, destinations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Only act if the destinations section is in view
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === "Escape") {
        setSearchQuery("");
        inputRef.current?.blur();
        return;
      }

      if (e.key === "Backspace") {
        setSearchQuery((prev) => prev.slice(0, -1));
        inputRef.current?.focus();
        triggerFlash();
        return;
      }

      // Single printable character (letter, number, space)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setSearchQuery((prev) => prev + e.key);
        inputRef.current?.focus();
        triggerFlash();
      }
    };

    const triggerFlash = () => {
      setKeyboardFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setKeyboardFlash(false), 300);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  return (
    <section id="destinations" ref={sectionRef} className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('destinations.title')} <span className="gradient-text">{t('destinations.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('destinations.subtitle')}
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

        {/* Search Input */}
        <div
          className={`max-w-md mx-auto mb-8 relative rounded-full transition-all duration-300 ${
            keyboardFlash ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
          }`}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type to search destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full border-border/50 focus-visible:ring-primary"
          />
        </div>

        {/* Destinations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((destination, index) => (
            <Card
              key={destination.key}
              className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl bg-card cursor-pointer animate-slide-up"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Destination Image */}
              <div className="relative h-56 overflow-hidden bg-muted">
                <img
                  src={destination.image}
                  alt={destination.name}
                  loading="lazy"
                  width={1024}
                  height={640}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Trending Badge */}
                {destination.trending && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-secondary text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    {t('destinations.trending')}
                  </div>
                )}

                {/* Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  {destination.location}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {destination.name}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {destination.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {destination.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      const planSection = document.getElementById('plan');
                      planSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-transform"
                  >
                    {t('destinations.bookNow')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results Message */}
        {filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery.trim()
                ? `No destinations found for "${searchQuery.trim()}".`
                : t('destinations.noResults')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Destinations;
