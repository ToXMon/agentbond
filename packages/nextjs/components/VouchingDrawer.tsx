"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────
 * VOUCHING DRAWER STORYBOARD
 *
 *    0ms   drawer hidden
 *  200ms   drawer slides up from bottom
 *  400ms   stake slider appears
 *  600ms   risk assessment spinner shows
 *  900ms   "Confirm Vouch" button enables
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  drawerSlide: 200,
  sliderAppear: 400,
  riskAssessment: 600,
  buttonEnable: 900,
};

export interface VouchingDrawerProps {
  isOpen: boolean;
  agentAddress: string;
  agentName: string;
  agentReputation: number;
  minStake: string;
  maxStake: string;
  onConfirm: (stakeAmount: string) => void;
  onClose: () => void;
}

interface RiskAssessment {
  score: number; // 0-100
  factors: {
    reputation: number;
    tasksCompleted: number;
    vouchHistory: number;
    slashingEvents: number;
  };
  recommendation: "low" | "medium" | "high";
}

export function VouchingDrawer({
  isOpen,
  agentAddress,
  agentName,
  agentReputation,
  minStake,
  maxStake,
  onConfirm,
  onClose,
}: VouchingDrawerProps) {
  const [stakeAmount, setStakeAmount] = useState("");
  const [isAssessingRisk, setIsAssessingRisk] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);

  // Generate avatar color from address
  const avatarColor = `hsl(${parseInt(agentAddress.slice(2, 8), 16) % 360}, 70%, 50%)`;

  // Reset state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setStakeAmount("");
      setRiskAssessment(null);
      setIsConfirmEnabled(false);

      // Start risk assessment after delay
      const assessTimer = setTimeout(() => {
        setIsAssessingRisk(true);
        
        // Simulate risk assessment
        setTimeout(() => {
          setRiskAssessment({
            score: Math.min(agentReputation + Math.random() * 10, 100),
            factors: {
              reputation: agentReputation,
              tasksCompleted: Math.floor(Math.random() * 50) + 10,
              vouchHistory: Math.floor(Math.random() * 20),
              slashingEvents: Math.floor(Math.random() * 3),
            },
            recommendation:
              agentReputation >= 70 ? "low" : agentReputation >= 40 ? "medium" : "high",
          });
          setIsAssessingRisk(false);
        }, 1500);
      }, TIMING.riskAssessment);

      // Enable confirm button
      const enableTimer = setTimeout(() => {
        setIsConfirmEnabled(true);
      }, TIMING.buttonEnable);

      return () => {
        clearTimeout(assessTimer);
        clearTimeout(enableTimer);
      };
    }
  }, [isOpen, agentReputation]);

  const handleConfirm = () => {
    if (stakeAmount && isConfirmEnabled) {
      onConfirm(stakeAmount);
    }
  };

  const getRiskColor = (recommendation: string) => {
    switch (recommendation) {
      case "low":
        return "text-success";
      case "medium":
        return "text-warning";
      case "high":
        return "text-error";
      default:
        return "text-base-content";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 bg-base-100 rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-base-300 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-6 pb-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: avatarColor }}
                >
                  {agentName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-base-content">Vouch for {agentName}</h2>
                  <p className="text-sm text-base-content/60">
                    {agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-base-200 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Reputation Display */}
              <div className="bg-base-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-base-content/60">Agent Reputation</span>
                  <span className="text-lg font-bold text-primary">{agentReputation}</span>
                </div>
              </div>

              {/* Stake Slider */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: TIMING.sliderAppear / 1000 }}
                className="mb-6"
              >
                <label className="block text-sm font-medium text-base-content mb-2">
                  Stake Amount (CELO)
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min={parseFloat(minStake)}
                    max={parseFloat(maxStake)}
                    step="0.1"
                    value={stakeAmount || parseFloat(minStake)}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-base-content/60">
                    <span>Min: {minStake} CELO</span>
                    <span className="text-lg font-bold text-primary">
                      {stakeAmount || minStake} CELO
                    </span>
                    <span>Max: {maxStake} CELO</span>
                  </div>
                </div>
              </motion.div>

              {/* Risk Assessment */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: TIMING.riskAssessment / 1000 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-base-content">Risk Assessment</span>
                  {isAssessingRisk && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                    />
                  )}
                </div>

                {riskAssessment ? (
                  <div className="bg-base-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/60">Risk Score</span>
                      <span className={`text-lg font-bold ${getRiskColor(riskAssessment.recommendation)}`}>
                        {riskAssessment.score.toFixed(1)}
                      </span>
                    </div>

                    {/* Risk Factors */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-base-300/50 rounded p-2">
                        <span className="text-base-content/60">Reputation</span>
                        <span className="float-right font-medium">{riskAssessment.factors.reputation}</span>
                      </div>
                      <div className="bg-base-300/50 rounded p-2">
                        <span className="text-base-content/60">Tasks</span>
                        <span className="float-right font-medium">{riskAssessment.factors.tasksCompleted}</span>
                      </div>
                      <div className="bg-base-300/50 rounded p-2">
                        <span className="text-base-content/60">Vouches</span>
                        <span className="float-right font-medium">{riskAssessment.factors.vouchHistory}</span>
                      </div>
                      <div className="bg-base-300/50 rounded p-2">
                        <span className="text-base-content/60">Slashes</span>
                        <span className="float-right font-medium text-error">
                          {riskAssessment.factors.slashingEvents}
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Badge */}
                    <div
                      className={`text-center py-2 rounded-lg font-medium capitalize ${getRiskColor(
                        riskAssessment.recommendation
                      )} bg-opacity-10`}
                      style={{
                        backgroundColor:
                          riskAssessment.recommendation === "low"
                            ? "rgba(16, 185, 129, 0.1)"
                            : riskAssessment.recommendation === "medium"
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                      }}
                    >
                      {riskAssessment.recommendation.toUpperCase()} RISK
                    </div>
                  </div>
                ) : (
                  <div className="bg-base-200 rounded-lg p-4 h-32 flex items-center justify-center">
                    <p className="text-sm text-base-content/40">Assessing risk...</p>
                  </div>
                )}
              </motion.div>

              {/* Confirm Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: isConfirmEnabled ? 1 : 0.5 }}
                disabled={!isConfirmEnabled || !stakeAmount}
                onClick={handleConfirm}
                className="w-full py-4 bg-primary text-primary-content font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:cursor-not-allowed"
              >
                {isConfirmEnabled ? "Confirm Vouch" : "Assessing..."}
              </motion.button>

              {/* Warning */}
              <p className="text-xs text-center text-base-content/50 mt-4">
                ⚠️ Staking is risky. You may lose your stake if the agent behaves maliciously.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default VouchingDrawer;
