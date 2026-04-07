import React from 'react';
import { TripSummary } from '../../../types';
import { formatTime, formatDuration } from '../../../utils';

interface TripSummaryProps {
  summary: TripSummary;
}

/**
 * Trip summary display component
 */
export const TripSummaryPanel: React.FC<TripSummaryProps> = ({ summary }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'white',
      padding: '20px',
      border: '1px solid black',
      zIndex: 1000,
      fontSize: '11px',
      minWidth: '200px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      <div style={{ fontWeight: '900', marginBottom: '15px', borderBottom: '1px solid black', paddingBottom: '8px' }}>
        Trip Summary
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: '900', fontSize: '24px', letterSpacing: '-0.05em' }}>
          {summary.total_miles.toLocaleString()} <span style={{ fontSize: '12px' }}>MI</span>
        </div>
        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>
          Leg 1: {summary.leg1_miles.toLocaleString()} mi | Leg 2: {summary.leg2_miles.toLocaleString()} mi
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ opacity: 0.5, fontSize: '9px' }}>Drive Time</div>
          <div style={{ fontWeight: '700' }}>{formatDuration(summary.total_drive_time)}</div>
        </div>
        <div>
          <div style={{ opacity: 0.5, fontSize: '9px' }}>Rest Time</div>
          <div style={{ fontWeight: '700' }}>{formatDuration(summary.total_rest_time)}</div>
        </div>
        <div>
          <div style={{ opacity: 0.5, fontSize: '9px' }}>Duration</div>
          <div style={{ fontWeight: '700' }}>{formatDuration(summary.total_trip_time)}</div>
        </div>
        <div>
          <div style={{ opacity: 0.5, fontSize: '9px' }}>Days</div>
          <div style={{ fontWeight: '700' }}>{summary.num_days}</div>
        </div>
      </div>
    </div>
  );
};
