"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import anime from 'animejs';
import { Address } from "@scaffold-ui/components";
import { Hash, Transaction, TransactionReceipt, formatEther, formatUnits } from "viem";
import { hardhat } from "viem/chains";
import { usePublicClient } from "wagmi";
import { VantaBackground } from "~~/components/ui/VantaBackground";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { decodeTransactionData, getFunctionDetails } from "~~/utils/scaffold-eth";
import { replacer } from "~~/utils/scaffold-eth/common";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD - Transaction Details
 *
 *  200ms   title fades in with gradient shimmer
 *  500ms   back button slides in
 *  800ms   transaction card fades in
 * ───────────────────────────────────────────────────────── */

const TIMING = { title: 200, button: 500, card: 800 };

const TransactionComp = ({ txHash }: { txHash: Hash }) => {
  const client = usePublicClient({ chainId: hardhat.id });
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction>();
  const [receipt, setReceipt] = useState<TransactionReceipt>();
  const [functionCalled, setFunctionCalled] = useState<string>();

  const { targetNetwork } = useTargetNetwork();

  const titleRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (txHash && client) {
      const fetchTransaction = async () => {
        const tx = await client.getTransaction({ hash: txHash });
        const receipt = await client.getTransactionReceipt({ hash: txHash });

        const transactionWithDecodedData = decodeTransactionData(tx);
        setTransaction(transactionWithDecodedData);
        setReceipt(receipt);

        const functionCalled = transactionWithDecodedData.input.substring(0, 10);
        setFunctionCalled(functionCalled);
      };

      fetchTransaction();
    }
  }, [client, txHash]);

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
  }, [transaction]);

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
          Transaction Details
        </h1>
        <p className="text-lg text-slate-400">
          View transaction information on the blockchain
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

      {/* Transaction Card */}
      <div 
        ref={cardRef} 
        className="relative z-10 max-w-4xl mx-auto px-4 mb-8"
        style={{ opacity: 0 }}
      >
        {transaction ? (
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl shadow-xl shadow-purple-500/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <tbody>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">Transaction Hash</td>
                    <td className="py-4 px-6 text-white font-mono text-sm break-all">{transaction.hash}</td>
                  </tr>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">Block Number</td>
                    <td className="py-4 px-6 text-white">{Number(transaction.blockNumber)}</td>
                  </tr>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">From</td>
                    <td className="py-4 px-6">
                      <Address
                        address={transaction.from}
                        format="long"
                        onlyEnsOrAddress
                        blockExplorerAddressLink={
                          targetNetwork.id === hardhat.id ? `/blockexplorer/address/${transaction.from}` : undefined
                        }
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">To</td>
                    <td className="py-4 px-6">
                      {!receipt?.contractAddress ? (
                        transaction.to && (
                          <Address
                            address={transaction.to}
                            format="long"
                            onlyEnsOrAddress
                            blockExplorerAddressLink={
                              targetNetwork.id === hardhat.id ? `/blockexplorer/address/${transaction.to}` : undefined
                            }
                          />
                        )
                      ) : (
                        <span className="text-slate-300">
                          Contract Creation:{" "}
                          <Address
                            address={receipt.contractAddress}
                            format="long"
                            onlyEnsOrAddress
                            blockExplorerAddressLink={
                              targetNetwork.id === hardhat.id
                            ? `/blockexplorer/address/${receipt.contractAddress}`
                            : undefined
                          }
                        />
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">Value</td>
                    <td className="py-4 px-6">
                      <span className="text-purple-400 font-semibold">
                        {formatEther(transaction.value)} {targetNetwork.nativeCurrency.symbol}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">Function Called</td>
                    <td className="py-4 px-6">
                      <div className="w-full md:max-w-[500px] overflow-x-auto whitespace-nowrap">
                        {functionCalled === "0x" ? (
                          <span className="text-slate-500 italic">No function call (ETH transfer)</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300">{getFunctionDetails(transaction)}</span>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-mono">
                              {functionCalled}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">Gas Price</td>
                    <td className="py-4 px-6 text-slate-300">{formatUnits(transaction.gasPrice || 0n, 9)} Gwei</td>
                  </tr>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">Data</td>
                    <td className="py-4 px-6">
                      <textarea
                        readOnly
                        value={transaction.input}
                        className="w-full h-32 p-3 bg-slate-800/50 border border-white/10 rounded-lg text-slate-300 font-mono text-xs resize-none focus:outline-none"
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">Logs</td>
                    <td className="py-4 px-6">
                      {receipt?.logs?.length ? (
                        <ul className="space-y-2">
                          {receipt.logs.map((log, i) => (
                            <li key={i} className="text-sm">
                              <span className="text-purple-400 font-medium">Log {i}:</span>{" "}
                              <span className="text-slate-400 font-mono text-xs">
                                {JSON.stringify(log.topics, replacer, 2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500 italic">No logs</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mb-4"></div>
            <p className="text-slate-400">Loading transaction...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionComp;
