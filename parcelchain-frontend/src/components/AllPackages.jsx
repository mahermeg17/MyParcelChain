import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useAnchor } from '../utils/provider';
import { PROGRAM_ID } from '../utils/constants';
import { formatDate } from '../utils/helpers';

const AllPackages = () => {
  const { publicKey } = useWallet();
  const { program } = useAnchor();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllPackages = async () => {
      if (!program) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching all packages');
        setLoading(true);
        setError(null);

        // Get all package accounts
        const packageAccounts = await program.account.package.all();
        console.log('Raw package accounts:', JSON.stringify(packageAccounts, null, 2));

        const formattedPackages = packageAccounts.map(acc => {
          const packageData = {
            publicKey: acc.publicKey.toString(),
            ...acc.account
          };
          console.log('Package data:', JSON.stringify(packageData, null, 2));
          return packageData;
        });

        setPackages(formattedPackages);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to fetch packages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllPackages();
  }, [program]);

  // Log the current packages state whenever it changes
  useEffect(() => {
    console.log('Current packages state:', JSON.stringify(packages, null, 2));
  }, [packages]);

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-800">Loading packages...</p>
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
        <p className="text-gray-800">No packages found in the system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">All Packages</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Tracking Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Weight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Dimensions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {packages.map((pkg) => {
              const status = pkg.status ? Object.keys(pkg.status)[0] : 'unknown';
              return (
                <tr key={pkg.publicKey} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{pkg.publicKey}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.description || 'No description'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.weight ? `${pkg.weight} grams` : 'Not specified'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.dimensions ? 
                      `${pkg.dimensions.length}x${pkg.dimensions.width}x${pkg.dimensions.height} cm` : 
                      'Not specified'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.createdAt ? formatDate(pkg.createdAt) : 'Unknown'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllPackages; 