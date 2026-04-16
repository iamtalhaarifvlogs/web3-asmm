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
  useGasPrice,
} from "wagmi";

import { formatUnits, parseUnits, isAddress } from "viem";
import { erc20Abi } from "@/lib/erc20Abi";
import { BSC_CHAIN_ID, USDT_BSC } from "@/lib/constants";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { connectors, connect, status: connectStatus, error: connectError } =
    useConnect();

  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [approveAmount, setApproveAmount] = useState("10");
  const [spender, setSpender] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: nativeBalanceData } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const { data: gasPrice } = useGasPrice();

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

  const spenderValid = useMemo(() => {
    if (!spender) return false;
    return isAddress(spender);
  }, [spender]);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: USDT_BSC,
    functionName: "allowance",
    args: address && spenderValid ? [address, spender as `0x${string}`] : undefined,
    query: { enabled: Boolean(address && spenderValid) },
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

  const parsedApproveAmount = useMemo(() => {
    if (!decimals) return undefined;
    try {
      return parseUnits(approveAmount || "0", decimals);
    } catch {
      return undefined;
    }
  }, [approveAmount, decimals]);

  const gasEstimateBNB = useMemo(() => {
    if (!gasPrice) return null;
    const assumedGasLimit = BigInt(65000);
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
      if (spenderValid) refetchAllowance();
    }, 10000);

    return () => clearInterval(interval);
  }, [address, spenderValid, refetchUSDT, refetchAllowance]);

  const handleApprove = async () => {
    if (!spenderValid) return;
    if (!parsedApproveAmount) return;

    writeContract({
      abi: erc20Abi,
      address: USDT_BSC,
      functionName: "approve",
      args: [spender as `0x${string}`, parsedApproveAmount],
    });
  };

  const handleRefresh = () => {
    refetchUSDT();
    if (spenderValid) refetchAllowance();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Security Verification
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect wallet and review token permissions.
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
          {/* STEP 1 */}
          {step === 1 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold mb-2">Wallet Connection</h2>
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
              <h2 className="text-sm font-semibold mb-2">Network Validation</h2>
              <p className="text-xs text-gray-500 mb-4">
                Please switch to BNB Smart Chain (BSC Mainnet).
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
                  <h2 className="text-sm font-semibold">Authorization Panel</h2>
                  <p className="text-xs text-gray-500">
                    Review your token approvals safely.
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
                  {nativeBalanceData
                    ? `${Number(
                        formatUnits(
                          nativeBalanceData.value,
                          nativeBalanceData.decimals
                        )
                      ).toFixed(4)} ${nativeBalanceData.symbol}`
                    : "Loading..."}
                </Row>

                <Row label="USDT Balance">
                  {Number(formattedUSDT).toFixed(4)} {symbol || "USDT"}
                </Row>

                <Row label="Estimated Gas Fee">
                  {gasEstimateBNB
                    ? `${Number(gasEstimateBNB).toFixed(6)} BNB`
                    : "Loading..."}
                </Row>

                <div className="border-t border-gray-200 pt-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">
                      Spender Address
                    </label>
                    <input
                      value={spender}
                      onChange={(e) => setSpender(e.target.value.trim())}
                      placeholder="0x..."
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                    />

                    {!spenderValid && spender.length > 0 && (
                      <p className="text-[11px] text-red-500 mt-2">
                        Invalid address format.
                      </p>
                    )}
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
                      {spenderValid
                        ? allowanceApproved
                          ? "Approved"
                          : "Not Approved"
                        : "Enter Spender"}
                    </span>
                  </div>

                  {spenderValid && (
                    <Row label="Allowance">
                      {Number(formattedAllowance).toFixed(4)} USDT
                    </Row>
                  )}
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
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-[11px] text-gray-500 mt-2">
                    Tip: Never approve unlimited unless required by a trusted dApp.
                  </p>
                </div>

                <button
                  onClick={handleApprove}
                  disabled={
                    isPending ||
                    waitingTx ||
                    !parsedApproveAmount ||
                    !spenderValid
                  }
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
          Always verify spender address before approving.
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