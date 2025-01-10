"use client";

import { useEffect, useState } from "react";
import { IStylusNFT } from "./IStylusNFT";
import { ethers } from "ethers";

const contractAddress = "0xa6e41ffd769491a42a6e5ce453259b93983a22ef"; // Get this from run-dev-node.sh output
const provider = new ethers.JsonRpcProvider("http://localhost:8547/");
const privateKey = "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659";
const signer = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, IStylusNFT, signer);

export function DebugContracts() {
  const [balance, setBalance] = useState<number | null>(null);
  const [tokenId, setTokenId] = useState<string>("");
  const [owner, setOwner] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [nftName, setNftName] = useState<string>("");
  const [nftSymbol, setNftSymbol] = useState<string>("");
  const [txStatus, setTxStatus] = useState<{
    status: "none" | "pending" | "success" | "error";
    message: string;
  }>({ status: "none", message: "" });

  const fetchContractInfo = async () => {
    try {
      const name = await contract.name();
      const symbol = await contract.symbol();
      setNftName(name);
      setNftSymbol(symbol);
    } catch (error) {
      console.error("Error fetching contract info:", error);
    }
  };

  const fetchBalance = async () => {
    try {
      const balance = await contract.balanceOf(signer.address);
      setBalance(Number(balance));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  useEffect(() => {
    fetchContractInfo();
    fetchBalance();
  }, []);

  const handleTransaction = async (operation: () => Promise<any>, pendingMessage: string, successMessage: string) => {
    try {
      setTxStatus({ status: "pending", message: pendingMessage });
      const tx = await operation();
      if (tx) {
        await tx.wait();
      }
      setTxStatus({ status: "success", message: successMessage });
      await fetchBalance();
    } catch (error: any) {
      console.error("Transaction error:", error);
      setTxStatus({
        status: "error",
        message: error.reason || error.message || "Transaction failed",
      });
    }
    // Clear status after 5 seconds
    setTimeout(() => {
      setTxStatus({ status: "none", message: "" });
    }, 5000);
  };

  const mintNFT = () => {
    handleTransaction(() => contract.mint(), "Minting your NFT...", "NFT minted successfully!");
  };

  const mintToAddress = () => {
    if (!ethers.isAddress(recipientAddress)) {
      setTxStatus({
        status: "error",
        message: "Please enter a valid Ethereum address",
      });
      return;
    }
    handleTransaction(
      () => contract.mintTo(recipientAddress),
      "Minting NFT to address...",
      `NFT minted to ${recipientAddress} successfully!`,
    );
  };

  const checkOwner = async () => {
    if (!tokenId || isNaN(Number(tokenId))) {
      setTxStatus({
        status: "error",
        message: "Please enter a valid token ID",
      });
      return;
    }
    try {
      const ownerAddress = await contract.ownerOf(Number(tokenId));
      setOwner(ownerAddress);
      setTxStatus({
        status: "success",
        message: `Owner found: ${ownerAddress}`,
      });
    } catch (error: any) {
      console.error("Error checking owner:", error);
      setOwner(null);
      setTxStatus({
        status: "error",
        message: "Token ID not found or invalid",
      });
    }
  };

  const burnToken = () => {
    if (!tokenId || isNaN(Number(tokenId))) {
      setTxStatus({
        status: "error",
        message: "Please enter a valid token ID",
      });
      return;
    }
    handleTransaction(
      async () => {
        try {
          await contract.burn(Number(tokenId));
        } catch (error: any) {
          // Check for specific error conditions
          if (error.reason && error.reason.includes("InvalidTokenId")) {
            throw new Error("Invalid token ID. Please check and try again.");
          }
          // If no specific reason is provided, show a generic error message
          throw new Error("An error occurred while trying to burn the token. Please try again.");
        }
      },
      "Burning token...",
      `Token ${tokenId} burned successfully!`,
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-6">
      <div className="bg-base-100 shadow-lg rounded-2xl w-full p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {nftName} ({nftSymbol})
        </h1>

        <div className="flex justify-center mb-8">
          <div className="bg-base-200 rounded-lg px-6 py-4 shadow-inner">
            <span className="text-lg font-semibold">Your NFT Balance: </span>
            <span className="text-2xl font-bold text-white">{balance !== null ? balance : "Loading..."}</span>
          </div>
        </div>

        {/* Transaction Status Alert */}
        {txStatus.status !== "none" && (
          <div
            className={`alert ${
              txStatus.status === "pending"
                ? "alert-info"
                : txStatus.status === "success"
                  ? "alert-success"
                  : "alert-error"
            } mb-4`}
          >
            <div className="flex items-center">
              {txStatus.status === "pending" && <div className="loading loading-spinner loading-sm mr-2" />}
              {txStatus.status === "success" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {txStatus.status === "error" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{txStatus.message}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex justify-center">
            <button
              className={`btn btn-primary w-48 ${txStatus.status === "pending" ? "loading" : ""}`}
              onClick={mintNFT}
              disabled={txStatus.status === "pending"}
            >
              {txStatus.status === "pending" ? "Minting..." : "Mint NFT"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input
              type="text"
              value={recipientAddress}
              onChange={e => setRecipientAddress(e.target.value)}
              className="input input-bordered w-full sm:w-96"
              placeholder="Enter recipient address"
              disabled={txStatus.status === "pending"}
            />
            <button
              className={`btn btn-success ${txStatus.status === "pending" ? "loading" : ""}`}
              onClick={mintToAddress}
              disabled={txStatus.status === "pending"}
            >
              {txStatus.status === "pending" ? "Minting..." : "Mint To Address"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input
              type="number"
              value={tokenId}
              onChange={e => setTokenId(e.target.value)}
              className="input input-bordered w-full sm:w-48"
              placeholder="Enter token ID"
              disabled={txStatus.status === "pending"}
            />
            <button className="btn btn-secondary" onClick={checkOwner} disabled={txStatus.status === "pending"}>
              Check Owner
            </button>
            <button
              className={`btn btn-error ${txStatus.status === "pending" ? "loading" : ""}`}
              onClick={burnToken}
              disabled={txStatus.status === "pending"}
            >
              {txStatus.status === "pending" ? "Burning..." : "Burn Token"}
            </button>
          </div>

          {owner && (
            <div className="bg-base-200 rounded-lg px-4 py-2 text-center">
              <span className="text-sm break-all">Owner: {owner}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
