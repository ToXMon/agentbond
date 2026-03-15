/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - useAnimations
 *
 * FADE_IN:
 *    0ms   element invisible (opacity: 0)
 *  400ms   element fades in, slides up 20px
 *
 * STAGGER_CHILDREN:
 *    0ms   parent appears
 *  100ms   first child animates
 *  150ms   second child (staggered 50ms)
 *
 * COUNTER:
 *    0ms   count at 0
 * 1000ms   count reaches target (easeOutExpo)
 * ───────────────────────────────────────────────────────── */

'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

export const TIMING = {
  fadeIn: 400,
  staggerDelay: 50,
  counterDuration: 1000,
};

export function useAnimatedCounter(target: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const currentRef = useRef({ value: 0 });
  
  useEffect(() => {
    if (!ref.current) return;
    anime({
      targets: currentRef.current,
      value: target,
      duration: TIMING.counterDuration,
      easing: 'easeOutExpo',
      round: 1,
      update: () => {
        if (ref.current) ref.current.textContent = Math.round(currentRef.current.value).toString();
      }
    });
  }, [target]);
  
  return ref;
}

export function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: TIMING.fadeIn,
      delay,
      easing: 'easeOutCubic'
    });
  }, [delay]);
  
  return ref;
}

export function useStaggerChildren(parentRef: React.RefObject<HTMLElement>, selector: string) {
  useEffect(() => {
    if (!parentRef.current) return;
    const children = parentRef.current.querySelectorAll(selector);
    anime({
      targets: children,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
      delay: anime.stagger(TIMING.staggerDelay),
      easing: 'easeOutCubic'
    });
  }, [parentRef, selector]);
}
