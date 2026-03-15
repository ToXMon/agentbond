# AgentBond Frontend Enhancement Task

## 🎯 Objective
Transform the AgentBond frontend into a world-class, animated UI that will help win the Synthesis Hackathon ($20K prizes - Celo + Venice tracks).

## 📦 Step 1: Install Dependencies

```bash
cd packages/nextjs
npm install animejs@3.2.2 vanta@0.5.24 three@0.160.0 --legacy-peer-deps
```

> Note: Use these specific versions for React 18 compatibility. If install hangs, try: `npm install --legacy-peer-deps --prefer-offline --no-audit`

---

## 📋 Step 2: Read Context Files

Before implementing, read these files for full context:

1. **VISUAL_LIBRARIES.md** - Anime.js & Vanta.js API documentation, patterns, TypeScript types
2. **UI_UX_ENHANCEMENT_TASK.md** - Design critique and implementation specs
3. **prd.md** - Full product requirements for AgentBond

---

## 🎨 Step 3: Create UI Components Directory

```bash
mkdir -p packages/nextjs/components/ui
```

---

## 📝 Step 4: Implement Components

### 4A. Create `components/ui/AnimatedComponents.tsx`

Create reusable animation hooks following the **Storyboard Animation Pattern**:

```tsx
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
 * ───────────────────────────────────────────────────────── */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';

export const TIMING = {
  fadeIn: { start: 0, duration: 400 },
  staggerDelay: 50,
  reputationCount: 1000,
  celebrationPulse: 1200,
};

// Animated counter for reputation scores
export function useAnimatedCounter(target: number, duration = TIMING.reputationCount) {
  const ref = useRef<HTMLSpanElement>(null);
  const currentRef = useRef({ value: 0 });
  
  useEffect(() => {
    if (!ref.current) return;
    
    anime({
      targets: currentRef.current,
      value: target,
      duration,
      easing: 'easeOutExpo',
      round: 1,
      update: () => {
        if (ref.current) {
          ref.current.textContent = Math.round(currentRef.current.value).toString();
        }
      }
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
      easing: 'easeOutCubic'
    });
  }, [delay]);
  
  return ref;
}

// Stagger children animation
export function useStaggerChildren(parentRef: React.RefObject<HTMLDivElement>, selector: string, delay = 0) {
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
      easing: 'easeOutCubic'
    });
  }, [parentRef, selector, delay]);
}

// Celebration particles
export function useCelebration(containerRef: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create particles
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 rounded-full';
      particle.style.backgroundColor = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)];
      particle.style.left = '50%';
      particle.style.top = '50%';
      containerRef.current.appendChild(particle);
      particles.push(particle);
    }
    
    // Animate particles
    anime({
      targets: particles,
      translateX: () => anime.random(-200, 200),
      translateY: () => anime.random(-200, 200),
      scale: [1, 0],
      opacity: [1, 0],
      duration: 1500,
      easing: 'easeOutExpo',
      complete: () => {
        particles.forEach(p => p.remove());
      }
    });
  }, [containerRef]);
}
```

### 4B. Create `components/ui/VantaBackground.tsx`

```tsx
/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - VantaBackground
 *
 *    0ms   canvas invisible, initializing
 *  500ms   Vanta effect starts (NET effect for blockchain)
 * ongoing  subtle movement, responds to mouse
 * ───────────────────────────────────────────────────────── */

'use client';

import { useEffect, useRef } from 'react';

// Declare VANTA as a global
 declare const VANTA: any;
 declare const THREE: any;

export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);
  
  useEffect(() => {
    if (!vantaRef.current || effectRef.current) return;
    
    // Dynamic import to avoid SSR issues
    import('vanta/dist/vanta.net.min').then((vantaModule) => {
      import('three').then((threeModule) => {
        const VANTA = vantaModule.default;
        const THREE = threeModule;
        
        effectRef.current = VANTA({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x8b5cf6,
          backgroundColor: 0x0f172a,
          points: 10.00,
          maxDistance: 20.00,
          spacing: 18.00,
        });
      });
    });
    
    return () => {
      if (effectRef.current) effectRef.current.destroy();
    };
  }, []);
  
  return (
    <div 
      ref={vantaRef} 
      className="absolute inset-0 -z-10 opacity-40"
      style={{ minHeight: '100vh' }}
    />
  );
}
```

### 4C. Create Enhanced AgentCard `components/AgentCardEnhanced.tsx`

Read existing `AgentCard.tsx` for props interface, then create enhanced version with:
- Storyboard animation comments
- TIMING config object
- Animated reputation counter
- Smooth hover transitions
- Reputation ring animation

### 4D. Create HeroSection `components/HeroSection.tsx`

```tsx
'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import dynamic from 'next/dynamic';

const VantaBackground = dynamic(() => import('./ui/VantaBackground').then(m => m.VantaBackground), { ssr: false });

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - HeroSection
 *
 *    0ms   section invisible
 *  300ms   title fades in from top
 *  600ms   subtitle fades in
 *  900ms   buttons slide up (staggered)
 * 1200ms   stats fade in
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  title: 300,
  subtitle: 600,
  buttons: 900,
  stats: 1200,
};

export function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Title animation
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
    
    // Subtitle animation
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
    
    // Buttons stagger animation
    if (buttonsRef.current) {
      const buttons = buttonsRef.current.querySelectorAll('button');
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
        <div ref={buttonsRef} className="flex gap-4 justify-center">
          <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/25">
            Browse Agents
          </button>
          <button className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors">
            Create Task
          </button>
        </div>
      </div>
    </section>
  );
}
```

### 4E. Update `app/page.tsx`

Import and use HeroSection and enhanced components.

---

## 🎯 Design Principles to Follow

1. **Readable over clever** - Animation storyboard comments at top of every file
2. **Tunable by default** - All timing values in TIMING config objects
3. **Stage-driven** - Single stage state drives animation sequences
4. **Performance-first** - Lazy load Vanta, use CSS transitions where possible

---

## ✅ Verification Checklist

After implementation:

1. `npm run build` - Must complete without errors
2. Check all animations are smooth (60fps)
3. Verify Vanta background loads on hero section
4. Test agent card hover and reputation counter animations
5. Ensure dark theme is preserved
6. Verify web3 wallet connection still works

---

## 🚀 Commit When Done

```bash
git add -A
git commit -m "feat(ui): world-class UI/UX with Anime.js and Vanta.js

- Add AnimatedComponents.tsx with reusable hooks
- Add VantaBackground.tsx for hero section
- Create AgentCardEnhanced with storyboard animations
- Add HeroSection with staggered entrance animations
- Update main page with new components

Closes: UI enhancement task"
git push origin main
```

---

## 📢 Signal When Complete

Reply with: **UI_UX_ENHANCEMENT_COMPLETE** when all components are implemented, tested, and committed.
