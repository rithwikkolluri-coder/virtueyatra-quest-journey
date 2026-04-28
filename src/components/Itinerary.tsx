import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Sun, Cloud, Moon, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ItineraryProps {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  travelers?: string;
  budget?: string;
  specialRequests?: string;
}

interface AIDay { day: number; morning: string; afternoon: string; evening: string; }

const ITINERARY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`;

const Itinerary = ({ destination, startDate, endDate, interests, travelers, budget, specialRequests }: ItineraryProps) => {
  const { t } = useLanguage();
  const [aiDays, setAiDays] = useState<AIDay[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAI = async () => {
      setAiLoading(true);
      setAiError(null);
      setAiDays(null);
      try {
        const resp = await fetch(ITINERARY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ destination, startDate, endDate, interests, travelers, budget, specialRequests }),
        });
        if (!resp.ok) throw new Error("AI itinerary unavailable");
        const data = await resp.json();
        if (!cancelled && Array.isArray(data?.days)) setAiDays(data.days);
      } catch (e) {
        if (!cancelled) setAiError(e instanceof Error ? e.message : "Failed to load AI itinerary");
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };
    if (destination && startDate && endDate) fetchAI();
    return () => { cancelled = true; };
  }, [destination, startDate, endDate, JSON.stringify(interests), travelers, budget, specialRequests]);
  
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
    },
    "Mumbai": {
      morning: [
        "Visit Gateway of India - Iconic colonial monument at Apollo Bunder",
        "Explore Elephanta Caves - UNESCO World Heritage rock-cut temples on the island",
        "Tour Chhatrapati Shivaji Terminus - Victorian Gothic railway station",
        "Walk along Marine Drive - The famous Queen's Necklace promenade"
      ],
      afternoon: [
        "Visit Siddhivinayak Temple - One of Mumbai's most revered temples",
        "Explore Dharavi - Asia's largest slum and industrial hub tour",
        "Shop at Colaba Causeway - Street shopping for clothes and accessories",
        "Tour Dhobi Ghat - World's largest open-air laundry"
      ],
      evening: [
        "Sunset at Juhu Beach - Street food and ocean views",
        "Dinner at Leopold Cafe - Historic colonial-era restaurant",
        "Night drive on Marine Drive - See the sparkling Queen's Necklace",
        "Explore Bandra-Worli Sea Link and Bandstand Promenade"
      ]
    },
    "Delhi": {
      morning: [
        "Visit Red Fort - UNESCO World Heritage Mughal fortress",
        "Explore Qutub Minar - 73-meter tall victory tower from the 12th century",
        "Tour Humayun's Tomb - Magnificent Mughal garden tomb",
        "Walk through Chandni Chowk - Old Delhi's bustling market street"
      ],
      afternoon: [
        "Visit India Gate - War memorial and Rajpath promenade",
        "Explore Lotus Temple - Stunning Bahá'í House of Worship",
        "Tour Akshardham Temple - Modern Hindu temple complex with boat ride",
        "Shop at Connaught Place - Colonial-era shopping arcade"
      ],
      evening: [
        "Sound and light show at Red Fort - History comes alive",
        "Street food tour at Paranthe Wali Gali - Famous for stuffed parathas",
        "Evening at Hauz Khas Village - Cafes, boutiques, and ancient ruins",
        "Dinner at Khan Market - Premium dining and shopping"
      ]
    },
    "Agra": {
      morning: [
        "Sunrise at Taj Mahal - Witness the marble wonder in golden light",
        "Explore Agra Fort - UNESCO World Heritage red sandstone fortress",
        "Visit Mehtab Bagh - Gardens with stunning Taj Mahal views across Yamuna",
        "Tour Itmad-ud-Daulah's Tomb - Baby Taj with exquisite marble inlay"
      ],
      afternoon: [
        "Visit Fatehpur Sikri - Abandoned Mughal capital city",
        "Shop at Sadar Bazaar - Marble handicrafts and leather goods",
        "Explore Jama Masjid - One of India's largest mosques",
        "Tour Akbar's Tomb at Sikandra - Unique architectural blend"
      ],
      evening: [
        "Sunset view of Taj Mahal from Agra Fort - Romantic panorama",
        "Dinner at Peshawri, ITC Mughal - Authentic North Indian cuisine",
        "Cultural show Mohabbat the Taj - Dance drama about Shah Jahan",
        "Evening stroll along Yamuna riverfront"
      ]
    },
    "Shimla": {
      morning: [
        "Walk on The Mall Road - Colonial-era pedestrian street with shops",
        "Visit Christ Church - Second oldest church in North India",
        "Explore The Ridge - Open space with views of snow-capped mountains",
        "Tour Viceregal Lodge - British-era summer residence"
      ],
      afternoon: [
        "Ride the Toy Train to Kalka - UNESCO World Heritage railway",
        "Visit Jakhoo Temple - Hanuman temple atop the highest peak",
        "Explore Kufri - Hill station with adventure activities",
        "Tour Himalayan Bird Park - Native Himalayan birds"
      ],
      evening: [
        "Sunset at Scandal Point - Historic gathering spot on The Ridge",
        "Dinner at Cafe Simla Times - Colonial ambiance and local cuisine",
        "Ice skating at Shimla Ice Skating Rink - Asia's largest open-air rink",
        "Night walk on Mall Road - Lit up colonial buildings"
      ]
    },
    "Manali": {
      morning: [
        "Visit Hadimba Temple - Ancient wooden temple in cedar forest",
        "Trek to Jogini Waterfall - Scenic hike through pine forests",
        "Explore Old Manali - Hippie culture, cafes, and riverside walks",
        "Morning yoga at Vashisht Hot Springs - Natural thermal baths"
      ],
      afternoon: [
        "Adventure at Solang Valley - Paragliding, zorbing, and skiing",
        "Visit Rohtang Pass - Snow-capped mountain pass at 13,050 ft",
        "Explore Manu Temple - Dedicated to sage Manu, creator of mankind",
        "River rafting on Beas River - Grade II-III rapids"
      ],
      evening: [
        "Sunset at Mall Road - Mountain views and shopping",
        "Dinner at Johnson's Cafe - Trout fish and continental cuisine",
        "Bonfire at riverside camp - Stars and mountain air",
        "Evening at Lazy Dog Lounge - Live music and local crowd"
      ]
    },
    "Rishikesh": {
      morning: [
        "Sunrise yoga at Parmarth Niketan - Ashram on the Ganges",
        "White water rafting on Ganges - Thrilling rapids from Shivpuri",
        "Visit Beatles Ashram (Chaurasi Kutia) - Where the band stayed in 1968",
        "Walk across Laxman Jhula - Iconic suspension bridge"
      ],
      afternoon: [
        "Bungee jumping at Jumpin Heights - India's highest bungee",
        "Explore Triveni Ghat - Sacred confluence of three rivers",
        "Visit Neelkanth Mahadev Temple - Trek through forest trails",
        "Cliff jumping and body surfing at Shivpuri"
      ],
      evening: [
        "Ganga Aarti at Parmarth Niketan - Spiritual fire ceremony",
        "Dinner at Little Buddha Cafe - Israeli food with river views",
        "Meditation session at Osho Ganga Dham Ashram",
        "Evening walk on Ram Jhula and explore cafes"
      ]
    },
    "Darjeeling": {
      morning: [
        "Sunrise at Tiger Hill - View of Kanchenjunga and Mount Everest",
        "Ride the Darjeeling Himalayan Railway - UNESCO Toy Train",
        "Visit Batasia Loop - War memorial with 360-degree mountain views",
        "Tour Happy Valley Tea Estate - Learn tea processing"
      ],
      afternoon: [
        "Explore Padmaja Naidu Himalayan Zoological Park - Red pandas and snow leopards",
        "Visit Himalayan Mountaineering Institute - Tenzing Norgay's legacy",
        "Tour Peace Pagoda - Japanese Buddhist temple with panoramic views",
        "Shop at Chowrasta Mall - Local crafts and tea"
      ],
      evening: [
        "Sunset at Observatory Hill - Sacred site with temple",
        "Dinner at Glenary's - Historic bakery and restaurant since 1935",
        "Evening at Keventers - Famous milkshakes since colonial era",
        "Cultural show featuring Nepali folk dance"
      ]
    },
    "Amritsar": {
      morning: [
        "Sunrise at Golden Temple (Harmandir Sahib) - Most sacred Sikh shrine",
        "Participate in Langar - World's largest free community kitchen",
        "Visit Jallianwala Bagh - Historic memorial of 1919 massacre",
        "Tour Central Sikh Museum inside Golden Temple complex"
      ],
      afternoon: [
        "Explore Wagah Border - Daily flag lowering ceremony preparations",
        "Visit Partition Museum - Moving history of India-Pakistan partition",
        "Shop at Hall Bazaar - Traditional Phulkari embroidery and juttis",
        "Tour Maharaja Ranjit Singh Museum - Sikh empire artifacts"
      ],
      evening: [
        "Wagah Border Ceremony - Spectacular flag lowering parade",
        "Dinner at Kesar da Dhaba - Famous dal makhani since 1916",
        "Night visit to illuminated Golden Temple - Magical reflection in Amrit Sarovar",
        "Street food at Lawrence Road - Amritsari kulcha and lassi"
      ]
    },
    "Mysore": {
      morning: [
        "Visit Mysore Palace - Magnificent Indo-Saracenic royal residence",
        "Explore Chamundi Hills - Chamundeshwari Temple and Nandi statue",
        "Tour Brindavan Gardens - Musical fountain and terraced gardens",
        "Visit St. Philomena's Church - Gothic architecture cathedral"
      ],
      afternoon: [
        "Explore Devaraja Market - Colorful local market with flowers and spices",
        "Tour Mysore Zoo - One of India's oldest and best zoos",
        "Visit Jaganmohan Palace Art Gallery - Raja Ravi Varma paintings",
        "Shop for Mysore silk sarees and sandalwood products"
      ],
      evening: [
        "Mysore Palace illumination - 97,000 bulbs light up the palace",
        "Dinner at Vinayaka Mylari - Famous crispy dosas",
        "Cultural show at Mysore Sand Sculpture Museum",
        "Evening walk on Sayyaji Rao Road"
      ]
    },
    "Hyderabad": {
      morning: [
        "Visit Charminar - Iconic 16th-century monument and mosque",
        "Explore Golconda Fort - Ancient fortress with acoustic wonders",
        "Tour Qutb Shahi Tombs - Magnificent mausoleums of Qutb Shahi kings",
        "Shop at Laad Bazaar - Famous for bangles near Charminar"
      ],
      afternoon: [
        "Visit Ramoji Film City - World's largest integrated film studio",
        "Explore Salar Jung Museum - One of India's largest art museums",
        "Tour Chowmahalla Palace - Nizam's royal residence",
        "Visit Birla Mandir - Marble temple on a hilltop"
      ],
      evening: [
        "Biryani dinner at Paradise Restaurant - Legendary Hyderabadi biryani",
        "Sunset at Hussain Sagar Lake - Buddha statue and boat ride",
        "Night walk around Charminar - Illuminated monument",
        "Explore Eat Street - Food stalls along Necklace Road"
      ]
    },
    "Kolkata": {
      morning: [
        "Visit Victoria Memorial - White marble monument and museum",
        "Explore Howrah Bridge - Iconic cantilever bridge over Hooghly",
        "Tour Dakshineswar Kali Temple - Where Ramakrishna Paramahamsa lived",
        "Walk through College Street - World's largest second-hand book market"
      ],
      afternoon: [
        "Visit Indian Museum - Oldest and largest museum in India",
        "Explore Kumartuli - Watch artisans craft clay idols",
        "Tour Marble Palace - 19th-century mansion with art collection",
        "Shop at New Market - Colonial-era shopping arcade"
      ],
      evening: [
        "Sunset at Prinsep Ghat - Colonial riverside promenade",
        "Dinner at Peter Cat - Famous chelo kebab",
        "Evening at Park Street - Kolkata's food and nightlife hub",
        "Ride a heritage tram through the city"
      ]
    },
    "Chennai": {
      morning: [
        "Sunrise at Marina Beach - Second longest urban beach in the world",
        "Visit Kapaleeshwarar Temple - Ancient Dravidian temple in Mylapore",
        "Explore Fort St. George - First English fortress in India",
        "Tour San Thome Basilica - Built over St. Thomas the Apostle's tomb"
      ],
      afternoon: [
        "Visit Mahabalipuram - UNESCO rock-cut monuments and Shore Temple",
        "Explore Government Museum - Second oldest museum in India",
        "Tour DakshinaChitra - Living museum of South Indian heritage",
        "Shop at T. Nagar - Silk sarees and gold jewelry"
      ],
      evening: [
        "Sunset at Elliot's Beach (Besant Nagar) - Calm and scenic",
        "Dinner at Murugan Idli Shop - Authentic South Indian cuisine",
        "Bharatanatyam dance performance at Kalakshetra",
        "Evening walk at Marina Beach promenade"
      ]
    },
    "Bengaluru": {
      morning: [
        "Visit Lalbagh Botanical Garden - Historic garden with Glass House",
        "Explore Bangalore Palace - Tudor-style royal residence",
        "Tour ISKCON Temple - Beautiful Krishna temple on Chord Road",
        "Walk through Cubbon Park - Green lung of the city"
      ],
      afternoon: [
        "Visit Tipu Sultan's Summer Palace - Indo-Islamic wooden architecture",
        "Explore Nandi Hills - Hill station with sunrise views",
        "Tour Innovative Film City - Theme park and film sets",
        "Shop at Commercial Street - Bustling shopping district"
      ],
      evening: [
        "Dinner at MTR (Mavalli Tiffin Rooms) - Legendary since 1924",
        "Microbrewery hopping in Indiranagar - Craft beer capital of India",
        "Evening at UB City - Premium dining and shopping",
        "Explore Church Street for cafes and nightlife"
      ]
    },
    "Jaisalmer": {
      morning: [
        "Sunrise at Sam Sand Dunes - Camel safari in Thar Desert",
        "Explore Jaisalmer Fort - Living fort with havelis inside",
        "Visit Patwon Ki Haveli - Largest and most elaborate haveli",
        "Tour Gadisar Lake - Artificial lake with temples and ghats"
      ],
      afternoon: [
        "Visit Bada Bagh - Royal cenotaphs with desert backdrop",
        "Explore Kuldhara - Abandoned ghost village with mysterious history",
        "Tour Nathmal Ki Haveli - Intricate stone carvings by two brothers",
        "Shop for embroidered textiles and camel leather"
      ],
      evening: [
        "Desert camp dinner with folk music and dance",
        "Sunset at Sam Sand Dunes - Golden hour in the desert",
        "Night under stars at luxury desert camp",
        "Evening walk on fort walls with city views"
      ]
    },
    "Jodhpur": {
      morning: [
        "Visit Mehrangarh Fort - One of India's largest forts",
        "Explore Jaswant Thada - White marble royal cenotaph",
        "Walk through Blue City - Iconic blue-painted houses below fort",
        "Tour Umaid Bhawan Palace - Art Deco royal residence"
      ],
      afternoon: [
        "Visit Mandore Gardens - Ancient capital with temples and cenotaphs",
        "Explore Clock Tower Market (Sardar Market) - Spices and handicrafts",
        "Tour Rao Jodha Desert Rock Park - Ecological restoration project",
        "Shop for Jodhpuri mojris and textiles"
      ],
      evening: [
        "Sunset at Mehrangarh Fort - Panoramic views of Blue City",
        "Dinner at On The Rocks - Rooftop with fort views",
        "Sound and light show at Mehrangarh Fort",
        "Evening walk through the old city streets"
      ]
    },
    "Pushkar": {
      morning: [
        "Sunrise puja at Pushkar Lake - Sacred bathing ghats",
        "Visit Brahma Temple - One of very few temples dedicated to Lord Brahma",
        "Explore Pushkar Bazaar - Hippie clothes, jewelry, and souvenirs",
        "Camel ride in the desert outskirts"
      ],
      afternoon: [
        "Visit Savitri Temple - Hilltop temple with lake views",
        "Explore Old Rangji Temple - Dravidian-style architecture",
        "Tour Pushkar Passport Office - Get your 'Brahma visa'",
        "Attend a cooking class - Learn Rajasthani cuisine"
      ],
      evening: [
        "Sunset Aarti at Pushkar Ghats - Spiritual ceremony",
        "Dinner at Honey & Spice Cafe - Rooftop organic food",
        "Evening at German Bakery - Famous among backpackers",
        "Stargazing in the desert with bonfire"
      ]
    },
    "Khajuraho": {
      morning: [
        "Visit Western Group of Temples - UNESCO World Heritage with Kandariya Mahadeva",
        "Explore Eastern Group of Temples - Jain and Hindu temples",
        "Tour Lakshmana Temple - Finest example of Chandela architecture",
        "Walk through the Archaeological Museum"
      ],
      afternoon: [
        "Visit Southern Group of Temples - Duladeo and Chaturbhuj temples",
        "Explore Raneh Falls - Grand Canyon of India nearby",
        "Tour Panna National Park - Tiger reserve 25 km away",
        "Shop for stone sculptures and local crafts"
      ],
      evening: [
        "Sound and Light Show at Western Group - History comes alive",
        "Dinner at Raja Cafe - Temple views and Israeli cuisine",
        "Cultural dance performance - Khajuraho Dance Festival style",
        "Evening walk around illuminated temples"
      ]
    },
    "Hampi": {
      morning: [
        "Sunrise at Virupaksha Temple - Ancient temple still in worship",
        "Explore Vittala Temple - Famous stone chariot and musical pillars",
        "Visit Elephant Stables - Royal Vijayanagara architecture",
        "Trek to Matanga Hill - Panoramic sunrise point"
      ],
      afternoon: [
        "Explore Hampi Bazaar - Ancient marketplace ruins",
        "Visit Lotus Mahal - Indo-Islamic royal ladies' pavilion",
        "Tour Queen's Bath - Royal bathing complex with arched corridors",
        "Coracle ride on Tungabhadra River"
      ],
      evening: [
        "Sunset at Hemakuta Hill - Temple silhouettes against orange sky",
        "Dinner at Mango Tree Restaurant - Riverside seating",
        "Explore Hippie Island (Virupapur Gaddi) - Bohemian cafes",
        "Stargazing among ancient boulder landscapes"
      ]
    },
    "Pondicherry": {
      morning: [
        "Sunrise at Rock Beach Promenade - Peaceful morning walk",
        "Visit Auroville and Matrimandir - Experimental township and meditation dome",
        "Explore French Quarter (White Town) - Colonial architecture and cafes",
        "Tour Sri Aurobindo Ashram - Spiritual center"
      ],
      afternoon: [
        "Visit Paradise Beach (Plage Paradiso) - Boat ride to secluded beach",
        "Explore Arikamedu - Ancient Roman trading port ruins",
        "Shopping on Mission Street - Boutiques and French bakeries",
        "Tour Basilica of the Sacred Heart of Jesus"
      ],
      evening: [
        "Sunset at Promenade Beach - Gandhi statue and sea breeze",
        "Dinner at Villa Shanti - French-Tamil fusion cuisine",
        "Evening at Cafe des Arts - French Quarter vibes",
        "Night walk through illuminated French Quarter"
      ]
    },
    "Ooty": {
      morning: [
        "Ride the Nilgiri Mountain Railway - UNESCO heritage toy train",
        "Visit Botanical Gardens - 55 acres of exotic plants and trees",
        "Explore Doddabetta Peak - Highest point in Nilgiris at 2,637m",
        "Tour Tea Factory and Museum - Learn about Nilgiri tea"
      ],
      afternoon: [
        "Boating at Ooty Lake - Peaceful lake surrounded by eucalyptus",
        "Visit Rose Garden - Over 20,000 rose varieties",
        "Explore Pykara Falls and Lake - Scenic waterfalls and reservoir",
        "Tour Thread Garden - Unique garden made entirely of thread"
      ],
      evening: [
        "Sunset at Elk Hill - Panoramic views of Ooty",
        "Dinner at Earl's Secret - Colonial bungalow restaurant",
        "Hot chocolate at King Star Confectionery - Famous since decades",
        "Evening walk at Charing Cross"
      ]
    },
    "Coorg": {
      morning: [
        "Visit Abbey Falls - Scenic waterfall surrounded by coffee and spice plantations",
        "Explore Raja's Seat - Sunrise viewpoint of the valley",
        "Tour Coffee Plantation - Learn about Coorg's famous coffee",
        "Trek to Tadiandamol Peak - Highest peak in Coorg"
      ],
      afternoon: [
        "Visit Namdroling Monastery - Golden Temple, largest Tibetan settlement",
        "Explore Dubare Elephant Camp - Bathe and feed elephants",
        "Tour Talakaveri - Source of river Kaveri",
        "Visit Madikeri Fort - Historic fort with panoramic views"
      ],
      evening: [
        "Sunset at Raja's Seat - Spectacular mountain views",
        "Dinner with pork curry - Traditional Kodava cuisine",
        "Homestay experience with local family",
        "Bonfire and stargazing in plantation"
      ]
    },
    "Andaman Islands": {
      morning: [
        "Sunrise at Radhanagar Beach - Asia's best beach on Havelock",
        "Snorkeling at Elephant Beach - Crystal clear waters and coral",
        "Visit Cellular Jail - Colonial-era prison and museum",
        "Scuba diving at Nemo Reef - Encounter marine life"
      ],
      afternoon: [
        "Visit Ross Island - Abandoned British colonial capital ruins",
        "Explore North Bay Island - Glass-bottom boat and sea walking",
        "Kayaking through Mangrove Creeks - Pristine forest waterways",
        "Visit Kalapathar Beach - Black rocks and turquoise waters"
      ],
      evening: [
        "Sound and Light Show at Cellular Jail - Freedom struggle history",
        "Sunset at Laxmanpur Beach - Stunning sea views",
        "Seafood dinner at New Lighthouse Restaurant",
        "Bioluminescence spotting at night (seasonal)"
      ]
    },
    "Kaziranga": {
      morning: [
        "Elephant Safari in Central Range - Spot one-horned rhinos up close",
        "Jeep Safari in Western Range - Best for tiger sightings",
        "Birdwatching at Mihimukh - Wetland bird sanctuary",
        "Visit Panbari Reserve Forest - Hollock gibbons habitat"
      ],
      afternoon: [
        "Jeep Safari in Eastern Range - Wild elephants and buffalo",
        "Visit Orchid Park - Exotic Assamese orchids",
        "Tour Kaziranga National Orchid and Biodiversity Park",
        "Explore local Mishing tribal village"
      ],
      evening: [
        "Sunset at Kohora - Golden light over grasslands",
        "Traditional Assamese dinner with local thali",
        "Cultural show featuring Bihu dance",
        "Night safari with spotlight (if available)"
      ]
    },
    "Rann of Kutch": {
      morning: [
        "Sunrise at White Rann - Salt desert turns golden",
        "Visit Kalo Dungar (Black Hill) - Highest point with panoramic views",
        "Explore Hodka Village - Traditional Kutchi handicrafts",
        "Camel safari across the white desert"
      ],
      afternoon: [
        "Visit Dhordo - Gateway to Rann Utsav tent city",
        "Explore Bhuj - Aina Mahal and Prag Mahal palaces",
        "Tour Kutch Museum - Oldest museum in Gujarat",
        "Shop for Kutchi embroidery, bandhani, and leather crafts"
      ],
      evening: [
        "Sunset at White Rann - Surreal salt desert views",
        "Rann Utsav cultural program - Folk music and dance",
        "Dinner under stars at desert camp",
        "Full moon walk on the salt flats (during Sharad Purnima)"
      ]
    },
    "Ajanta Ellora": {
      morning: [
        "Visit Ajanta Caves - 30 Buddhist rock-cut caves with ancient paintings",
        "Explore Cave 1 & 2 - Finest Bodhisattva murals",
        "Tour Cave 26 - Largest chaitya hall with reclining Buddha",
        "Early morning for best lighting in painted caves"
      ],
      afternoon: [
        "Visit Ellora Caves - Hindu, Buddhist, and Jain rock-cut temples",
        "Explore Kailasa Temple (Cave 16) - World's largest monolithic excavation",
        "Tour Jain Caves (Cave 30-34) - Intricate carvings",
        "Visit Grishneshwar Temple - One of 12 Jyotirlingas"
      ],
      evening: [
        "Sunset at Aurangabad - Bibi Ka Maqbara (Mini Taj)",
        "Dinner with Aurangabad's famous Naan Qalia",
        "Visit Panchakki - 17th-century watermill",
        "Night walk in old Aurangabad city"
      ]
    },
    "Mount Abu": {
      morning: [
        "Sunrise at Guru Shikhar - Highest peak in Rajasthan at 1,722m",
        "Visit Dilwara Temples - Exquisite Jain marble temples",
        "Explore Nakki Lake - Boating and scenic views",
        "Tour Achalgarh Fort - 14th-century fort with temples"
      ],
      afternoon: [
        "Visit Toad Rock - Natural rock formation viewpoint",
        "Explore Wildlife Sanctuary - Leopards and sloth bears",
        "Tour Peace Park and Om Shanti Bhawan - Brahma Kumaris HQ",
        "Shop at Nakki Lake Market - Rajasthani crafts"
      ],
      evening: [
        "Sunset Point - Spectacular views of Aravalli hills",
        "Dinner at Arbuda Restaurant - Rajasthani and Gujarati thalis",
        "Evening at Honeymoon Point - Romantic hilltop spot",
        "Night walk around Nakki Lake"
      ]
    },
    "Lakshadweep": {
      morning: [
        "Sunrise at Agatti Beach - Pristine white sand and turquoise water",
        "Snorkeling at Bangaram Island - Coral reefs and tropical fish",
        "Visit Kavaratti Island - Capital with marine aquarium",
        "Kayaking in crystal clear lagoons"
      ],
      afternoon: [
        "Scuba diving at reef sites - Encounter manta rays and turtles",
        "Glass-bottom boat ride - View coral without getting wet",
        "Visit Minicoy Island - Southernmost island with lighthouse",
        "Deep sea fishing excursion"
      ],
      evening: [
        "Sunset cruise around the atoll",
        "Fresh seafood dinner at beach resort",
        "Stargazing on uninhabited island beach",
        "Traditional Lakshadweep folk dance performance"
      ]
    },
    "Arunachal Pradesh": {
      morning: [
        "Visit Tawang Monastery - India's largest Buddhist monastery",
        "Sunrise at Sela Pass - Frozen lake at 13,700 ft",
        "Explore Nuranang Falls - Stunning waterfall near Tawang",
        "Visit Gorichen Peak viewpoint - Snow-capped mountain views"
      ],
      afternoon: [
        "Explore Ziro Valley - UNESCO World Heritage site, Apatani tribe",
        "Visit Namdapha National Park - India's largest protected area",
        "Tour Itanagar's Ganga Lake - Tranquil lake surrounded by hills",
        "Visit Ita Fort - 14th-century brick fortification"
      ],
      evening: [
        "Sunset at Tawang War Memorial - Honoring 1962 war heroes",
        "Dinner with local Monpa cuisine",
        "Cultural show featuring tribal dances",
        "Bonfire at camp with mountain views"
      ]
    },
    "Sikkim": {
      morning: [
        "Sunrise at Tsomgo Lake - Sacred glacial lake at 12,400 ft",
        "Visit Rumtek Monastery - Seat of Kagyu lineage of Buddhism",
        "Drive to Nathula Pass - India-China border at 14,140 ft",
        "Explore Gangtok MG Marg - Car-free promenade"
      ],
      afternoon: [
        "Visit Pelling - Views of Kanchenjunga, India's highest peak",
        "Explore Rabdentse Ruins - Ancient capital of Sikkim",
        "Tour Namchi - Largest Shiva statue at Char Dham",
        "Cable car ride from Gangtok to Tashi viewpoint"
      ],
      evening: [
        "Sunset at Tashi View Point - Kanchenjunga golden hour",
        "Dinner with traditional Sikkimese thali",
        "Evening at Lal Market - Local produce and crafts",
        "Hot stone bath at local spa"
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

  const getActivities = (day: number) => {
    if (aiDays && aiDays.length > 0) {
      const found = aiDays.find(d => d.day === day) || aiDays[(day - 1) % aiDays.length];
      if (found) return { morning: found.morning, afternoon: found.afternoon, evening: found.evening };
    }
    return generateDayActivities(day);
  };

  return (
    <Card className="p-6 mt-8 border-border/50 bg-card/80 backdrop-blur-sm animate-slide-up">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-travel-ocean flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold">{t('itinerary.title')}</h3>
        </div>
        {aiLoading && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Personalizing with AI...
          </span>
        )}
        {aiDays && !aiLoading && (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5" /> AI-personalized for your trip
          </span>
        )}
      </div>

      <div className="space-y-6">
        {days.map((day) => {
          const activities = getActivities(day);
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
