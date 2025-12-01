import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Mumbai",
      rating: 5,
      text: "VirtueYatra made planning our family trip to the Himalayas so easy! The AI recommendations were spot-on, and we discovered places we would have never found on our own.",
      avatar: "PS",
    },
    {
      name: "Rahul Verma",
      location: "Delhi",
      rating: 5,
      text: "Best travel platform I've used! The chatbot answered all my questions instantly, and the itinerary was perfectly planned. Highly recommend for anyone planning a trip.",
      avatar: "RV",
    },
    {
      name: "Ananya Patel",
      location: "Bangalore",
      rating: 5,
      text: "The wildlife safari package exceeded our expectations. VirtueYatra's attention to detail and personalized service made our trip unforgettable!",
      avatar: "AP",
    },
    {
      name: "Vikram Singh",
      location: "Jaipur",
      rating: 5,
      text: "I've booked three trips through VirtueYatra now. Each one has been amazing! The platform is user-friendly and the destinations are carefully curated.",
      avatar: "VS",
    },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Our <span className="gradient-text">Travelers Say</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of happy travelers who've discovered their dream destinations with us
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-8 border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-card/80 backdrop-blur-sm relative overflow-hidden"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-12 h-12 text-primary/10" />
              
              {/* Content */}
              <div className="relative">
                {/* Avatar and Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-travel-ocean flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-muted-foreground leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
