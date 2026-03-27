'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import Link from 'next/link';
import { VantaBackground } from './ui/VantaBackground';
 * TODO: Glassmorphism Redesign (Issue #5) - Add 3D shimmering typography, glowing buttons

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
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      <VantaBackground />
      
      <div className="relative z-10 text-center px-4">
        <h1 
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-6"
          style={{ opacity: 0 }}
        >
          AgentBond
        </h1>
        <p 
          ref={subtitleRef}
          className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-8"
          style={{ opacity: 0 }}
        >
          Reputation-backed agent lending protocol
        </p>
        <div ref={buttonsRef} className="flex gap-4 justify-center flex-wrap">
          <Link href="/agents" className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/25" aria-label="Browse agents">
            Browse Agents
          </Link>
          <Link href="/tasks" className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors" aria-label="View tasks">
            View Tasks
          </Link>
        </div>
      </div>
    </section>
  );
}
