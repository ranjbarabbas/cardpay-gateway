"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface MobileAutoScrollCarouselProps {
  children: React.ReactNode[];
  autoScrollInterval?: number;
  desktopGridClassName?: string;
  theme?: "dark" | "light";
  showDots?: boolean;
}

export default function MobileAutoScrollCarousel({
  children,
  autoScrollInterval = 3000,
  desktopGridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5",
  theme = "dark",
  showDots = true,
}: MobileAutoScrollCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isInteractingRef = useRef(false);

  const itemCount = React.Children.count(children);

  // Scroll to slide by index
  const scrollToSlide = useCallback((index: number) => {
    const targetEl = itemRefs.current[index];
    if (targetEl && containerRef.current) {
      targetEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setActiveIndex(index);
    }
  }, []);

  // Auto-scroll effect: advances every 3 seconds unless user touched/paused
  useEffect(() => {
    if (isPaused || itemCount <= 1) return;

    const timer = setInterval(() => {
      if (isInteractingRef.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % itemCount;
        const targetEl = itemRefs.current[next];
        if (targetEl && containerRef.current) {
          targetEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
        return next;
      });
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [isPaused, itemCount, autoScrollInterval]);

  // Handle touch and interaction pause
  const handleTouchStart = () => {
    isInteractingRef.current = true;
    setIsPaused(true); // Permanent pause on user interaction as requested
  };

  // Sync activeIndex with manual scroll using IntersectionObserver or scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerCenter = container.getBoundingClientRect().left + container.offsetWidth / 2;

    let closestIdx = 0;
    let minDistance = Infinity;

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeIndex) {
      setActiveIndex(closestIdx);
    }
  };

  return (
    <div>
      {/* Desktop View: Regular Responsive Grid */}
      <div className={`hidden md:grid ${desktopGridClassName}`}>
        {children}
      </div>

      {/* Mobile View: Horizontal Auto-Scroll Carousel */}
      <div className="block md:hidden">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onPointerDown={handleTouchStart}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-3 px-4 touch-pan-y"
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
          }}
          dir="rtl"
        >
          {React.Children.map(children, (child, idx) => (
            <div
              key={idx}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className="min-w-[85vw] max-w-[85vw] sm:min-w-[340px] sm:max-w-[340px] snap-center shrink-0 transition-transform duration-300"
              style={{ touchAction: "pan-y" }}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Carousel Navigation Indicators (Dots) */}
        {showDots && itemCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-3">
            {Array.from({ length: itemCount }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsPaused(true);
                  scrollToSlide(idx);
                }}
                aria-label={`اسلاید ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeIndex === idx
                    ? theme === "dark"
                      ? "w-6 bg-emerald-400"
                      : "w-6 bg-emerald-600"
                    : theme === "dark"
                    ? "w-2 bg-slate-700 hover:bg-slate-600"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
