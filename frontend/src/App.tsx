import React, { useRef } from 'react';
import { TripPlanningFeature } from './features/trip-planning';
import { useHorizontalResize, useVerticalResize, useLocalStorage } from './hooks';
import { CalibrationTool } from './features/calibration'; // Will be created
import { MapFeature } from './features/map'; // Will be created
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Types
interface CalibrationConfig {
  avgSpeed: number;
  fuelInterval: number;
  breakDuration: number;
  restDuration: number;
}

/**
 * Modern React App with feature-based architecture
 */
function App() {
  // Resizable state
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, startSidebarResize] = useHorizontalResize(350, 280, 500);
  const [mapHeight, startMapResize] = useVerticalResize(rightPanelRef, 450, 200, 700);

  // Calibration state
  const [showCalibration, setShowCalibration] = React.useState(false);
  const [calibration, setCalibration] = useLocalStorage<CalibrationConfig | null>(
    'eldCalibration',
    null
  );

  const handleCalibrationComplete = (config: CalibrationConfig) => {
    setCalibration(config);
    setShowCalibration(false);
  };

  return (
    <ErrorBoundary>
      {/* Calibration Modal */}
      {showCalibration && (
        <CalibrationTool
          onCalibrationComplete={handleCalibrationComplete}
          onClose={() => setShowCalibration(false)}
          initialValues={calibration}
        />
      )}

      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        
        {/* LEFT PANEL - Resizable */}
        <div style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          flexShrink: 0,
          padding: '30px 40px',
          background: 'var(--bg-color)',
          overflowY: 'auto',
          zIndex: 1000,
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <TripPlanningFeature />
        </div>

        {/* HORIZONTAL RESIZE HANDLE */}
        <div
          onMouseDown={startSidebarResize}
          style={{
            width: '1px',
            cursor: 'col-resize',
            background: 'var(--border-color)',
            zIndex: 1001,
            position: 'relative'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '-10px',
            width: '20px',
            height: '40px',
            cursor: 'col-resize'
          }} />
        </div>

        {/* RIGHT PANEL */}
        <div ref={rightPanelRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* MAP - Resizable height */}
          <div style={{ height: mapHeight, position: 'relative' }}>
            <MapFeature
              tripData={null} // Will be connected to trip planning state
              leg1Coords={[]}
              leg2Coords={[]}
            />
          </div>

          {/* VERTICAL RESIZE HANDLE */}
          <div
            onMouseDown={startMapResize}
            style={{
              height: '1px',
              cursor: 'row-resize',
              background: 'var(--border-color)',
              zIndex: 1001,
              position: 'relative',
              flexShrink: 0
            }}
          >
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '-10px',
              width: '40px',
              height: '20px',
              cursor: 'row-resize'
            }} />
          </div>

          {/* LOG CANVAS */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {/* LogCanvas component will go here */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h3>DAILY LOGS UNAVAILABLE</h3>
                <p>GENERATE A TRIP TO VIEW AND ANALYZE THE ELECTRONIC LOGGING DATA FOR EACH DAY.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
