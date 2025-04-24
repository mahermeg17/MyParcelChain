import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { useAnchor } from "./utils/provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SystemProgram, PublicKey } from "@solana/web3.js";

import AddPackageForm from './components/AddPackageForm';
import Navigation from './components/Navigation';
import PackageList from './components/PackageList';

function App() {
  const { program } = useAnchor();
  const { publicKey, connected } = useWallet();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);
  const [isPlatformInitialized, setIsPlatformInitialized] = useState(false);
  const [activeSection, setActiveSection] = useState('add');
  const [myPackages, setMyPackages] = useState([]);
  const [allPackages, setAllPackages] = useState([]);

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

  const renderInitializationView = () => (
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
  );

  const renderMainView = () => (
    <div className="main-view">
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="section-content">
        {activeSection === 'add' && (
          <div className="add-package-section">
            <h2>Add New Package</h2>
            <AddPackageForm
              program={program}
              programID={program.programId}
              provider={program.provider}
              platformPDA={PublicKey.findProgramAddressSync(
                [Buffer.from("platform")],
                program.programId
              )[0]}
              packagePDA={PublicKey.findProgramAddressSync(
                [Buffer.from("package"), publicKey.toBuffer()],
                program.programId
              )[0]}
              wallet={{ publicKey }}
              setMessage={(message, type) => {
                if (type === 'error') setError(message);
                else setTxSignature(message);
              }}
            />
          </div>
        )}
        
        {activeSection === 'my' && (
          <div className="my-packages-section">
            <PackageList packages={myPackages} title="My Packages" />
          </div>
        )}
        
        {activeSection === 'all' && (
          <div className="all-packages-section">
            <PackageList packages={allPackages} title="All Packages" />
          </div>
        )}
      </div>
    </div>
  );

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

        {connected ? (
          isPlatformInitialized ? renderMainView() : renderInitializationView()
        ) : (
          <div className="connect-wallet-message">
            Please connect your wallet to continue
          </div>
        )}
      </main>
    </div>
  );
}

export default App