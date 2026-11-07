import { ReactNode, useEffect, useRef, useState } from "react";
import { MovieCardSkeleton } from "@/components/movieCardSkeleton";

export const movieGridClasses = "grid grid-cols-[repeat(auto-fill,minmax(440px,1fr))] gap-6 max-[450px]:grid-cols-1";

export const LazyMovieCardWrapper = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div style={{ flex: 1 }} ref={ref}>{isVisible && children}</div>;
};

export const AllTimeLoading = () => (
  <div className={movieGridClasses}>
    {Array.from({ length: 9 }, (_, index) => <MovieCardSkeleton key={index} />)}
  </div>
);
