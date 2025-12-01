import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, DollarSign, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TripPlanner = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: "1",
    budget: "",
    interests: [] as string[],
    specialRequests: "",
  });

  const interestOptions = [
    "Adventure", "Beach", "Culture", "Wildlife", "Photography",
    "Food", "Hiking", "Relaxation", "Shopping", "History"
  ];

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in destination and dates.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Trip Plan Created! 🎉",
      description: `Your personalized itinerary for ${formData.destination} is being prepared. We'll send it to your email shortly!`,
    });

    // Reset form
    setFormData({
      destination: "",
      startDate: "",
      endDate: "",
      travelers: "1",
      budget: "",
      interests: [],
      specialRequests: "",
    });
  };

  return (
    <section id="plan" className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 glass-effect px-6 py-3 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">AI-Powered Planning</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Plan Your <span className="gradient-text">Perfect Trip</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Let our AI assistant create a personalized itinerary based on your preferences
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination and Dates */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="Where to?"
                    value={formData.destination}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                    className="border-border/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="border-border/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="border-border/50 focus:border-primary"
                  />
                </div>
              </div>

              {/* Travelers and Budget */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="travelers" className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Number of Travelers
                  </Label>
                  <Select value={formData.travelers} onValueChange={(value) => setFormData(prev => ({ ...prev, travelers: value }))}>
                    <SelectTrigger className="border-border/50 focus:border-primary bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Traveler' : 'Travelers'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Budget Range
                  </Label>
                  <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                    <SelectTrigger className="border-border/50 focus:border-primary bg-background">
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="budget">Budget (₹10k - ₹25k)</SelectItem>
                      <SelectItem value="moderate">Moderate (₹25k - ₹50k)</SelectItem>
                      <SelectItem value="luxury">Luxury (₹50k - ₹1L)</SelectItem>
                      <SelectItem value="premium">Premium (₹1L+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label>Your Interests</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {interestOptions.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        formData.interests.includes(interest)
                          ? 'bg-primary text-primary-foreground shadow-md scale-105'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:scale-105'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                <Textarea
                  id="specialRequests"
                  placeholder="Any specific requirements, dietary restrictions, accessibility needs, etc."
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  className="border-border/50 focus:border-primary min-h-24"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-all duration-300 shadow-lg text-lg py-6"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Create My Itinerary
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TripPlanner;
