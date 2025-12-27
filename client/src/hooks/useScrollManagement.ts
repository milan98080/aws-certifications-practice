import { useEffect, useRef, useCallback, useState } from 'react';
import { 
  ScrollPosition, 
  getScrollPosition, 
  setScrollPosition, 
  scrollToQuestionTop,
  debounce,
  throttle 
} from '../utils/scrollUtils';

export interface UseScrollManagementReturn {
  scrollToQuestionContainer: () => void;
  preventAutoScroll: () => void;
  restoreScrollPosition: (position: ScrollPosition) => void;
  maintainScrollOnTransition: () => ScrollPosition;
}

/**
 * Hook for managing scroll behavior in quiz components
 */
export const useScrollManagement = (): UseScrollManagementReturn => {
  const scrollPositionRef = useRef<ScrollPosition>({ x: 0, y: 0 });
  const preventScrollRef = useRef<boolean>(false);

  const scrollToQuestionContainer = useCallback(() => {
    scrollToQuestionTop();
  }, []);

  const preventAutoScroll = useCallback(() => {
    preventScrollRef.current = true;
    // Reset after a short delay
    setTimeout(() => {
      preventScrollRef.current = false;
    }, 100);
  }, []);

  const restoreScrollPosition = useCallback((position: ScrollPosition) => {
    setScrollPosition(position, true);
  }, []);

  const maintainScrollOnTransition = useCallback((): ScrollPosition => {
    const currentPosition = getScrollPosition();
    scrollPositionRef.current = currentPosition;
    return currentPosition;
  }, []);

  // Prevent unwanted scroll behavior during component updates
  useEffect(() => {
    const handleScroll = throttle(() => {
      if (!preventScrollRef.current) {
        scrollPositionRef.current = getScrollPosition();
      }
    }, 16); // ~60fps throttling

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    scrollToQuestionContainer,
    preventAutoScroll,
    restoreScrollPosition,
    maintainScrollOnTransition
  };
};

/**
 * Hook for pagination scroll management
 */
export const usePaginationScroll = () => {
  const scrollToTop = useCallback(() => {
    scrollToQuestionTop();
  }, []);

  const handlePageChange = useCallback((pageChangeCallback: () => void) => {
    pageChangeCallback();
    // Small delay to ensure DOM updates before scrolling
    setTimeout(() => {
      scrollToTop();
    }, 50);
  }, [scrollToTop]);

  return {
    scrollToTop,
    handlePageChange
  };
};

/**
 * Hook for responsive viewport detection
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isNarrowScreen: window.innerWidth < 768
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isNarrowScreen: window.innerWidth < 768
      });
    }, 250);

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

/**
 * Hook for scroll position tracking with performance optimization
 */
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = throttle(() => {
      setScrollPosition(getScrollPosition());
    }, 16); // ~60fps throttling

    window.addEventListener('scroll', updatePosition, { passive: true });
    updatePosition(); // Set initial position

    return () => window.removeEventListener('scroll', updatePosition);
  }, []);

  return scrollPosition;
};

/**
 * Hook for smooth scrolling to top
 */
export const useScrollToTop = () => {
  const scrollToTop = useCallback((smooth: boolean = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  return scrollToTop;
};