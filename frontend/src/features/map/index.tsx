import React from 'react';

// Placeholder map feature
export const MapFeature: React.FC<{
  tripData: any;
  leg1Coords: any[];
  leg2Coords: any[];
}> = ({ tripData }) => (
  <div style={{
    width: '100%',
    height: '100%',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ddd'
  }}>
    <div style={{ textAlign: 'center', color: '#666' }}>
      <h3>Map Feature</h3>
      <p>Interactive map will be implemented here.</p>
      {tripData && <p>Trip data available for mapping</p>}
    </div>
  </div>
);
