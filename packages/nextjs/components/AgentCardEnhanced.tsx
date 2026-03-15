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
