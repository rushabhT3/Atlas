import React from 'react';

// Placeholder calibration feature
export const CalibrationTool: React.FC<{
  onCalibrationComplete: (config: any) => void;
  onClose: () => void;
  initialValues?: any;
}> = ({ onCalibrationComplete, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      minWidth: '300px'
    }}>
      <h3>Calibration Tool</h3>
      <p>Calibration feature will be implemented here.</p>
      <button
        onClick={() => onCalibrationComplete({})}
        style={{ marginRight: '10px' }}
      >
        Save
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  </div>
);
