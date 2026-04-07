import React from 'react';
import { useTripPlanning } from './hooks/useTripPlanning';
import { TripForm } from './components/TripForm';
import { TripSummaryPanel } from './components/TripSummaryPanel';
import { StopsList } from './components/StopsList';

// Define types locally to avoid import issues
interface TripFormData {
  current: string;
  pickup: string;
  dropoff: string;
  cycle: number;
}

interface TripPlanningFeatureProps {
  initialFormData?: TripFormData;
  onFormDataChange?: (data: TripFormData) => void;
}

/**
 * Main trip planning feature component
 */
export const TripPlanningFeature: React.FC<TripPlanningFeatureProps> = ({
  initialFormData = { current: '', pickup: '', dropoff: '', cycle: 0 },
  onFormDataChange
}) => {
  const [formData, setFormData] = React.useState<TripFormData>(initialFormData);
  const { tripData, loading, error, generateTrip } = useTripPlanning();

  React.useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateTrip(formData);
  };

  const handleFormDataChange = (newFormData: TripFormData) => {
    setFormData(newFormData);
  };

  return (
    <div>
      <h2 style={{
        color: 'var(--text-color)',
        fontSize: '1.2rem',
        marginBottom: '40px',
        fontWeight: '900',
        letterSpacing: '-0.03em'
      }}>
        Atlas <span style={{ fontWeight: '300', marginLeft: '5px', opacity: 0.6 }}>ELD Planner</span>
      </h2>

      <TripForm
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #f87171',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong> Error:</strong> {error}
        </div>
      )}

      {tripData?.summary && (
        <TripSummaryPanel summary={tripData.summary} />
      )}

      {tripData?.stops && tripData.stops.length > 0 && (
        <StopsList stops={tripData.stops} />
      )}
    </div>
  );
};
