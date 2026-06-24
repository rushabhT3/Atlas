# Atlas Frontend - Professional React/Vite Structure

## Overview

This frontend follows React best practices with a component-based architecture, modern hooks, TypeScript support for shared logic, and enterprise-grade patterns.

## Architecture

### **Directory Structure**

```
frontend/src/
|-- components/                  # UI components
|   |-- AddressInput.jsx         # Location entry with autocomplete + validation
|   |-- CalibrationTool.jsx      # System parameter adjustment
|   |-- LogCanvas.jsx            # Interactive ELD log visualizer
|   |-- ErrorBoundary.jsx        # Catches and renders component errors
|
|-- hooks/                       # Custom React hooks
|   |-- index.ts                 # useHorizontalResize, useVerticalResize,
|                                #   useLocalStorage, useDebounce
|
|-- services/                    # API services
|   |-- api.ts                   # Axios-based API client (generateTrip, healthCheck)
|
|-- utils/                       # Utility functions
|   |-- index.ts                 # Coordinate parsing, time formatting, etc.
|
|-- constants/                   # Application constants
|   |-- index.js                 # Route colors, stop styles, UI constants, endpoints
|
|-- types/                       # TypeScript type definitions
|   |-- index.ts                 # Shared interfaces (TripData, LogEntry, etc.)
|
|-- assets/                      # Static assets (images, svg)
|
|-- App.jsx                      # Main application shell, map + form integration
|-- main.jsx                     # Application entry point
```

## **Design Principles**

### **1. Component-Based Architecture**

- Reusable, self-contained components
- Co-located UI concerns
- Clear component boundaries

### **2. Modern React Patterns**

- Functional components with hooks
- Custom hooks for business logic
- No class components (unless absolutely necessary, e.g. error boundaries)

### **3. TypeScript Support**

- Type-safe shared logic (hooks, services, utils, types)
- Interface definitions for all data structures
- Type-safe API responses

### **4. Separation of Concerns**

- **Components**: UI only
- **Hooks**: Business logic and state management
- **Services**: API communication
- **Utils**: Pure functions
- **Constants**: Configuration values

## **Key Features**

### **API Service**

```typescript
// Usage
import { tripApi } from "./services/api";

// Warm-up / health check on load
await tripApi.healthCheck();

// Generate a trip plan
const { data, error } = await tripApi.generateTrip({
  current: "",
  pickup: "",
  dropoff: "",
  cycle: 0,
});
```

### **Custom Hooks**

```typescript
// Resizable panels
const [width, startResize] = useHorizontalResize(350, 280, 500);
const [height, startMapResize] = useVerticalResize(ref, 450, 200, 700);

// Local storage
const [calibration, setCalibration] = useLocalStorage("eldCalibration", null);

// Debounced values
const debouncedSearch = useDebounce(searchTerm, 300);
```

### **Type Safety**

```typescript
// All data structures are typed
interface TripData {
  logs: LogEntry[];
  stops: StopInfo[];
  route_geometry: RouteGeometry;
  summary: TripSummary;
}
```

## **React Best Practices Followed**

### **1. Component Patterns**

- **Functional Components**: Preferred over class components
- **Props Destructuring**: Clear prop interfaces
- **Default Props**: Using TypeScript defaults
- **Children Prop**: Proper composition patterns

### **2. State Management**

- **useState**: Local component state
- **useReducer**: Complex state logic
- **useContext**: Global state when needed
- **Custom Hooks**: Reusable state logic

### **3. Performance Optimization**

- **useCallback**: Memoized functions
- **useMemo**: Memoized values
- **React.memo**: Component memoization
- **Debouncing**: Input optimization

### **4. Error Handling**

- **Error Boundaries**: Catch component errors
- **Try-Catch**: API error handling
- **Fallback UI**: Graceful degradation

### **5. Code Organization**

- **Barrel Exports**: Clean imports
- **Index Files**: Module organization
- **Consistent Paths**: Predictable imports
- **Naming Conventions**: Clear, descriptive names

## **Modern JavaScript/TypeScript**

### **ES6+ Features**

- Destructuring assignment
- Arrow functions
- Template literals
- Async/await
- Optional chaining

### **TypeScript Features**

- Interface definitions
- Generic types
- Union types
- Type guards
- Strict mode enabled

## **Development Workflow**

### **Adding New Components**

1. Create the component: `src/components/ComponentName.jsx`
2. Add shared logic to `hooks/` or `utils/` if reusable
3. Add types: `types/index.ts` (if needed)
4. Wire it into `App.jsx` (or its parent component)

### **Component Guidelines**

1. Single responsibility principle
2. Clear prop interface
3. Default exports preferred
4. Unit tests (if applicable)

### **Hook Guidelines**

1. Prefix with `use`
2. Return array or object
3. TypeScript interfaces
4. JSDoc comments
5. Error handling

## **Tooling & Configuration**

### **Vite Configuration**

- Fast HMR (Hot Module Replacement)
- TypeScript support
- Environment variables (`VITE_BACKEND_URL`)

### **Linting & Formatting**

- ESLint configured
- Prettier integrated

### **Build Optimization**

- Code splitting
- Tree shaking
- Asset optimization

## **Benefits of This Structure**

### **Maintainability**

- Clear separation of concerns
- Easy to locate code
- Consistent patterns
- Type safety for shared logic

### **Scalability**

- Reusable components
- Shared utilities and hooks
- Modular organization

### **Developer Experience**

- Fast development with Vite
- IntelliSense with TypeScript
- Clear file organization
- Consistent patterns

### **Team Collaboration**

- Clear interfaces
- Reduced conflicts
- Easy onboarding
