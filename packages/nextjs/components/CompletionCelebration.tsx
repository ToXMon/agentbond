"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

/* ─────────────────────────────────────────────────────────
 * COMPLETION CELEBRATION STORYBOARD
 *
 *    0ms   trigger (task complete)
 *  100ms   confetti particles spawn (20 particles)
 *  300ms   "TASK COMPLETE" text scales in
 *  500ms   reputation +5 floats up
 *  700ms   earnings amount floats up
 * 1000ms   "View Transaction" button fades in
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  confettiStart: 100,
  textScaleIn: 300,
  reputationFloat: 500,
  earningsFloat: 700,
  buttonAppear: 1000,
};

const CELEBRATION = {
  particleCount: 20,
  particleColors: ["#10B981", "#3B82F6", "#F59E0B", "#EC4899"],
  floatDistance: -60,
  spring: { type: "spring" as const, stiffness: 400, damping: 25 },
};

export interface CompletionCelebrationProps {
  isVisible: boolean;
  reputationGain: number;
  earningsAmount: string;
  transactionHash?: string;
  onViewTransaction?: () => void;
  onDismiss?: () => void;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
}

export function CompletionCelebration({
  isVisible,
  reputationGain,
  earningsAmount,
  transactionHash,
  onViewTransaction,
  onDismiss,
}: CompletionCelebrationProps) {
  // Generate confetti particles
  const particles = useMemo<ConfettiParticle[]>(() => {
    return Array.from({ length: CELEBRATION.particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: CELEBRATION.particleColors[Math.floor(Math.random() * CELEBRATION.particleColors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      velocityX: (Math.random() - 0.5) * 200,
      velocityY: -100 - Math.random() * 200,
    }));
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onDismiss}
        >
          {/* Confetti Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
              <motion.div
n                key={particle.id}
                initial={{
                  x: `calc(${particle.x}vw)`,
                  y: `calc(${particle.y}vh)`,
                  rotate: 0,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `calc(${particle.x}vw + ${particle.velocityX}px)`,
                  y: `calc(100vh + 100px)`,
                  rotate: particle.rotation + 720,
                  scale: particle.scale,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: TIMING.confettiStart / 1000,
                  ease: "easeIn",
                }}
                className="absolute w-3 h-3 rounded-sm"
                style={{ backgroundColor: particle.color }}
              />
            ))}
          </div>

          {/* Main Content Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-base-100 rounded-2xl p-8 shadow-2xl border border-base-300 max-w-sm w-full mx-4"
          >
            {/* "TASK COMPLETE" Text */}
            <motion.div
n              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                ...CELEBRATION.spring,
                delay: TIMING.textScaleIn / 1000,
              }}
              className="text-center mb-6"
            >
              <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: 1 }}
                  className="text-2xl"
                >
                  🎉
                </motion.span>
                <span className="text-xl font-bold">TASK COMPLETE</span>
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: 1 }}
                  className="text-2xl"
                >
                  🎉
                </motion.span>
              </div>
            </motion.div>

            {/* Floating Reputation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: CELEBRATION.floatDistance }}
              transition={{
                delay: TIMING.reputationFloat / 1000,
                duration: 0.5,
              }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold">+{reputationGain}</span>
                <span className="text-sm font-medium">Reputation</span>
              </div>
            </motion.div>

            {/* Floating Earnings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: CELEBRATION.floatDistance }}
              transition={{
                delay: TIMING.earningsFloat / 1000,
                duration: 0.5,
              }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold">{earningsAmount}</span>
                <span className="text-sm font-medium">Earned</span>
              </div>
            </motion.div>

            {/* View Transaction Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: TIMING.buttonAppear / 1000 }}
              className="space-y-3"
            >
              {transactionHash && (
                <button
                  onClick={onViewTransaction}
                  className="w-full py-3 bg-primary text-primary-content font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  View Transaction
                </button>
              )}
              <button
                onClick={onDismiss}
                className="w-full py-3 bg-base-200 text-base-content font-medium rounded-lg hover:bg-base-300 transition-colors"
              >
                Continue
              </button>
            </motion.div>

            {/* Transaction Hash */}
            {transactionHash && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: TIMING.buttonAppear / 1000 + 0.2 }}
                className="text-xs text-center text-base-content/50 mt-4 truncate"
              >
                TX: {transactionHash}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CompletionCelebration;
