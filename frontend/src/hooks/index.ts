import { useState, useEffect, useRef, useCallback } from "react";
import { UI_CONSTANTS } from "../constants";

/**
 * Custom hook for horizontal resizing functionality
 */
export const useHorizontalResize = (
  initialWidth: number,
  minWidth: number,
  maxWidth: number,
): [number, () => void] => {
  const [width, setWidth] = useState(initialWidth);
  const isResizing = useRef(false);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minWidth, maxWidth]);

  return [width, startResize];
};

/**
 * Custom hook for vertical resizing functionality
 */
export const useVerticalResize = (
  ref: React.RefObject<HTMLDivElement | null>,
  initialHeight: number,
  minHeight: number,
  maxHeight: number,
): [number, () => void] => {
  const [height, setHeight] = useState(initialHeight);
  const isResizing = useRef(false);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const newHeight = Math.min(
        maxHeight,
        Math.max(minHeight, rect.bottom - e.clientY),
      );
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minHeight, maxHeight, ref]);

  return [height, startResize];
};

/**
 * Custom hook for localStorage with type safety
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
};

/**
 * Custom hook for debounced values
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
