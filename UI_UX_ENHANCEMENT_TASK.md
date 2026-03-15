# UI/UX Enhancement Task for GitHub Copilot Agent

## Overview

Enhance AgentBond's frontend with world-class UI/UX using Anime.js and Vanta.js, following the interface-craft design critique methodology and storyboard-animation pattern.

**Signal when complete:** `UI_UX_ENHANCEMENT_COMPLETE`

---

## Part 1: Install Dependencies

```bash
cd /a0/usr/workdir/agentbond/packages/nextjs
npm install animejs vanta three --legacy-peer-deps
```

Note: Use `--legacy-peer-deps` due to React 19 peer dependency conflicts.

---

## Part 2: Design Critique of Existing Components

### Component Analysis Summary

Based on systematic design critique of 6 components:

| Component | Visual Issues | Interface Issues | Animation Opportunities |
|-----------|--------------|------------------|------------------------|
| AgentCard | Inconsistent shadows, generic badge styling | No progressive disclosure of specialties | Reputation counter could animate, status pulse |
| TaskExecutionPanel | Dense layout, progress bar generic | All stages shown at once | Stage transitions could be smoother, particle effects on complete |
| CompletionCelebration | Generic confetti, flat backgrounds | No context about what was completed | Better particle physics, Vanta background |
| TaskSubmissionForm | No animations, static form | No feedback during input | Input focus animations, submit button progress |
| VouchingDrawer | Risk assessment visualization weak | Slider feels disconnected | Risk score animation, stake preview animation |
| Header | Generic scaffold-eth styling, no brand identity | Static, no feedback | Wallet connect animation, network indicator pulse |

### Detailed Critique Findings

#### 1. AgentCard.tsx
**Visual Design Issues:**
- **Muddy shadows** — Shadow-lg creates hazy depth rather than crisp elevation
- **Competing colors** — Avatar color, ring color, status color, and vouch badge all fight for attention
- **Weak typographic hierarchy** — Name and reputation score same visual weight

**Interface Design Issues:**
- **No focusing mechanism** — All elements compete equally
- **Missing specialties display** — No way to see what the agent specializes in

**Animation Opportunities:**
- Counter should animate from 0 to reputation value
- Status indicator should pulse subtly when online
- Specialty tags could fade in staggered on hover

#### 2. TaskExecutionPanel.tsx
**Visual Design Issues:**
- **Dense stage display** — Three stages shown simultaneously creates cognitive load
- **Generic progress bars** — No personality, standard browser styling

**Interface Design Issues:**
- **Everything visible at once** — Violates progressive disclosure
- **No stage details** — Can't see what each stage is doing

**Animation Opportunities:**
- Stages could reveal progressively
- Progress bar could have gradient animation
- Completion could trigger particle celebration

#### 3. CompletionCelebration.tsx
**Visual Design Issues:**
- **Flat background** — Black/50% backdrop feels cheap
- **Generic confetti** — Squares without physics look amateur

**Interface Design Issues:**
- **No task context** — Celebration disconnected from what was completed

**Animation Opportunities:**
- Confetti could have gravity and rotation physics
- Numbers could count up dramatically
- Background could have subtle Vanta effect

#### 4. TaskSubmissionForm.tsx
**Visual Design Issues:**
- **No visual polish** — Standard form inputs without character
- **Static buttons** — No visual feedback on interaction

**Interface Design Issues:**
- **No input validation feedback** — Silent until submit
- **No preview** — Can't see what task will look like

**Animation Opportunities:**
- Input focus could animate border glow
- Submit button could show progress state
- Form could slide in smoothly

#### 5. VouchingDrawer.tsx
**Visual Design Issues:**
- **Risk assessment visualization** — Grid of numbers hard to parse
- **Disconnected slider** — Doesn't feel connected to stake amount

**Interface Design Issues:**
- **No preview of consequences** — What happens if I vouch this amount?

**Animation Opportunities:**
- Risk score could animate as meter
- Stake amount could show preview animation
- Confirm button could pulse when ready

#### 6. Header.tsx
**Visual Design Issues:**
- **Generic scaffold-eth branding** — No AgentBond identity
- **Static navigation** — No active state animation

**Interface Design Issues:**
- **No wallet state feedback** — Connection status not celebrated

**Animation Opportunities:**
- Logo could have subtle hover effect
- Wallet connect could have satisfying animation
- Network indicator could pulse on pending tx

---

## Part 3: Implementation Specifications

### 3A. Create `components/ui/AnimatedComponents.tsx`

Create reusable animated primitives with Anime.js following the storyboard pattern:

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
 *  ...
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
export function useStaggerChildren(selector: string, delay = 0) {
  const parentRef = useRef<HTMLDivElement>(null);
  
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
  }, [selector, delay]);
  
  return parentRef;
}

// Pulse animation for status indicators
export function usePulse(isActive: boolean, interval = 2000) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current || !isActive) return;
    
    const animation = anime({
      targets: ref.current,
      scale: [1, 1.1, 1],
      opacity: [1, 0.7, 1],
      duration: 1000,
      easing: 'easeInOutSine',
      loop: true
    });
    
    return () => animation.pause();
  }, [isActive, interval]);
  
  return ref;
}
```

### 3B. Create `components/ui/VantaBackground.tsx`

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

// Dynamic import to avoid SSR issues
export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);
  
  useEffect(() => {
    if (!vantaRef.current || effectRef.current) return;
    
    // Dynamic imports for Three.js and Vanta
    Promise.all([
      import('three'),
      import('vanta/dist/vanta.net.min')
    ]).then(([THREE, VANTA]) => {
      if (!vantaRef.current) return;
      
      effectRef.current = VANTA.default({
        el: vantaRef.current,
        THREE: THREE.default,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x8b5cf6, // Purple - matches AgentBond theme
        backgroundColor: 0x0f172a, // Slate 900
        points: 10.00,
        maxDistance: 20.00,
        spacing: 18.00,
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

### 3C. Create Enhanced AgentCard

Create `components/AgentCardEnhanced.tsx`:

```tsx
/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - AgentCardEnhanced
 *
 *    0ms   card invisible, waiting for intersection
 *  200ms   card fades in, slides up 20px
 *  500ms   reputation ring animates (stroke-dashoffset)
 *  700ms   counter starts counting up
 * 1000ms   status indicator pulses
 * 1200ms   specialty tags fade in (staggered)
 * ───────────────────────────────────────────────────────── */

'use client';

import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { useAnimatedCounter, TIMING } from './ui/AnimatedComponents';

const CARD_TIMING = {
  cardAppear: 200,
  ringAnimate: 500,
  counterStart: 700,
  statusPulse: 1000,
  tagsAppear: 1200,
};

export interface AgentCardEnhancedProps {
  address: string;
  name: string;
  reputation: number;
  isVouched: boolean;
  status: 'online' | 'offline' | 'busy';
  tasksCompleted: number;
  specialties: string[];
  onSelect?: () => void;
}

export function AgentCardEnhanced({
  address,
  name,
  reputation,
  isVouched,
  status,
  tasksCompleted,
  specialties,
  onSelect,
}: AgentCardEnhancedProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const counterRef = useAnimatedCounter(reputation);
  const [isHovered, setIsHovered] = useState(false);
  
  // Card entrance animation
  useEffect(() => {
    if (!cardRef.current) return;
    
    anime({
      targets: cardRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      duration: 600,
      delay: CARD_TIMING.cardAppear,
      easing: 'easeOutExpo'
    });
  }, []);
  
  // Reputation ring animation
  useEffect(() => {
    if (!ringRef.current) return;
    
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (reputation / 100) * circumference;
    
    anime({
      targets: ringRef.current,
      strokeDashoffset: [circumference, strokeDashoffset],
      duration: 1200,
      delay: CARD_TIMING.ringAnimate,
      easing: 'easeOutExpo'
    });
  }, [reputation]);
  
  // Specialty tags staggered animation
  useEffect(() => {
    if (!tagsRef.current) return;
    
    const tags = tagsRef.current.querySelectorAll('.specialty-tag');
    anime({
      targets: tags,
      opacity: [0, 1],
      translateY: [10, 0],
      scale: [0.9, 1],
      delay: anime.stagger(50, { start: CARD_TIMING.tagsAppear }),
      duration: 400,
      easing: 'easeOutCubic'
    });
  }, [specialties]);
  
  // Hover animation
  useEffect(() => {
    if (!cardRef.current) return;
    
    anime({
      targets: cardRef.current,
      scale: isHovered ? 1.03 : 1,
      translateY: isHovered ? -5 : 0,
      duration: 300,
      easing: 'easeOutCubic'
    });
  }, [isHovered]);
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const ringColor = reputation >= 70 ? '#10B981' : reputation >= 40 ? '#F59E0B' : '#EF4444';
  
  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 cursor-pointer border border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-shadow"
      style={{ opacity: 0 }}
    >
      {/* Reputation Ring */}
      <div className="relative w-28 h-28 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-slate-700"
          />
          <circle
            ref={ringRef}
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span ref={counterRef} className="text-3xl font-bold text-white">0</span>
        </div>
      </div>
      
      {/* Agent Info */}
      <h3 className="text-xl font-bold text-white text-center mb-1">{name}</h3>
      <p className="text-slate-400 text-sm text-center mb-4 font-mono">
        {address.slice(0, 6)}...{address.slice(-4)}
      </p>
      
      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          status === 'online' ? 'bg-emerald-500/20 text-emerald-400' :
          status === 'busy' ? 'bg-amber-500/20 text-amber-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      
      {/* Stats */}
      <div className="flex justify-between text-sm text-slate-400 mb-4">
        <span>{tasksCompleted} tasks</span>
        {isVouched && <span className="text-purple-400">✓ Vouched</span>}
      </div>
      
      {/* Specialties */}
      <div ref={tagsRef} className="flex flex-wrap gap-2 justify-center">
        {specialties.map((spec) => (
          <span
            key={spec}
            className="specialty-tag px-2 py-1 bg-purple-500/10 text-purple-300 rounded text-xs"
            style={{ opacity: 0 }}
          >
            {spec}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### 3D. Create HeroSection with Vanta

Create `components/HeroSection.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const VantaBackground = dynamic(
  () => import('./ui/VantaBackground').then(mod => mod.VantaBackground),
  { ssr: false }
);

const HERO_TIMING = {
  titleAppear: 200,
  subtitleAppear: 500,
  buttonsAppear: 800,
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
        translateY: [30, 0],
        duration: 800,
        delay: HERO_TIMING.titleAppear,
        easing: 'easeOutExpo'
      });
    }
    
    // Subtitle animation
    if (subtitleRef.current) {
      anime({
        targets: subtitleRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: HERO_TIMING.subtitleAppear,
        easing: 'easeOutExpo'
      });
    }
    
    // Buttons stagger animation
    if (buttonsRef.current) {
      const buttons = buttonsRef.current.querySelectorAll('button');
      anime({
        targets: buttons,
        opacity: [0, 1],
        translateY: [15, 0],
        scale: [0.95, 1],
        delay: anime.stagger(100, { start: HERO_TIMING.buttonsAppear }),
        duration: 500,
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
          <button 
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20"
            style={{ opacity: 0 }}
          >
            Browse Agents
          </button>
          <button 
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
            style={{ opacity: 0 }}
          >
            Create Task
          </button>
        </div>
      </div>
    </section>
  );
}
```

---

## Part 4: Integration Requirements

### Maintaining Project Cohesion

1. **Keep existing components working** - Do not delete original components, create enhanced versions alongside

2. **Update exports in `components/index.ts`**:
```tsx
export { AgentCard } from './AgentCard';
export { AgentCardEnhanced } from './AgentCardEnhanced';
export { HeroSection } from './HeroSection';
export { TaskExecutionPanel } from './TaskExecutionPanel';
export { CompletionCelebration } from './CompletionCelebration';
export { TaskSubmissionForm } from './TaskSubmissionForm';
export { VouchingDrawer } from './VouchingDrawer';
```

3. **Update `app/page.tsx` to use new components**:
```tsx
import { HeroSection, AgentCardEnhanced } from '~~/components';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900">
      <HeroSection />
      {/* Rest of page using AgentCardEnhanced */}
    </main>
  );
}
```

4. **Preserve DaisyUI/theme compatibility** - Enhanced components should work with existing theme system

5. **Keep contract integration intact** - All web3 hooks and contract calls must continue to work

---

## Part 5: Testing Requirements

After implementation:

```bash
cd /a0/usr/workdir/agentbond/packages/nextjs
npm run build
npm run dev  # Manual test in browser
```

Verify:
- [ ] All animations play correctly
- [ ] Vanta background loads without errors
- [ ] No console errors
- [ ] Components render correctly
- [ ] Theme switching still works
- [ ] Wallet connection still works
- [ ] Build succeeds without errors

---

## Part 6: Commit

```bash
cd /a0/usr/workdir/agentbond
git add -A
git commit -m "feat(ui): world-class UI/UX with Anime.js and Vanta.js

- Add AnimatedComponents with useAnimatedCounter, useFadeIn, useStaggerChildren hooks
- Add VantaBackground with NET effect for blockchain aesthetic
- Add AgentCardEnhanced with animated reputation ring and staggered tags
- Add HeroSection with Vanta background and entrance animations
- Implement interface-craft design critique improvements
- Maintain project cohesion with existing components"
git push origin main
```

---

## Reference Files

- Visual libraries research: `/a0/usr/workdir/agentbond/VISUAL_LIBRARIES.md`
- Existing components: `/a0/usr/workdir/agentbond/packages/nextjs/components/`
- Interface-craft skill: `/a0/skills/interface-craft/`

---

**Signal when complete:** `UI_UX_ENHANCEMENT_COMPLETE`
