"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";

const BSC_CHAIN_ID = 56;

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!isConnected) setStep(1);
    else if (chainId !== BSC_CHAIN_ID) setStep(2);
    else setStep(3);
  }, [isConnected, chainId]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Web3 Portal</h1>
          <p className="text-sm text-gray-500">
            Connect your wallet and verify your network to continue.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className={step === 1 ? "font-semibold text-gray-900" : ""}>
              Step 1: Connect
            </span>
            <span className={step === 2 ? "font-semibold text-gray-900" : ""}>
              Step 2: Network
            </span>
            <span className={step === 3 ? "font-semibold text-gray-900" : ""}>
              Step 3: Ready
            </span>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Connect Wallet</h2>
              <p className="text-xs text-gray-500 mb-4">
                Please connect your wallet to continue.
              </p>

              <button
                onClick={() => connect({ connector: injected() })}
                disabled={isPending}
                className="w-full rounded-xl bg-black text-white py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? "Connecting..." : "Connect Wallet"}
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Wrong Network</h2>
              <p className="text-xs text-gray-500 mb-4">
                Please switch to Binance Smart Chain (BSC Mainnet).
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

          {/* Step 3 */}
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
                  <span>Network</span>
                  <span className="text-gray-900 font-medium">BSC Mainnet</span>
                </div>
              </div>

              <button
                onClick={() => alert("Next step can be implemented here safely.")}
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

          <p className="text-[11px] text-gray-400 text-center mt-2">
            Always verify transactions in your wallet before confirming.
          </p>
        </div>
      </div>
    </main>
  );
}