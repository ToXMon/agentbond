"use client";

import { useEffect, useState, useRef } from "react";
import anime from 'animejs';
import { PaginationButton, SearchBar, TransactionsTable } from "./_components";
import type { NextPage } from "next";
import { hardhat } from "viem/chains";
import { VantaBackground } from "~~/components/ui/VantaBackground";
import { useFetchBlocks } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - BlockExplorer
 *
 *  200ms   title fades in with gradient shimmer
 *  500ms   subtitle fades in
 *  800ms   search bar slides up
 *  1100ms  table area fades in
 * ───────────────────────────────────────────────────────── */

const TIMING = { title: 200, subtitle: 500, search: 800, table: 1100 };

const BlockExplorer: NextPage = () => {
  const { blocks, transactionReceipts, currentPage, totalBlocks, setCurrentPage, error } = useFetchBlocks();
  const { targetNetwork } = useTargetNetwork();
  const [isLocalNetwork, setIsLocalNetwork] = useState(true);
  const [hasError, setHasError] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetNetwork.id !== hardhat.id) {
      setIsLocalNetwork(false);
    }
  }, [targetNetwork.id]);

  useEffect(() => {
    if (targetNetwork.id === hardhat.id && error) {
      setHasError(true);
    }
  }, [targetNetwork.id, error]);

  useEffect(() => {
    if (!isLocalNetwork) {
      notification.error(
        <>
          <p className="font-bold mt-0 mb-1">
            <code className="italic bg-base-300 text-base font-bold"> targetNetwork </code> is not localhost
          </p>
          <p className="m-0">
            - You are on <code className="italic bg-base-300 text-base font-bold">{targetNetwork.name}</code> .This
            block explorer is only for <code className="italic bg-base-300 text-base font-bold">localhost</code>.
          </p>
          <p className="mt-1 break-normal">
            - You can use{" "}
            <a className="text-accent" href={targetNetwork.blockExplorers?.default.url}>
              {targetNetwork.blockExplorers?.default.name}
            </a>{" "}
            instead
          </p>
        </>,
      );
    }
  }, [
    isLocalNetwork,
    targetNetwork.blockExplorers?.default.name,
    targetNetwork.blockExplorers?.default.url,
    targetNetwork.name,
  ]);

  useEffect(() => {
    if (hasError) {
      notification.error(
        <>
          <p className="font-bold mt-0 mb-1">Cannot connect to local provider</p>
          <p className="m-0">
            - Did you forget to run <code className="italic bg-base-300 text-base font-bold">yarn chain</code> ?
          </p>
          <p className="mt-1 break-normal">
            - Or you can change <code className="italic bg-base-300 text-base font-bold">targetNetwork</code> in{" "}
            <code className="italic bg-base-300 text-base font-bold">scaffold.config.ts</code>
          </p>
        </>,
      );
    }
  }, [hasError]);

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

    if (subtitleRef.current) {
      anime({
        targets: subtitleRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
        delay: TIMING.subtitle,
        easing: 'easeOutExpo'
      });
    }

    if (searchRef.current) {
      anime({
        targets: searchRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: TIMING.search,
        easing: 'easeOutCubic'
      });
    }

    if (tableRef.current) {
      anime({
        targets: tableRef.current,
        opacity: [0, 1],
        duration: 600,
        delay: TIMING.table,
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
          Block Explorer
        </h1>
        <p
          ref={subtitleRef}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
          style={{ opacity: 0 }}
        >
          Explore blocks and transactions on the network
        </p>
      </div>

      {/* Search Bar with Glassmorphism */}
      <div 
        ref={searchRef} 
        className="relative z-10 max-w-4xl mx-auto px-4 mb-6"
        style={{ opacity: 0 }}
      >
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 shadow-xl shadow-purple-500/10">
          <SearchBar />
        </div>
      </div>

      {/* Transactions Table with Glassmorphism */}
      <div 
        ref={tableRef}
        className="relative z-10 max-w-7xl mx-auto px-4 mb-6"
        style={{ opacity: 0 }}
      >
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 shadow-xl shadow-purple-500/10">
          <TransactionsTable blocks={blocks} transactionReceipts={transactionReceipts} />
        </div>
      </div>

      {/* Pagination */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
        <div className="flex justify-center">
          <PaginationButton currentPage={currentPage} totalItems={Number(totalBlocks)} setCurrentPage={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

export default BlockExplorer;
