import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import studentsProfile from '@/assets/students-profile.png';

export const TestimonialsSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isIndia } = useCountryDetection();

  const indiaTestimonials = [
    {
      name: 'Priya Sharma',
      exam: 'NEET 2024',
      rating: 5,
      comment: 'Examtrakr helped me track my entire NEET preparation systematically. The topic-wise analytics were incredibly helpful in identifying my weak areas. I scored 680/720 and got into my dream medical college!',
      avatarPos: '35% center',
      location: 'Mumbai',
      result: 'AIR 247'
    },
    {
      name: 'Rahul Kumar',
      exam: 'IBPS PO 2024',
      rating: 5,
      comment: 'The progress tracking feature kept me motivated throughout my preparation. I could see my improvement day by day. The AI insights helped me focus on weak areas. Finally cleared IBPS PO in my second attempt!',
      avatarPos: '5% center',
      location: 'Delhi',
      result: 'Selected'
    },
    {
      name: 'Anita Patel',
      exam: 'JEE Advanced 2024',
      rating: 5,
      comment: 'Outstanding platform! The exam-wise analytics and subject breakdown made my preparation so much more organized and efficient. The daily progress tracking kept me disciplined. Got into IIT Bombay!',
      avatarPos: '95% center',
      location: 'Ahmedabad',
      result: 'AIR 156'
    },
    {
      name: 'Vikram Singh',
      exam: 'SSC CGL 2023',
      rating: 5,
      comment: 'Examtrakr made my SSC preparation so much easier. The mobile app helped me track progress anywhere. AI insights helped me focus on weak topics. Highly recommend for all SSC aspirants!',
      avatarPos: '65% center',
      location: 'Lucknow',
      result: 'Selected'
    },
    {
      name: 'Sneha Reddy',
      exam: 'CAT 2023',
      rating: 5,
      comment: 'The detailed analytics and progress reports helped me identify weak areas quickly. Examtrakr\'s structured approach helped me cover the entire syllabus systematically. Got into IIM Bangalore with 99.2 percentile!',
      avatarPos: '35% center',
      location: 'Bangalore',
      result: '99.2%ile'
    },
    {
      name: 'Arjun Mehta',
      exam: 'UPSC CSE 2023',
      rating: 5,
      comment: 'Perfect tool for UPSC preparation with 800+ topics to track. The progress tracking kept me disciplined and focused throughout the 18-month journey. Cleared Prelims in first attempt!',
      avatarPos: '65% center',
      location: 'Chennai',
      result: 'Prelims Cleared'
    },
  ];

  const globalTestimonials = [
    {
      name: 'Emily Carter',
      exam: 'GRE 2024',
      rating: 5,
      comment: 'Examtrakr helped me track my GRE prep efficiently. I could monitor weak areas and improve day by day. Highly recommend for international exams!',
      avatarPos: '95% center',
      location: 'New York, USA',
      result: '330/340'
    },
    {
      name: 'Liam Johnson',
      exam: 'SAT 2023',
      rating: 5,
      comment: 'The platform made SAT preparation so simple and organized. Tracking topics and practicing regularly really boosted my confidence.',
      avatarPos: '5% center',
      location: 'London, UK',
      result: '1550/1600'
    },
    {
      name: 'Sophia Lee',
      exam: 'IELTS 2024',
      rating: 5,
      comment: 'With Examtrakr, I could track IELTS practice and focus on my weak sections. Finally got the band I needed for my university application.',
      avatarPos: '35% center',
      location: 'Sydney, Australia',
      result: 'Band 8.5'
    },
    {
      name: 'Raj Patel',
      exam: 'CFA Level 1',
      rating: 5,
      comment: 'Using Examtrakr for CFA Level 1 prep was amazing. The progress tracking and resource access helped me pass on my first attempt!',
      avatarPos: '65% center',
      location: 'Toronto, Canada',
      result: 'Pass'
    },
    {
      name: 'Olivia Smith',
      exam: 'GMAT 2023',
      rating: 5,
      comment: 'Tracking my GMAT prep with Examtrakr kept me disciplined and focused. Highly recommend for all MBA aspirants!',
      avatarPos: '95% center',
      location: 'Singapore',
      result: '740'
    },
  ];

  const testimonials = isIndia ? indiaTestimonials : globalTestimonials;
  
  // Duplicate testimonials for seamless loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // Slow scroll speed
    let animationFrame: number;
    let isPaused = false;

    const animate = () => {
      if (!isPaused) {
        scrollPosition += scrollSpeed;
        
        // Reset position when halfway through (seamless loop)
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollLeft = scrollPosition;
      }
      animationFrame = requestAnimationFrame(animate);
    };

    const handleMouseEnter = () => {
      isPaused = true;
    };

    const handleMouseLeave = () => {
      isPaused = false;
    };

    const handleTouchStart = () => {
      isPaused = true;
    };

    const handleTouchEnd = () => {
      isPaused = false;
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    scrollContainer.addEventListener('touchstart', handleTouchStart);
    scrollContainer.addEventListener('touchend', handleTouchEnd);

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-semibold text-primary">Trusted by 50,000+ Students</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real results from students who achieved their goals
          </p>
        </div>

        {/* Auto-scrolling testimonials container */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-hidden pb-4 cursor-pointer"
          style={{ scrollBehavior: 'auto' }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="flex-shrink-0 w-[340px] sm:w-[400px] lg:w-[420px] border-border hover:shadow-lg transition-all duration-300 bg-card"
            >
              <CardContent className="p-5 sm:p-8 space-y-4 sm:space-y-5">
                {/* Rating and Result */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-warning fill-warning" />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-success bg-success/10 px-2 sm:px-3 py-1 rounded-full">
                    {testimonial.result}
                  </span>
                </div>

                {/* Comment */}
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed min-h-[120px] sm:min-h-[140px]">
                  "{testimonial.comment}"
                </p>

                {/* Author info */}
                <div className="flex items-center space-x-3 sm:space-x-4 pt-4 sm:pt-5 border-t border-border">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
                    <img
                      src={studentsProfile}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: testimonial.avatarPos }}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-base sm:text-lg truncate">
                      {testimonial.name}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">
                      {testimonial.exam} • {testimonial.location}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent pointer-events-none hidden sm:block"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent pointer-events-none hidden sm:block"></div>
      </div>
    </section>
  );
};