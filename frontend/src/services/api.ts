import axios from 'axios';
import { API_ENDPOINTS } from '../constants';
import { TripFormData, TripData, ApiResponse } from '../types';

/**
 * API service for trip planning
 */
class TripApiService {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a trip plan with FMCSA compliance
   */
  async generateTrip(formData: TripFormData): Promise<ApiResponse<TripData>> {
    try {
      const response = await axios.post(`${this.baseUrl}${API_ENDPOINTS.GENERATE_TRIP}`, formData);
      
      if (response.data.error) {
        return { error: response.data.error };
      }
      
      return { data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message || 'Failed to generate trip';
        return { error: message };
      }
      
      return { error: 'An unexpected error occurred' };
    }
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/health/`);
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const tripApi = new TripApiService();

export default tripApi;
