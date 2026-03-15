/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - AnimatedComponents
 *
 * FADE_IN:
 *    0ms   element invisible (opacity: 0)
 *  200ms   element fades in, slides up 20px
 *  400ms   element at rest
 *
 * STAGGER_CHILDREN:
 *    0ms   parent appears
 *  100ms   first child animates
 *  150ms   second child (staggered 50ms)
 *  200ms   third child
 *
 * REPUTATION_COUNTER:
 *    0ms   count at 0
 * 1000ms   count reaches target (easeOutExpo)
 * 1200ms   subtle pulse celebration
 *
 * CELEBRATION:
 *    0ms   30 particles created at center
 *  500ms   particles burst outward
 * 1500ms   particles fade and shrink, removed from DOM
 * ───────────────────────────────────────────────────────── */

"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export const TIMING = {
  fadeIn: { start: 0, duration: 400 },
  staggerDelay: 50,
  counterDuration: 1000,
  celebrationPulse: 1200,
};

// Animated counter for reputation scores
export function useAnimatedCounter(target: number, duration = TIMING.counterDuration) {
  const ref = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<{ value: number }>({ value: 0 });

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: currentRef.current,
      value: target,
      duration,
      easing: "easeOutExpo",
      round: 1,
      update: () => {
        if (ref.current) {
          ref.current.textContent = Math.round(currentRef.current.value).toString();
        }
      },
    });
  }, [target, duration]);

  return ref;
}

// Fade in with slide up
export function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: TIMING.fadeIn.duration,
      delay,
      easing: "easeOutCubic",
    });
  }, [delay]);

  return ref;
}

// Stagger children animation
export function useStaggerChildren(
  parentRef: React.RefObject<HTMLDivElement>,
  selector: string,
  delay = 0,
) {
  useEffect(() => {
    if (!parentRef.current) return;

    const children = parentRef.current.querySelectorAll(selector);
    anime({
      targets: children,
      opacity: [0, 1],
      translateY: [15, 0],
      scale: [0.98, 1],
      duration: 500,
      delay: anime.stagger(TIMING.staggerDelay, { start: delay }),
      easing: "easeOutCubic",
    });
  }, [parentRef, selector, delay]);
}

// Celebration particles burst
export function useCelebration(containerRef: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];
    const colors = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "absolute w-2 h-2 rounded-full pointer-events-none";
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = "50%";
      particle.style.top = "50%";
      container.appendChild(particle);
      particles.push(particle);
    }

    anime({
      targets: particles,
      translateX: () => anime.random(-200, 200),
      translateY: () => anime.random(-200, 200),
      scale: [1, 0],
      opacity: [1, 0],
      duration: 1500,
      easing: "easeOutExpo",
      complete: () => {
        particles.forEach(p => p.remove());
      },
    });
  }, [containerRef]);
}
