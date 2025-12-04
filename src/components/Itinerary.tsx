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

  // Generate sample itinerary based on interests
  const generateDayActivities = (dayNum: number) => {
    const activities = {
      morning: [] as string[],
      afternoon: [] as string[],
      evening: [] as string[],
    };

    // Base activities for the destination
    const baseActivities = {
      morning: [
        `Explore local markets of ${destination}`,
        `Visit famous temples and monuments`,
        `Breakfast at traditional local eatery`,
        `Morning yoga session at scenic spot`,
      ],
      afternoon: [
        `Guided tour of historical sites`,
        `Local cuisine cooking class`,
        `Visit museums and galleries`,
        `Photography walk through old city`,
      ],
      evening: [
        `Sunset viewing at famous spot`,
        `Cultural performance and dinner`,
        `Evening stroll along waterfront`,
        `Traditional dinner experience`,
      ],
    };

    // Interest-based activities
    if (interests.includes('Adventure')) {
      activities.morning.push('Adventure sports activity');
      activities.afternoon.push('Trekking or outdoor adventure');
    }
    if (interests.includes('Beach')) {
      activities.morning.push('Beach sunrise meditation');
      activities.afternoon.push('Water sports and beach activities');
    }
    if (interests.includes('Culture')) {
      activities.morning.push('Temple visit and local rituals');
      activities.afternoon.push('Cultural heritage walk');
    }
    if (interests.includes('Wildlife')) {
      activities.morning.push('Wildlife safari or bird watching');
    }
    if (interests.includes('Food')) {
      activities.afternoon.push('Street food tour');
      activities.evening.push('Fine dining experience');
    }
    if (interests.includes('Shopping')) {
      activities.afternoon.push('Local handicraft shopping');
    }

    // Fill with base activities if needed
    const dayIndex = (dayNum - 1) % baseActivities.morning.length;
    
    return {
      morning: activities.morning.length > 0 ? activities.morning[0] : baseActivities.morning[dayIndex],
      afternoon: activities.afternoon.length > 0 ? activities.afternoon[Math.min(dayNum - 1, activities.afternoon.length - 1) % activities.afternoon.length] : baseActivities.afternoon[dayIndex],
      evening: activities.evening.length > 0 ? activities.evening[0] : baseActivities.evening[dayIndex],
    };
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
