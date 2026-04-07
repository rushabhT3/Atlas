import React from 'react';
import { TripFormData } from '../../../types';

interface TripFormProps {
  formData: TripFormData;
  onFormDataChange: (data: TripFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

/**
 * Trip planning form component
 */
export const TripForm: React.FC<TripFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  loading
}) => {
  const handleInputChange = (field: keyof TripFormData, value: string | number) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <AddressInput
        label="Current Location"
        value={formData.current}
        onChange={(value) => handleInputChange('current', value)}
      />
      
      <AddressInput
        label="Pickup Location"
        value={formData.pickup}
        onChange={(value) => handleInputChange('pickup', value)}
      />
      
      <AddressInput
        label="Dropoff Location"
        value={formData.dropoff}
        onChange={(value) => handleInputChange('dropoff', value)}
      />
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
          Current Cycle Used (Hrs)
        </label>
        <input
          type="number"
          value={formData.cycle}
          onChange={(e) => handleInputChange('cycle', parseFloat(e.target.value) || 0)}
          style={{
            width: '100%',
            padding: '10px',
            boxSizing: 'border-box',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          marginTop: '10px'
        }}
      >
        {loading ? 'GENERATING...' : 'GENERATE TRIP & LOGS'}
      </button>
    </form>
  );
};

// Temporary AddressInput component - will be moved to shared components
const AddressInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Type ${label.toLowerCase()}...`}
      style={{
        width: '100%',
        padding: '10px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #ccc'
      }}
    />
  </div>
);
