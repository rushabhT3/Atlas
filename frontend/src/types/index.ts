// Type definitions for the Atlas ELD Planner

export const LOG_STATUS = {
  DRIVING: "DRIVING",
  ON_DUTY: "ON_DUTY",
  OFF_DUTY: "OFF_DUTY",
  SLEEPER: "SLEEPER",
} as const;

export const STOP_TYPES = {
  START: "start",
  END: "end",
  PICKUP: "pickup",
  DROPOFF: "dropoff",
  FUEL: "fuel",
  SLEEP: "sleep",
  BREAK: "break",
  RESTART: "restart",
  INSPECTION: "inspection",
} as const;

export interface LogEntry {
  status: keyof typeof LOG_STATUS;
  start: number;
  end: number;
  location: string;
  remarks: string;
}

export interface StopInfo {
  coords: string;
  type: keyof typeof STOP_TYPES;
  remark: string;
  time: number;
  duration: number;
}

export interface RouteGeometry {
  leg1: {
    type: string;
    coordinates: [number, number][];
  };
  leg2: {
    type: string;
    coordinates: [number, number][];
  };
}

export interface TripSummary {
  total_miles: number;
  leg1_miles: number;
  leg2_miles: number;
  total_drive_time: number;
  total_rest_time: number;
  total_on_duty_time: number;
  total_trip_time: number;
  num_stops: number;
  num_days: number;
}

export interface TripData {
  logs: LogEntry[];
  stops: StopInfo[];
  route_geometry: RouteGeometry;
  summary: TripSummary;
}

export interface TripFormData {
  current: string;
  pickup: string;
  dropoff: string;
  cycle: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface CalibrationConfig {
  avgSpeed: number;
  fuelInterval: number;
  breakDuration: number;
  restDuration: number;
}

export type Coordinate = [number, number]; // [lat, lng]
