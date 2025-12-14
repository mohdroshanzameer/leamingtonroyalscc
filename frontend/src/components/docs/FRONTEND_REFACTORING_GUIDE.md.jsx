# Frontend Refactoring Guide

## Overview

The frontend has been refactored into a modern feature-based architecture with clean separation of concerns.

## New Structure

```
components/
├── api/                      # API Layer
│   ├── httpClient.js        # Base HTTP client with auth
│   ├── authApi.js           # Authentication endpoints
│   ├── entitiesApi.js       # Entity CRUD operations
│   ├── integrationsApi.js   # External integrations
│   └── index.js             # Central exports
│
├── app/                      # Application Core
│   ├── providers/
│   │   └── AuthProvider.jsx # Auth state management
│   ├── RequireAuth.jsx      # Protected route wrapper
│   └── router.jsx           # Route configuration
│
├── lib/                      # Utilities & Configuration
│   └── config.js            # App configuration
│
└── (existing components, pages, etc.)
```

## API Layer

### Old Way (apiClient.js)
```javascript
import { api } from '@/components/api/apiClient';

// Usage
await api.auth.me();
await api.entities.Team.list();
```

### New Way (Clean APIs)
```javascript
import { authApi, entities } from '@/components/api';

// Usage
await authApi.getMe();
await entities.Team.list();
```

### Benefits
✅ Better TypeScript support (future)
✅ Cleaner imports
✅ Easier testing
✅ Consistent error handling
✅ Automatic auth token attachment

## Authentication

### AuthProvider
Manages global auth state:
- `user` - Current user object
- `isAuthenticated` - Boolean flag
- `isLoading` - Loading state
- `login(credentials)` - Login function
- `register(userData)` - Registration function
- `logout()` - Logout function
- `updateUser(data)` - Update profile
- `refreshUser()` - Reload user data

### Usage in Components
```javascript
import { useAuth } from '@/components/app/providers/AuthProvider';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginButton onClick={login} />;
  }

  return <div>Welcome {user.full_name}</div>;
}
```

## Protected Routes

### RequireAuth Component
Wraps routes that need authentication:

```javascript
import { RequireAuth } from '@/components/app/RequireAuth';

<Route path="/admin" element={
  <RequireAuth>
    <AdminPage />
  </RequireAuth>
} />
```

With role-based access:
```javascript
<Route path="/finance" element={
  <RequireAuth requiredRole="treasurer">
    <FinancePage />
  </RequireAuth>
} />
```

## Router Configuration

Centralized in `components/app/router.jsx`:

**Public Routes:**
- Home, SignIn, Register, Contact, News, Events, Gallery, Fixtures

**Protected Routes:**
- Profile, Squad, Teams, Scoring, Tournaments, Finance, Admin

All protected routes automatically redirect to SignIn if not authenticated.

## Migration Steps

### Step 1: Update Imports

**Before:**
```javascript
import { api } from '@/components/api/apiClient';
```

**After:**
```javascript
import { authApi, entities } from '@/components/api';
// or
import api from '@/components/api'; // Legacy compatible
```

### Step 2: Update API Calls

**Before:**
```javascript
const user = await api.auth.me();
const teams = await api.entities.Team.list();
const match = await api.entities.TournamentMatch.get(id);
```

**After (new way):**
```javascript
const user = await authApi.getMe();
const teams = await entities.Team.list();
const match = await entities.TournamentMatch.get(id);
```

**Or (legacy compatible):**
```javascript
const user = await api.auth.getMe(); // Still works!
const teams = await api.entities.Team.list();
```

### Step 3: Use AuthProvider

Wrap components that need auth:
```javascript
import { useAuth } from '@/components/app/providers/AuthProvider';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  // No need for manual state management
  // User is automatically loaded on app start
}
```

### Step 4: Protect Routes

```javascript
// Before
function MyPage() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);
  
  if (!user) return <Navigate to="/signin" />;
  // ...
}

// After
<Route path="/my-page" element={
  <RequireAuth>
    <MyPage />
  </RequireAuth>
} />
```

## Configuration

### Environment Variables

**Frontend .env:**
```env
VITE_API_URL=http://localhost:5000/api
```

### Config Usage
```javascript
import { config, API_BASE_URL } from '@/components/lib/config';

console.log(config.api.baseUrl); // http://localhost:5000/api
console.log(config.app.name); // LRCC
```

## Benefits of New Structure

### 1. Separation of Concerns
- API logic separated from UI components
- Auth state managed centrally
- Routes defined in one place

### 2. Easier Testing
- Mock httpClient for API tests
- Mock AuthProvider for component tests
- Isolated route testing

### 3. Better Developer Experience
- Clear API contracts
- Predictable auth flow
- Type-safe (ready for TypeScript)

### 4. Scalability
- Easy to add new features
- Plugin new API endpoints
- Extend auth logic

## Feature-Based Organization (Future)

The structure is ready for feature-based organization:

```
features/
├── auth/
│   ├── pages/
│   │   ├── SignInPage.jsx
│   │   └── RegisterPage.jsx
│   ├── components/
│   │   └── LoginForm.jsx
│   └── hooks/
│       └── useAuth.js
├── matches/
│   ├── pages/
│   │   ├── FixturesPage.jsx
│   │   └── ScoringPage.jsx
│   └── components/
│       └── MatchCard.jsx
└── finance/
    ├── pages/
    └── components/
```

Pages can be gradually moved into features/ as the app grows.

## Backward Compatibility

The new API layer maintains backward compatibility:
```javascript
// Old code still works
import { api } from '@/components/api/apiClient';
await api.auth.me();

// New imports work too
import { authApi } from '@/components/api';
await authApi.getMe();
```

Both point to the same implementation via `components/api/index.js`.

## Next Steps

1. ✅ API layer refactored
2. ✅ AuthProvider implemented
3. ✅ Protected routes configured
4. ⏳ Move pages into features/ folders (optional)
5. ⏳ Add TypeScript (optional)
6. ⏳ Add comprehensive tests (optional)

---

**Version:** 2.0 (Refactored)
**Date:** December 2024