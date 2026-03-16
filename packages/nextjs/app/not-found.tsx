"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import anime from 'animejs';
import { VantaBackground } from "~~/components/ui/VantaBackground";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - 404 Not Found
 *
 *  200ms   404 text fades in with scale animation
 *  500ms   subtitle fades in
 *  800ms   description fades in
 *  1100ms  button slides up with glow effect
 * ───────────────────────────────────────────────────────── */

const TIMING = { errorCode: 200, subtitle: 500, description: 800, button: 1100 };

export default function NotFound() {
  const errorCodeRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Entrance animations
  useEffect(() => {
    if (errorCodeRef.current) {
      anime({
        targets: errorCodeRef.current,
        opacity: [0, 1],
        scale: [0.5, 1],
        duration: 800,
        delay: TIMING.errorCode,
        easing: 'easeOutExpo'
      });
    }

    if (subtitleRef.current) {
      anime({
        targets: subtitleRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 600,
        delay: TIMING.subtitle,
        easing: 'easeOutCubic'
      });
    }

    if (descriptionRef.current) {
      anime({
        targets: descriptionRef.current,
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 600,
        delay: TIMING.description,
        easing: 'easeOutCubic'
      });
    }

    if (buttonRef.current) {
      anime({
        targets: buttonRef.current,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        delay: TIMING.button,
        easing: 'easeOutCubic'
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <VantaBackground />
      
      <div className="relative z-10 text-center px-4">
        {/* Large 404 with Gradient */}
        <h1
          ref={errorCodeRef}
          className="text-[10rem] md:text-[14rem] font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-none mb-4"
          style={{ opacity: 0, textShadow: '0 0 80px rgba(168, 85, 247, 0.3)' }}
        >
          404
        </h1>
        
        {/* Subtitle */}
        <h2
          ref={subtitleRef}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
          style={{ opacity: 0 }}
        >
          Page Not Found
        </h2>
        
        {/* Description */}
        <p
          ref={descriptionRef}
          className="text-lg md:text-xl text-slate-400 mb-8 max-w-md mx-auto"
          style={{ opacity: 0 }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        {/* Styled CTA Button */}
        <div ref={buttonRef} style={{ opacity: 0 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
