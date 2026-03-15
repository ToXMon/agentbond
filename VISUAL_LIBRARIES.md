# Visual Libraries Research for AgentBond UI/UX Enhancement

## Overview

This document provides comprehensive research on Anime.js and Vanta.js for implementing world-class UI/UX enhancements in AgentBond.

---

## 1. Anime.js v4

### What is Anime.js?

Anime.js is a lightweight JavaScript animation library with a simple yet powerful API. It works with CSS properties, SVG, DOM attributes, and JavaScript Objects.

### Installation

```bash
npm install animejs
```

### Core API

```javascript
import anime from 'animejs';

// Basic animation
anime({
  targets: 'div',
  translateX: 250,
  rotate: '1turn',
  backgroundColor: '#FFF',
  duration: 800,
  easing: 'easeInOutQuad'
});
```

### Key Features for AgentBond

#### 1. Staggered Animations
Perfect for agent cards appearing one by one:

```javascript
anime({
  targets: '.agent-card',
  opacity: [0, 1],
  translateY: [50, 0],
  delay: anime.stagger(100, {grid: [4, 4], from: 'center'}),
  easing: 'easeOutExpo'
});
```

#### 2. Timeline Animations
For complex multi-stage sequences:

```javascript
const tl = anime.timeline({
  easing: 'easeOutExpo',
  duration: 750
});

tl.add({
  targets: '.card',
  opacity: [0, 1],
  translateY: [50, 0]
})
.add({
  targets: '.reputation-ring',
  strokeDashoffset: [circumference, targetOffset],
}, '-=500') // Overlap with previous
.add({
  targets: '.counter',
  innerHTML: [0, 100],
  round: 1
}, '-=300');
```

#### 3. SVG Animations
For reputation rings:

```javascript
anime({
  targets: 'circle',
  strokeDashoffset: [anime.setDashoffset, 0],
  easing: 'easeInOutSine',
  duration: 1500,
  direction: 'normal'
});
```

#### 4. Number Animations
For reputation counters:

```javascript
anime({
  targets: { value: 0 },
  value: 85,
  round: 1,
  duration: 2000,
  easing: 'easeOutExpo',
  update: function(anim) {
    counterElement.textContent = Math.round(anim.animations[0].currentValue);
  }
});
```

#### 5. React Integration Pattern

```tsx
import { useEffect, useRef } from 'react';
import anime from 'animejs';

function useAnimeEffect(dependencies = []) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      easing: 'easeOutCubic'
    });
  }, dependencies);
  
  return ref;
}
```

### Easing Functions

```javascript
// Available easings
'easeInQuad'    'easeOutQuad'    'easeInOutQuad'
'easeInCubic'   'easeOutCubic'   'easeInOutCubic'
'easeInQuart'   'easeOutQuart'   'easeInOutQuart'
'easeInExpo'    'easeOutExpo'    'easeInOutExpo'
'easeInSine'    'easeOutSine'    'easeInOutSine'
'easeInCirc'    'easeOutCirc'    'easeInOutCirc'
'easeInBack'    'easeOutBack'    'easeInOutBack'
'easeInBounce'  'easeOutBounce'  'easeInOutBounce'
'linear'
'spring(mass, stiffness, damping, velocity)'
```

### Performance Tips

1. **Use `will-change` CSS property** for animated elements
2. **Prefer transforms** (translate, scale, rotate) over layout properties
3. **Use `requestAnimationFrame`** internally handled by Anime.js
4. **Batch animations** with timelines for complex sequences

---

## 2. Vanta.js

### What is Vanta.js?

Vanta.js is a collection of animated 3D backgrounds using Three.js. Perfect for creating immersive blockchain-themed hero sections.

### Installation

```bash
npm install vanta three
```

### Available Effects

| Effect | Best For | Visual Style |
|--------|----------|-------------|
| NET | Blockchain/Network | Connected nodes, perfect for AgentBond |
| WAVES | Flowing/Movement | Organic wave patterns |
| BIRDS | Dynamic/Lively | Flying bird flock |
| FOG | Mysterious/Depth | Layered fog clouds |
| CLOUDS | Sky/Atmospheric | Moving cloud layer |
| CELLS | Biological/Tech | Dividing cells pattern |
| TRUNK | Abstract/Artistic | Growing branch structure |
| TOPOLOGY | Data/Network | Topographic lines |
| DOTS | Minimal/Modern | Floating dot matrix |
| RINGS | Futuristic/SciFi | Concentric ring animation |
| GLOBE | Global/World | 3D earth visualization |

### NET Effect (Recommended for AgentBond)

```javascript
import VANTA from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';

VANTA.NET({
  el: '#vanta-container',
  THREE: THREE,
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200.00,
  minWidth: 200.00,
  scale: 1.00,
  scaleMobile: 1.00,
  color: 0x8b5cf6,      // Purple - AgentBond brand
  backgroundColor: 0x0f172a, // Slate 900
  points: 10.00,        // Number of nodes
  maxDistance: 20.00,   // Connection distance
  spacing: 18.00,       // Node spacing
});
```

### React Integration

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);
  
  useEffect(() => {
    if (!vantaRef.current) return;
    
    // Dynamic imports for SSR compatibility
    Promise.all([
      import('three'),
      import('vanta/dist/vanta.net.min')
    ]).then(([THREE, VANTA]) => {
      effectRef.current = VANTA.default({
        el: vantaRef.current,
        THREE: THREE.default,
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
  
  return <div ref={vantaRef} className="absolute inset-0 -z-10 opacity-40" />;
}
```

### Performance Considerations

1. **Use `opacity: 0.4`** to reduce visual noise
2. **Limit points to 10-15** for better performance
3. **Enable `mouseControls: true`** for interactivity
4. **Destroy effect on unmount** to prevent memory leaks
5. **Use dynamic imports** for SSR/Next.js compatibility

---

## 3. Combined Animation Patterns

### Hero Section Pattern

```tsx
/* STORYBOARD:
 *    0ms   Vanta background initializes
 *  200ms   Title fades in from bottom
 *  500ms   Subtitle fades in
 *  800ms   CTA buttons stagger in
 * ongoing  Vanta responds to mouse
 */

function HeroSection() {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonsRef = useRef(null);
  
  useEffect(() => {
    // Title animation
    anime({
      targets: titleRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      delay: 200,
      easing: 'easeOutExpo'
    });
    
    // Subtitle animation
    anime({
      targets: subtitleRef.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      delay: 500,
      easing: 'easeOutExpo'
    });
    
    // Buttons stagger
    anime({
      targets: buttonsRef.current.children,
      opacity: [0, 1],
      translateY: [15, 0],
      delay: anime.stagger(100, {start: 800}),
      duration: 500,
      easing: 'easeOutCubic'
    });
  }, []);
  
  return (
    <section>
      <VantaBackground />
      <h1 ref={titleRef} style={{opacity: 0}}>AgentBond</h1>
      <p ref={subtitleRef} style={{opacity: 0}}>Reputation-backed lending</p>
      <div ref={buttonsRef}>
        <button style={{opacity: 0}}>Browse</button>
        <button style={{opacity: 0}}>Create</button>
      </div>
    </section>
  );
}
```

### Agent Card Pattern

```tsx
/* STORYBOARD:
 *    0ms   Card invisible
 *  200ms   Card container fades in
 *  500ms   Reputation ring draws
 *  700ms   Counter counts up
 * 1000ms   Status pulse starts
 * 1200ms   Tags stagger in
 */

function AgentCard({ reputation, specialties }) {
  const cardRef = useRef(null);
  const ringRef = useRef(null);
  const counterRef = useRef({value: 0});
  const tagsRef = useRef(null);
  
  useEffect(() => {
    // Card entrance
    anime({
      targets: cardRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      duration: 600,
      delay: 200,
      easing: 'easeOutExpo'
    });
    
    // Ring animation
    anime({
      targets: ringRef.current,
      strokeDashoffset: [circumference, targetOffset],
      duration: 1200,
      delay: 500,
      easing: 'easeOutExpo'
    });
    
    // Counter animation
    anime({
      targets: counterRef.current,
      value: reputation,
      duration: 1000,
      delay: 700,
      round: 1,
      easing: 'easeOutExpo',
      update: (a) => {
        displayRef.current.textContent = Math.round(a.animations[0].currentValue);
      }
    });
    
    // Tags stagger
    anime({
      targets: tagsRef.current.children,
      opacity: [0, 1],
      translateY: [10, 0],
      scale: [0.9, 1],
      delay: anime.stagger(50, {start: 1200}),
      duration: 400,
      easing: 'easeOutCubic'
    });
  }, []);
  
  return (
    <div ref={cardRef} style={{opacity: 0}}>
      <svg><circle ref={ringRef} /></svg>
      <span ref={displayRef}>0</span>
      <div ref={tagsRef}>
        {specialties.map(s => <span style={{opacity: 0}}>{s}</span>)}
      </div>
    </div>
  );
}
```

---

## 4. Color Palette for AgentBond

```css
/* Primary Brand Colors */
--purple-500: #8b5cf6;   /* Primary accent */
--purple-600: #7c3aed;   /* Hover state */
--pink-400: #f472b6;     /* Gradient accent */

/* Background Colors */
--slate-900: #0f172a;    /* Main background */
--slate-800: #1e293b;    /* Card background */
--slate-700: #334155;    /* Borders */

/* Status Colors */
--emerald-500: #10b981;  /* Success/Online/High rep */
--amber-500: #f59e0b;    /* Warning/Busy/Medium rep */
--red-500: #ef4444;      /* Error/Offline/Low rep */

/* Text Colors */
--white: #ffffff;
--slate-300: #cbd5e1;    /* Secondary text */
--slate-400: #94a3b8;    /* Muted text */
```

### Vanta Configuration with Brand Colors

```javascript
VANTA.NET({
  color: 0x8b5cf6,        // Purple-500
  backgroundColor: 0x0f172a, // Slate-900
});
```

---

## 5. TypeScript Types

```typescript
// animejs types (install: npm install @types/animejs --legacy-peer-deps)
import anime from 'animejs';

// Vanta types
type VantaEffect = 'NET' | 'WAVES' | 'BIRDS' | 'FOG' | 'CLOUDS' | 
                   'CELLS' | 'TRUNK' | 'TOPOLOGY' | 'DOTS' | 'RINGS' | 'GLOBE';

interface VantaConfig {
  el: HTMLElement | string;
  THREE: any;
  mouseControls?: boolean;
  touchControls?: boolean;
  gyroControls?: boolean;
  minHeight?: number;
  minWidth?: number;
  scale?: number;
  scaleMobile?: number;
  color?: number;
  backgroundColor?: number;
  // NET-specific
  points?: number;
  maxDistance?: number;
  spacing?: number;
}

declare function VANTA(config: VantaConfig): { destroy: () => void };
```

---

## 6. Common Patterns & Gotchas

### SSR/Next.js Compatibility

```tsx
// Always use dynamic imports for Vanta
import dynamic from 'next/dynamic';

const VantaBackground = dynamic(
  () => import('./VantaBackground').then(m => m.VantaBackground),
  { ssr: false }
);
```

### Cleanup on Unmount

```tsx
useEffect(() => {
  const animation = anime({ /* ... */ });
  
  return () => {
    animation.pause();
  if (vantaEffect) vantaEffect.destroy();
  };
}, []);
```

### Initial Opacity for Fade-In

```tsx
// Elements must start invisible for fade-in to work
<div ref={ref} style={{ opacity: 0 }}>Content</div>
```

### React State Updates

```tsx
// Don't trigger animations on every render
useEffect(() => {
  anime({ /* ... */ });
}, [dependency]); // Specific dependencies, not []
```

---

## References

- [Anime.js Documentation](https://animejs.com/documentation/)
- [Vanta.js GitHub](https://github.com/tengbao/vanta)
- [Three.js Documentation](https://threejs.org/docs/)
- [Interface Craft Skill](/a0/skills/interface-craft/)
