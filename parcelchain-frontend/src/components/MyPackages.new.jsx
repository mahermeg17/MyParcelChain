import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { useAnchor } from '../context/AnchorContext';

const MyPackages = () => {
  const { publicKey } = useWallet();
  const { program } = useAnchor();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyPackages = async () => {
      if (!publicKey || !program) return;

      try {
        setLoading(true);
        setError(null);

        // Get all packages and filter those created by the user
        const allPackages = await program.account.package.all();
        const myPackages = allPackages.filter(pkg => 
          pkg.account.sender.equals(publicKey)
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Packages</h2>
      {packages.length === 0 ? (
        <p className="text-gray-600">No packages found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.publicKey.toString()} className="border rounded-lg p-4">
              <h3 className="font-medium">Package #{pkg.account.packageId.toString()}</h3>
              <p className="text-sm text-gray-600">Description: {pkg.account.description}</p>
              <p className="text-sm text-gray-600">Weight: {pkg.account.weight.toString()} kg</p>
              <p className="text-sm text-gray-600">
                Dimensions: {pkg.account.dimensions[0]} x {pkg.account.dimensions[1]} x {pkg.account.dimensions[2]} cm
              </p>
              <p className="text-sm text-gray-600">Price: {pkg.account.price.toString()} SOL</p>
              <p className="text-sm text-gray-600">Status: {pkg.account.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPackages; 