import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Program } from '@project-serum/anchor';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { frenchCities, generateTrackingNumber } from '../utils/frenchCities';
import * as anchor from '@project-serum/anchor';
import idl from '../idl/parcel_chain.json';

const AddPackageForm = ({ program, programID, provider, platformPDA, onPackageAdded }) => {
    const { publicKey, connected } = useWallet();
    const [formData, setFormData] = useState({
        tracking_number: generateTrackingNumber(),
        description: '',
        weight: '',
        dimensions: {
            length: '',
            width: '',
            height: ''
        },
        origin: '',
        destination: '',
        status: 'InTransit'
    });
    const [message, setMessageState] = useState({ text: '', type: '' });
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
    const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Close suggestions when clicking outside
        const handleClickOutside = (event) => {
            if (!event.target.closest('.autocomplete-container')) {
                setShowOriginSuggestions(false);
                setShowDestinationSuggestions(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const { id, value } = e.target;

        if (id === 'origin' || id === 'destination') {
            setFormData(prev => ({ ...prev, [id]: value }));

            // Filter cities based on input
            const suggestions = frenchCities.filter(city =>
                city.city.toLowerCase().includes(value.toLowerCase()) ||
                city.postalCode.includes(value)
            );

            if (id === 'origin') {
                setOriginSuggestions(suggestions);
            } else {
                setDestinationSuggestions(suggestions);
            }
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleDimensionChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            dimensions: {
                ...prev.dimensions,
                [id]: value
            }
        }));
    };

    const selectCity = (field, city) => {
        setFormData(prev => ({
            ...prev,
            [field]: `${city.postalCode} - ${city.city}`
        }));
        if (field === 'origin') {
            setShowOriginSuggestions(false);
        } else {
            setShowDestinationSuggestions(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('Submit button clicked');
        console.log('Form data:', formData);
        console.log('Wallet connected:', connected);
        console.log('Public key:', publicKey?.toString());

        if (!publicKey) {
            console.log('No public key found');
            setMessageState({ text: 'Please connect your wallet first', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        setMessageState({ text: 'Submitting package...', type: 'info' });

        try {
            // Check if wallet is connected
            if (!connected) {
                console.log('Wallet not connected');
                setMessageState({ text: 'Please connect your wallet first', type: 'error' });
                return;
            }

            // Validate all required fields
            if (!formData.description.trim()) {
                throw new Error('Description is required');
            }
            if (!formData.weight) {
                throw new Error('Weight is required');
            }
            if (!formData.dimensions.length || !formData.dimensions.width || !formData.dimensions.height) {
                throw new Error('All dimensions are required');
            }

            console.log('Starting package creation process...');
            console.log('Form data:', formData);
            console.log('Wallet public key:', publicKey.toString());
            console.log('Platform PDA:', platformPDA.toString());

            // Validate numeric inputs
            const weight = parseInt(formData.weight);
            const length = parseInt(formData.dimensions.length);
            const width = parseInt(formData.dimensions.width);
            const height = parseInt(formData.dimensions.height);

            if (isNaN(weight) || isNaN(length) || isNaN(width) || isNaN(height)) {
                const errorMsg = 'Please ensure all numeric fields are filled correctly';
                console.error('Validation error:', errorMsg);
                setMessageState({ text: errorMsg, type: 'error' });
                return;
            }

            console.log('Creating package account...');
            // Get the current total packages count from the platform account
            const platformAccount = await program.account.platform.fetch(platformPDA);
            const packageId = (platformAccount.totalPackages.toNumber() + 1) % 256; // Ensure it's a u8
            console.log('Using packageId:', packageId);

            // Derive package PDA using the same seeds as the Rust program
            const [packagePDA] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from('package'),
                    platformPDA.toBuffer(),
                    Buffer.from([packageId])
                ],
                programID
            );
            console.log('Package PDA:', packagePDA.toString());
            console.log('Platform PDA:', platformPDA.toString());
            console.log('Package ID:', packageId);

            console.log('Preparing transaction...');
            console.log('Program methods:', program.methods);
            console.log('Program IDL:', program.idl);
            
            try {
                const tx = await program.methods
                    .registerPackage(
                        formData.description,
                        new anchor.BN(weight),
                        [new anchor.BN(length), new anchor.BN(width), new anchor.BN(height)],
                        new anchor.BN(0), // price (u64)
                        new anchor.BN(packageId)  // packageId (u8)
                    )
                    .accounts({
                        package: packagePDA,
                        sender: publicKey,
                        platform: platformPDA,
                        systemProgram: SystemProgram.programId
                    })
                    .rpc();

                console.log('Transaction submitted:', tx);
                console.log('Waiting for confirmation...');

                // Wait for confirmation
                const connection = program.provider.connection;
                const latestBlockHash = await connection.getLatestBlockhash();
                await connection.confirmTransaction({
                    blockhash: latestBlockHash.blockhash,
                    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                    signature: tx
                });

                console.log('Transaction confirmed!');
                console.log('Fetching created package...');

                // Add retry mechanism for fetching the package
                let retries = 3;
                let createdPackage = null;
                
                while (retries > 0) {
                    try {
                        createdPackage = await program.account.package.fetch(packagePDA);
                        console.log('Created package:', createdPackage);
                        break;
                    } catch (error) {
                        retries--;
                        if (retries === 0) {
                            console.error('Failed to fetch package after retries:', error);
                            throw error;
                        }
                        console.log(`Retrying to fetch package (${retries} attempts left)...`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between retries
                    }
                }

                setMessageState({
                    text: `Package registered successfully! Transaction: ${tx}`,
                    type: 'success'
                });
                onPackageAdded();

                // Reset form with new tracking number
                setFormData({
                    tracking_number: generateTrackingNumber(),
                    description: '',
                    weight: '',
                    dimensions: {
                        length: '',
                        width: '',
                        height: ''
                    },
                    origin: '',
                    destination: '',
                    status: 'InTransit'
                });
            } catch (error) {
                console.error('Transaction error:', error);
                if (error.logs) {
                    console.error('Program logs:', error.logs);
                }
                throw error;
            }
        } catch (error) {
            console.error('Detailed error:', {
                message: error.message,
                stack: error.stack,
                logs: error.logs,
                code: error.code,
                name: error.name,
                programError: error.programError,
                txError: error.txError
            });

            let errorMessage = 'Error registering package';

            if (error.message.includes('User rejected the request')) {
                errorMessage = 'Wallet connection was rejected. Please try connecting again.';
            } else if (error.message.includes('not connected')) {
                errorMessage = 'Please connect your wallet first. Click the "Connect Wallet" button in the top right corner.';
            } else if (error.logs) {
                errorMessage = `Error: ${error.logs.join('\n')}`;
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            setMessageState({
                text: errorMessage,
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-package-form">
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit} className="package-form">
                <div className="form-group">
                    <label htmlFor="tracking_number">Tracking Number <span className="required">*</span></label>
                    <input
                        type="text"
                        id="tracking_number"
                        value={formData.tracking_number}
                        readOnly
                        className="readonly-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description <span className="required">*</span></label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter package description"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="weight">Weight (grams) <span className="required">*</span></label>
                    <input
                        type="number"
                        id="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        required
                        min="1"
                        placeholder="Enter weight in grams"
                    />
                </div>

                <div className="dimensions-group">
                    <h3>Dimensions (cm) <span className="required">*</span></h3>
                    <div className="dimensions-inputs">
                        <div className="form-group">
                            <label htmlFor="length">Length</label>
                            <input
                                type="number"
                                id="length"
                                value={formData.dimensions.length}
                                onChange={handleDimensionChange}
                                required
                                min="1"
                                placeholder="Length"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="width">Width</label>
                            <input
                                type="number"
                                id="width"
                                value={formData.dimensions.width}
                                onChange={handleDimensionChange}
                                required
                                min="1"
                                placeholder="Width"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="height">Height</label>
                            <input
                                type="number"
                                id="height"
                                value={formData.dimensions.height}
                                onChange={handleDimensionChange}
                                required
                                min="1"
                                placeholder="Height"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="origin">Origin <span className="required">*</span></label>
                    <div className="autocomplete-container">
                        <input
                            type="text"
                            id="origin"
                            value={formData.origin}
                            onChange={handleInputChange}
                            onFocus={() => setShowOriginSuggestions(true)}
                            required
                            placeholder="Enter origin city"
                        />
                        {showOriginSuggestions && originSuggestions.length > 0 && (
                            <div className="suggestions-dropdown">
                                {originSuggestions.map((city, index) => (
                                    <div
                                        key={index}
                                        className="suggestion-item"
                                        onClick={() => selectCity('origin', city)}
                                    >
                                        {city.postalCode} - {city.city}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="destination">Destination <span className="required">*</span></label>
                    <div className="autocomplete-container">
                        <input
                            type="text"
                            id="destination"
                            value={formData.destination}
                            onChange={handleInputChange}
                            onFocus={() => setShowDestinationSuggestions(true)}
                            required
                            placeholder="Enter destination city"
                        />
                        {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                            <div className="suggestions-dropdown">
                                {destinationSuggestions.map((city, index) => (
                                    <div
                                        key={index}
                                        className="suggestion-item"
                                        onClick={() => selectCity('destination', city)}
                                    >
                                        {city.postalCode} - {city.city}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={isSubmitting ? 'button loading' : 'button'}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner"></span>
                                Submitting...
                            </>
                        ) : (
                            'Add Package'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPackageForm; 