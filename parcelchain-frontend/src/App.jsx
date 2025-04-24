import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { useAnchor } from "./utils/provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SystemProgram, PublicKey } from "@solana/web3.js";

function App() {
  const { program } = useAnchor();
  const { publicKey, connected } = useWallet();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);
  const [isPlatformInitialized, setIsPlatformInitialized] = useState(false);

  // Check if platform is initialized
  useEffect(() => {
    const checkPlatformInitialization = async () => {
      if (!program || !publicKey) return;

      try {
        const [platform] = PublicKey.findProgramAddressSync(
          [Buffer.from("platform")],
          program.programId
        );

        const platformAccount = await program.account.platform.fetch(platform);
        setIsPlatformInitialized(!!platformAccount);
      } catch (err) {
        // If account doesn't exist, it's not initialized
        setIsPlatformInitialized(false);
      }
    };

    checkPlatformInitialization();
  }, [program, publicKey]);

  const handleAction = async () => {
    try {
      setError(null);
      setLoading(true);
      
      if (!program) {
        throw new Error("Program not initialized");
      }
      
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      if (isPlatformInitialized) {
        throw new Error("Platform is already initialized");
      }

      // Generate a PDA for the platform account
      const [platform] = PublicKey.findProgramAddressSync(
        [Buffer.from("platform")],
        program.programId
      );

      // For now, we'll use a placeholder for the default token
      // In a real implementation, you would use a real token mint
      const defaultToken = new PublicKey("So11111111111111111111111111111111111111112");

      const tx = await program.methods
        .initialize()
        .accounts({
          platform: platform,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
          defaultToken: defaultToken
        })
        .rpc();

      setTxSignature(tx);
      setIsPlatformInitialized(true);
      console.log("Transaction Signature:", tx);
    } catch (err) {
      console.error("Transaction failed:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Parcel Chain</h1>
        <WalletMultiButton />
      </header>

      <main>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {txSignature && (
          <div className="success-message">
            Transaction successful! Signature: {txSignature}
          </div>
        )}

        {connected && (
          <div className="platform-status">
            <p>Platform Status: {isPlatformInitialized ? 'Initialized' : 'Not Initialized'}</p>
            {!isPlatformInitialized && (
              <button
                onClick={handleAction}
                disabled={loading}
                className={`action-button ${loading ? 'loading' : ''}`}
              >
                {loading ? 'Processing...' : 'Initialize Platform'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App