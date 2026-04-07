import React, { useRef, useState, useEffect } from "react";
import logBg from "../assets/blank-paper-log.png";

const POINT_LABELS = [
  {
    key: "gridStartX",
    label: "HOUR 0 (MIDNIGHT - LEFT EDGE)",
    instruction: "CLICK THE LEFT EDGE OF THE TIME GRID (HOUR 0)",
  },
  {
    key: "gridEndX",
    label: "HOUR 24 (MIDNIGHT - RIGHT EDGE)",
    instruction: "CLICK THE RIGHT EDGE OF THE TIME GRID (HOUR 24)",
  },
  {
    key: "offDutyY",
    label: "OFF DUTY ROW",
    instruction: "CLICK THE CENTER OF THE OFF DUTY ROW",
  },
  {
    key: "sleeperY",
    label: "SLEEPER BERTH ROW",
    instruction: "CLICK THE CENTER OF THE SLEEPER BERTH ROW",
  },
  {
    key: "drivingY",
    label: "DRIVING ROW",
    instruction: "CLICK THE CENTER OF THE DRIVING ROW",
  },
  {
    key: "onDutyY",
    label: "ON DUTY ROW",
    instruction: "CLICK THE CENTER OF THE ON DUTY ROW",
  },
  {
    key: "remarksY",
    label: "REMARKS AREA",
    instruction: "CLICK WHERE REMARKS TEXT SHOULD START",
  },
];

const CalibrationTool = ({ onCalibrationComplete, onClose, initialValues }) => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentStep, setCurrentStep] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [calibration, setCalibration] = useState(
    initialValues || {
      gridStartX: null,
      gridEndX: null,
      offDutyY: null,
      sleeperY: null,
      drivingY: null,
      onDutyY: null,
      remarksY: null,
    },
  );

  const redrawCanvas = (ctx, img, cal, step) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw existing points
    const pointsOrder = [
      "gridStartX",
      "gridEndX",
      "offDutyY",
      "sleeperY",
      "drivingY",
      "onDutyY",
      "remarksY",
    ];

    pointsOrder.forEach((key, idx) => {
      if (cal[key] !== null) {
        const isXPoint = key.includes("X");
        const x = isXPoint ? cal[key] : 100;
        const y = isXPoint ? 250 : cal[key];

        // Draw square marker (Gufram style)
        ctx.fillStyle = idx < step ? "#000" : "#000";
        ctx.fillRect(x - 6, y - 6, 12, 12);
        ctx.strokeStyle = idx < step ? "#0f0" : "#f00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 6, y - 6, 12, 12);

        // Draw label
        ctx.fillStyle = "white";
        ctx.font = "bold 10px Outfit";
        ctx.textAlign = "center";
        ctx.fillText(idx + 1, x, y + 4);

        // Draw line for X points
        if (isXPoint) {
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cal[key], 0);
          ctx.lineTo(cal[key], ctx.canvas.height);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw line for Y points
        if (!isXPoint && cal.gridStartX && cal.gridEndX) {
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cal.gridStartX, cal[key]);
          ctx.lineTo(cal.gridEndX, cal[key]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = logBg;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setImageSize({ width: img.width, height: img.height });
      redrawCanvas(ctx, img, calibration, currentStep);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = logBg;
    img.onload = () => {
      redrawCanvas(ctx, img, calibration, currentStep);
    };
  }, [calibration, currentStep]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setMousePos({
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    });
  };

  const handleClick = (e) => {
    if (currentStep >= POINT_LABELS.length) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    const pointKey = POINT_LABELS[currentStep].key;
    const value = pointKey.includes("X") ? x : y;

    setCalibration((prev) => ({
      ...prev,
      [pointKey]: value,
    }));

    setCurrentStep((prev) => prev + 1);
  };

  const handleReset = () => {
    setCalibration({
      gridStartX: null,
      gridEndX: null,
      offDutyY: null,
      sleeperY: null,
      drivingY: null,
      onDutyY: null,
      remarksY: null,
    });
    setCurrentStep(0);
  };

  const handleSave = () => {
    const config = {
      GRID_START_X: calibration.gridStartX,
      GRID_END_X: calibration.gridEndX,
      ROW_Y: {
        OFF_DUTY: calibration.offDutyY,
        SLEEPER: calibration.sleeperY,
        DRIVING: calibration.drivingY,
        ON_DUTY: calibration.onDutyY,
      },
      REMARKS_Y: calibration.remarksY,
      IMAGE_SIZE: imageSize,
    };

    localStorage.setItem("eldCalibration", JSON.stringify(config));

    if (onCalibrationComplete) {
      onCalibrationComplete(config);
    }
  };

  const isComplete = currentStep >= POINT_LABELS.length;
  const currentInstruction = POINT_LABELS[currentStep] || {
    instruction: "CALIBRATION COMPLETE!",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--bg-color)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        padding: "40px",
        fontFamily: "var(--font-family)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
          borderBottom: "1px solid black",
          paddingBottom: "20px",
        }}
      >
        <h2
          style={{
            color: "black",
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: "900",
          }}
        >
          📐 SYSTEM CALIBRATION
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: "10px 20px",
            fontSize: "10px",
            borderRadius: "0",
          }}
        >
          CLOSE [X]
        </button>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", gap: "40px", flex: 1 }}>
        {/* Canvas Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Instruction */}
          <div
            style={{
              background: "black",
              color: "white",
              padding: "25px",
              marginBottom: "20px",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.6,
                  marginBottom: "5px",
                  fontWeight: "900",
                }}
              >
                STEP {Math.min(currentStep + 1, POINT_LABELS.length)} OF{" "}
                {POINT_LABELS.length}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "900",
                  letterSpacing: "-0.02em",
                }}
              >
                {currentInstruction.instruction.toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{ fontSize: "10px", opacity: 0.6, fontWeight: "900" }}
              >
                COORDS
              </div>
              <div style={{ fontSize: "14px", fontWeight: "900" }}>
                X:{mousePos.x} Y:{mousePos.y}
              </div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid black",
              background: "white",
              display: "inline-block",
              position: "relative",
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              style={{
                cursor: isComplete ? "default" : "crosshair",
                maxWidth: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div
          style={{
            width: "380px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Points List */}
          <div
            style={{
              border: "1px solid black",
              padding: "25px",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "0.1em",
              }}
            >
              CALIBRATION STATUS
            </h3>

            {POINT_LABELS.map((point, idx) => {
              const value = calibration[point.key];
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #eee",
                    opacity: idx > currentStep ? 0.3 : 1,
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "1px solid black",
                      background: isDone
                        ? "black"
                        : isActive
                          ? "transparent"
                          : "transparent",
                      marginRight: "15px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isDone && (
                      <span style={{ color: "white", fontSize: "10px" }}>
                        ✓
                      </span>
                    )}
                    {isActive && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          background: "black",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", fontWeight: "900" }}>
                      {point.label}
                    </div>
                    {value !== null && (
                      <div
                        style={{
                          fontSize: "10px",
                          opacity: 0.6,
                          marginTop: "2px",
                        }}
                      >
                        {point.key.includes("X")
                          ? `X: ${value}`
                          : `Y: ${value}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "15px" }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                borderRadius: "0",
                background: "transparent",
                color: "black",
              }}
            >
              RESET
            </button>

            <button
              onClick={handleSave}
              disabled={!isComplete}
              style={{
                flex: 2,
                borderRadius: "0",
                background: isComplete ? "black" : "transparent",
                color: isComplete ? "white" : "black",
                opacity: isComplete ? 1 : 0.3,
              }}
            >
              {isComplete ? "SAVE CONFIGURATION" : "COMPLETE STEPS"}
            </button>
          </div>

          {/* Preview (Minimalist) */}
          {isComplete && (
            <div
              style={{
                border: "1px solid black",
                padding: "20px",
                background: "#000",
                color: "#fff",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "9px",
                  fontWeight: "900",
                  color: "#666",
                }}
              >
                JSON PREVIEW
              </h3>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  opacity: 0.8,
                  lineHeight: "1.4",
                }}
              >
                GRID: {calibration.gridStartX} → {calibration.gridEndX}
                <br />
                ROWS: {calibration.offDutyY}, {calibration.sleeperY},{" "}
                {calibration.drivingY}, {calibration.onDutyY}
                <br />
                REMARK: {calibration.remarksY}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalibrationTool;
