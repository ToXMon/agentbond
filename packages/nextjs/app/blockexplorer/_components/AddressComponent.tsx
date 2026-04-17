"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import anime from 'animejs';
import { ContractTabs } from "./ContractTabs";
import { Address, Balance } from "@scaffold-ui/components";
import { Address as AddressType } from "viem";
import { hardhat } from "viem/chains";
import { VantaBackground } from "~~/components/ui/VantaBackground";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - Address Details
 *
 *  200ms   title fades in with gradient shimmer
 *  500ms   back button slides in
 *  800ms   address card fades in
 *  1100ms  contract tabs fade in
 * ───────────────────────────────────────────────────────── */

const TIMING = { title: 200, button: 500, card: 800, tabs: 1100 };

export const AddressComponent = ({
  address,
  contractData,
}: {
  address: AddressType;
  contractData: { bytecode: string; assembly: string } | null;
}) => {
  const { targetNetwork } = useTargetNetwork();
  const router = useRouter();

  const titleRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Entrance animations
  useEffect(() => {
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

    if (buttonRef.current) {
      anime({
        targets: buttonRef.current,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 600,
        delay: TIMING.button,
        easing: 'easeOutCubic'
      });
    }

    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        delay: TIMING.card,
        easing: 'easeOutCubic'
      });
    }

    if (tabsRef.current) {
      anime({
        targets: tabsRef.current,
        opacity: [0, 1],
        duration: 600,
        delay: TIMING.tabs,
        easing: 'easeOutCubic'
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <VantaBackground />
      
      {/* Hero Header */}
      <div className="relative z-10 pt-12 pb-6 text-center px-4">
        <h1
          ref={titleRef}
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3"
          style={{ opacity: 0 }}
        >
          Address Details
        </h1>
        <p className="text-lg text-slate-400">
          View address information and contract data
        </p>
      </div>

      {/* Back Button */}
      <div ref={buttonRef} className="relative z-10 max-w-4xl mx-auto px-4 mb-6" style={{ opacity: 0 }}>
        <button
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors flex items-center gap-2"
          onClick={() => router.back()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* Address Card */}
      <div 
        ref={cardRef} 
        className="relative z-10 max-w-4xl mx-auto px-4 mb-6"
        style={{ opacity: 0 }}
      >
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl shadow-xl shadow-purple-500/10 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-400 mb-1">Address</div>
                <Address
                  address={address}
                  format="long"
                  onlyEnsOrAddress
                  blockExplorerAddressLink={
                    targetNetwork.id === hardhat.id ? `/blockexplorer/address/${address}` : undefined
                  }
                />
              </div>
            </div>
            <div className="h-px bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="text-slate-400 font-medium">Balance:</div>
              <div className="text-purple-400 font-semibold">
                <Balance address={address} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Tabs */}
      <div ref={tabsRef} className="relative z-10 max-w-4xl mx-auto px-4 pb-8" style={{ opacity: 0 }}>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl shadow-xl shadow-purple-500/10 overflow-hidden">
          <ContractTabs address={address} contractData={contractData} />
        </div>
      </div>
    </div>
  );
};
