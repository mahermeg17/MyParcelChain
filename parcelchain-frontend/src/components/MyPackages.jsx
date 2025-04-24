import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useAnchor } from '../utils/provider';
import { PROGRAM_ID } from '../utils/constants';
import { formatDate } from '../utils/helpers';

const MyPackages = () => {
  const { publicKey } = useWallet();
  const { program } = useAnchor();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!publicKey || !program) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching packages for wallet:', publicKey.toString());
        setLoading(true);
        setError(null);

        // Get all package accounts owned by the user
        const packageAccounts = await program.account.package.all([
          {
            memcmp: {
              offset: 8, // After discriminator
              bytes: publicKey.toBase58(),
            },
          },
        ]);

        console.log('Found packages:', packageAccounts.length);
        setPackages(packageAccounts.map(acc => ({
          publicKey: acc.publicKey,
          ...acc.account,
        })));
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to fetch packages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [publicKey, program]);

  if (!publicKey) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600">Please connect your wallet to view your packages.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading packages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600">No packages found. Create a new package to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">My Packages</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.publicKey.toString()} className="bg-white rounded-lg shadow p-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Tracking Number</p>
              <p className="font-mono text-sm">{pkg.publicKey.toString()}</p>
              
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-sm">{pkg.description}</p>
              
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-sm capitalize">{pkg.status}</p>
              
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm">{formatDate(pkg.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPackages; 