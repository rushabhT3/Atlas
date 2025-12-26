import React, { useRef, useState, useEffect } from 'react';
import logBg from '../assets/blank-paper-log.png';

const POINT_LABELS = [
    { key: 'gridStartX', label: 'Hour 0 (Midnight - Left Edge)', instruction: 'Click the LEFT edge of the time grid (where hour 0/midnight starts)' },
    { key: 'gridEndX', label: 'Hour 24 (Midnight - Right Edge)', instruction: 'Click the RIGHT edge of the time grid (where hour 24/midnight ends)' },
    { key: 'offDutyY', label: 'OFF DUTY Row', instruction: 'Click the CENTER of the OFF DUTY row' },
    { key: 'sleeperY', label: 'SLEEPER BERTH Row', instruction: 'Click the CENTER of the SLEEPER BERTH row' },
    { key: 'drivingY', label: 'DRIVING Row', instruction: 'Click the CENTER of the DRIVING row' },
    { key: 'onDutyY', label: 'ON DUTY Row', instruction: 'Click the CENTER of the ON DUTY row' },
    { key: 'remarksY', label: 'REMARKS Area', instruction: 'Click where REMARKS text should start (below the grid)' },
];

const CalibrationTool = ({ onCalibrationComplete, onClose, initialValues }) => {
    const canvasRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [currentStep, setCurrentStep] = useState(0);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [calibration, setCalibration] = useState(initialValues || {
        gridStartX: null,
        gridEndX: null,
        offDutyY: null,
        sleeperY: null,
        drivingY: null,
        onDutyY: null,
        remarksY: null,
    });

    const redrawCanvas = (ctx, img, cal, step) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Draw existing points
        const pointsOrder = ['gridStartX', 'gridEndX', 'offDutyY', 'sleeperY', 'drivingY', 'onDutyY', 'remarksY'];
        
        pointsOrder.forEach((key, idx) => {
            if (cal[key] !== null) {
                const isXPoint = key.includes('X');
                const x = isXPoint ? cal[key] : 100;
                const y = isXPoint ? 250 : cal[key];
                
                // Draw marker
                ctx.fillStyle = idx < step ? '#22c55e' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw label
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(idx + 1, x, y + 4);
                
                // Draw line for X points
                if (isXPoint) {
                    ctx.strokeStyle = idx < step ? '#22c55e' : '#3b82f6';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(cal[key], 150);
                    ctx.lineTo(cal[key], 350);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                
                // Draw line for Y points
                if (!isXPoint && cal.gridStartX && cal.gridEndX) {
                    ctx.strokeStyle = idx < step ? '#22c55e' : '#3b82f6';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
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
        const ctx = canvas.getContext('2d');
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
        const ctx = canvas.getContext('2d');
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
            y: Math.round((e.clientY - rect.top) * scaleY)
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
        const value = pointKey.includes('X') ? x : y;
        
        setCalibration(prev => ({
            ...prev,
            [pointKey]: value
        }));
        
        setCurrentStep(prev => prev + 1);
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
            IMAGE_SIZE: imageSize
        };
        
        // Save to localStorage
        localStorage.setItem('eldCalibration', JSON.stringify(config));
        
        if (onCalibrationComplete) {
            onCalibrationComplete(config);
        }
    };

    const isComplete = currentStep >= POINT_LABELS.length;
    const currentInstruction = POINT_LABELS[currentStep] || { instruction: 'Calibration Complete!' };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
            }}>
                <h2 style={{ color: 'white', margin: 0 }}>📐 Log Sheet Calibration Tool</h2>
                <button 
                    onClick={onClose}
                    style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ✕ Close
                </button>
            </div>

            {/* Progress */}
            <div style={{
                display: 'flex',
                gap: '5px',
                marginBottom: '15px'
            }}>
                {POINT_LABELS.map((point, idx) => (
                    <div 
                        key={idx}
                        style={{
                            flex: 1,
                            height: '8px',
                            borderRadius: '4px',
                            background: idx < currentStep ? '#22c55e' : idx === currentStep ? '#3b82f6' : '#374151'
                        }}
                    />
                ))}
            </div>

            {/* Instruction */}
            <div style={{
                background: isComplete ? '#22c55e' : '#3b82f6',
                color: 'white',
                padding: '15px 20px',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>
                    Step {Math.min(currentStep + 1, POINT_LABELS.length)} of {POINT_LABELS.length}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {currentInstruction.instruction}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
                {/* Canvas */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        background: '#1f2937',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        fontFamily: 'monospace',
                        color: '#22c55e',
                        fontSize: '14px'
                    }}>
                        Cursor: X = {mousePos.x}, Y = {mousePos.y}
                    </div>
                    
                    <div style={{ 
                        border: '3px solid #3b82f6', 
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        display: 'inline-block'
                    }}>
                        <canvas 
                            ref={canvasRef} 
                            onMouseMove={handleMouseMove}
                            onClick={handleClick}
                            style={{ 
                                cursor: isComplete ? 'default' : 'crosshair',
                                maxWidth: '100%',
                                height: 'auto',
                                display: 'block'
                            }}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ width: '320px', flexShrink: 0 }}>
                    {/* Points List */}
                    <div style={{
                        background: '#1f2937',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '15px'
                    }}>
                        <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '14px' }}>
                            📍 Calibration Points
                        </h3>
                        
                        {POINT_LABELS.map((point, idx) => {
                            const value = calibration[point.key];
                            const isActive = idx === currentStep;
                            const isDone = idx < currentStep;
                            
                            return (
                                <div 
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px',
                                        marginBottom: '8px',
                                        background: isActive ? '#3b82f6' : isDone ? '#065f46' : '#374151',
                                        borderRadius: '6px',
                                        opacity: idx > currentStep ? 0.5 : 1
                                    }}
                                >
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: isDone ? '#22c55e' : isActive ? 'white' : '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '10px',
                                        flexShrink: 0
                                    }}>
                                        {isDone ? (
                                            <span style={{ color: 'white', fontWeight: 'bold' }}>✓</span>
                                        ) : (
                                            <span style={{ 
                                                color: isActive ? '#3b82f6' : 'white', 
                                                fontWeight: 'bold',
                                                fontSize: '12px'
                                            }}>
                                                {idx + 1}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>
                                            {point.label}
                                        </div>
                                        {value !== null && (
                                            <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
                                                {point.key.includes('X') ? `X = ${value}` : `Y = ${value}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button
                            onClick={handleReset}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🔄 Reset
                        </button>
                        
                        <button
                            onClick={handleSave}
                            disabled={!isComplete}
                            style={{
                                flex: 2,
                                padding: '12px',
                                background: isComplete ? '#22c55e' : '#374151',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isComplete ? 'pointer' : 'not-allowed',
                                fontWeight: 'bold'
                            }}
                        >
                            {isComplete ? '✓ Save & Apply' : 'Complete all steps...'}
                        </button>
                    </div>

                    {/* Generated Values Preview */}
                    {isComplete && (
                        <div style={{
                            background: '#1f2937',
                            borderRadius: '8px',
                            padding: '15px'
                        }}>
                            <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '14px' }}>
                                💾 Generated Configuration
                            </h3>
                            <pre style={{
                                background: '#111827',
                                color: '#9cdcfe',
                                padding: '12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                overflow: 'auto',
                                margin: 0
                            }}>
{`GRID_START_X: ${calibration.gridStartX}
GRID_END_X: ${calibration.gridEndX}
TOTAL_WIDTH: ${calibration.gridEndX - calibration.gridStartX}

ROW_Y:
  OFF_DUTY: ${calibration.offDutyY}
  SLEEPER: ${calibration.sleeperY}
  DRIVING: ${calibration.drivingY}
  ON_DUTY: ${calibration.onDutyY}

REMARKS_Y: ${calibration.remarksY}

Image: ${imageSize.width} x ${imageSize.height}`}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalibrationTool;