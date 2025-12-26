import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import LogCanvas from './components/LogCanvas';
import AddressInput from './components/AddressInput';
import CalibrationTool from './components/CalibrationTool';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ErrorBoundary from './components/ErrorBoundary';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// ============================================
// RESIZABLE HOOKS
// ============================================
const useHorizontalResize = (initialWidth, minWidth, maxWidth) => {
  const [width, setWidth] = useState(initialWidth);
  const isResizing = useRef(false);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minWidth, maxWidth]);

  return [width, startResize];
};

const useVerticalResize = (containerRef, initialHeight, minHeight, maxHeight) => {
  const [height, setHeight] = useState(initialHeight);
  const isResizing = useRef(false);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = Math.min(maxHeight, Math.max(minHeight, e.clientY - rect.top));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, minHeight, maxHeight]);

  return [height, startResize];
};

// ============================================
// ROUTE COLORS
// ============================================
const ROUTE_COLORS = {
  leg1: { main: '#f97316', shadow: '#c2410c', label: 'To Pickup' },
  leg2: { main: '#22c55e', shadow: '#166534', label: 'To Dropoff' }
};

// ============================================
// STOP STYLES
// ============================================
const STOP_STYLES = {
  start: { color: '#3b82f6', fillColor: '#3b82f6', icon: '🚛', label: 'Trip Start', letter: 'S' },
  end: { color: '#ef4444', fillColor: '#ef4444', icon: '🏁', label: 'Trip End', letter: 'E' },
  pickup: { color: '#f97316', fillColor: '#f97316', icon: '📦', label: 'Pickup', letter: 'P' },
  dropoff: { color: '#22c55e', fillColor: '#22c55e', icon: '📬', label: 'Dropoff', letter: 'D' },
  fuel: { color: '#eab308', fillColor: '#eab308', icon: '⛽', label: 'Fuel Stop', letter: 'F' },
  sleep: { color: '#6366f1', fillColor: '#6366f1', icon: '🛏️', label: 'Sleeper (10hr)', letter: 'Z' },
  break: { color: '#14b8a6', fillColor: '#14b8a6', icon: '☕', label: 'Break (30min)', letter: 'B' },
  restart: { color: '#ec4899', fillColor: '#ec4899', icon: '🔄', label: '34hr Restart', letter: 'R' },
  inspection: { color: '#64748b', fillColor: '#64748b', icon: '🔍', label: 'Inspection', letter: 'I' }
};

// ============================================
// HELPERS
// ============================================
const createCustomIcon = (stopType) => {
  const style = STOP_STYLES[stopType] || STOP_STYLES.break;
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="position: relative; width: 32px; height: 40px;">
        <div style="width: 28px; height: 28px; background: ${style.fillColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-weight: bold; font-size: 12px;">${style.letter}</span>
        </div>
        <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${style.fillColor};"></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36]
  });
};

const parseCoords = (coordString) => {
  if (!coordString || typeof coordString !== 'string') return null;
  try {
    const parts = coordString.split(',');
    if (parts.length !== 2) return null;
    const lon = parseFloat(parts[0].trim());
    const lat = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lon)) return null;
    return [lat, lon];
  } catch (e) {
    return null;
  }
};

const formatTime = (hours) => {
  const day = Math.floor(hours / 24) + 1;
  const h = Math.floor(hours % 24);
  const m = Math.floor((hours % 1) * 60);
  return `Day ${day}, ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// ============================================
// MAP COMPONENTS
// ============================================
const MapLegend = () => (
  <div style={{
    position: 'absolute', bottom: '20px', left: '10px',
    background: 'white', padding: '12px 15px', borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 1000, fontSize: '11px', maxWidth: '200px'
  }}>
    <div style={{ fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
      🗺️ Map Legend
    </div>
    <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
      <div style={{ fontWeight: '600', marginBottom: '5px', fontSize: '10px', color: '#666' }}>ROUTES</div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ width: '24px', height: '4px', background: ROUTE_COLORS.leg1.main, marginRight: '8px', borderRadius: '2px' }}></div>
        <span>Current → Pickup</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '24px', height: '4px', background: ROUTE_COLORS.leg2.main, marginRight: '8px', borderRadius: '2px' }}></div>
        <span>Pickup → Dropoff</span>
      </div>
    </div>
    <div style={{ fontWeight: '600', marginBottom: '5px', fontSize: '10px', color: '#666' }}>STOPS</div>
    {Object.entries(STOP_STYLES).map(([key, style]) => (
      <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: style.fillColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px',
          border: '2px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}>
          <span style={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>{style.letter}</span>
        </div>
        <span>{style.icon} {style.label}</span>
      </div>
    ))}
  </div>
);

const TripSummary = ({ summary }) => {
  if (!summary) return null;
  return (
    <div style={{
      position: 'absolute', top: '10px', right: '10px', background: 'white',
      padding: '12px 15px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      zIndex: 1000, fontSize: '12px', minWidth: '180px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
        📊 Trip Summary
      </div>
      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{summary.total_miles?.toLocaleString()} mi</div>
        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
          <span style={{ color: ROUTE_COLORS.leg1.main }}>■</span> {summary.leg1_miles?.toLocaleString()} mi
          <span style={{ margin: '0 5px' }}>|</span>
          <span style={{ color: ROUTE_COLORS.leg2.main }}>■</span> {summary.leg2_miles?.toLocaleString()} mi
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div><div style={{ color: '#666', fontSize: '10px' }}>Drive Time</div><div style={{ fontWeight: '600' }}>{summary.total_drive_time} hrs</div></div>
        <div><div style={{ color: '#666', fontSize: '10px' }}>Rest Time</div><div style={{ fontWeight: '600' }}>{summary.total_rest_time} hrs</div></div>
        <div><div style={{ color: '#666', fontSize: '10px' }}>Trip Duration</div><div style={{ fontWeight: '600' }}>{summary.total_trip_time} hrs</div></div>
        <div><div style={{ color: '#666', fontSize: '10px' }}>Days</div><div style={{ fontWeight: '600' }}>{summary.num_days}</div></div>
      </div>
    </div>
  );
};

function MapUpdater({ leg1Coords, leg2Coords, stops }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
    const allPoints = [...leg1Coords, ...leg2Coords];
    if (stops?.length > 0) {
      stops.forEach(stop => {
        const parsed = parseCoords(stop.coords);
        if (parsed) allPoints.push(parsed);
      });
    }
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] });
    }
  }, [leg1Coords, leg2Coords, stops, map]);
  return null;
}

const StopMarkers = ({ stops }) => {
  if (!stops || stops.length === 0) return null;
  return (
    <>
      {stops.map((stop, index) => {
        const position = parseCoords(stop.coords);
        if (!position) return null;
        const style = STOP_STYLES[stop.type] || STOP_STYLES.break;
        return (
          <Marker key={`stop-${index}`} position={position} icon={createCustomIcon(stop.type)}>
            <Popup>
              <div style={{ minWidth: '160px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', borderBottom: `2px solid ${style.color}`, paddingBottom: '5px' }}>
                  {style.icon} {style.label}
                </div>
                <div style={{ fontSize: '12px', color: '#333', marginBottom: '5px' }}>{stop.remark}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  <div>⏰ {formatTime(stop.time)}</div>
                  {stop.duration > 0 && <div>⏱️ {(stop.duration * 60).toFixed(0)} min</div>}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

// ============================================
// MAIN APP
// ============================================
function App() {
  const [formData, setFormData] = useState({ current: '', pickup: '', dropoff: '', cycle: 0 });
  const [tripData, setTripData] = useState(null);
  const [leg1Coords, setLeg1Coords] = useState([]);
  const [leg2Coords, setLeg2Coords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resizable state
  const rightPanelRef = useRef(null);
  const [sidebarWidth, startSidebarResize] = useHorizontalResize(350, 280, 500);
  const [mapHeight, startMapResize] = useVerticalResize(rightPanelRef, 450, 200, 700);
  
  // Calibration state
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibration, setCalibration] = useState(null);

  // Load saved calibration from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('eldCalibration');
    if (saved) {
      try {
        setCalibration(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load calibration:', e);
      }
    }
  }, []);

  const handleCalibrationComplete = (config) => {
    setCalibration(config);
    setShowCalibration(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTripData(null);
    setLeg1Coords([]);
    setLeg2Coords([]);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const res = await axios.post(`${backendUrl}/api/generate-trip/`, formData);
      
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setTripData(res.data);
        
        if (res.data.route_geometry?.leg1?.coordinates) {
          setLeg1Coords(res.data.route_geometry.leg1.coordinates.map(c => [c[1], c[0]]));
        }
        if (res.data.route_geometry?.leg2?.coordinates) {
          setLeg2Coords(res.data.route_geometry.leg2.coordinates.map(c => [c[1], c[0]]));
        }
      }
    } catch (err) { 
      setError("Error connecting to server or processing trip.");
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    
      {/* LEFT PANEL - Now resizable */}
      <div style={{ 
        width: sidebarWidth, 
        minWidth: sidebarWidth, 
        flexShrink: 0, 
        padding: '20px', 
        background: '#f4f4f4', 
        overflowY: 'auto', 
        zIndex: 1000, 
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#002', marginBottom: '20px' }}>🚛 Spotter ELD Planner</h2>
        
        <form onSubmit={handleSubmit}>
          <AddressInput label="Current Location" value={formData.current} onChange={v => setFormData({...formData, current: v})} />
          <AddressInput label="Pickup Location" value={formData.pickup} onChange={v => setFormData({...formData, pickup: v})} />
          <AddressInput label="Dropoff Location" value={formData.dropoff} onChange={v => setFormData({...formData, dropoff: v})} />
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '5px'}}>
              Current Cycle Used (Hrs)
            </label>
            <input 
              type="number" 
              value={formData.cycle} 
              onChange={e => setFormData({...formData, cycle: e.target.value})}
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>

          <button type="submit" disabled={loading}
            style={{ 
              width: '100%', padding: '15px', 
              background: loading ? '#ccc' : '#000080', 
              color: 'white', border: 'none', 
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '5px', fontWeight: 'bold', fontSize: '14px'
            }}>
            {loading ? '⏳ GENERATING...' : '🗺️ GENERATE TRIP & LOGS'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', borderRadius: '4px', fontSize: '14px' }}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* Calibration Status */}
        <div style={{ 
          marginTop: '20px', 
          padding: '10px 15px', 
          background: calibration ? '#d1fae5' : '#fef3c7',
          borderRadius: '5px',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            {calibration ? '✅ Log sheet calibrated' : '⚠️ Log sheet not calibrated'}
          </span>
          <button
            onClick={() => setShowCalibration(true)}
            style={{
              padding: '5px 10px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            📐 {calibration ? 'Recalibrate' : 'Calibrate'}
          </button>
        </div>

        {/* STOPS LIST */}
        {tripData?.stops && tripData.stops.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>📍 Stops ({tripData.stops.length})</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {tripData.stops.map((stop, idx) => {
                const style = STOP_STYLES[stop.type] || STOP_STYLES.break;
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'flex-start',
                    padding: '10px', marginBottom: '8px',
                    background: 'white', borderRadius: '5px',
                    borderLeft: `4px solid ${style.color}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%', background: style.fillColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: '10px', flexShrink: 0
                    }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '11px' }}>{style.letter}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{style.icon} {style.label}</div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{stop.remark}</div>
                      <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                        {formatTime(stop.time)}
                        {stop.duration > 0 && ` • ${(stop.duration * 60).toFixed(0)} min`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* HORIZONTAL RESIZE HANDLE */}
      <div
        onMouseDown={startSidebarResize}
        style={{
          width: '6px',
          cursor: 'col-resize',
          background: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.background = '#bbb'}
        onMouseLeave={(e) => e.target.style.background = '#e0e0e0'}
      >
        <div style={{ width: '2px', height: '40px', background: '#999', borderRadius: '1px' }} />
      </div>

      {/* RIGHT PANEL */}
      <div ref={rightPanelRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* MAP - Now resizable height */}
        <div style={{ height: mapHeight, width: '100%', position: 'relative', flexShrink: 0 }}>
          <MapContainer center={[39.8, -98.5]} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <MapUpdater leg1Coords={leg1Coords} leg2Coords={leg2Coords} stops={tripData?.stops} />
            
            {leg1Coords.length > 0 && (
              <>
                <Polyline positions={leg1Coords} color={ROUTE_COLORS.leg1.shadow} weight={8} opacity={0.4} />
                <Polyline positions={leg1Coords} color={ROUTE_COLORS.leg1.main} weight={5} opacity={1} />
              </>
            )}
            
            {leg2Coords.length > 0 && (
              <>
                <Polyline positions={leg2Coords} color={ROUTE_COLORS.leg2.shadow} weight={8} opacity={0.4} />
                <Polyline positions={leg2Coords} color={ROUTE_COLORS.leg2.main} weight={5} opacity={1} />
              </>
            )}

            <StopMarkers stops={tripData?.stops} />
          </MapContainer>
          
          {tripData && <MapLegend />}
          {tripData?.summary && <TripSummary summary={tripData.summary} />}
        </div>

        {/* VERTICAL RESIZE HANDLE */}
        <div
          onMouseDown={startMapResize}
          style={{
            height: '6px',
            cursor: 'row-resize',
            background: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = '#bbb'}
          onMouseLeave={(e) => e.target.style.background = '#e0e0e0'}
        >
          <div style={{ width: '40px', height: '2px', background: '#999', borderRadius: '1px' }} />
        </div>

        {/* LOGS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fafafa' }}>
          <LogCanvas 
            logs={tripData?.logs} 
            calibration={calibration}
            onOpenCalibration={() => setShowCalibration(true)}
          />
        </div>
      </div>
    </div>

    <style>{`
      .custom-stop-marker { background: transparent !important; border: none !important; }
    `}</style>
  </ErrorBoundary>
);
}

export default App;