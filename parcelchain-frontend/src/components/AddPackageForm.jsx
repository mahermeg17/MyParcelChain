import { useState, useEffect } from 'react';
import { Program } from '@project-serum/anchor';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { frenchCities, generateTrackingNumber } from '../utils/frenchCities';
import * as anchor from '@project-serum/anchor';

const AddPackageForm = ({ program, programID, provider, platformPDA, wallet, setMessage }) => {
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

  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'origin') {
      setShowOriginSuggestions(true);
      const filtered = frenchCities.filter(city => 
        city.city.toLowerCase().includes(value.toLowerCase()) ||
        city.postalCode.includes(value)
      );
      setOriginSuggestions(filtered);
    } else if (name === 'destination') {
      setShowDestinationSuggestions(true);
      const filtered = frenchCities.filter(city => 
        city.city.toLowerCase().includes(value.toLowerCase()) ||
        city.postalCode.includes(value)
      );
      setDestinationSuggestions(filtered);
    }

    if (name.startsWith('dimensions.')) {
      const dimensionField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const selectCity = (city, field) => {
    const cityString = `${city.postalCode} - ${city.city}`;
    setFormData(prev => ({
      ...prev,
      [field]: cityString
    }));
    if (field === 'origin') {
      setShowOriginSuggestions(false);
    } else {
      setShowDestinationSuggestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Starting package registration...');
      console.log('Form data:', formData);

      // Convert dimensions and weight to appropriate number types
      const dimensions = [
        new anchor.BN(parseInt(formData.dimensions.length)),
        new anchor.BN(parseInt(formData.dimensions.width)),
        new anchor.BN(parseInt(formData.dimensions.height))
      ];
      const weight = new anchor.BN(parseInt(formData.weight));

      console.log('Parsed dimensions:', dimensions);
      console.log('Parsed weight:', weight);

      // Validate the data
      if (!dimensions[0] || !dimensions[1] || !dimensions[2] || !weight) {
        const errorMsg = 'Please ensure all numeric fields are filled correctly';
        console.error('Validation error:', errorMsg);
        setMessage(errorMsg, 'error');
        return;
      }

      // Derive the package PDA using the platform and tracking number as seeds
      console.log('Deriving package PDA...');
      console.log('Platform PDA:', platformPDA.toString());
      console.log('Tracking number:', formData.tracking_number);
      
      const [packagePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("package"),
          Buffer.from(formData.tracking_number),
          platformPDA.toBuffer()
        ],
        program.programId
      );

      console.log('Package PDA:', packagePDA.toString());

      // Prepare the package data
      const packageData = {
        description: formData.description,
        weight: weight,
        dimensions: dimensions,
        price: new anchor.BN(0),
        packageId: formData.tracking_number
      };

      console.log('Package data to be sent:', packageData);

      // Prepare the accounts
      const accounts = {
        platform: platformPDA,
        package: packagePDA,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      };

      console.log('Accounts to be used:', {
        platform: accounts.platform.toString(),
        package: accounts.package.toString(),
        authority: accounts.authority.toString(),
        systemProgram: accounts.systemProgram.toString()
      });

      console.log('Calling registerPackage instruction...');
      const tx = await program.methods
        .registerPackage(
          packageData.description,
          packageData.weight,
          packageData.dimensions,
          packageData.price,
          packageData.packageId
        )
        .accounts(accounts)
        .rpc();

      console.log('Transaction successful:', tx);
      setMessage('Package registered successfully! Transaction: ' + tx, 'success');

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
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        logs: error.logs,
        code: error.code,
        name: error.name
      });
      setMessage(`Error registering package: ${error.message}`, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="package-form">
      <div className="form-group">
        <label htmlFor="tracking_number">Tracking Number *</label>
        <input
          type="text"
          id="tracking_number"
          value={formData.tracking_number}
          readOnly
          className="readonly-input"
          placeholder="Auto-generated tracking number"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">
          Description <span className="required">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          placeholder="Describe the package contents"
        />
      </div>

      <div className="form-group">
        <label htmlFor="weight">
          Weight (grams) <span className="required">*</span>
        </label>
        <input
          type="number"
          id="weight"
          name="weight"
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
            <label htmlFor="dimensions.length">Length</label>
            <input
              type="number"
              id="dimensions.length"
              name="dimensions.length"
              value={formData.dimensions.length}
              onChange={handleInputChange}
              required
              min="1"
              placeholder="Length in cm"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dimensions.width">Width</label>
            <input
              type="number"
              id="dimensions.width"
              name="dimensions.width"
              value={formData.dimensions.width}
              onChange={handleInputChange}
              required
              min="1"
              placeholder="Width in cm"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dimensions.height">Height</label>
            <input
              type="number"
              id="dimensions.height"
              name="dimensions.height"
              value={formData.dimensions.height}
              onChange={handleInputChange}
              required
              min="1"
              placeholder="Height in cm"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="origin">
          Origin <span className="required">*</span>
        </label>
        <div className="autocomplete-container">
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleInputChange}
            required
            placeholder="Search French city..."
            autoComplete="off"
          />
          {showOriginSuggestions && originSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {originSuggestions.map((city, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => selectCity(city, 'origin')}
                >
                  {city.postalCode} - {city.city}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="destination">
          Destination <span className="required">*</span>
        </label>
        <div className="autocomplete-container">
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleInputChange}
            required
            placeholder="Search French city..."
            autoComplete="off"
          />
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {destinationSuggestions.map((city, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => selectCity(city, 'destination')}
                >
                  {city.postalCode} - {city.city}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="status">Status *</label>
        <input
          type="text"
          id="status"
          value="InTransit"
          readOnly
          className="readonly-input"
        />
      </div>

      <div className="form-required-note">
        <span className="required">*</span> Required field
      </div>

      <button type="submit" className="action-button">
        Add Package
      </button>
    </form>
  );
};

export default AddPackageForm; 