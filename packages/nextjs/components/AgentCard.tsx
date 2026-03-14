"use client";

import { motion } from "framer-motion";
import { useState } from "react";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 *    0ms   card invisible, waiting
 *  200ms   card fades in, slides up 20px
 *  500ms   reputation ring animates (stroke-dashoffset)
 *  800ms   agent avatar pulses once
 * 1200ms   vouch badge appears (if vouched)
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  cardAppear: 200,
  ringAnimate: 500,
  avatarPulse: 800,
  vouchBadge: 1200,
};

export interface AgentCardProps {
  address: string;
  name: string;
  reputation: number; // 0-100
  isVouched: boolean;
  status: "online" | "offline" | "busy";
  tasksCompleted: number;
  onSelect?: () => void;
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-yellow-500",
};

export function AgentCard({
  address,
  name,
  reputation,
  isVouched,
  status,
  tasksCompleted,
  onSelect,
}: AgentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate ring properties
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (reputation / 100) * circumference;

  // Generate avatar color from address
  const avatarColor = `hsl(${parseInt(address.slice(2, 8), 16) % 360}, 70%, 50%)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: TIMING.cardAppear / 1000 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onSelect}
      className="relative bg-base-200 rounded-xl p-4 cursor-pointer shadow-lg hover:shadow-xl transition-shadow border border-base-300"
    >
      {/* Reputation Ring */}
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-base-300"
          />
          {/* Animated reputation ring */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={reputation >= 70 ? "#10B981" : reputation >= 40 ? "#F59E0B" : "#EF4444"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 1,
              delay: TIMING.ringAnimate / 1000,
              ease: "easeOut",
            }}
          />
        </svg>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{
            duration: 0.4,
            delay: TIMING.avatarPulse / 1000,
            times: [0, 0.5, 1],
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md"
            style={{ backgroundColor: avatarColor }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        </motion.div>

        {/* Status Indicator */}
        <div
          className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-base-200 ${statusColors[status]}`}
        />
      </div>

      {/* Reputation Score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: TIMING.ringAnimate / 1000 }}
        className="text-center mb-2"
      >
        <span className="text-2xl font-bold text-primary">{reputation}</span>
        <span className="text-sm text-base-content/60 ml-1">REP</span>
      </motion.div>

      {/* Agent Name */}
      <h3 className="text-center font-semibold text-base-content truncate mb-1">{name}</h3>

      {/* Tasks Completed */}
      <p className="text-center text-sm text-base-content/60 mb-2">
        {tasksCompleted} tasks completed
      </p>

      {/* Vouch Badge */}
      {isVouched && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: TIMING.vouchBadge / 1000,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="absolute -top-2 -right-2 bg-success text-success-content text-xs font-bold px-2 py-1 rounded-full shadow-md"
        >          ✓ Vouched
        </motion.div>
      )}

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none"
      />
    </motion.div>
  );
}

export default AgentCard;
