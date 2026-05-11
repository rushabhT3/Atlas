import { useState, useRef, useEffect } from "react";
import axios from "axios";

const AddressInput = ({ label, value, onChange, clearSignal }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (clearSignal) {
      setSuggestions([]);
    }
  }, [clearSignal]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleSearch = (query) => {
    onChange(query);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length > 2) {
      // Wait 500ms after user stops typing
      debounceTimer.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=us&limit=3`,
          );
          setSuggestions(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div style={{ position: "relative", marginBottom: "25px" }}>
      <label
        style={{
          display: "block",
          fontSize: "10px",
          color: "var(--text-color)",
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid var(--border-color)",
            borderRadius: "0",
            boxSizing: "border-box",
          }}
          placeholder={`TYPE ${label.toUpperCase()}...`}
        />
        {isLoading && (
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
            }}
          >
            ⏳
          </span>
        )}
      </div>
      {suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            width: "100%",
            background: "#fff",
            border: "1px solid var(--border-color)",
            borderTop: "none",
            zIndex: 100,
            listStyle: "none",
            padding: 0,
            margin: 0,
            borderRadius: "0",
            top: "100%",
          }}
        >
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => {
                onChange(s.display_name);
                setSuggestions([]);
              }}
              style={{
                padding: "12px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                fontSize: "11px",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "black";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "white";
                e.target.style.color = "black";
              }}
            >
              {s.display_name.substring(0, 50)}...
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressInput;
