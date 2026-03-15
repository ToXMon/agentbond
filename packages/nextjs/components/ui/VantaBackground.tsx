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
