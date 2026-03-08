'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const COOLDOWN_MS = 800;
const WHEEL_THRESHOLD = 100; // 누적 deltaY 임계값

export function useSectionCarousel(
  total: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const activeIndexRef = useRef(0);
  const lastNavTime = useRef(0);
  const wheelAccumulator = useRef(0);

  // state → ref 동기화
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= total || index === activeIndexRef.current) return;
      lastNavTime.current = Date.now(); // 쿨다운 시작
      wheelAccumulator.current = 0;    // 누적 리셋
      setDirection(index > activeIndexRef.current ? 1 : -1);
      setActiveIndex(index);
    },
    [total],
  );

  const goNext = useCallback(() => goTo(activeIndexRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(activeIndexRef.current - 1), [goTo]);

  // 휠 이벤트 — 누적 방식
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();

      if (now - lastNavTime.current < COOLDOWN_MS) {
        wheelAccumulator.current = 0; // 쿨다운 중: 누적 리셋
        return;
      }

      wheelAccumulator.current += e.deltaY;

      if (Math.abs(wheelAccumulator.current) >= WHEEL_THRESHOLD) {
        const delta = wheelAccumulator.current;
        if (delta > 0) goNext();
        else goPrev();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [goNext, goPrev, containerRef]);

  // 터치 스와이프 이벤트
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const delta = startY - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 50) {
        if (delta > 0) goNext();
        else goPrev();
      }
    };

    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goNext, goPrev, containerRef]);

  // 키보드 이벤트 (input/textarea 포커스 시 무시)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp') goPrev();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  return { activeIndex, direction, goNext, goPrev, goTo, total };
}
