# 🎯 AgentBond UI/UX Enhancement Task

**Goal:** Transform AgentBond frontend into a world-class animated UI for Synthesis Hackathon ($20K prizes - Celo + Venice tracks).

---

## 📦 TASK 1: Install Dependencies

```bash
cd packages/nextjs
npm install animejs@3.2.2 vanta@0.5.24 three@0.160.0 --legacy-peer-deps --prefer-offline --no-audit
```

> If this hangs, kill the process and run: `npm install animejs@3.2.2 vanta@0.5.24 three@0.160.0 --legacy-peer-deps` directly without the extra flags.

---

## 🎨 TASK 2: Create Animation Hooks

**File:** `packages/nextjs/hooks/useAnimations.ts`

```typescript
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
```

---

## 🌌 TASK 3: Create Vanta Background

**File:** `packages/nextjs/components/ui/VantaBackground.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);
  
  useEffect(() => {
    if (!vantaRef.current || effectRef.current) return;
    
    Promise.all([
      import('vanta/dist/vanta.net.min'),
      import('three')
    ]).then(([vantaModule, threeModule]) => {
      const VANTA = (vantaModule as any).default;
      const THREE = threeModule;
      
      effectRef.current = VANTA({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        minHeight: 200,
        minWidth: 200,
        color: 0x8b5cf6,
        backgroundColor: 0x0f172a,
        points: 10,
        maxDistance: 20,
        spacing: 18,
      });
    });
    
    return () => {
      if (effectRef.current) effectRef.current.destroy();
    };
  }, []);
  
  return <div ref={vantaRef} className="absolute inset-0 -z-10 opacity-40 min-h-screen" />;
}
```

---

## 🦸 TASK 4: Create Hero Section

**File:** `packages/nextjs/components/HeroSection.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
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
          <a href="/agents" className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/25">
            Browse Agents
          </a>
          <a href="/tasks" className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors">
            View Tasks
          </a>
        </div>
      </div>
    </section>
  );
}
```

---

## 🤖 TASK 5: Enhance AgentCard

**File:** `packages/nextjs/components/AgentCardEnhanced.tsx`

Read the existing `AgentCard.tsx` for the props interface, then create an enhanced version with:

1. Import `useAnimatedCounter` from `../hooks/useAnimations`
2. Add animated reputation counter
3. Add hover scale effect using CSS transitions
4. Add pulsing status indicator
5. Add stagger animation for specialty tags

```typescript
'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useAnimatedCounter } from '../hooks/useAnimations';

// Copy props interface from existing AgentCard.tsx

export function AgentCardEnhanced(props: AgentCardProps) {
  const reputationRef = useAnimatedCounter(props.reputation);
  const cardRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (tagsRef.current) {
      const tags = tagsRef.current.querySelectorAll('.tag');
      anime({
        targets: tags,
        opacity: [0, 1],
        scale: [0.8, 1],
        delay: anime.stagger(50),
        duration: 400,
        easing: 'easeOutCubic'
      });
    }
  }, []);
  
  return (
    <div 
      ref={cardRef}
      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-purple-500/10"
    >
      {/* Agent header with status pulse */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          {props.isActive && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-slate-800 animate-pulse" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{props.name}</h3>
          <p className="text-slate-400 text-sm">{props.specialty}</p>
        </div>
      </div>
      
      {/* Animated reputation */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl font-bold text-purple-400" ref={reputationRef}>0</span>
        <span className="text-slate-500">reputation</span>
      </div>
      
      {/* Specialty tags with stagger */}
      <div ref={tagsRef} className="flex flex-wrap gap-2">
        {props.tags?.map((tag, i) => (
          <span key={i} className="tag px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

## 📄 TASK 6: Update Main Page

**File:** `packages/nextjs/app/page.tsx`

Import and use the new components:

```typescript
import { HeroSection } from '../components/HeroSection';
import { AgentCardEnhanced } from '../components/AgentCardEnhanced';

// Replace existing AgentCard usage with AgentCardEnhanced
// Add HeroSection at the top of the page
```

---

## ✅ TASK 7: Verify Build

```bash
cd packages/nextjs
npm run build
```

Fix any TypeScript errors. Common fixes:
- Add `"type": "module"` to package.json if needed
- Install types: `npm install @types/three -D`

---

## 🚀 TASK 8: Commit Changes

```bash
git add -A
git commit -m "feat(ui): world-class animated UI with Anime.js and Vanta.js

- Add useAnimations hook with counter, fade, stagger
- Add VantaBackground component with NET effect
- Add HeroSection with staggered entrance
- Add AgentCardEnhanced with animated reputation
- Update main page with new components

Implements interface-craft storyboard pattern"
git push origin main
```

---

## 📢 COMPLETION SIGNAL

When all tasks are complete and the build passes, reply with:

**UI_UX_ENHANCEMENT_COMPLETE**

Include a summary of:
- Files created
- Files modified
- Build status
- Any issues encountered
