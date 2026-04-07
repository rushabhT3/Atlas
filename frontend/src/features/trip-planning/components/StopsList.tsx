import React from 'react';
import { StopInfo } from '../../../types';
import { formatTime, formatDuration } from '../../../utils';
import { STOP_STYLES } from '../../../constants';

interface StopsListProps {
  stops: StopInfo[];
}

/**
 * Stops list display component
 */
export const StopsList: React.FC<StopsListProps> = ({ stops }) => {
  if (!stops || stops.length === 0) return null;

  return (
    <div style={{ marginTop: '40px' }}>
      <h3 style={{
        marginBottom: '20px',
        fontSize: '10px',
        fontWeight: '900',
        letterSpacing: '0.1em',
        borderBottom: '1px solid black',
        paddingBottom: '10px'
      }}>
        PLANNED STOPS ({stops.length})
      </h3>
      
      <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
        {stops.map((stop, idx) => {
          const style = STOP_STYLES[stop.type.toLowerCase() as keyof typeof STOP_STYLES] || STOP_STYLES.break;
          return (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '15px 0',
              marginBottom: '0',
              background: 'transparent',
              borderBottom: '1px solid #eee',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: style.fillColor,
                  border: '1px solid black',
                  flexShrink: 0
                }} />
                <div style={{
                  fontWeight: '900',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}>
                  {style.label}
                </div>
              </div>
              
              <div style={{ paddingLeft: '20px' }}>
                <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                  {stop.remark}
                </div>
                <div style={{
                  fontSize: '9px',
                  fontWeight: '700',
                  marginTop: '6px',
                  textTransform: 'uppercase',
                  opacity: 0.6
                }}>
                  {formatTime(stop.time)}
                  {stop.duration > 0 && ` ${formatDuration(stop.duration)}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
