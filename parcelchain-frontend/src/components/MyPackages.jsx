import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Program } from '@project-serum/anchor';
import { PublicKey, Connection } from '@solana/web3.js';

const MyPackages = ({ program, programID, platformPDA }) => {
  const { publicKey } = useWallet();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyPackages = async () => {
      if (!publicKey || !program) return;

      try {
        setLoading(true);
        setError(null);

        // Get the connection from the program provider
        const connection = program.provider.connection;
        
        // Get recent signatures for the program
        const signatures = await connection.getSignaturesForAddress(programID, {
          limit: 100, // Adjust limit as needed
        });

        // Filter transactions where the user's public key appears
        const userTransactions = [];
        for (const sig of signatures) {
          const tx = await connection.getTransaction(sig.signature);
          if (tx?.transaction.message.accountKeys.some(key => key.equals(publicKey))) {
            userTransactions.push(tx);
          }
        }

        // Get all packages and filter those created by the user
        const allPackages = await program.account.package.all();
        const myPackages = allPackages.filter(pkg => 
          userTransactions.some(tx => 
            tx.transaction.message.accountKeys.some(key => 
              key.equals(pkg.publicKey)
            )
          )
        );

        setPackages(myPackages);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to load packages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyPackages();
  }, [program, publicKey, programID]);

  if (!publicKey) {
    return (
      <div className="connect-wallet-message">
        <h3>Connect Your Wallet</h3>
        <p>Please connect your wallet to view your packages.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-message">
        <div className="spinner"></div>
        <p>Loading your packages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="no-packages">
        <h3>No Packages Found</h3>
        <p>You haven't created any packages yet.</p>
      </div>
    );
  }

  return (
    <div className="my-packages">
      <h2>My Packages</h2>
      <div className="packages-grid">
        {packages.map((pkg) => (
          <div key={pkg.publicKey.toString()} className="package-card">
            <h3>Package #{pkg.account.trackingNumber}</h3>
            <div className="package-details">
              <p><strong>Description:</strong> {pkg.account.description}</p>
              <p><strong>Weight:</strong> {pkg.account.weight.toString()} grams</p>
              <p><strong>Dimensions:</strong> {pkg.account.dimensions[0].toString()} x {pkg.account.dimensions[1].toString()} x {pkg.account.dimensions[2].toString()} cm</p>
              <p><strong>Status:</strong> {pkg.account.status}</p>
              <p><strong>Created:</strong> {new Date(pkg.account.createdAt * 1000).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPackages; 