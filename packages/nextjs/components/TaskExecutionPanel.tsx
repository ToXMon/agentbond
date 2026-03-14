"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────
 * TASK EXECUTION STORYBOARD
 *
 *    0ms   panel slides in from right
 *  300ms   task header appears (title, reward)
 *  600ms   agent avatar pulses, "Working..." shows
 *  900ms   stage 1: Research (icon + progress bar)
 * 1500ms   stage 1 completes (checkmark, green flash)
 * 1800ms   stage 2: Processing (icon + progress bar)
 * 2400ms   stage 2 completes (checkmark, green flash)
 * 2700ms   stage 3: Validation (icon + progress bar)
 * 3300ms   stage 3 completes (checkmark, green flash)
 * 3600ms   "COMPLETE" badge animates in (scale + glow)
 * 4000ms   reputation scores update (+numbers float up)
 * 4500ms   payment confirmation shows
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  panelSlide: 300,
  headerAppear: 600,
  agentPulse: 900,
  stage1Start: 900,
  stage1Complete: 1500,
  stage2Start: 1800,
  stage2Complete: 2400,
  stage3Start: 2700,
  stage3Complete: 3300,
  completeBadge: 3600,
  reputationUpdate: 4000,
  paymentShow: 4500,
};

const STAGES = {
  stagger: 0.3,
  barHeight: 8,
  checkScale: 1.2,
  completeGlow: "#22C55E",
  items: [
    { id: "research", icon: "🔍", label: "Research", duration: 600 },
    { id: "processing", icon: "⚡", label: "Processing", duration: 600 },
    { id: "validation", icon: "✓", label: "Validation", duration: 600 },
  ],
};

export interface TaskExecutionPanelProps {
  taskId: string;
  taskTitle: string;
  reward: string;
  agentName: string;
  agentAddress: string;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface StageState {
  id: string;
  status: "pending" | "active" | "completed";
  progress: number;
}

export function TaskExecutionPanel({
  taskId,
  taskTitle,
  reward,
  agentName,
  agentAddress,
  onComplete,
  autoStart = true,
}: TaskExecutionPanelProps) {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const [stages, setStages] = useState<StageState[]>(
    STAGES.items.map((item) => ({
      id: item.id,
      status: "pending",
      progress: 0,
    }))
  );
  const [reputationGain, setReputationGain] = useState(0);
  const [showPayment, setShowPayment] = useState(false);

  // Generate avatar color from address
  const avatarColor = `hsl(${parseInt(agentAddress.slice(2, 8), 16) % 360}, 70%, 50%)`;

  useEffect(() => {
    if (!isRunning) return;

    const timers: NodeJS.Timeout[] = [];

    // Stage 1
    timers.push(
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s) => (s.id === "research" ? { ...s, status: "active" } : s))
        );
      }, TIMING.stage1Start)
    );

    timers.push(
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s) => (s.id === "research" ? { ...s, status: "completed", progress: 100 } : s))
        );
      }, TIMING.stage1Complete)
    );

    // Stage 2
    timers.push(
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s) => (s.id === "processing" ? { ...s, status: "active" } : s))
        );
      }, TIMING.stage2Start)
    );

    timers.push(
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s) => (s.id === "processing" ? { ...s, status: "completed", progress: 100 } : s))
        );
      }, TIMING.stage2Complete)
    );

    // Stage 3
    timers.push(
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s) => (s.id === "validation" ? { ...s, status: "active" } : s))
        );
      }, TIMING.stage3Start)
    );

    timers.push(
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s) => (s.id === "validation" ? { ...s, status: "completed", progress: 100 } : s))
        );
        setIsComplete(true);
      }, TIMING.stage3Complete)
    );

    // Reputation update
    timers.push(
      setTimeout(() => {
        setReputationGain(5);
      }, TIMING.reputationUpdate)
    );

    // Payment confirmation
    timers.push(
      setTimeout(() => {
        setShowPayment(true);
        onComplete?.();
      }, TIMING.paymentShow)
    );

    return () => timers.forEach(clearTimeout);
  }, [isRunning, onComplete]);

  // Animate progress for active stages
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStages((prev) =>
        prev.map((s) => {
          if (s.status === "active" && s.progress < 100) {
            return { ...s, progress: Math.min(s.progress + 5, 100) };
          }
          return s;
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: TIMING.panelSlide / 1000 }}
      className="bg-base-200 rounded-xl p-6 shadow-xl border border-base-300 max-w-md w-full"
    >
      {/* Task Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: TIMING.headerAppear / 1000 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-base-content">{taskTitle}</h2>
          <span className="text-lg font-semibold text-success">{reward}</span>
        </div>
        <p className="text-sm text-base-content/60">Task ID: {taskId.slice(0, 8)}...</p>
      </motion.div>

      {/* Agent Working Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: TIMING.agentPulse / 1000 }}
        className="flex items-center gap-3 mb-6 p-3 bg-base-300/50 rounded-lg"
      >
        <motion.div
          animate={isRunning && !isComplete ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: avatarColor }}
        >
          {agentName.charAt(0).toUpperCase()}
        </motion.div>
        <div className="flex-1">
          <p className="font-medium text-base-content">{agentName}</p>
          <p className="text-sm text-base-content/60">
            {isComplete ? "Task Completed" : "Working..."}
          </p>
        </div>
        {!isComplete && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
          />
        )}
      </motion.div>

      {/* Execution Stages */}
      <div className="space-y-4 mb-6">
        {STAGES.items.map((stage, index) => {
          const stageState = stages.find((s) => s.id === stage.id)!;
          return (
            <motion.div
n              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: TIMING.stage1Start / 1000 + index * STAGES.stagger }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{stage.icon}</span>
                <span className="font-medium text-base-content">{stage.label}</span>
                <AnimatePresence>
                  {stageState.status === "completed" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: STAGES.checkScale }}
                      exit={{ scale: 0 }}
                      className="ml-auto text-green-500"
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              <div
                className="w-full bg-base-300 rounded-full overflow-hidden"
                style={{ height: STAGES.barHeight }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      stageState.status === "completed" ? STAGES.completeGlow : "#3B82F6",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${stageState.progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Green Flash on Complete */}
              <AnimatePresence>
                {stageState.status === "completed" && (
                  <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-green-500/20 rounded pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Complete Badge */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="text-center mb-4"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0px ${STAGES.completeGlow}`,
                  `0 0 20px ${STAGES.completeGlow}`,
                  `0 0 0px ${STAGES.completeGlow}`,
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="inline-block bg-success text-success-content font-bold text-lg px-6 py-2 rounded-full"
            >
              ✓ COMPLETE
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reputation Update */}
      <AnimatePresence>
        {reputationGain > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-4"
          >
            <div className="flex items-center gap-2 text-success">
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl font-bold"
              >
                +{reputationGain}
              </motion.span>
              <span className="text-sm">Reputation</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Confirmation */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-3 bg-success/10 rounded-lg border border-success/20"
          >
            <p className="text-success font-medium">Payment Confirmed</p>
            <p className="text-sm text-base-content/60">{reward} transferred to agent</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restart Button */}
      {isComplete && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            setIsComplete(false);
            setReputationGain(0);
            setShowPayment(false);
            setStages(
              STAGES.items.map((item) => ({
                id: item.id,
                status: "pending",
                progress: 0,
              }))
            );
            setTimeout(() => setIsRunning(true), 100);
          }}
          className="mt-4 w-full py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
        >
          Replay Animation
        </motion.button>
      )}
    </motion.div>
  );
}

export default TaskExecutionPanel;
