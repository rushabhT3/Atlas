# Atlas Frontend - Professional React/Vite Structure

## Overview

This frontend follows React best practices with a feature-based architecture, modern hooks, TypeScript support, and enterprise-grade patterns.

## Architecture

### **Directory Structure**

```
frontend/src/
|-- features/                    # Feature-based modules
|   |-- trip-planning/          # Trip planning feature
|   |   |-- components/         # Feature-specific components
|   |   |   |-- TripForm.tsx
|   |   |   |-- TripSummaryPanel.tsx
|   |   |   |-- StopsList.tsx
|   |   |-- hooks/               # Feature-specific hooks
|   |   |   |-- useTripPlanning.ts
|   |   |-- index.tsx            # Feature entry point
|   |   |-- exports.ts           # Feature exports
|   |-- calibration/            # Calibration feature
|   |-- map/                    # Map feature
|   |-- index.ts                # Features barrel export
|
|-- shared/                      # Shared components
|   |-- components/              # Reusable UI components
|   |-- hooks/                   # Shared custom hooks
|   |-- utils/                   # Utility functions
|
|-- hooks/                       # Global custom hooks
|   |-- useHorizontalResize.ts
|   |-- useVerticalResize.ts
|   |-- useLocalStorage.ts
|   |-- useDebounce.ts
|
|-- services/                    # API services
|   |-- api.ts                   # API client
|
|-- utils/                       # Utility functions
|   |-- index.ts                 # Coordinate parsing, formatting, etc.
|
|-- constants/                   # Application constants
|   |-- index.js                 # Route colors, stop styles, etc.
|
|-- types/                       # TypeScript type definitions
|   |-- index.ts                 # All type definitions
|
|-- assets/                      # Static assets
|   |-- react.svg
|
|-- App.jsx                      # Legacy app (will be refactored)
|-- main.jsx                     # Application entry point
```

## **Design Principles**

### **1. Feature-Based Architecture**
- Each feature is self-contained
- Co-located components, hooks, and types
- Clear feature boundaries

### **2. Modern React Patterns**
- Functional components with hooks
- Custom hooks for business logic
- No class components (unless absolutely necessary)

### **3. TypeScript Support**
- Full type safety
- Interface definitions for all data structures
- Type-safe API responses

### **4. Separation of Concerns**
- **Components**: UI only
- **Hooks**: Business logic and state management
- **Services**: API communication
- **Utils**: Pure functions
- **Constants**: Configuration values

## **Key Features**

### **Trip Planning Feature**
```typescript
// Usage
import { TripPlanningFeature } from '@/features/trip-planning';

<TripPlanningFeature
  initialFormData={{ current: '', pickup: '', dropoff: '', cycle: 0 }}
  onFormDataChange={(data) => console.log(data)}
/>
```

### **Custom Hooks**
```typescript
// Resizable panels
const [width, startResize] = useHorizontalResize(350, 280, 500);
const [height, startMapResize] = useVerticalResize(ref, 450, 200, 700);

// Local storage
const [calibration, setCalibration] = useLocalStorage('eldCalibration', null);

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
- **Index Files**: Feature organization
- **Absolute Imports**: Consistent paths
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

### **Adding New Features**
1. Create feature directory: `src/features/feature-name/`
2. Add components: `components/ComponentName.tsx`
3. Add hooks: `hooks/useFeatureName.ts`
4. Add types: `types/index.ts` (if needed)
5. Update exports: `exports.ts`
6. Update barrel: `features/index.ts`

### **Component Guidelines**
1. Single responsibility principle
2. Props interface required
3. Default exports preferred
4. Storybook stories (if applicable)
5. Unit tests (if applicable)

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
- Path aliases configured
- Environment variables

### **Linting & Formatting**
- ESLint configured
- Prettier integrated
- Pre-commit hooks
- CI/CD integration

### **Build Optimization**
- Code splitting
- Tree shaking
- Asset optimization
- Bundle analysis

## **Benefits of This Structure**

### **Maintainability**
- Clear feature boundaries
- Easy to locate code
- Consistent patterns
- Type safety

### **Scalability**
- Feature-based scaling
- Reusable components
- Shared utilities
- Modular architecture

### **Developer Experience**
- Fast development with Vite
- IntelliSense with TypeScript
- Clear file organization
- Consistent patterns

### **Team Collaboration**
- Feature ownership
- Clear interfaces
- Reduced conflicts
- Easy onboarding

## **Migration Path**

### **From Legacy Structure**
1. Identify features in `App.jsx`
2. Extract to feature modules
3. Create shared components
4. Add TypeScript types
5. Update imports
6. Remove legacy code

### **Gradual Migration**
- Features can be migrated independently
- Legacy code remains functional
- A/B testing possible
- Zero-downtime deployment

## **This structure represents world-class React development practices and is ready for enterprise-scale applications!**
