'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import Link from 'next/link';
import { VantaBackground } from './ui/VantaBackground';

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - HeroSection
 *
 *  300ms   title fades in from top
 *  600ms   subtitle fades in  
 *  900ms   buttons slide up (staggered)
 * ───────────────────────────────────────────────────────── */

const TIMING = { title: 300, subtitle: 600, buttons: 900 };

export function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (titleRef.current) {
      anime({
        targets: titleRef.current,
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 800,
        delay: TIMING.title,
        easing: 'easeOutExpo'
      });
    }
    
    if (subtitleRef.current) {
      anime({
        targets: subtitleRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
        delay: TIMING.subtitle,
        easing: 'easeOutExpo'
      });
    }
    
    if (buttonsRef.current) {
      const buttons = buttonsRef.current.querySelectorAll('button, a');
      anime({
        targets: buttons,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: anime.stagger(100, { start: TIMING.buttons }),
        easing: 'easeOutCubic'
      });
    }
  }, []);
  
  return (
    <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden deepspace-bg">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 grid-overlay pointer-events-none" />
      <VantaBackground />

      {/* Glass visual anchor */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-shimmer"
          style={{ opacity: 0 }}
        >
          AgentBond
        </h1>
        <p
          ref={subtitleRef}
          className="text-xl md:text-2xl text-slate-400 tracking-wide max-w-2xl mx-auto mb-10"
          style={{ opacity: 0 }}
        >
          Reputation-backed agent lending protocol
        </p>
        <div ref={buttonsRef} className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/agents"
            className="btn-glow px-8 py-3 inline-block"
            aria-label="Browse agents"
          >
            Browse Agents
          </Link>
          <Link
            href="/tasks"
            className="btn-ghost-space px-8 py-3 inline-block"
            aria-label="View tasks"
          >
            View Tasks
          </Link>
        </div>
      </div>
    </section>
  );
}
