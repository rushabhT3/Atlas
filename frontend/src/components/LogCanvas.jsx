import React, { useRef, useEffect } from 'react';
import logBg from '../assets/blank-paper-log.png';

// Default calibration values (will be overwritten by saved values)
const DEFAULT_CALIBRATION = {
    GRID_START_X: 62,
    GRID_END_X: 453,
    ROW_Y: {
        OFF_DUTY: 192,
        SLEEPER: 210,
        DRIVING: 228,
        ON_DUTY: 243
    },
    REMARKS_Y: 295
};

const SingleDayCanvas = ({ dayIndex, dayLogs, calibration }) => {
    const canvasRef = useRef(null);
    
    // Use provided calibration or defaults
    const config = calibration || DEFAULT_CALIBRATION;
    const GRID_START_X = config.GRID_START_X;
    const GRID_END_X = config.GRID_END_X;
    const TOTAL_WIDTH = GRID_END_X - GRID_START_X;
    const ROW_Y = config.ROW_Y;
    const REMARKS_Y = config.REMARKS_Y;

    const timeToX = (hour) => {
        const h = Math.max(0, Math.min(24, hour));
        return Math.round(GRID_START_X + (h / 24) * TOTAL_WIDTH);
    };
    
    const getStatusY = (status) => ROW_Y[status] || ROW_Y.OFF_DUTY;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = logBg;

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Day label
            ctx.font = "bold 16px Arial";
            ctx.fillStyle = "#333";
            ctx.fillText(`Day ${dayIndex + 1}`, img.width - 120, 40);

            if (!dayLogs || dayLogs.length === 0) return;

            const dayStart = dayIndex * 24;
            const dayEnd = (dayIndex + 1) * 24;

            // Build segments for this day
            const segments = [];
            
            for (const log of dayLogs) {
                if (log.end <= dayStart || log.start >= dayEnd) continue;
                
                const segStart = Math.max(0, Math.min(24, log.start - dayStart));
                const segEnd = Math.max(0, Math.min(24, log.end - dayStart));
                
                if (segEnd <= segStart) continue;
                
                segments.push({
                    start: segStart,
                    end: segEnd,
                    status: log.status,
                    remarks: log.remarks,
                    originalStart: log.start
                });
            }

            segments.sort((a, b) => a.start - b.start);

            // Fill gaps with OFF_DUTY
            const filled = [];
            let lastEnd = 0;

            for (const seg of segments) {
                if (seg.start > lastEnd + 0.01) {
                    filled.push({
                        start: lastEnd,
                        end: seg.start,
                        status: 'OFF_DUTY',
                        remarks: null,
                        isGap: true
                    });
                }
                filled.push(seg);
                lastEnd = seg.end;
            }

            // Fill to end of day (hour 24)
            if (lastEnd < 24) {
                filled.push({
                    start: lastEnd,
                    end: 24,
                    status: 'OFF_DUTY',
                    remarks: null,
                    isGap: true
                });
            }

            if (filled.length === 0) return;

            // Draw status line
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000080';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();

            let currentY = getStatusY(filled[0].status);
            ctx.moveTo(timeToX(0), currentY);

            for (const seg of filled) {
                const y = getStatusY(seg.status);
                const sx = timeToX(seg.start);
                const ex = timeToX(seg.end);

                if (currentY !== y) {
                    ctx.lineTo(sx, y);
                }
                ctx.lineTo(ex, y);
                currentY = y;
            }
            
            ctx.stroke();

            // Draw remarks with pointer lines
            const drawnRemarks = [];
            
            for (const seg of filled) {
                if (!seg.remarks || seg.isGap) continue;
                if (seg.originalStart < dayStart || seg.originalStart >= dayEnd) continue;
                
                const hour = Math.max(0, Math.min(24, seg.start));
                const x = timeToX(hour);
                const y = getStatusY(seg.status);
                
                // Offset for overlapping remarks
                let yOffset = 0;
                for (const prev of drawnRemarks) {
                    if (Math.abs(x - prev.x) < 60) {
                        yOffset = Math.max(yOffset, prev.yOffset + 18);
                    }
                }
                
                const remarkY = REMARKS_Y + yOffset;
                
                // Draw pointer line
                ctx.save();
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(x, y + 8);
                ctx.lineTo(x, remarkY - 10);
                ctx.stroke();
                ctx.restore();
                
                // Draw marker dot
                ctx.save();
                ctx.fillStyle = '#000080';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                // Draw remark text
                ctx.save();
                ctx.translate(x, remarkY);
                ctx.rotate(-0.4);
                ctx.font = "10px Arial";
                ctx.fillStyle = "#444";
                
                let text = seg.remarks;
                if (text.length > 22) text = text.substring(0, 20) + '...';
                ctx.fillText(text, 2, 0);
                ctx.restore();
                
                drawnRemarks.push({ x, yOffset });
            }
        };
    }, [dayLogs, dayIndex, calibration]);

    return (
        <div style={{ marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
    );
};

const LogCanvas = ({ logs, calibration, onOpenCalibration }) => {
    if (!logs || logs.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
                <div>Generate a trip to see daily logs here.</div>
                {onOpenCalibration && (
                    <button
                        onClick={onOpenCalibration}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        📐 Calibrate Log Sheet
                    </button>
                )}
            </div>
        );
    }
    
    const maxTime = Math.max(...logs.map(l => l.end));
    const totalDays = Math.max(1, Math.ceil(maxTime / 24));

    return (
        <div>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '15px' 
            }}>
                <h2 style={{ margin: 0, color: '#333' }}>📋 Daily Logs</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                        background: '#e0e7ff', 
                        color: '#3730a3', 
                        padding: '4px 12px', 
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500'
                    }}>
                        {totalDays} Day{totalDays > 1 ? 's' : ''}
                    </span>
                    {onOpenCalibration && (
                        <button
                            onClick={onOpenCalibration}
                            style={{
                                padding: '4px 12px',
                                background: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            📐 Calibrate
                        </button>
                    )}
                </div>
            </div>
            
            {Array.from({ length: totalDays }).map((_, i) => (
                <SingleDayCanvas 
                    key={i} 
                    dayIndex={i} 
                    dayLogs={logs}
                    calibration={calibration}
                />
            ))}
        </div>
    );
};

export default LogCanvas;