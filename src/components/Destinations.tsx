import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, TrendingUp } from "lucide-react";

const Destinations = () => {
  const [activeTab, setActiveTab] = useState("All");

  const tabs = ["All", "Adventure", "Beach", "Culture", "Wildlife", "Nature"];

  const destinations = [
    {
      name: "Himalayan Trails",
      location: "Northern Mountains",
      description: "Experience breathtaking mountain vistas, serene monasteries, and adventure sports",
      rating: 4.9,
      reviews: 2847,
      price: "₹25,999",
      tags: ["Adventure", "Nature", "Trekking"],
      category: "Adventure",
      trending: true,
    },
    {
      name: "Coastal Paradise",
      location: "Southern Beaches",
      description: "Crystal clear waters, golden sands, and vibrant marine life await",
      rating: 4.8,
      reviews: 1923,
      price: "₹18,499",
      tags: ["Beach", "Relaxation", "Water Sports"],
      category: "Beach",
      trending: false,
    },
    {
      name: "Heritage Wonders",
      location: "Cultural Heartland",
      description: "Explore ancient temples, royal palaces, and rich cultural traditions",
      rating: 4.7,
      reviews: 3156,
      price: "₹22,999",
      tags: ["Culture", "History", "Architecture"],
      category: "Culture",
      trending: true,
    },
    {
      name: "Wildlife Safari",
      location: "National Parks",
      description: "Encounter majestic tigers, elephants, and rare wildlife in their natural habitat",
      rating: 4.9,
      reviews: 1654,
      price: "₹32,999",
      tags: ["Wildlife", "Photography", "Safari"],
      category: "Wildlife",
      trending: false,
    },
    {
      name: "Tea Gardens",
      location: "Hill Stations",
      description: "Rolling tea plantations, misty hills, and colonial charm",
      rating: 4.6,
      reviews: 987,
      price: "₹16,999",
      tags: ["Nature", "Peaceful", "Scenic"],
      category: "Nature",
      trending: false,
    },
    {
      name: "Desert Adventure",
      location: "Western Deserts",
      description: "Experience camel safaris, sand dunes, and starlit desert nights",
      rating: 4.8,
      reviews: 1432,
      price: "₹21,499",
      tags: ["Adventure", "Culture", "Unique"],
      category: "Adventure",
      trending: true,
    },
    {
      name: "Goa Beaches",
      location: "Goa",
      description: "Famous beaches, nightlife, Portuguese architecture, and seafood",
      rating: 4.7,
      reviews: 4521,
      price: "₹15,999",
      tags: ["Beach", "Nightlife", "Food"],
      category: "Beach",
      trending: true,
    },
    {
      name: "Varanasi Ghats",
      location: "Uttar Pradesh",
      description: "Spiritual capital of India with ancient ghats and temples",
      rating: 4.8,
      reviews: 2134,
      price: "₹12,999",
      tags: ["Culture", "Spiritual", "Heritage"],
      category: "Culture",
      trending: false,
    },
    {
      name: "Kaziranga Safari",
      location: "Assam",
      description: "Home to the one-horned rhinoceros and diverse wildlife",
      rating: 4.9,
      reviews: 876,
      price: "₹28,999",
      tags: ["Wildlife", "Nature", "Safari"],
      category: "Wildlife",
      trending: false,
    },
  ];

  const filteredDestinations = activeTab === "All" 
    ? destinations 
    : destinations.filter(d => d.category === activeTab);

  return (
    <section id="destinations" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Popular <span className="gradient-text">Destinations</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked destinations that promise unforgettable experiences
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

        {/* Destinations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((destination, index) => (
            <Card
              key={destination.name}
              className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl bg-card cursor-pointer animate-slide-up"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Image Placeholder with Gradient */}
              <div className="relative h-56 bg-gradient-to-br from-primary via-travel-teal to-travel-ocean overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-20 h-20 text-white/30 group-hover:scale-125 transition-transform duration-500" />
                </div>
                
                {/* Trending Badge */}
                {destination.trending && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-secondary text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </div>
                )}

                {/* Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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

                {/* Rating and Reviews */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-semibold">{destination.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({destination.reviews.toLocaleString()} reviews)
                  </span>
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground">Starting from</div>
                    <div className="text-2xl font-bold text-secondary">
                      {destination.price}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const planSection = document.getElementById('plan');
                      planSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-transform"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results Message */}
        {filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No destinations found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Destinations;
