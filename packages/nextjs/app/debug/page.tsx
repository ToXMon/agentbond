"use client";

import { useEffect, useRef } from "react";
import anime from 'animejs';
import { DebugContracts } from "./_components/DebugContracts";
import { VantaBackground } from "~~/components/ui/VantaBackground";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - Debug Page
 *
 *  200ms   title fades in with gradient shimmer
 *  500ms   subtitle fades in
 *  800ms   info card slides up
 *  1100ms  debug contracts area fades in
 * ───────────────────────────────────────────────────────── */

const TIMING = { title: 200, subtitle: 500, card: 800, contracts: 1100 };

const DebugPage = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contractsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate title
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

    // Animate subtitle
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

    // Animate info card
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        delay: TIMING.card,
        easing: 'easeOutCubic'
      });
    }

    // Animate contracts area
    if (contractsRef.current) {
      anime({
        targets: contractsRef.current,
        opacity: [0, 1],
        duration: 600,
        delay: TIMING.contracts,
        easing: 'easeOutCubic'
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <VantaBackground />
      
      {/* Hero Header */}
      <div className="relative z-10 pt-12 pb-8 text-center px-4">
        <h1
          ref={titleRef}
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4"
          style={{ opacity: 0 }}
        >
          Debug Contracts
        </h1>
        <p
          ref={subtitleRef}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
          style={{ opacity: 0 }}
        >
          Interact with your deployed smart contracts
        </p>
      </div>

      {/* Info Card with Glassmorphism */}
      <div ref={cardRef} className="relative z-10 max-w-3xl mx-auto px-4 mb-8" style={{ opacity: 0 }}>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl shadow-purple-500/10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Contract Debugger</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                You can debug & interact with your deployed contracts here.
                <br />
                Check <code className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-mono text-xs">
                  packages/nextjs/app/debug/page.tsx
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Contracts Component */}
      <div 
        ref={contractsRef} 
        className="relative z-10 px-4"
        style={{ opacity: 0 }}
      >
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl shadow-purple-500/10 max-w-7xl mx-auto">
          <DebugContracts />
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
