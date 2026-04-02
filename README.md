# Atlas ELD Planner

Atlas is a full-stack route planning and compliance application designed for transportation operations. It combines intelligent trip scheduling with automated Electronic Logging Device (ELD) documentation.

### Core Functionality
- **Intelligent Routing**: Plan trips between current location, pickups, and dropoffs.
- **Compliance Planning**: Automatically generates logs based on driver cycles and HOS (Hours of Service) regulations.
- **Interactive Visualization**: Real-time map rendering of planned routes and stops.
- **System Calibration**: Customizable parameters for precise log generation and calculation.

### Folder Structure & Main Components
```
Atlas/
├── backend/                  # Django REST Framework backend
│   ├── api/                  # Main business logic
│   │   ├── utils.py          # Trip and log calculation algorithms (FMCSA simulation)
│   │   └── views.py          # API endpoints for trip generation
│   └── core/                 # Django settings and configuration
└── frontend/                 # Vite + React frontend
    ├── src/
    │   ├── App.jsx           # Main application shell and map integration
    │   ├── components/       # Modular UI components
    │   │   ├── CalibrationTool  # System parameter adjustment
    │   │   ├── LogCanvas        # Interactive ELD log visualizer
    │   │   └── AddressInput     # Location entry and validation
    └── index.html            # Main entry point with Atlas branding
```

### Technical Deep Dive: Backend Architecture

The backend is built as a specialized route-and-compliance engine that simulates driving events based on real-world geography and legal requirements.

#### 🌍 External Service Integration
- **Nominatim (OpenStreetMap)**: Used for high-precision geocoding, converting address strings into coordinate pairs (Longitude, Latitude).
- **OSRM (Open Source Routing Machine)**: Fetches optimal driving routes and exact distance geometry between waypoints.

#### ⚙️ Scheduling & Simulation Flow
The core logic in `backend/api/utils.py` follows a recursive simulation pattern:
1. **Route Pre-processing**: Fetches the entire path geometry as a series of coordinates.
2. **FMCSA Simulation**: A step-by-step drive simulation that monitors four distinct "clocks" (11-hour driving, 14-hour duty, 30-min break, and 70-hour cycle) in accordance with **U.S. FMCSA (Federal Motor Carrier Safety Administration)** traffic laws.
3. **Smart Stop Insertion**: Automatically determines where the driver *must* stop for fuel, rest, or sleep based on the calculated clocks.
4. **Local Interpolation**: Instead of making expensive API calls for every stop, the system uses **linear interpolation** to calculate the exact coordinates of each regulatory stop along the predefined route geometry.

#### 📊 Output Generation
The simulation results in a structured timeline of logs and an interactive map overlay, providing a complete 8-day view of the intended trip.
