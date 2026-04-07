// Map constants
export const ROUTE_COLORS = {
  leg1: {
    main: "#3b82f6",
    faded: "#93c5fd",
  },
  leg2: {
    main: "#ef4444",
    faded: "#fca5a5",
  },
};

export const STOP_STYLES = {
  start: {
    color: "#10b981",
    fillColor: "#10b981",
    icon: "Start",
    label: "Trip Start",
    letter: "S",
  },
  end: {
    color: "#f59e0b",
    fillColor: "#f59e0b",
    icon: "End",
    label: "Trip End",
    letter: "E",
  },
  pickup: {
    color: "#8b5cf6",
    fillColor: "#8b5cf6",
    icon: "Pickup",
    label: "Pickup",
    letter: "P",
  },
  dropoff: {
    color: "#f97316",
    fillColor: "#f97316",
    icon: "Dropoff",
    label: "Dropoff",
    letter: "D",
  },
  fuel: {
    color: "#eab308",
    fillColor: "#eab308",
    icon: "Fuel",
    label: "Fuel Stop",
    letter: "F",
  },
  sleep: {
    color: "#6366f1",
    fillColor: "#6366f1",
    icon: "Sleep",
    label: "Sleeper (10hr)",
    letter: "Z",
  },
  break: {
    color: "#14b8a6",
    fillColor: "#14b8a6",
    icon: "Break",
    label: "Break (30min)",
    letter: "B",
  },
  restart: {
    color: "#ec4899",
    fillColor: "#ec4899",
    icon: "Restart",
    label: "34hr Restart",
    letter: "R",
  },
  inspection: {
    color: "#64748b",
    fillColor: "#64748b",
    icon: "Inspection",
    label: "Inspection",
    letter: "I",
  },
};

export const API_ENDPOINTS = {
  GENERATE_TRIP: "/trips/generate/",
};

export const DEFAULT_COORDINATES = {
  NEW_YORK: [40.7128, -74.006],
  BOSTON: [42.3601, -71.0589],
  CHICAGO: [41.8781, -87.6298],
};

export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: {
    INITIAL: 350,
    MIN: 280,
    MAX: 500,
  },
  MAP_HEIGHT: {
    INITIAL: 450,
    MIN: 200,
    MAX: 700,
  },
  LEAFLET_DEFAULTS: {
    ZOOM: 4,
    CENTER: [39.8283, -98.5795], // Center of USA
  },
};
