import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import LogCanvas from "./components/LogCanvas";
import AddressInput from "./components/AddressInput";
import CalibrationTool from "./components/CalibrationTool";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ErrorBoundary from "./components/ErrorBoundary";

// Import shared utilities (keeping working hooks local)
import { parseCoords, formatTime } from "./utils";
import { ROUTE_COLORS, STOP_STYLES } from "./constants";
import { tripApi } from "./services/api";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ============================================
// RESIZABLE HOOKS
// ============================================
const useHorizontalResize = (initialWidth, minWidth, maxWidth) => {
  const [width, setWidth] = useState(initialWidth);
  const isResizing = useRef(false);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minWidth, maxWidth]);

  return [width, startResize];
};

const useVerticalResize = (
  containerRef,
  initialHeight,
  minHeight,
  maxHeight,
) => {
  const [height, setHeight] = useState(initialHeight);
  const isResizing = useRef(false);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = Math.min(
        maxHeight,
        Math.max(minHeight, e.clientY - rect.top),
      );
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerRef, minHeight, maxHeight]);

  return [height, startResize];
};

// ============================================
// HELPERS
// ============================================
const createCustomIcon = (stopType) => {
  const style = STOP_STYLES[stopType] || STOP_STYLES.break;
  return L.divIcon({
    className: "custom-stop-marker",
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
    popupAnchor: [0, -36],
  });
};

// ============================================
// MAP COMPONENTS
// ============================================
const MapLegend = () => (
  <div
    style={{
      position: "absolute",
      bottom: "20px",
      left: "20px",
      background: "white",
      padding: "20px",
      border: "1px solid black",
      zIndex: 1000,
      fontSize: "10px",
      maxWidth: "180px",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }}
  >
    <div
      style={{
        fontWeight: "900",
        marginBottom: "15px",
        borderBottom: "1px solid black",
        paddingBottom: "8px",
      }}
    >
      Map Legend
    </div>
    <div
      style={{
        marginBottom: "12px",
        paddingBottom: "10px",
        borderBottom: "1px solid #eee",
      }}
    >
      <div style={{ fontWeight: "900", marginBottom: "8px", opacity: 0.5 }}>
        ROUTES
      </div>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            background: ROUTE_COLORS.leg1.main,
            marginRight: "8px",
            border: "1px solid black",
          }}
        ></div>
        <span>Current → Pickup</span>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            background: ROUTE_COLORS.leg2.main,
            marginRight: "8px",
            border: "1px solid black",
          }}
        ></div>
        <span>Pickup → Dropoff</span>
      </div>
    </div>
    <div style={{ fontWeight: "900", marginBottom: "8px", opacity: 0.5 }}>
      STOPS
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
      {Object.entries(STOP_STYLES).map(([key, style]) => (
        <div key={key} style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              background: style.fillColor,
              marginRight: "8px",
              border: "1px solid black",
            }}
          ></div>
          <span>{style.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const TripSummary = ({ summary }) => {
  if (!summary) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        background: "white",
        padding: "20px",
        border: "1px solid black",
        zIndex: 1000,
        fontSize: "11px",
        minWidth: "200px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      <div
        style={{
          fontWeight: "900",
          marginBottom: "15px",
          borderBottom: "1px solid black",
          paddingBottom: "8px",
        }}
      >
        Trip Summary
      </div>
      <div style={{ marginBottom: "15px" }}>
        <div
          style={{
            fontWeight: "900",
            fontSize: "24px",
            letterSpacing: "-0.05em",
          }}
        >
          {summary.total_miles?.toLocaleString()}{" "}
          <span style={{ fontSize: "12px" }}>MI</span>
        </div>
        <div style={{ fontSize: "9px", opacity: 0.6, marginTop: "4px" }}>
          Leg 1: {summary.leg1_miles?.toLocaleString()} mi | Leg 2:{" "}
          {summary.leg2_miles?.toLocaleString()} mi
        </div>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
      >
        <div>
          <div style={{ opacity: 0.5, fontSize: "9px" }}>Drive Time</div>
          <div style={{ fontWeight: "700" }}>{summary.total_drive_time} H</div>
        </div>
        <div>
          <div style={{ opacity: 0.5, fontSize: "9px" }}>Rest Time</div>
          <div style={{ fontWeight: "700" }}>{summary.total_rest_time} H</div>
        </div>
        <div>
          <div style={{ opacity: 0.5, fontSize: "9px" }}>Duration</div>
          <div style={{ fontWeight: "700" }}>{summary.total_trip_time} H</div>
        </div>
        <div>
          <div style={{ opacity: 0.5, fontSize: "9px" }}>Days</div>
          <div style={{ fontWeight: "700" }}>{summary.num_days}</div>
        </div>
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
      stops.forEach((stop) => {
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
          <Marker
            key={`stop-${index}`}
            position={position}
            icon={createCustomIcon(stop.type)}
          >
            <Popup>
              <div style={{ minWidth: "160px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    marginBottom: "5px",
                    borderBottom: `2px solid ${style.color}`,
                    paddingBottom: "5px",
                  }}
                >
                  {style.icon} {style.label}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#333",
                    marginBottom: "5px",
                  }}
                >
                  {stop.remark}
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  <div> {formatTime(stop.time)}</div>
                  {stop.duration > 0 && (
                    <div> {(stop.duration * 60).toFixed(0)} min</div>
                  )}
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
  const [formData, setFormData] = useState({
    current: "",
    pickup: "",
    dropoff: "",
    cycle: 0,
  });
  const [submitCount, setSubmitCount] = useState(0);
  const [tripData, setTripData] = useState(null);
  const [leg1Coords, setLeg1Coords] = useState([]);
  const [leg2Coords, setLeg2Coords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resizable state
  const rightPanelRef = useRef(null);
  const [sidebarWidth, startSidebarResize] = useHorizontalResize(350, 280, 500);
  const [mapHeight, startMapResize] = useVerticalResize(
    rightPanelRef,
    450,
    200,
    700,
  );

  // Calibration state
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibration, setCalibration] = useState(null);

  // Load saved calibration from localStorage on mount
  useEffect(() => {
    tripApi.healthCheck();

    const saved = localStorage.getItem("eldCalibration");
    if (saved) {
      try {
        setCalibration(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load calibration:", e);
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
    setSubmitCount((c) => c + 1);
    setError(null);
    setTripData(null);
    setLeg1Coords([]);
    setLeg2Coords([]);

    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      const res = await axios.post(`${backendUrl}/trips/generate/`, formData);

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setTripData(res.data);

        if (res.data.route_geometry?.leg1?.coordinates) {
          setLeg1Coords(
            res.data.route_geometry.leg1.coordinates.map((c) => [c[1], c[0]]),
          );
        }
        if (res.data.route_geometry?.leg2?.coordinates) {
          setLeg2Coords(
            res.data.route_geometry.leg2.coordinates.map((c) => [c[1], c[0]]),
          );
        }
      }
    } catch (err) {
      setError("Error connecting to server or processing trip.");
      // Log error for debugging but don't expose to user
      if (import.meta.env.DEV) {
        console.error("API Error:", err);
      }
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

      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        {/* LEFT PANEL - Now resizable */}
        <div
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            flexShrink: 0,
            padding: "30px 40px",
            background: "var(--bg-color)",
            overflowY: "auto",
            zIndex: 1000,
            borderRight: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2
            style={{
              color: "var(--text-color)",
              fontSize: "1.2rem",
              marginBottom: "40px",
              fontWeight: "900",
              letterSpacing: "-0.03em",
            }}
          >
            🚛 Atlas
            <span
              style={{ fontWeight: "300", marginLeft: "5px", opacity: 0.6 }}
            >
              ELD Planner
            </span>
          </h2>

          <form onSubmit={handleSubmit}>
            <AddressInput
              label="Current Location"
              value={formData.current}
              onChange={(v) => setFormData({ ...formData, current: v })}
              clearSignal={submitCount}
            />
            <AddressInput
              label="Pickup Location"
              value={formData.pickup}
              onChange={(v) => setFormData({ ...formData, pickup: v })}
              clearSignal={submitCount}
            />
            <AddressInput
              label="Dropoff Location"
              value={formData.dropoff}
              onChange={(v) => setFormData({ ...formData, dropoff: v })}
              clearSignal={submitCount}
            />

            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <label
                  style={{
                    fontWeight: "bold",
                    fontSize: "12px",
                    marginRight: "5px",
                  }}
                >
                  Current Cycle Used (Hrs)
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    cursor: "help",
                    color: "#6b7280",
                    fontSize: "14px",
                    marginLeft: "5px",
                  }}
                  onMouseEnter={(e) => {
                    const tooltip = e.currentTarget.querySelector(".tooltip");
                    const arrow = e.currentTarget.querySelector(".arrow");
                    if (tooltip) {
                      tooltip.style.opacity = "1";
                      tooltip.style.visibility = "visible";
                    }
                    if (arrow) {
                      arrow.style.opacity = "1";
                      arrow.style.visibility = "visible";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const tooltip = e.currentTarget.querySelector(".tooltip");
                    const arrow = e.currentTarget.querySelector(".arrow");
                    if (tooltip) {
                      tooltip.style.opacity = "0";
                      tooltip.style.visibility = "hidden";
                    }
                    if (arrow) {
                      arrow.style.opacity = "0";
                      arrow.style.visibility = "hidden";
                    }
                  }}
                >
                  <span style={{ fontSize: "12px" }}>?</span>
                  <div
                    className="tooltip"
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#1f2937",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      whiteSpace: "normal",
                      lineHeight: "1.4",
                      opacity: 0,
                      visibility: "hidden",
                      transition: "opacity 0.3s, visibility 0.3s",
                      zIndex: 1000,
                      marginBottom: "5px",
                      width: "250px",
                      textAlign: "center",
                      wordWrap: "break-word",
                    }}
                  >
                    Hours used in current 70-hour duty cycle. FMCSA limits
                    drivers to 70 hours in 8 days.
                  </div>
                  <div
                    className="arrow"
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 0,
                      height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: "5px solid #1f2937",
                      opacity: 0,
                      visibility: "hidden",
                      transition: "opacity 0.3s, visibility 0.3s",
                      marginBottom: "0px",
                    }}
                  ></div>
                </div>
              </div>
              <input
                type="number"
                value={formData.cycle}
                onChange={(e) =>
                  setFormData({ ...formData, cycle: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  boxSizing: "border-box",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "10px",
              }}
            >
              {loading ? "⏳ GENERATING..." : "GENERATE TRIP & LOGS"}
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                background: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #f87171",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {/* Calibration Status */}
          <div
            style={{
              marginTop: "40px",
              padding: "20px 0",
              borderTop: "1px solid var(--border-color)",
              fontSize: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <span style={{ fontWeight: "700", textTransform: "uppercase" }}>
              {calibration ? "Status: CALIBRATED" : "Status: UNCALIBRATED"}
            </span>
            <button
              onClick={() => setShowCalibration(true)}
              style={{
                alignSelf: "flex-start",
                padding: "8px 16px",
                fontSize: "10px",
              }}
            >
              {calibration ? "Recalibrate System" : "Calibrate System"}
            </button>
          </div>

          {/* STOPS LIST */}
          {tripData?.stops && tripData.stops.length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <h3
                style={{
                  marginBottom: "20px",
                  fontSize: "10px",
                  fontWeight: "900",
                  letterSpacing: "0.1em",
                  borderBottom: "1px solid black",
                  paddingBottom: "10px",
                }}
              >
                PLANNED STOPS ({tripData.stops.length})
              </h3>
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  paddingRight: "10px",
                }}
              >
                {tripData.stops.map((stop, idx) => {
                  const style = STOP_STYLES[stop.type] || STOP_STYLES.break;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "15px 0",
                        marginBottom: "0",
                        background: "transparent",
                        borderBottom: "1px solid #eee",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            background: style.fillColor,
                            border: "1px solid black",
                            flexShrink: 0,
                          }}
                        ></div>
                        <div
                          style={{
                            fontWeight: "900",
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {style.label}
                        </div>
                      </div>
                      <div style={{ paddingLeft: "20px" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            lineHeight: "1.4",
                          }}
                        >
                          {stop.remark}
                        </div>
                        <div
                          style={{
                            fontSize: "9px",
                            fontWeight: "700",
                            marginTop: "6px",
                            textTransform: "uppercase",
                            opacity: 0.6,
                          }}
                        >
                          {formatTime(stop.time)}
                          {stop.duration > 0 &&
                            ` • ${(stop.duration * 60).toFixed(0)} MIN`}
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
            width: "1px",
            cursor: "col-resize",
            background: "var(--border-color)",
            zIndex: 1001,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "-10px",
              width: "20px",
              height: "40px",
              cursor: "col-resize",
            }}
          />
        </div>

        {/* RIGHT PANEL */}
        <div
          ref={rightPanelRef}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* MAP - Now resizable height */}
          <div
            style={{
              height: mapHeight,
              width: "100%",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <MapContainer
              center={[39.8, -98.5]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              <MapUpdater
                leg1Coords={leg1Coords}
                leg2Coords={leg2Coords}
                stops={tripData?.stops}
              />

              {leg1Coords.length > 0 && (
                <>
                  <Polyline
                    positions={leg1Coords}
                    color={ROUTE_COLORS.leg1.shadow}
                    weight={8}
                    opacity={0.4}
                  />
                  <Polyline
                    positions={leg1Coords}
                    color={ROUTE_COLORS.leg1.main}
                    weight={5}
                    opacity={1}
                  />
                </>
              )}

              {leg2Coords.length > 0 && (
                <>
                  <Polyline
                    positions={leg2Coords}
                    color={ROUTE_COLORS.leg2.shadow}
                    weight={8}
                    opacity={0.4}
                  />
                  <Polyline
                    positions={leg2Coords}
                    color={ROUTE_COLORS.leg2.main}
                    weight={5}
                    opacity={1}
                  />
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
              height: "1px",
              cursor: "row-resize",
              background: "var(--border-color)",
              position: "relative",
              zIndex: 1001,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "-10px",
                width: "40px",
                height: "20px",
                cursor: "row-resize",
              }}
            />
          </div>

          {/* LOGS */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              background: "#fafafa",
            }}
          >
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
