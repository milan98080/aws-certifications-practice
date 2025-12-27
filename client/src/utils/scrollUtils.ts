/**
 * Scroll management utilities for consistent scroll behavior across components
 */

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface ScrollUtils {
  scrollToElement(elementId: string, offset?: number): void;
  scrollToTop(smooth?: boolean): void;
  maintainScrollPosition(): ScrollPosition;
  scrollToQuestionTop(): void;
  getScrollPosition(): ScrollPosition;
  setScrollPosition(position: ScrollPosition, smooth?: boolean): void;
}

/**
 * Smoothly scrolls to a specific element with optional offset
 */
export const scrollToElement = (elementId: string, offset: number = 0): void => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    const targetPosition = elementTop - offset;
    
    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: 'smooth'
    });
  }
};

/**
 * Scrolls to the top of the page
 */
export const scrollToTop = (smooth: boolean = true): void => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

/**
 * Performance-optimized scroll position getter
 */
export const getScrollPosition = (): ScrollPosition => {
  // Use more performant method when available
  if (window.pageYOffset !== undefined) {
    return {
      x: window.pageXOffset,
      y: window.pageYOffset
    };
  }
  
  // Fallback for older browsers
  return {
    x: document.documentElement.scrollLeft || document.body.scrollLeft || 0,
    y: document.documentElement.scrollTop || document.body.scrollTop || 0
  };
};

/**
 * Sets the scroll position
 */
export const setScrollPosition = (position: ScrollPosition, smooth: boolean = false): void => {
  window.scrollTo({
    left: position.x,
    top: position.y,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

/**
 * Maintains scroll position without any jumping
 */
export const maintainScrollPosition = (): ScrollPosition => {
  return getScrollPosition();
};

/**
 * Scrolls to the question container top with appropriate offset
 */
export const scrollToQuestionTop = (): void => {
  // Look for common question container selectors
  const selectors = [
    '.question-card',
    '.practice-question',
    '.study-question',
    '.questions-list',
    '.random-practice'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
      const offset = 20; // Small offset from top
      
      window.scrollTo({
        top: Math.max(0, elementTop - offset),
        behavior: 'smooth'
      });
      return;
    }
  }
  
  // Fallback: scroll to top if no question container found
  scrollToTop();
};

/**
 * Debounced scroll event handler with configurable delay
 */
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttled function for high-frequency events
 */
export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function executedFunction(...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Checks if an element is visible in the viewport
 */
export const isElementVisible = (element: Element): boolean => {
  const rect = element.getBoundingClientRect();
  const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  
  return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
};

/**
 * Ensures an element is visible by scrolling to it if necessary
 */
export const ensureElementVisible = (element: Element, offset: number = 0): void => {
  if (!isElementVisible(element)) {
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: Math.max(0, elementTop - offset),
      behavior: 'smooth'
    });
  }
};

/**
 * Gets viewport information
 */
export const getViewportInfo = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isNarrowScreen: window.innerWidth < 768,
    scrollY: window.pageYOffset || document.documentElement.scrollTop
  };
};