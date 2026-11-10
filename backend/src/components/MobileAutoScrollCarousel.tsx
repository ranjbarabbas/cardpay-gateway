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
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isInteractingRef = useRef(false);

  const itemCount = React.Children.count(children);

  // Observe visibility in viewport: do not auto-scroll if user hasn't scrolled to this section yet
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll smoothly inside container ONLY without moving the window viewport
  const scrollContainerToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    const targetEl = itemRefs.current[index];
    if (!container || !targetEl) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // Distance between target center and container center
    const diff = (targetRect.left + targetRect.width / 2) - (containerRect.left + containerRect.width / 2);

    if (Math.abs(diff) > 2) {
      container.scrollBy({
        left: diff,
        behavior: "smooth",
      });
    }
    setActiveIndex(index);
  }, []);

  // Auto-scroll effect: advances every 3 seconds only if visible and not touched/paused
  useEffect(() => {
    if (isPaused || !isInView || itemCount <= 1) return;

    const timer = setInterval(() => {
      if (isInteractingRef.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % itemCount;
        scrollContainerToIndex(next);
        return next;
      });
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [isPaused, isInView, itemCount, autoScrollInterval, scrollContainerToIndex]);

  // Handle touch and interaction pause
  const handleUserInteract = () => {
    isInteractingRef.current = true;
    setIsPaused(true);
  };

  // Sync activeIndex with manual scroll
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
          onTouchStart={handleUserInteract}
          onPointerDown={handleUserInteract}
          onMouseEnter={handleUserInteract}
          onWheel={handleUserInteract}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-3 px-4"
          style={{
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
                  handleUserInteract();
                  scrollContainerToIndex(idx);
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
