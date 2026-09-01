import React, { useState, useRef, useEffect, useCallback } from 'react';

interface UseDragScrollOptions {
  dragThreshold?: number; // Minimum pixels to qualify as a drag (default 5px)
  momentumFriction?: number; // Friction decay multiplier for inertia (0.92 - 0.96, default 0.94)
  dragSpeed?: number; // Multiplier for mouse drag speed (default 1.2)
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useDragScroll<T extends HTMLElement = HTMLDivElement>(options: UseDragScrollOptions = {}) {
  const {
    dragThreshold = 5,
    momentumFriction = 0.94,
    dragSpeed = 1.15,
    onDragStart,
    onDragEnd
  } = options;

  const containerRef = useRef<T | null>(null);

  // States
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragScrolling, setIsDragScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Internal tracking refs
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Update scroll metrics (progress, canScroll flags)
  const updateScrollMetrics = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const currentScrollLeft = el.scrollLeft;

    setCanScrollLeft(currentScrollLeft > 5);
    setCanScrollRight(maxScrollLeft > 0 && currentScrollLeft < maxScrollLeft - 5);

    if (maxScrollLeft > 0) {
      const progress = Math.min(100, Math.max(0, Math.round((currentScrollLeft / maxScrollLeft) * 100)));
      setScrollProgress(progress);
    } else {
      setScrollProgress(0);
    }
  }, []);

  // Listen to scroll events on container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollMetrics();
    const handleScroll = () => {
      updateScrollMetrics();
    };

    const handleResize = () => {
      updateScrollMetrics();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollMetrics]);

  // Cancel any running momentum animation
  const cancelMomentum = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Start momentum glide
  const startMomentumGlide = useCallback(() => {
    cancelMomentum();
    const el = containerRef.current;
    if (!el) return;

    let velocity = velocityRef.current;
    if (Math.abs(velocity) < 1.2) {
      velocityRef.current = 0;
      return;
    }

    const step = () => {
      if (!containerRef.current) return;
      
      containerRef.current.scrollLeft -= velocity;
      velocity *= momentumFriction;

      if (Math.abs(velocity) > 0.4) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        velocityRef.current = 0;
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, [cancelMomentum, momentumFriction]);

  // Mouse Down handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only primary mouse button (left click)
    if (e.button !== 0) return;

    // Don't hijack input elements, textareas, selects, or interactive buttons
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('input'))
    ) {
      return;
    }

    cancelMomentum();

    const el = containerRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    startYRef.current = e.pageY - el.offsetTop;
    startScrollLeftRef.current = el.scrollLeft;
    startScrollTopRef.current = el.scrollTop;
    lastXRef.current = e.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;

    setIsMouseDown(true);
  }, [cancelMomentum]);

  // Mouse Move handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const el = containerRef.current;
    if (!el) return;

    const currentX = e.pageX - el.offsetLeft;
    const dx = currentX - startXRef.current;

    // Check threshold before starting drag scroll
    if (!hasDraggedRef.current && Math.abs(dx) > dragThreshold) {
      hasDraggedRef.current = true;
      setIsDragScrolling(true);
      if (onDragStart) onDragStart();
    }

    if (hasDraggedRef.current) {
      e.preventDefault();
      // Scroll horizontally
      el.scrollLeft = startScrollLeftRef.current - dx * dragSpeed;

      // Track velocity for inertia
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      if (dt > 10) {
        const frameDx = e.pageX - lastXRef.current;
        velocityRef.current = (frameDx / dt) * 16.6 * dragSpeed;
        lastXRef.current = e.pageX;
        lastTimeRef.current = now;
      }
    }
  }, [dragSpeed, dragThreshold, onDragStart]);

  // Mouse Up / Leave handler
  const handleMouseUpOrLeave = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsMouseDown(false);

    if (hasDraggedRef.current) {
      startMomentumGlide();
      if (onDragEnd) onDragEnd();
      // Delay resetting isDragScrolling briefly so click-capturing works reliably
      setTimeout(() => {
        setIsDragScrolling(false);
        hasDraggedRef.current = false;
      }, 50);
    } else {
      setIsDragScrolling(false);
      hasDraggedRef.current = false;
    }
  }, [onDragEnd, startMomentumGlide]);

  // Click Capture handler to suppress cell selection / clicks when dragging
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDraggedRef.current || isDragScrolling) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, [isDragScrolling]);

  // Programmatic scroll methods
  const scrollByAmount = useCallback((amount: number, smooth: boolean = true) => {
    cancelMomentum();
    const el = containerRef.current;
    if (!el) return;

    el.scrollBy({
      left: amount,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, [cancelMomentum]);

  const scrollToStart = useCallback(() => {
    cancelMomentum();
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'smooth' });
  }, [cancelMomentum]);

  const scrollToEnd = useCallback(() => {
    cancelMomentum();
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
  }, [cancelMomentum]);

  const scrollToSlotIndex = useCallback((slotIndex: number, totalSlots: number = 23) => {
    cancelMomentum();
    const el = containerRef.current;
    if (!el) return;

    // Approximate position of slot: offset for staff column (220px) + (slotWidth * slotIndex)
    const slotWidth = 100; // average column width
    const targetScrollLeft = Math.max(0, slotIndex * slotWidth);

    el.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
  }, [cancelMomentum]);

  return {
    containerRef,
    isMouseDown,
    isDragScrolling,
    scrollProgress,
    canScrollLeft,
    canScrollRight,
    scrollByAmount,
    scrollToStart,
    scrollToEnd,
    scrollToSlotIndex,
    events: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
      onClickCapture: handleClickCapture
    }
  };
}
