import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, DollarSign, Sparkles, Check, ArrowLeft, History, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface TripSummary {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  budget: string;
  interests: string[];
  specialRequests: string;
}

interface SavedTrip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: string;
  interests: string[];
  special_requests: string | null;
  created_at: string;
}

const TripPlanner = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSummary, setShowSummary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(false);
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

  const budgetLabels: Record<string, string> = {
    budget: "Budget (₹10k - ₹25k)",
    moderate: "Moderate (₹25k - ₹50k)",
    luxury: "Luxury (₹50k - ₹1L)",
    premium: "Premium (₹1L+)",
  };

  useEffect(() => {
    if (user) {
      fetchSavedTrips();
    }
  }, [user]);

  const fetchSavedTrips = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trips:', error);
    } else {
      setSavedTrips(data || []);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in destination and dates.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Save to database if user is logged in
    if (user) {
      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        travelers: parseInt(formData.travelers),
        budget: formData.budget || 'budget',
        interests: formData.interests,
        special_requests: formData.specialRequests || null,
      });

      if (error) {
        toast({
          title: "Error saving trip",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      fetchSavedTrips();
    }

    setTripSummary(formData);
    setShowSummary(true);
    setLoading(false);

    toast({
      title: "Trip Plan Created! 🎉",
      description: user 
        ? `Your trip to ${formData.destination} has been saved!`
        : `Your itinerary for ${formData.destination} is ready! Sign in to save your trips.`,
    });
  };

  const handleDeleteTrip = async (tripId: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', tripId);
    
    if (error) {
      toast({
        title: "Error deleting trip",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Trip deleted",
        description: "Your trip has been removed from history.",
      });
      fetchSavedTrips();
    }
  };

  const handleNewTrip = () => {
    setShowSummary(false);
    setTripSummary(null);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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
          
          {user && savedTrips.length > 0 && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? 'Hide' : 'View'} Booking History ({savedTrips.length})
            </Button>
          )}
        </div>

        {/* Booking History */}
        {showHistory && user && savedTrips.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12 animate-slide-up">
            <h3 className="text-2xl font-bold mb-6">Your Booking History</h3>
            <div className="grid gap-4">
              {savedTrips.map((trip) => (
                <Card key={trip.id} className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h4 className="text-lg font-semibold">{trip.destination}</h4>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatShortDate(trip.start_date)} - {formatShortDate(trip.end_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {budgetLabels[trip.budget] || trip.budget}
                        </span>
                      </div>
                      {trip.interests && trip.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {trip.interests.map((interest) => (
                            <span key={interest} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteTrip(trip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {showSummary && tripSummary ? (
            /* Trip Summary Card */
            <Card className="p-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-travel-ocean rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold gradient-text mb-2">Your Trip is Planned!</h3>
                <p className="text-muted-foreground">
                  {user ? "Your trip has been saved to your booking history" : "Sign in to save your trips"}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-semibold text-lg">{tripSummary.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Travel Dates</p>
                      <p className="font-semibold">{formatDate(tripSummary.startDate)}</p>
                      <p className="text-sm text-muted-foreground">to</p>
                      <p className="font-semibold">{formatDate(tripSummary.endDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Travelers</p>
                      <p className="font-semibold text-lg">
                        {tripSummary.travelers} {parseInt(tripSummary.travelers) === 1 ? 'Person' : 'People'}
                      </p>
                    </div>
                  </div>

                  {tripSummary.budget && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                      <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Budget Range</p>
                        <p className="font-semibold">{budgetLabels[tripSummary.budget]}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {tripSummary.interests.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3">Selected Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {tripSummary.interests.map(interest => (
                      <span
                        key={interest}
                        className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tripSummary.specialRequests && (
                <div className="mb-8 p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Special Requests</p>
                  <p className="text-foreground">{tripSummary.specialRequests}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleNewTrip}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Plan Another Trip
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Detailed Itinerary
                </Button>
              </div>
            </Card>
          ) : (
            /* Trip Form */
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
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-all duration-300 shadow-lg text-lg py-6"
                >
                  <Sparkles className="mr-2 w-5 h-5" />
                  {loading ? 'Creating...' : 'Create My Itinerary'}
                </Button>

                {!user && (
                  <p className="text-center text-sm text-muted-foreground">
                    Sign in to save your trips and view booking history
                  </p>
                )}
              </form>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default TripPlanner;
