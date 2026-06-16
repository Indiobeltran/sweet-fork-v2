"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { cn } from "@/lib/utils";

type Testimonial = {
  context: string;
  name: string;
  quote: string;
};

type TestimonialCarouselProps = {
  testimonials: Testimonial[];
  className?: string;
};

const AUTOPLAY_INTERVAL = 6000;

export function TestimonialCarousel({ testimonials, className }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((current) => (current + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
  };

  // Intersection Observer for autoplay trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Autoplay Logic
  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (!isInView || isPaused || prefersReducedMotion || testimonials.length <= 1) {
      return;
    }

    const interval = setInterval(nextSlide, AUTOPLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isInView, isPaused, nextSlide, testimonials.length]);

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      prevSlide();
    }
  };

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative mx-auto w-full min-w-0 max-w-4xl", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Customer Testimonials"
    >
      <div className="grid min-w-0 grid-cols-1 grid-rows-1 overflow-hidden">
        {testimonials.map((testimonial, index) => {
          const isActive = index === currentIndex;
          
          return (
            <div
              key={`${testimonial.name}-${index}`}
              className={cn(
                "col-start-1 row-start-1 flex w-full min-w-0 items-center justify-center transition-opacity duration-700 ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
              aria-hidden={!isActive}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${testimonials.length}`}
            >
              <blockquote className="luxury-panel mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center justify-center rounded-[1.35rem] px-6 py-8 text-center sm:px-10">
                <p className="text-base sm:text-lg leading-relaxed text-charcoal/80 italic font-serif">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <footer className="mt-6 text-sm text-charcoal/70 flex flex-col items-center">
                  <p className="font-semibold text-charcoal uppercase tracking-wider text-xs">
                    {testimonial.name}
                  </p>
                  <p className="mt-1 text-xs opacity-80">{testimonial.context}</p>
                </footer>
              </blockquote>
            </div>
          );
        })}
      </div>

      {testimonials.length > 1 && (
        <div className="mt-6 flex max-w-full items-center justify-center gap-3 sm:gap-6">
          <button
            onClick={prevSlide}
            className="p-2 text-charcoal/40 hover:text-charcoal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-full"
            aria-label="Previous testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex max-w-[10rem] flex-wrap justify-center gap-2 sm:max-w-none" role="tablist" aria-label="Slides">
            {testimonials.map((_, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex ? "w-6 bg-gold" : "w-1.5 bg-charcoal/15 hover:bg-charcoal/30"
                )}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-2 text-charcoal/40 hover:text-charcoal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-full"
            aria-label="Next testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
