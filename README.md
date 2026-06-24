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
- **LocationIQ**: Primary provider for both geocoding (address strings → Longitude/Latitude pairs) and routing (driving routes + distance geometry). Requires a free API key and works from cloud hosts. Its responses are OSM-compatible.
- **Nominatim / OSRM (fallback)**: The public OpenStreetMap demo servers, used automatically when no LocationIQ key is configured. Fine for local development, but they block cloud/datacenter IPs, so a key is required in production.

#### Architecture
The backend follows a modular Django app structure:
- **apps/geocoding/**: Handles address-to-coordinate conversion (LocationIQ, with Nominatim fallback)
- **apps/routing/**: Manages route calculation (LocationIQ, with OSRM fallback)
- **apps/compliance/**: Contains FMCSA simulation engine and driving logic
- **apps/trips/**: Orchestrates the complete trip planning workflow
- **services/**: Main service layer that orchestrates all apps

#### API Endpoints
- `POST /trips/generate/` - Main endpoint for trip planning with compliance
- `GET /api/health/` - Lightweight health/warm-up check; the frontend hits this on page load to avoid cold-start latency
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

### 2. Configure the Geocoding & Routing API Key (LocationIQ)

Atlas uses **LocationIQ** for geocoding and routing. Without a key it falls back to the public Nominatim/OSRM demo servers, which work locally but are blocked on cloud hosts (e.g. Render) — so a key is **required in production**.

1. Create a free account at [locationiq.com](https://locationiq.com) and copy your **Access Token**.
2. Expose it as the `LOCATIONIQ_API_KEY` environment variable:

```bash
# Local development
# macOS/Linux:
export LOCATIONIQ_API_KEY="your_access_token"
# Windows (PowerShell):
$env:LOCATIONIQ_API_KEY="your_access_token"
```

**Production (Render):** open your service → **Environment** tab → add a variable named `LOCATIONIQ_API_KEY` with your token as the value → save (Render redeploys automatically).

> Free tier: 5,000 requests/day. Each trip uses ~5 requests (3 geocode + 2 routing).

### 3. Frontend Setup & Run (React/Vite)
From the project root:
```bash
cd frontend
npm install
npm run dev
```

The backend server will run on `http://localhost:8000` and the frontend will be available at `http://localhost:5173` (or another port as specified by Vite).
