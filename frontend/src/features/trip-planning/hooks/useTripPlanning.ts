import { useState } from 'react';
import { TripFormData, TripData } from '../../../types';

// Mock API service for now - will be replaced with actual API
const mockGenerateTrip = async (formData: TripFormData): Promise<{ data?: TripData, error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock response
  return {
    data: {
      logs: [
        { status: 'ON_DUTY' as const, start: 6.0, end: 6.25, location: '-74.0060,40.7128', remarks: 'Pre-trip Inspection' },
        { status: 'DRIVING' as const, start: 6.25, end: 10.132, location: 'En Route (to Pickup)', remarks: 'Driving' }
      ],
      stops: [
        { coords: '-74.0060,40.7128', type: 'START' as const, remark: 'Trip Start', time: 6.0, duration: 0 },
        { coords: '-71.0589,42.3601', type: 'PICKUP' as const, remark: 'Pickup Location', time: 10.132, duration: 1.0 }
      ],
      route_geometry: {
        leg1: { type: 'LineString', coordinates: [[-74.006, 40.713], [-71.059, 42.360]] },
        leg2: { type: 'LineString', coordinates: [[-71.059, 42.360], [-87.629, 41.878]] }
      },
      summary: {
        total_miles: 200,
        leg1_miles: 190,
        leg2_miles: 10,
        total_drive_time: 3.882,
        total_rest_time: 1.0,
        total_on_duty_time: 1.25,
        total_trip_time: 5.132,
        num_stops: 2,
        num_days: 1
      }
    }
  };
};

/**
 * Custom hook for trip planning logic
 */
export const useTripPlanning = () => {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTrip = async (formData: TripFormData) => {
    setLoading(true);
    setError(null);
    setTripData(null);

    try {
      const response = await mockGenerateTrip(formData);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setTripData(response.data);
      }
    } catch (err) {
      setError('Error connecting to server or processing trip.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetTrip = () => {
    setTripData(null);
    setError(null);
    setLoading(false);
  };

  return {
    tripData,
    loading,
    error,
    generateTrip,
    resetTrip
  };
};
