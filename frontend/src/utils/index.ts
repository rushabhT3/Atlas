// Utility functions for the Atlas ELD Planner

import { Coordinate } from '../types';

/**
 * Parse coordinate string to [lat, lng] array
 */
export const parseCoords = (coordString: string): Coordinate | null => {
  if (!coordString || typeof coordString !== 'string') return null;
  
  try {
    const parts = coordString.split(',');
    if (parts.length !== 2) return null;
    
    const lon = parseFloat(parts[0].trim());
    const lat = parseFloat(parts[1].trim());
    
    if (isNaN(lat) || isNaN(lon)) return null;
    
    return [lat, lon];
  } catch (e) {
    return null;
  }
};

/**
 * Format hours to readable time string
 */
export const formatTime = (hours: number): string => {
  const day = Math.floor(hours / 24) + 1;
  const h = Math.floor(hours % 24);
  const m = Math.floor((hours % 1) * 60);
  
  return `Day ${day}, ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Format duration in hours to hours and minutes
 */
export const formatDuration = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.floor((hours % 1) * 60);
  
  if (h > 0 && m > 0) {
    return `${h}h ${m}m`;
  } else if (h > 0) {
    return `${h}h`;
  } else {
    return `${m}m`;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
  const R = 3959; // Earth's radius in miles
  
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Local storage utilities
 */
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (e) {
      console.error(`Error reading from localStorage: ${key}`, e);
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing to localStorage: ${key}`, e);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing from localStorage: ${key}`, e);
    }
  }
};
