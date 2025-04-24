import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { useAnchor } from "./utils/provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function App() {
  const { program } = useAnchor();
  const { publicKey, connected } = useWallet();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);

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

      const tx = await program.methods
        .initialize()
        .accounts({ signer: publicKey })
        .rpc();

      setTxSignature(tx);
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
          <button
            onClick={handleAction}
            disabled={loading}
            className={`action-button ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Processing...' : 'Interact with Anchor'}
          </button>
        )}
      </main>
    </div>
  );
}

export default App