"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";

const BSC_CHAIN_ID = 56;

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { connectors, connect, status, error } = useConnect();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!isConnected) setStep(1);
    else if (chainId !== BSC_CHAIN_ID) setStep(2);
    else setStep(3);
  }, [isConnected, chainId]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h1 className="text-2xl font-semibold">Web3 Portal</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect wallet to continue.
        </p>

        <div className="mt-6 space-y-4">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Connect Wallet</h2>

              <div className="space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={status === "pending"}
                    className="w-full rounded-xl bg-black text-white py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60"
                  >
                    {status === "pending"
                      ? "Connecting..."
                      : `Connect ${connector.name}`}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-500 mt-3">
                  {error.message}
                </p>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Wrong Network</h2>
              <p className="text-xs text-gray-500 mb-4">
                Switch to Binance Smart Chain (BSC Mainnet).
              </p>

              <button
                onClick={() => switchChain({ chainId: BSC_CHAIN_ID })}
                className="w-full rounded-xl bg-black text-white py-3 text-sm font-medium hover:opacity-90"
              >
                Switch to BSC
              </button>

              <button
                onClick={() => disconnect()}
                className="w-full mt-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium hover:bg-gray-50"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Connected</h2>

              <div className="text-xs text-gray-500 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Wallet</span>
                  <span className="text-gray-900 font-medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Chain ID</span>
                  <span className="text-gray-900 font-medium">{chainId}</span>
                </div>
              </div>

              <button
                onClick={() => alert("Continue step here")}
                className="w-full rounded-xl bg-black text-white py-3 text-sm font-medium hover:opacity-90"
              >
                Continue
              </button>

              <button
                onClick={() => disconnect()}
                className="w-full mt-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium hover:bg-gray-50"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}