import { Card } from "@/components/ui/card";
import { MapPin, Sun, Cloud, Moon, Lightbulb } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ItineraryProps {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
}

const Itinerary = ({ destination, startDate, endDate, interests }: ItineraryProps) => {
  const { t } = useLanguage();
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Destination-specific places and activities
  const destinationPlaces: Record<string, { morning: string[], afternoon: string[], evening: string[] }> = {
    "Jaipur": {
      morning: [
        "Visit Amber Fort - Marvel at the stunning architecture and take an elephant ride up the hill",
        "Explore Hawa Mahal (Palace of Winds) - Capture photos of the iconic pink facade with 953 windows",
        "Tour Nahargarh Fort - Enjoy panoramic views of the Pink City at sunrise",
        "Visit Jal Mahal - See the beautiful Water Palace floating on Man Sagar Lake"
      ],
      afternoon: [
        "Explore City Palace - Discover the royal heritage and museum collections",
        "Shop at Johari Bazaar - Browse traditional jewelry, textiles, and handicrafts",
        "Visit Jantar Mantar - Explore the UNESCO World Heritage astronomical observatory",
        "Tour Albert Hall Museum - See the finest collection of artifacts and paintings"
      ],
      evening: [
        "Watch sunset at Nahargarh Fort - Enjoy breathtaking views over Jaipur",
        "Dine at Chokhi Dhani - Experience authentic Rajasthani cuisine and folk performances",
        "Evening stroll at MI Road - Shop and taste local street food like pyaaz kachori",
        "Attend sound and light show at Amber Fort"
      ]
    },
    "Goa": {
      morning: [
        "Sunrise yoga at Palolem Beach - Start your day with peaceful meditation",
        "Visit Basilica of Bom Jesus - Explore the UNESCO World Heritage Church in Old Goa",
        "Explore Anjuna Flea Market - Shop for souvenirs, clothes, and local crafts",
        "Dolphin watching tour at Sinquerim Beach"
      ],
      afternoon: [
        "Water sports at Baga Beach - Try parasailing, jet skiing, and banana boat rides",
        "Tour Fort Aguada - Explore the 17th-century Portuguese fort with lighthouse",
        "Visit Dudhsagar Falls - Marvel at India's tallest four-tiered waterfall",
        "Explore Fontainhas - Walk through the colorful Latin Quarter of Panaji"
      ],
      evening: [
        "Sunset cruise on Mandovi River - Enjoy live music and dinner on the water",
        "Party at Tito's Lane, Baga - Experience Goa's famous nightlife",
        "Dinner at Britto's Beach Shack - Fresh seafood with your toes in the sand",
        "Casino Royale experience on the Mandovi River"
      ]
    },
    "Kerala": {
      morning: [
        "Houseboat cruise through Alleppey backwaters - Glide through scenic canals and villages",
        "Visit Periyar Wildlife Sanctuary - Spot elephants, tigers, and exotic birds",
        "Tea plantation tour in Munnar - Walk through emerald green tea estates",
        "Kathakali morning show in Cochin - Watch traditional dance drama"
      ],
      afternoon: [
        "Explore Fort Kochi - Visit Chinese fishing nets and colonial architecture",
        "Ayurvedic spa treatment in Kovalam - Experience traditional Kerala massage",
        "Visit Padmanabhaswamy Temple in Thiruvananthapuram",
        "Spice garden tour in Thekkady - Learn about cardamom, pepper, and cinnamon"
      ],
      evening: [
        "Sunset at Kovalam Beach - Relax at the famous lighthouse beach",
        "Traditional Kerala Sadhya dinner - Feast on banana leaf cuisine",
        "Cultural show at Kerala Folklore Theatre in Cochin",
        "Evening walk along Marine Drive in Kochi"
      ]
    },
    "Varanasi": {
      morning: [
        "Sunrise boat ride on the Ganges - Witness the spiritual dawn at the ghats",
        "Visit Kashi Vishwanath Temple - One of the most sacred Hindu temples",
        "Explore Sarnath - Where Buddha gave his first sermon after enlightenment",
        "Morning Ganga Aarti at Assi Ghat"
      ],
      afternoon: [
        "Walk through the narrow lanes of old Varanasi - Experience authentic bazaars",
        "Visit Ramnagar Fort - Explore the 18th-century fortress and museum",
        "Silk weaving workshop - See famous Banarasi silk being crafted",
        "Explore Banaras Hindu University campus and Bharat Kala Bhavan museum"
      ],
      evening: [
        "Witness Ganga Aarti at Dashashwamedh Ghat - Spectacular fire ceremony",
        "Dinner at Blue Lassi - Try the famous lassi in clay cups",
        "Evening walk through Vishwanath Gali - Shop for silk and souvenirs",
        "Night boat ride to see the illuminated ghats"
      ]
    },
    "Ladakh": {
      morning: [
        "Sunrise at Pangong Lake - Watch the lake change colors at dawn",
        "Visit Thiksey Monastery - Explore the 12-story Buddhist monastery",
        "Drive through Khardung La Pass - One of the world's highest motorable roads",
        "Morning meditation at Shanti Stupa in Leh"
      ],
      afternoon: [
        "Explore Leh Palace - Tour the 17th-century royal residence",
        "Visit Magnetic Hill - Experience the optical illusion phenomenon",
        "Rafting on Zanskar River - Thrilling white water adventure",
        "Tour Hemis Monastery - Largest and wealthiest monastery in Ladakh"
      ],
      evening: [
        "Sunset at Nubra Valley - Watch camels against the Himalayan backdrop",
        "Traditional Ladakhi dinner in Leh - Try thukpa and momos",
        "Stargazing at Hanle - One of the best places for astronomy in India",
        "Bonfire and cultural evening at a local camp"
      ]
    },
    "Udaipur": {
      morning: [
        "Visit City Palace - Explore the magnificent lakeside royal residence",
        "Boat ride on Lake Pichola - See Jag Mandir and Lake Palace",
        "Tour Sajjangarh Palace (Monsoon Palace) - Panoramic city views",
        "Explore Bagore Ki Haveli - Historic mansion with folk museum"
      ],
      afternoon: [
        "Visit Jagdish Temple - 17th-century Indo-Aryan temple",
        "Shop at Hathi Pol Bazaar - Traditional handicrafts and miniature paintings",
        "Explore Saheliyon Ki Bari - Garden of the Maidens with fountains",
        "Tour Vintage Car Museum - Royal automobile collection"
      ],
      evening: [
        "Sunset dinner at Ambrai Ghat - Lake views with City Palace backdrop",
        "Watch cultural dance show at Bagore Ki Haveli",
        "Rooftop dining at Lake Pichola - Romantic candlelit dinner",
        "Evening stroll along Gangaur Ghat"
      ]
    }
  };

  // Default activities for unknown destinations
  const defaultPlaces = {
    morning: [
      `Explore the historic old town of ${destination} - Walk through ancient streets and local markets`,
      `Visit the main temple/religious site of ${destination} - Experience local spirituality`,
      `Morning nature walk in ${destination} - Enjoy the scenic beauty and fresh air`,
      `Traditional breakfast at a local eatery in ${destination} - Try authentic regional cuisine`
    ],
    afternoon: [
      `Guided heritage tour of ${destination} - Discover historical monuments and architecture`,
      `Local craft workshop in ${destination} - Learn traditional art forms`,
      `Visit museums and cultural centers of ${destination}`,
      `Photography walk through scenic spots of ${destination}`
    ],
    evening: [
      `Sunset viewpoint in ${destination} - Watch the sun set over the landscape`,
      `Traditional dinner experience in ${destination} - Savor local delicacies`,
      `Evening cultural show in ${destination} - Folk music and dance`,
      `Night market exploration in ${destination} - Shop for souvenirs`
    ]
  };

  const generateDayActivities = (dayNum: number) => {
    const places = destinationPlaces[destination] || defaultPlaces;
    const dayIndex = (dayNum - 1) % places.morning.length;
    
    let morning = places.morning[dayIndex];
    let afternoon = places.afternoon[dayIndex];
    let evening = places.evening[dayIndex];

    // Add interest-specific activities
    if (interests.includes('Adventure') && dayNum === 1) {
      afternoon = destinationPlaces[destination] 
        ? `Adventure activity: ${destination === 'Goa' ? 'Water sports at Calangute Beach' : destination === 'Ladakh' ? 'River rafting on Indus River' : destination === 'Kerala' ? 'Bamboo rafting in Periyar' : 'Trekking and outdoor adventure'}`
        : `Adventure sports and outdoor activities in ${destination}`;
    }
    if (interests.includes('Food') && dayNum === 2) {
      afternoon = destination === 'Varanasi' ? 'Street food tour - Try chaat at Kachori Gali and lassi at Blue Lassi' 
        : destination === 'Jaipur' ? 'Food walk through Johari Bazaar - Sample pyaaz kachori, ghewar, and dal baati churma'
        : destination === 'Goa' ? 'Seafood tour - Visit fish markets and beach shacks for fresh catches'
        : `Culinary tour of ${destination} - Taste authentic local specialties`;
    }
    if (interests.includes('Culture') && dayNum === 1) {
      morning = destinationPlaces[destination]?.morning[0] || `Cultural heritage walk through ${destination}`;
    }
    if (interests.includes('Wildlife') && dayNum === 2) {
      morning = destination === 'Kerala' ? 'Early morning safari at Periyar Tiger Reserve - Spot elephants and exotic birds'
        : destination === 'Ladakh' ? 'Wildlife spotting at Hemis National Park - Look for snow leopards'
        : `Wildlife safari and bird watching in ${destination} region`;
    }

    return { morning, afternoon, evening };
  };

  const days = Array.from({ length: Math.min(dayCount, 7) }, (_, i) => i + 1);

  return (
    <Card className="p-6 mt-8 border-border/50 bg-card/80 backdrop-blur-sm animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-travel-ocean flex items-center justify-center">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold">{t('itinerary.title')}</h3>
      </div>

      <div className="space-y-6">
        {days.map((day) => {
          const activities = generateDayActivities(day);
          const currentDate = new Date(start);
          currentDate.setDate(start.getDate() + day - 1);
          
          return (
            <div key={day} className="border-l-2 border-primary/30 pl-6 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {t('itinerary.day')} {day}
                </span>
                <span className="text-sm text-muted-foreground">
                  {currentDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Sun className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('itinerary.morning')}</p>
                    <p className="text-sm font-medium">{activities.morning}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Cloud className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('itinerary.afternoon')}</p>
                    <p className="text-sm font-medium">{activities.afternoon}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Moon className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('itinerary.evening')}</p>
                    <p className="text-sm font-medium">{activities.evening}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Travel Tips */}
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-travel-ocean/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">{t('itinerary.tips')}</h4>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            {t('itinerary.tip1')}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            {t('itinerary.tip2')}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            {t('itinerary.tip3')}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            {t('itinerary.tip4')}
          </li>
        </ul>
      </div>
    </Card>
  );
};

export default Itinerary;
