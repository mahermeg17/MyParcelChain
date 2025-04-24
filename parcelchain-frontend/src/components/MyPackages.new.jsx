import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useAnchor } from '../context/AnchorContext';
import { formatDate } from '../utils/formatDate';

const MyPackages = () => {
  const { publicKey } = useWallet();
  const { program } = useAnchor();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!publicKey || !program) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all packages and filter those belonging to the current user
        const allPackages = await program.account.package.all();
        const userPackages = allPackages.filter(pkg => 
          pkg.account.sender.equals(publicKey)
        );

        setPackages(userPackages);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to load packages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [publicKey, program]);

  if (loading) {
    return (
      <div className="section">
        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-4">My Packages</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-4">My Packages</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="section">
        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-4">My Packages</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No packages found. Create a new package to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-4">My Packages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.publicKey.toString()} className="bg-white rounded-lg shadow-md p-4">
            <div className="space-y-2">
              <p><strong className="text-gray-800">Tracking Number:</strong> <span className="text-gray-900 font-mono">{pkg.publicKey.toString()}</span></p>
              <p><strong className="text-gray-800">Description:</strong> <span className="text-gray-900">{pkg.account.description || 'No description'}</span></p>
              <p><strong className="text-gray-800">Weight:</strong> <span className="text-gray-900">{pkg.account.weight ? `${pkg.account.weight} grams` : 'Not specified'}</span></p>
              <p><strong className="text-gray-800">Dimensions:</strong> <span className="text-gray-900">
                {pkg.account.dimensions ? 
                  `${pkg.account.dimensions.length}x${pkg.account.dimensions.width}x${pkg.account.dimensions.height} cm` : 
                  'Not specified'
                }
              </span></p>
              <p><strong className="text-gray-800">Status:</strong> <span className="text-gray-900 capitalize">{pkg.account.status ? Object.keys(pkg.account.status)[0] : 'unknown'}</span></p>
              <p><strong className="text-gray-800">Created:</strong> <span className="text-gray-900">{pkg.account.createdAt ? formatDate(pkg.account.createdAt) : 'Unknown'}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPackages; 