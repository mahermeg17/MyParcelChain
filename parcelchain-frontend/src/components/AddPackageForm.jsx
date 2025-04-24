import { useState, useEffect } from 'react';
import { Program } from '@project-serum/anchor';
import { SystemProgram } from '@solana/web3.js';
import { frenchCities, generateTrackingNumber } from '../utils/frenchCities';

const AddPackageForm = ({ program, programID, provider, platformPDA, packagePDA, wallet, setMessage }) => {
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
      const program = new Program(idl, programID, provider);
      const dimensions = {
        length: parseInt(formData.dimensions.length),
        width: parseInt(formData.dimensions.width),
        height: parseInt(formData.dimensions.height)
      };
      
      await program.methods
        .addPackage(
          formData.tracking_number,
          formData.description,
          parseInt(formData.weight),
          dimensions,
          formData.origin,
          formData.destination,
          { [formData.status]: {} }
        )
        .accounts({
          platform: platformPDA,
          package: packagePDA,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage('Package added successfully!', 'success');
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
      setMessage(`Error adding package: ${error.message}`, 'error');
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