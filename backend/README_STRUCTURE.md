# Atlas Backend - Professional Django Structure

## Overview

This backend follows Django best practices with a modular, maintainable architecture that separates concerns and follows SOLID principles.

## Architecture

### **Directory Structure**

```
backend/
|-- core/                          # Core Django project configuration
|   |-- config.py                  # FMCSA regulations configuration
|   |-- driver_state.py            # Driver state tracking
|   |-- settings.py                # Django settings
|   |-- urls.py                    # Main URL configuration
|   |-- wsgi.py                    # WSGI configuration
|
|-- apps/                          # Modular Django apps
|   |-- geocoding/                 # Address to coordinate conversion
|   |   |-- apps.py
|   |   |-- services.py            # Geocoding service classes
|   |   |-- __init__.py
|   |
|   |-- routing/                    # Route calculation services
|   |   |-- apps.py
|   |   |-- services.py            # Routing service classes
|   |   |-- __init__.py
|   |
|   |-- compliance/                # FMCSA compliance simulation
|   |   |-- apps.py
|   |   |-- simulator.py           # Driving simulation logic
|   |   |-- __init__.py
|   |
|   |-- trips/                     # Trip planning orchestration
|   |   |-- apps.py
|   |   |-- services.py            # TripPlanner main orchestrator
|   |   |-- views.py                # API views
|   |   |-- urls.py                # App URL configuration
|   |   |-- __init__.py
|
|-- services/                      # Shared services (if needed)
|-- api/                           # Legacy API app (backward compatibility)
|   |-- utils.py                   # Legacy function wrapper
|   |-- views.py                   # Legacy API views
|   |-- urls.py                    # Legacy API URLs
|
|-- manage.py                      # Django management script
```

## **App Responsibilities**

### **1. `apps.geocoding`**
- **Purpose**: Convert addresses to geographic coordinates
- **Services**: 
  - `GeocodingService` (Abstract base)
  - `NominatimGeocodingService` (OpenStreetMap)
  - `MockGeocodingService` (Testing)
- **Dependency**: External Nominatim API

### **2. `apps.routing`**
- **Purpose**: Calculate driving routes and distances
- **Services**:
  - `RoutingService` (Abstract base)
  - `OSRMRoutingService` (Open Source Routing Machine)
  - `MockRoutingService` (Testing)
- **Models**: `RouteInfo` dataclass
- **Dependency**: External OSRM API

### **3. `apps.compliance`**
- **Purpose**: FMCSA regulation compliance simulation
- **Services**:
  - `RouteInterpolator` (Coordinate interpolation)
  - `DrivingSimulator` (Regulation-compliant driving)
- **Dependency**: Core configuration, driver state

### **4. `apps.trips`**
- **Purpose**: Orchestrate complete trip planning
- **Services**: `TripPlanner` (Main orchestrator)
- **Views**: REST API endpoints
- **Dependencies**: All other apps

### **5. `core`**
- **Purpose**: Shared core functionality
- **Components**:
  - `FMCSARegulations` (Configuration)
  - `DriverState` (State tracking)
- **Dependencies**: None (base layer)

## **Design Principles**

### **SOLID Implementation**
1. **Single Responsibility**: Each app has one clear purpose
2. **Open/Closed**: Extensible through service interfaces
3. **Liskov Substitution**: Mock services substitute real ones
4. **Interface Segregation**: Small, focused service interfaces
5. **Dependency Inversion**: High-level modules depend on abstractions

### **Django Best Practices**
- **Modular Apps**: Each app is self-contained
- **Dependency Injection**: Services injected into TripPlanner
- **Configuration Management**: Centralized in core
- **Testing Support**: Mock services for all external dependencies
- **Backward Compatibility**: Legacy API still functional

## **API Endpoints**

### **Legacy API** (Backward Compatible)
```
POST /api/generate/
```

### **New Modular API**
```
POST /trips/generate/
```

Both endpoints accept the same payload:
```json
{
    "current": "Starting location",
    "pickup": "Pickup location", 
    "dropoff": "Final destination",
    "cycle": 0.0
}
```

## **Development Workflow**

### **Adding New Features**
1. Identify which app the feature belongs to
2. Add service classes to appropriate app
3. Update TripPlanner if orchestration needed
4. Add tests with mock services
5. Update API documentation

### **Testing Strategy**
- **Unit Tests**: Test each service in isolation
- **Integration Tests**: Test TripPlanner with real services
- **Mock Services**: All external dependencies have mocks
- **API Tests**: Test endpoints end-to-end

### **Deployment Considerations**
- **Environment Variables**: API URLs, timeouts, user agents
- **Service Configuration**: Easy swapping of real/mock services
- **Monitoring**: Each service can be monitored independently
- **Scaling**: Apps can be scaled independently if needed

## **Benefits of This Structure**

### **Maintainability**
- Clear separation of concerns
- Easy to locate and modify specific functionality
- Reduced code duplication

### **Testability**
- Each service can be tested in isolation
- Mock implementations for all external dependencies
- Clear interfaces make testing straightforward

### **Scalability**
- Apps can be developed independently
- Easy to add new service implementations
- Clear dependency graph

### **Professional Standards**
- Follows Django and Python best practices
- Industry-standard project structure
- Clear documentation and naming conventions

## **Migration from Legacy**

The legacy `api` app is maintained for backward compatibility. To migrate:

1. **Update Imports**: Change from `api.utils` to `apps.trips`
2. **Use New Services**: Directly use service classes instead of utils
3. **Update Tests**: Use new mock services
4. **Update URLs**: Use new app URLs when ready

This structure provides a solid foundation for a professional, maintainable Django application that can grow with the business needs.
