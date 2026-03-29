'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useAnimatedCounter } from '../hooks/useAnimations';

export interface AgentCardProps {
  address: string;
  name: string;
  reputation: number;
  isVouched: boolean;
  status: 'online' | 'offline' | 'busy';
  tasksCompleted: number;
  onSelect?: () => void;
  specialty?: string;
  tags?: string[];
  isActive?: boolean;
}

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
      onClick={props.onSelect}
      className="glass-card p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
    >
      {/* Agent header with glowing status */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30" />
          {props.isActive && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-slate-900 animate-pulse"
              style={{ boxShadow: '0 0 8px rgba(74, 222, 128, 0.8)' }}
            />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">{props.name}</h3>
          <p className="text-slate-400 text-sm">{props.specialty}</p>
        </div>
      </div>

      {/* Animated reputation */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-2xl font-bold"
          ref={reputationRef}
          style={{ color: '#a78bfa' }}
        >
          0
        </span>
        <span className="text-slate-500 text-sm">reputation</span>
      </div>

      {/* Specialty tags */}
      <div ref={tagsRef} className="flex flex-wrap gap-2">
        {props.tags?.map((tag, i) => (
          <span
            key={i}
            className="tag px-3 py-1 rounded-full text-xs text-slate-300"
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
