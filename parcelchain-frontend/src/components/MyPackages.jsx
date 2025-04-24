import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { formatDate } from '../utils/formatDate';

const MyPackages = ({ program }) => {
  const { publicKey } = useWallet();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!program || !publicKey) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all packages and filter those belonging to the current user
        const allPackages = await program.account.package.all();
        const userPackages = allPackages.filter(
          pkg => pkg.account.sender.equals(publicKey)
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
  }, [program, publicKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No packages found</h3>
        <p className="mt-2 text-sm text-gray-500">
          You haven't created any packages yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Packages</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div
            key={pkg.publicKey.toString()}
            className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {pkg.account.trackingNumber}
                </h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  pkg.account.status === 'InTransit' ? 'bg-yellow-100 text-yellow-800' :
                  pkg.account.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {pkg.account.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {pkg.account.description}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Weight</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pkg.account.weight} kg</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {pkg.account.dimensions[0]} x {pkg.account.dimensions[1]} x {pkg.account.dimensions[2]} cm
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Origin</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pkg.account.origin}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Destination</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pkg.account.destination}</dd>
                </div>
              </dl>
            </div>
            <div className="px-4 py-4 sm:px-6">
              <div className="text-sm text-gray-500">
                Created on {formatDate(pkg.account.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPackages; 