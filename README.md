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
|-- backend/                     # Django REST Framework backend
|   |-- apps/                    # Modular application structure
|   |   |-- geocoding/           # Location to coordinates conversion
|   |   |-- routing/             # Route calculation and geometry
|   |   |-- compliance/          # FMCSA simulation and driving logic
|   |   |-- trips/               # Trip planning orchestration
|   |-- core/                    # Django settings and configuration
|   |-- services/                # Main service layer that orchestrates all apps
|-- frontend/                    # Vite + React frontend
    |-- src/
    |   |-- App.jsx              # Main application shell and map integration
    |   |-- components/          # Modular UI components
    |   |   |-- CalibrationTool   # System parameter adjustment
    |   |   |-- LogCanvas        # Interactive ELD log visualizer
    |   |   |-- AddressInput     # Location entry and validation
    |-- index.html               # Main entry point with Atlas branding
```

### Technical Deep Dive: Backend Architecture

The backend is built as a specialized route-and-compliance engine that simulates driving events based on real-world geography and legal requirements.

#### 🌍 External Service Integration
- **Nominatim (OpenStreetMap)**: Used for high-precision geocoding, converting address strings into coordinate pairs (Longitude, Latitude).
- **OSRM (Open Source Routing Machine)**: Fetches optimal driving routes and exact distance geometry between waypoints.

#### Architecture
The backend follows a modular Django app structure:
- **apps/geocoding/**: Handles address-to-coordinate conversion using Nominatim API
- **apps/routing/**: Manages route calculation via OSRM service
- **apps/compliance/**: Contains FMCSA simulation engine and driving logic
- **apps/trips/**: Orchestrates the complete trip planning workflow
- **services/**: Main service layer that orchestrates all apps

#### API Endpoints
- `/trips/generate/` - Main endpoint for trip planning with compliance
- Uses REST framework with proper CORS configuration for production

#### 📊 Output Generation
The simulation results in a structured timeline of logs and an interactive map overlay, providing a complete 8-day view of the intended trip.

## Installation

### 1. Backend Setup & Run (Django)
From the project root:
```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate

pip install -r requirements.txt
python manage.py runserver
```

### 2. Frontend Setup & Run (React/Vite)
From the project root:
```bash
cd frontend
npm install
npm run dev
```

The backend server will run on `http://localhost:8000` and the frontend will be available at `http://localhost:5173` (or another port as specified by Vite).
