import { useState, useRef, useEffect } from "react";
import axios from "axios";

const AddressInput = ({ label, value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef(null);

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
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=us&limit=3`
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
    <div style={{ position: "relative", marginBottom: "15px" }}>
      <label style={{ display: "block", fontSize: "12px", color: "#666", fontWeight: "bold" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }}
          placeholder={`Enter ${label}`}
        />
        {isLoading && (
          <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>
            ⏳
          </span>
        )}
      </div>
      {suggestions.length > 0 && (
        <ul style={{
          position: "absolute", width: "100%", background: "#fff", border: "1px solid #ccc", 
          zIndex: 100, listStyle: "none", padding: 0, margin: 0, borderRadius: "4px", marginTop: "2px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          {suggestions.map((s) => (
            <li key={s.place_id} 
                onClick={() => { onChange(s.display_name); setSuggestions([]); }}
                style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.target.style.background = "#fff"}>
              📍 {s.display_name.substring(0, 50)}...
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressInput;