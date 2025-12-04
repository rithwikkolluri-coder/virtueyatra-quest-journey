import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi' | 'te';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'nav.destinations': 'Destinations',
    'nav.experiences': 'Experiences',
    'nav.plan': 'Plan Trip',
    'nav.signIn': 'Sign In',
    'nav.signOut': 'Sign Out',
    
    // Hero
    'hero.badge': 'Discover India',
    'hero.title1': 'Explore the Magic of',
    'hero.title2': 'Incredible India',
    'hero.subtitle': 'From ancient temples to pristine beaches, from majestic mountains to vibrant cities. Let VirtueYatra guide you through unforgettable journeys across the land of diversity.',
    'hero.startPlanning': 'Start Planning',
    'hero.exploreDestinations': 'Explore Destinations',
    
    // Trip Planner
    'planner.badge': 'AI-Powered Planning',
    'planner.title': 'Plan Your',
    'planner.titleHighlight': 'Perfect Trip',
    'planner.subtitle': 'Let our AI assistant create a personalized itinerary based on your preferences',
    'planner.viewHistory': 'View',
    'planner.hideHistory': 'Hide',
    'planner.bookingHistory': 'Booking History',
    'planner.yourBookingHistory': 'Your Booking History',
    'planner.destination': 'Destination',
    'planner.whereTo': 'Where to?',
    'planner.startDate': 'Start Date',
    'planner.endDate': 'End Date',
    'planner.travelers': 'Number of Travelers',
    'planner.traveler': 'Traveler',
    'planner.travelersPlural': 'Travelers',
    'planner.budget': 'Budget Range',
    'planner.selectBudget': 'Select budget',
    'planner.budgetLow': 'Budget (₹10k - ₹25k)',
    'planner.budgetModerate': 'Moderate (₹25k - ₹50k)',
    'planner.budgetLuxury': 'Luxury (₹50k - ₹1L)',
    'planner.budgetPremium': 'Premium (₹1L+)',
    'planner.interests': 'Your Interests',
    'planner.selectInterests': 'Select activities you enjoy',
    'planner.specialRequests': 'Special Requests',
    'planner.specialRequestsPlaceholder': 'Any specific requirements, dietary restrictions, accessibility needs...',
    'planner.createItinerary': 'Create My Itinerary',
    'planner.creating': 'Creating...',
    'planner.tripPlanned': 'Your Trip is Planned!',
    'planner.savedToHistory': 'Your trip has been saved to your booking history',
    'planner.signInToSave': 'Sign in to save your trips',
    'planner.travelDates': 'Travel Dates',
    'planner.to': 'to',
    'planner.person': 'Person',
    'planner.people': 'People',
    'planner.selectedInterests': 'Selected Interests',
    'planner.planAnotherTrip': 'Plan Another Trip',
    'planner.getDetailedItinerary': 'View Detailed Itinerary',
    
    // Itinerary
    'itinerary.title': 'Your Detailed Itinerary',
    'itinerary.day': 'Day',
    'itinerary.morning': 'Morning',
    'itinerary.afternoon': 'Afternoon',
    'itinerary.evening': 'Evening',
    'itinerary.tips': 'Travel Tips',
    'itinerary.tip1': 'Carry light cotton clothes for day tours',
    'itinerary.tip2': 'Keep local currency for small purchases',
    'itinerary.tip3': 'Stay hydrated and carry water bottle',
    'itinerary.tip4': 'Respect local customs and traditions',
    
    // Interests
    'interest.adventure': 'Adventure',
    'interest.beach': 'Beach',
    'interest.culture': 'Culture',
    'interest.wildlife': 'Wildlife',
    'interest.photography': 'Photography',
    'interest.food': 'Food',
    'interest.hiking': 'Hiking',
    'interest.relaxation': 'Relaxation',
    'interest.shopping': 'Shopping',
    'interest.history': 'History',
    
    // Destinations
    'destinations.badge': 'Popular Destinations',
    'destinations.title': 'Discover India\'s',
    'destinations.titleHighlight': 'Hidden Gems',
    'destinations.subtitle': 'From the snow-capped Himalayas to tropical beaches, explore destinations that will take your breath away',
    'destinations.bookNow': 'Book Now',
    'destinations.all': 'All',
    
    // Experiences
    'experiences.badge': 'Unique Experiences',
    'experiences.title': 'Unforgettable',
    'experiences.titleHighlight': 'Adventures',
    'experiences.subtitle': 'Create memories that last a lifetime with our curated experiences',
    'experiences.bookNow': 'Book Now',
    'experiences.all': 'All',
    
    // Features
    'features.badge': 'Why Choose VirtueYatra',
    'features.title': 'Travel Made',
    'features.titleHighlight': 'Effortless',
    'features.subtitle': 'We combine cutting-edge technology with deep local expertise to create seamless travel experiences',
    'features.aiPlanning': 'AI Trip Planning',
    'features.aiPlanningDesc': 'Our intelligent AI creates personalized itineraries based on your preferences, budget, and travel style.',
    'features.localExperts': 'Local Experts',
    'features.localExpertsDesc': 'Connect with verified local guides who share authentic experiences and hidden gems.',
    'features.secureBooking': 'Secure Booking',
    'features.secureBookingDesc': 'Book with confidence using our secure payment system with best price guarantee.',
    'features.support': '24/7 Support',
    'features.supportDesc': 'Round-the-clock assistance for all your travel needs, wherever you are.',
    
    // Footer
    'footer.tagline': 'Your journey to incredible experiences starts here. Discover the magic of India with VirtueYatra.',
    'footer.quickLinks': 'Quick Links',
    'footer.destinations': 'Destinations',
    'footer.experiences': 'Experiences',
    'footer.planTrip': 'Plan Your Trip',
    'footer.about': 'About Us',
    'footer.support': 'Support',
    'footer.helpCenter': 'Help Center',
    'footer.safety': 'Travel Safety',
    'footer.cancellation': 'Cancellation Policy',
    'footer.faq': 'FAQs',
    'footer.rights': 'All rights reserved.',
    
    // Chatbot
    'chatbot.title': 'VirtueYatra Assistant',
    'chatbot.greeting': 'Hello! I\'m your VirtueYatra travel assistant. How can I help you plan your perfect Indian adventure today?',
    'chatbot.placeholder': 'Ask me anything about travel...',
    
    // Toast messages
    'toast.missingInfo': 'Missing Information',
    'toast.fillDestinationDates': 'Please fill in destination and dates.',
    'toast.errorSavingTrip': 'Error saving trip',
    'toast.tripCreated': 'Trip Plan Created!',
    'toast.tripSaved': 'Your trip to {destination} has been saved!',
    'toast.tripReadySignIn': 'Your itinerary for {destination} is ready! Sign in to save your trips.',
    'toast.tripDeleted': 'Trip deleted',
    'toast.tripDeletedDesc': 'Your trip has been removed from history.',
  },
  hi: {
    // Header
    'nav.destinations': 'गंतव्य',
    'nav.experiences': 'अनुभव',
    'nav.plan': 'यात्रा योजना',
    'nav.signIn': 'साइन इन',
    'nav.signOut': 'साइन आउट',
    
    // Hero
    'hero.badge': 'भारत की खोज करें',
    'hero.title1': 'जादू का अन्वेषण करें',
    'hero.title2': 'अतुल्य भारत',
    'hero.subtitle': 'प्राचीन मंदिरों से प्राचीन समुद्र तटों तक, भव्य पहाड़ों से जीवंत शहरों तक। विविधता की भूमि में अविस्मरणीय यात्राओं के माध्यम से VirtueYatra आपका मार्गदर्शन करे।',
    'hero.startPlanning': 'योजना शुरू करें',
    'hero.exploreDestinations': 'गंतव्य खोजें',
    
    // Trip Planner
    'planner.badge': 'AI-संचालित योजना',
    'planner.title': 'अपनी योजना बनाएं',
    'planner.titleHighlight': 'सही यात्रा',
    'planner.subtitle': 'हमारा AI सहायक आपकी प्राथमिकताओं के आधार पर व्यक्तिगत यात्रा कार्यक्रम बनाए',
    'planner.viewHistory': 'देखें',
    'planner.hideHistory': 'छिपाएं',
    'planner.bookingHistory': 'बुकिंग इतिहास',
    'planner.yourBookingHistory': 'आपका बुकिंग इतिहास',
    'planner.destination': 'गंतव्य',
    'planner.whereTo': 'कहाँ जाना है?',
    'planner.startDate': 'आरंभ तिथि',
    'planner.endDate': 'समाप्ति तिथि',
    'planner.travelers': 'यात्रियों की संख्या',
    'planner.traveler': 'यात्री',
    'planner.travelersPlural': 'यात्री',
    'planner.budget': 'बजट सीमा',
    'planner.selectBudget': 'बजट चुनें',
    'planner.budgetLow': 'बजट (₹10k - ₹25k)',
    'planner.budgetModerate': 'मध्यम (₹25k - ₹50k)',
    'planner.budgetLuxury': 'लक्जरी (₹50k - ₹1L)',
    'planner.budgetPremium': 'प्रीमियम (₹1L+)',
    'planner.interests': 'आपकी रुचियां',
    'planner.selectInterests': 'अपनी पसंदीदा गतिविधियां चुनें',
    'planner.specialRequests': 'विशेष अनुरोध',
    'planner.specialRequestsPlaceholder': 'कोई विशिष्ट आवश्यकताएं, आहार प्रतिबंध, पहुंच संबंधी आवश्यकताएं...',
    'planner.createItinerary': 'मेरा यात्रा कार्यक्रम बनाएं',
    'planner.creating': 'बना रहे हैं...',
    'planner.tripPlanned': 'आपकी यात्रा की योजना बन गई!',
    'planner.savedToHistory': 'आपकी यात्रा आपके बुकिंग इतिहास में सहेज ली गई है',
    'planner.signInToSave': 'अपनी यात्राएं सहेजने के लिए साइन इन करें',
    'planner.travelDates': 'यात्रा तिथियां',
    'planner.to': 'से',
    'planner.person': 'व्यक्ति',
    'planner.people': 'लोग',
    'planner.selectedInterests': 'चयनित रुचियां',
    'planner.planAnotherTrip': 'एक और यात्रा की योजना बनाएं',
    'planner.getDetailedItinerary': 'विस्तृत यात्रा कार्यक्रम देखें',
    
    // Itinerary
    'itinerary.title': 'आपका विस्तृत यात्रा कार्यक्रम',
    'itinerary.day': 'दिन',
    'itinerary.morning': 'सुबह',
    'itinerary.afternoon': 'दोपहर',
    'itinerary.evening': 'शाम',
    'itinerary.tips': 'यात्रा सुझाव',
    'itinerary.tip1': 'दिन के दौरे के लिए हल्के सूती कपड़े ले जाएं',
    'itinerary.tip2': 'छोटी खरीदारी के लिए स्थानीय मुद्रा रखें',
    'itinerary.tip3': 'हाइड्रेटेड रहें और पानी की बोतल साथ रखें',
    'itinerary.tip4': 'स्थानीय रीति-रिवाजों और परंपराओं का सम्मान करें',
    
    // Interests
    'interest.adventure': 'साहसिक',
    'interest.beach': 'समुद्र तट',
    'interest.culture': 'संस्कृति',
    'interest.wildlife': 'वन्यजीव',
    'interest.photography': 'फोटोग्राफी',
    'interest.food': 'भोजन',
    'interest.hiking': 'पैदल यात्रा',
    'interest.relaxation': 'विश्राम',
    'interest.shopping': 'खरीदारी',
    'interest.history': 'इतिहास',
    
    // Destinations
    'destinations.badge': 'लोकप्रिय गंतव्य',
    'destinations.title': 'भारत के खोजें',
    'destinations.titleHighlight': 'छिपे हुए रत्न',
    'destinations.subtitle': 'बर्फ से ढके हिमालय से लेकर उष्णकटिबंधीय समुद्र तटों तक, ऐसे गंतव्यों का अन्वेषण करें जो आपकी सांसें रोक देंगे',
    'destinations.bookNow': 'अभी बुक करें',
    'destinations.all': 'सभी',
    
    // Experiences
    'experiences.badge': 'अनूठे अनुभव',
    'experiences.title': 'अविस्मरणीय',
    'experiences.titleHighlight': 'साहसिक कार्य',
    'experiences.subtitle': 'हमारे क्यूरेटेड अनुभवों के साथ जीवन भर की यादें बनाएं',
    'experiences.bookNow': 'अभी बुक करें',
    'experiences.all': 'सभी',
    
    // Features
    'features.badge': 'VirtueYatra क्यों चुनें',
    'features.title': 'यात्रा बनाई',
    'features.titleHighlight': 'आसान',
    'features.subtitle': 'हम निर्बाध यात्रा अनुभव बनाने के लिए अत्याधुनिक तकनीक को गहरी स्थानीय विशेषज्ञता के साथ जोड़ते हैं',
    'features.aiPlanning': 'AI यात्रा योजना',
    'features.aiPlanningDesc': 'हमारा बुद्धिमान AI आपकी प्राथमिकताओं, बजट और यात्रा शैली के आधार पर व्यक्तिगत यात्रा कार्यक्रम बनाता है।',
    'features.localExperts': 'स्थानीय विशेषज्ञ',
    'features.localExpertsDesc': 'सत्यापित स्थानीय गाइडों से जुड़ें जो प्रामाणिक अनुभव और छिपे हुए रत्न साझा करते हैं।',
    'features.secureBooking': 'सुरक्षित बुकिंग',
    'features.secureBookingDesc': 'सर्वोत्तम मूल्य गारंटी के साथ हमारी सुरक्षित भुगतान प्रणाली का उपयोग करके आत्मविश्वास से बुक करें।',
    'features.support': '24/7 सहायता',
    'features.supportDesc': 'आपकी सभी यात्रा आवश्यकताओं के लिए चौबीसों घंटे सहायता, चाहे आप कहीं भी हों।',
    
    // Footer
    'footer.tagline': 'अविश्वसनीय अनुभवों की आपकी यात्रा यहां शुरू होती है। VirtueYatra के साथ भारत का जादू खोजें।',
    'footer.quickLinks': 'त्वरित लिंक',
    'footer.destinations': 'गंतव्य',
    'footer.experiences': 'अनुभव',
    'footer.planTrip': 'अपनी यात्रा की योजना बनाएं',
    'footer.about': 'हमारे बारे में',
    'footer.support': 'सहायता',
    'footer.helpCenter': 'सहायता केंद्र',
    'footer.safety': 'यात्रा सुरक्षा',
    'footer.cancellation': 'रद्दीकरण नीति',
    'footer.faq': 'अक्सर पूछे जाने वाले प्रश्न',
    'footer.rights': 'सर्वाधिकार सुरक्षित।',
    
    // Chatbot
    'chatbot.title': 'VirtueYatra सहायक',
    'chatbot.greeting': 'नमस्ते! मैं आपका VirtueYatra यात्रा सहायक हूं। आज मैं आपकी सही भारतीय साहसिक यात्रा की योजना बनाने में कैसे मदद कर सकता हूं?',
    'chatbot.placeholder': 'यात्रा के बारे में कुछ भी पूछें...',
    
    // Toast messages
    'toast.missingInfo': 'जानकारी अधूरी है',
    'toast.fillDestinationDates': 'कृपया गंतव्य और तिथियां भरें।',
    'toast.errorSavingTrip': 'यात्रा सहेजने में त्रुटि',
    'toast.tripCreated': 'यात्रा योजना बनाई गई!',
    'toast.tripSaved': '{destination} की आपकी यात्रा सहेज ली गई है!',
    'toast.tripReadySignIn': '{destination} के लिए आपका यात्रा कार्यक्रम तैयार है! अपनी यात्राएं सहेजने के लिए साइन इन करें।',
    'toast.tripDeleted': 'यात्रा हटाई गई',
    'toast.tripDeletedDesc': 'आपकी यात्रा इतिहास से हटा दी गई है।',
  },
  te: {
    // Header
    'nav.destinations': 'గమ్యస్థానాలు',
    'nav.experiences': 'అనుభవాలు',
    'nav.plan': 'ప్రయాణ ప్రణాళిక',
    'nav.signIn': 'సైన్ ఇన్',
    'nav.signOut': 'సైన్ అవుట్',
    
    // Hero
    'hero.badge': 'భారతదేశాన్ని కనుగొనండి',
    'hero.title1': 'మ్యాజిక్ అన్వేషించండి',
    'hero.title2': 'అద్భుత భారతదేశం',
    'hero.subtitle': 'ప్రాచీన దేవాలయాల నుండి ప్రిస్టీన్ బీచ్‌ల వరకు, గంభీరమైన పర్వతాల నుండి శక్తివంతమైన నగరాల వరకు. వైవిధ్యం భూమి అంతటా మరపురాని ప్రయాణాల ద్వారా VirtueYatra మిమ్మల్ని మార్గనిర్దేశం చేయనివ్వండి.',
    'hero.startPlanning': 'ప్రణాళిక ప్రారంభించండి',
    'hero.exploreDestinations': 'గమ్యస్థానాలు అన్వేషించండి',
    
    // Trip Planner
    'planner.badge': 'AI-ఆధారిత ప్రణాళిక',
    'planner.title': 'మీ ప్రణాళిక',
    'planner.titleHighlight': 'పర్ఫెక్ట్ ట్రిప్',
    'planner.subtitle': 'మీ ప్రాధాన్యతల ఆధారంగా వ్యక్తిగతీకరించిన యాత్రా పథకాన్ని మా AI సహాయకుడు సృష్టించనివ్వండి',
    'planner.viewHistory': 'చూడండి',
    'planner.hideHistory': 'దాచు',
    'planner.bookingHistory': 'బుకింగ్ చరిత్ర',
    'planner.yourBookingHistory': 'మీ బుకింగ్ చరిత్ర',
    'planner.destination': 'గమ్యస్థానం',
    'planner.whereTo': 'ఎక్కడికి?',
    'planner.startDate': 'ప్రారంభ తేదీ',
    'planner.endDate': 'ముగింపు తేదీ',
    'planner.travelers': 'ప్రయాణికుల సంఖ్య',
    'planner.traveler': 'ప్రయాణికుడు',
    'planner.travelersPlural': 'ప్రయాణికులు',
    'planner.budget': 'బడ్జెట్ పరిధి',
    'planner.selectBudget': 'బడ్జెట్ ఎంచుకోండి',
    'planner.budgetLow': 'బడ్జెట్ (₹10k - ₹25k)',
    'planner.budgetModerate': 'మధ్యస్థ (₹25k - ₹50k)',
    'planner.budgetLuxury': 'లగ్జరీ (₹50k - ₹1L)',
    'planner.budgetPremium': 'ప్రీమియం (₹1L+)',
    'planner.interests': 'మీ ఆసక్తులు',
    'planner.selectInterests': 'మీకు ఇష్టమైన కార్యకలాపాలను ఎంచుకోండి',
    'planner.specialRequests': 'ప్రత్యేక అభ్యర్థనలు',
    'planner.specialRequestsPlaceholder': 'ఏదైనా నిర్దిష్ట అవసరాలు, ఆహార పరిమితులు, యాక్సెసిబిలిటీ అవసరాలు...',
    'planner.createItinerary': 'నా యాత్రా పథకం సృష్టించండి',
    'planner.creating': 'సృష్టిస్తోంది...',
    'planner.tripPlanned': 'మీ ట్రిప్ ప్రణాళిక చేయబడింది!',
    'planner.savedToHistory': 'మీ ట్రిప్ మీ బుకింగ్ చరిత్రలో సేవ్ చేయబడింది',
    'planner.signInToSave': 'మీ ట్రిప్‌లను సేవ్ చేయడానికి సైన్ ఇన్ చేయండి',
    'planner.travelDates': 'ప్రయాణ తేదీలు',
    'planner.to': 'నుండి',
    'planner.person': 'వ్యక్తి',
    'planner.people': 'వ్యక్తులు',
    'planner.selectedInterests': 'ఎంచుకున్న ఆసక్తులు',
    'planner.planAnotherTrip': 'మరో ట్రిప్ ప్లాన్ చేయండి',
    'planner.getDetailedItinerary': 'వివరణాత్మక యాత్రా పథకం చూడండి',
    
    // Itinerary
    'itinerary.title': 'మీ వివరణాత్మక యాత్రా పథకం',
    'itinerary.day': 'రోజు',
    'itinerary.morning': 'ఉదయం',
    'itinerary.afternoon': 'మధ్యాహ్నం',
    'itinerary.evening': 'సాయంత్రం',
    'itinerary.tips': 'ప్రయాణ చిట్కాలు',
    'itinerary.tip1': 'రోజు పర్యటనల కోసం తేలికపాటి కాటన్ బట్టలు తీసుకెళ్ళండి',
    'itinerary.tip2': 'చిన్న కొనుగోళ్లకు స్థానిక కరెన్సీ ఉంచుకోండి',
    'itinerary.tip3': 'హైడ్రేటెడ్‌గా ఉండండి మరియు నీటి బాటిల్ తీసుకెళ్ళండి',
    'itinerary.tip4': 'స్థానిక ఆచారాలు మరియు సంప్రదాయాలను గౌరవించండి',
    
    // Interests
    'interest.adventure': 'సాహసం',
    'interest.beach': 'బీచ్',
    'interest.culture': 'సంస్కృతి',
    'interest.wildlife': 'వన్యప్రాణులు',
    'interest.photography': 'ఫోటోగ్రఫీ',
    'interest.food': 'ఆహారం',
    'interest.hiking': 'హైకింగ్',
    'interest.relaxation': 'విశ్రాంతి',
    'interest.shopping': 'షాపింగ్',
    'interest.history': 'చరిత్ర',
    
    // Destinations
    'destinations.badge': 'ప్రసిద్ధ గమ్యస్థానాలు',
    'destinations.title': 'భారతదేశం కనుగొనండి',
    'destinations.titleHighlight': 'దాచిన రత్నాలు',
    'destinations.subtitle': 'హిమాలయాల మంచు కప్పిన శిఖరాల నుండి ఉష్ణమండల బీచ్‌ల వరకు, మీ శ్వాసను ఆపే గమ్యస్థానాలను అన్వేషించండి',
    'destinations.bookNow': 'ఇప్పుడే బుక్ చేయండి',
    'destinations.all': 'అన్నీ',
    
    // Experiences
    'experiences.badge': 'ప్రత్యేక అనుభవాలు',
    'experiences.title': 'మరపురాని',
    'experiences.titleHighlight': 'సాహసాలు',
    'experiences.subtitle': 'మా క్యూరేటెడ్ అనుభవాలతో జీవితకాల జ్ఞాపకాలు సృష్టించండి',
    'experiences.bookNow': 'ఇప్పుడే బుక్ చేయండి',
    'experiences.all': 'అన్నీ',
    
    // Features
    'features.badge': 'VirtueYatra ఎందుకు ఎంచుకోవాలి',
    'features.title': 'ప్రయాణం చేసింది',
    'features.titleHighlight': 'సులభం',
    'features.subtitle': 'అతుకులేని ప్రయాణ అనుభవాలను సృష్టించడానికి మేము అత్యాధునిక సాంకేతికతను లోతైన స్థానిక నైపుణ్యంతో కలుపుతాము',
    'features.aiPlanning': 'AI ట్రిప్ ప్లానింగ్',
    'features.aiPlanningDesc': 'మీ ప్రాధాన్యతలు, బడ్జెట్ మరియు ప్రయాణ శైలి ఆధారంగా వ్యక్తిగతీకరించిన యాత్రా పథకాలను మా తెలివైన AI సృష్టిస్తుంది.',
    'features.localExperts': 'స్థానిక నిపుణులు',
    'features.localExpertsDesc': 'ప్రామాణికమైన అనుభవాలు మరియు దాచిన రత్నాలను పంచుకునే ధృవీకరించబడిన స్థానిక గైడ్‌లతో కనెక్ట్ అవ్వండి.',
    'features.secureBooking': 'సురక్షిత బుకింగ్',
    'features.secureBookingDesc': 'ఉత్తమ ధర హామీతో మా సురక్షిత చెల్లింపు వ్యవస్థను ఉపయోగించి నమ్మకంగా బుక్ చేయండి.',
    'features.support': '24/7 సపోర్ట్',
    'features.supportDesc': 'మీ అన్ని ప్రయాణ అవసరాలకు రౌండ్-ది-క్లాక్ సహాయం, మీరు ఎక్కడున్నా.',
    
    // Footer
    'footer.tagline': 'అద్భుతమైన అనుభవాలకు మీ ప్రయాణం ఇక్కడ మొదలవుతుంది. VirtueYatraతో భారతదేశ మ్యాజిక్‌ను కనుగొనండి.',
    'footer.quickLinks': 'త్వరిత లింక్‌లు',
    'footer.destinations': 'గమ్యస్థానాలు',
    'footer.experiences': 'అనుభవాలు',
    'footer.planTrip': 'మీ ట్రిప్ ప్లాన్ చేయండి',
    'footer.about': 'మా గురించి',
    'footer.support': 'సపోర్ట్',
    'footer.helpCenter': 'సహాయ కేంద్రం',
    'footer.safety': 'ప్రయాణ భద్రత',
    'footer.cancellation': 'రద్దు విధానం',
    'footer.faq': 'తరచుగా అడిగే ప్రశ్నలు',
    'footer.rights': 'అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.',
    
    // Chatbot
    'chatbot.title': 'VirtueYatra సహాయకుడు',
    'chatbot.greeting': 'నమస్కారం! నేను మీ VirtueYatra ప్రయాణ సహాయకుడిని. ఈ రోజు మీ పర్ఫెక్ట్ భారతీయ సాహసాన్ని ప్లాన్ చేయడంలో నేను మీకు ఎలా సహాయం చేయగలను?',
    'chatbot.placeholder': 'ప్రయాణం గురించి ఏదైనా అడగండి...',
    
    // Toast messages
    'toast.missingInfo': 'సమాచారం లేదు',
    'toast.fillDestinationDates': 'దయచేసి గమ్యస్థానం మరియు తేదీలను పూరించండి.',
    'toast.errorSavingTrip': 'ట్రిప్ సేవ్ చేయడంలో లోపం',
    'toast.tripCreated': 'ట్రిప్ ప్లాన్ సృష్టించబడింది!',
    'toast.tripSaved': '{destination}కి మీ ట్రిప్ సేవ్ చేయబడింది!',
    'toast.tripReadySignIn': '{destination} కోసం మీ యాత్రా పథకం సిద్ధంగా ఉంది! మీ ట్రిప్‌లను సేవ్ చేయడానికి సైన్ ఇన్ చేయండి.',
    'toast.tripDeleted': 'ట్రిప్ తొలగించబడింది',
    'toast.tripDeletedDesc': 'మీ ట్రిప్ చరిత్ర నుండి తొలగించబడింది.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('virtueYatra-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('virtueYatra-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
