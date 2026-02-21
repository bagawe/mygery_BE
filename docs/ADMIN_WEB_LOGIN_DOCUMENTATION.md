# Admin Web Panel - Login Documentation

## Overview
Dokumentasi ini menjelaskan implementasi fitur login untuk Admin Web Panel. Login ini khusus untuk user dengan role **admin** saja.

---

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [API Endpoint](#api-endpoint)
3. [Request & Response](#request--response)
4. [Frontend Implementation](#frontend-implementation)
5. [Security Best Practices](#security-best-practices)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

---

## Authentication Flow

```
┌─────────────┐
│  Admin User │
└──────┬──────┘
       │ 1. Input email & password
       ▼
┌─────────────────┐
│  Login Form     │
│  (Vue.js)       │
└──────┬──────────┘
       │ 2. POST /api/auth/login
       ▼
┌─────────────────┐
│  Backend API    │
│  - Validate     │
│  - Check role   │
└──────┬──────────┘
       │ 3. Return JWT + user data
       ▼
┌─────────────────┐
│  Store Token    │
│  (localStorage) │
└──────┬──────────┘
       │ 4. Redirect to dashboard
       ▼
┌─────────────────┐
│  Admin Panel    │
└─────────────────┘
```

---

## API Endpoint

### Login Admin
**Endpoint:** `POST /api/auth/login`

**Purpose:** Autentikasi admin untuk mengakses admin web panel

**URL:** `http://localhost:3030/api/auth/login`

**Method:** POST

**Authentication:** None (public endpoint)

**Content-Type:** `application/json`

---

## Request & Response

### Request Body

```json
{
  "identifier": "admin@example.com",
  "password": "Admin123!"
}
```

**Field Description:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `identifier` | string | ✅ | Email atau username admin |
| `password` | string | ✅ | Password admin (min 8 karakter) |

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "uuid": "ddd1fc74-e88e-4b8d-9c53-f1218114be7f",
      "name": "Admin User",
      "email": "admin@example.com",
      "ktaVerified": false,
      "ktaVerifiedAt": null,
      "ktaVerifiedBy": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "61c0600fa8c8b1395534ca6128a2e7cd...",
    "expiresIn": "1d"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `user.id` | number | ID user di database |
| `user.uuid` | string | UUID unik user |
| `user.name` | string | Nama lengkap admin |
| `user.email` | string | Email admin |
| `accessToken` | string | JWT token untuk authorization (valid 24 jam) |
| `refreshToken` | string | Token untuk refresh access token |
| `expiresIn` | string | Durasi valid token |

### Error Responses

#### 1. Invalid Credentials (401 Unauthorized)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### 2. User Not Found (401 Unauthorized)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### 3. Validation Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "identifier",
      "message": "Identifier is required"
    },
    {
      "field": "password",
      "message": "Password is required"
    }
  ]
}
```

#### 4. Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Frontend Implementation

### 1. Vue.js 3 + Composition API + Pinia

#### Install Dependencies
```bash
npm install axios pinia
```

#### Auth Store (stores/auth.js)
```javascript
import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => {
      // Check if user has admin role
      return state.user?.roles?.some(role => role.name === 'admin') || false;
    },
  },

  actions: {
    async login(credentials) {
      try {
        const response = await axios.post(
          'http://localhost:3030/api/auth/login',
          credentials
        );

        const { user, accessToken, refreshToken } = response.data.data;

        // Save to state
        this.user = user;
        this.token = accessToken;
        this.refreshToken = refreshToken;

        // Save to localStorage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        return { success: true };
      } catch (error) {
        console.error('Login error:', error);
        
        // Handle error response
        if (error.response) {
          return {
            success: false,
            message: error.response.data.message || 'Login failed',
          };
        }
        
        return {
          success: false,
          message: 'Network error. Please try again.',
        };
      }
    },

    logout() {
      // Clear state
      this.user = null;
      this.token = null;
      this.refreshToken = null;

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear authorization header
      delete axios.defaults.headers.common['Authorization'];
    },

    initializeAuth() {
      // Load from localStorage on app start
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        this.token = token;
        this.user = JSON.parse(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    },
  },
});
```

#### Login Component (views/Login.vue)
```vue
<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Admin Panel</h1>
        <p>Silakan login untuk melanjutkan</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <!-- Email Input -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.identifier"
            type="email"
            placeholder="admin@example.com"
            required
            :disabled="loading"
          />
        </div>

        <!-- Password Input -->
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            :disabled="loading"
          />
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="btn-login"
          :disabled="loading"
        >
          {{ loading ? 'Loading...' : 'Login' }}
        </button>
      </form>

      <!-- Test Credentials Info -->
      <div class="test-credentials">
        <p><strong>Test Credentials:</strong></p>
        <p>Email: admin@example.com</p>
        <p>Password: Admin123!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  identifier: '',
  password: '',
});

const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await authStore.login(form.value);

    if (result.success) {
      // Check if user is admin
      if (authStore.isAdmin) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        errorMessage.value = 'Access denied. Admin role required.';
        authStore.logout();
      }
    } else {
      errorMessage.value = result.message;
    }
  } catch (error) {
    errorMessage.value = 'An error occurred. Please try again.';
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 28px;
  color: #1a202c;
  margin-bottom: 8px;
}

.login-header p {
  color: #718096;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background-color: #fed7d7;
  color: #c53030;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.btn-login {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-credentials {
  margin-top: 24px;
  padding: 16px;
  background-color: #edf2f7;
  border-radius: 8px;
  font-size: 12px;
  color: #4a5568;
  text-align: center;
}

.test-credentials p {
  margin: 4px 0;
}
</style>
```

#### Router Setup (router/index.js)
```javascript
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // If route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  }
  // If route requires admin role
  else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/login');
  }
  // If logged in user tries to access login page
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard');
  }
  else {
    next();
  }
});

export default router;
```

#### Axios Interceptor (plugins/axios.js)
```javascript
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

// Set base URL
axios.defaults.baseURL = 'http://localhost:3030/api';

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    
    // Add token to every request
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const authStore = useAuthStore();
      authStore.logout();
      router.push('/login');
    }
    
    return Promise.reject(error);
  }
);

export default axios;
```

#### Main.js Setup
```javascript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './plugins/axios';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize auth state from localStorage
import { useAuthStore } from './stores/auth';
const authStore = useAuthStore();
authStore.initializeAuth();

app.mount('#app');
```

---

### 2. Vue.js 2 + Options API + Vuex

#### Auth Store (store/modules/auth.js)
```javascript
import axios from 'axios';

const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
};

const getters = {
  isAuthenticated: (state) => !!state.token,
  isAdmin: (state) => {
    return state.user?.roles?.some(role => role.name === 'admin') || false;
  },
  currentUser: (state) => state.user,
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
  },
  SET_TOKEN(state, token) {
    state.token = token;
  },
  SET_REFRESH_TOKEN(state, refreshToken) {
    state.refreshToken = refreshToken;
  },
  CLEAR_AUTH(state) {
    state.user = null;
    state.token = null;
    state.refreshToken = null;
  },
};

const actions = {
  async login({ commit }, credentials) {
    try {
      const response = await axios.post(
        'http://localhost:3030/api/auth/login',
        credentials
      );

      const { user, accessToken, refreshToken } = response.data.data;

      commit('SET_USER', user);
      commit('SET_TOKEN', accessToken);
      commit('SET_REFRESH_TOKEN', refreshToken);

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      return { success: true };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          message: error.response.data.message || 'Login failed',
        };
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  logout({ commit }) {
    commit('CLEAR_AUTH');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  },

  initializeAuth({ commit }) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      commit('SET_TOKEN', token);
      commit('SET_USER', JSON.parse(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
```

---

## Security Best Practices

### 1. Token Storage
✅ **DO:**
- Store JWT in `localStorage` or `sessionStorage`
- Clear token on logout
- Set token expiration

❌ **DON'T:**
- Store password
- Store sensitive data in plain text

### 2. Password Security
✅ **DO:**
- Use HTTPS in production
- Implement password strength validation
- Use type="password" for input
- Never log passwords

❌ **DON'T:**
- Send password in URL
- Store password in localStorage
- Show password in error messages

### 3. CORS Configuration
Backend harus mengizinkan request dari frontend:

```javascript
// Backend: src/app.js
app.use(cors({
  origin: 'http://localhost:5173', // Vue dev server
  credentials: true
}));
```

### 4. Token Refresh
Implement automatic token refresh sebelum expired:

```javascript
// Check token expiration
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Auto refresh if token expires soon
setInterval(() => {
  const token = localStorage.getItem('token');
  if (token && isTokenExpired(token)) {
    authStore.refreshAccessToken();
  }
}, 60000); // Check every minute
```

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| CORS Error | Backend tidak allow origin | Set CORS di backend |
| 401 Unauthorized | Token invalid/expired | Refresh token atau logout |
| 400 Bad Request | Input validation failed | Check form input |
| 500 Server Error | Backend error | Check backend logs |
| Network Error | Backend tidak running | Start backend server |

### Error Display Component

```vue
<template>
  <div v-if="error" class="alert alert-error">
    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
    </svg>
    <span>{{ error }}</span>
    <button @click="$emit('close')" class="close-btn">×</button>
  </div>
</template>

<script setup>
defineProps(['error']);
defineEmits(['close']);
</script>

<style scoped>
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.alert-error {
  background-color: #fed7d7;
  color: #c53030;
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: inherit;
}
</style>
```

---

## Testing

### 1. Manual Testing with cURL

```bash
# Test login
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@example.com",
    "password": "Admin123!"
  }'

# Test with token
curl -X GET http://localhost:3030/api/voting/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Browser Console Testing

```javascript
// Test login from browser console
fetch('http://localhost:3030/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    identifier: 'admin@example.com',
    password: 'Admin123!'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### 3. Unit Test Example (Vitest)

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

vi.mock('axios');

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          user: { id: 1, email: 'admin@example.com' },
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh'
        }
      }
    };

    axios.post.mockResolvedValue(mockResponse);

    const authStore = useAuthStore();
    const result = await authStore.login({
      identifier: 'admin@example.com',
      password: 'Admin123!'
    });

    expect(result.success).toBe(true);
    expect(authStore.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('should handle login error', async () => {
    axios.post.mockRejectedValue({
      response: {
        data: { message: 'Invalid credentials' }
      }
    });

    const authStore = useAuthStore();
    const result = await authStore.login({
      identifier: 'wrong@email.com',
      password: 'wrongpass'
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials');
  });
});
```

---

## Quick Start Checklist

### Backend Setup
- [ ] Backend running on `http://localhost:3030`
- [ ] Admin user tersedia (email: admin@example.com, password: Admin123!)
- [ ] CORS configured untuk frontend URL

### Frontend Setup
- [ ] Install dependencies: `npm install axios pinia vue-router`
- [ ] Create auth store (`stores/auth.js`)
- [ ] Create login component (`views/Login.vue`)
- [ ] Setup router with guards
- [ ] Configure axios interceptors
- [ ] Initialize auth state in `main.js`

### Testing
- [ ] Test login dengan credentials yang benar
- [ ] Test login dengan credentials yang salah
- [ ] Test redirect setelah login berhasil
- [ ] Test token persistence (refresh page)
- [ ] Test logout functionality
- [ ] Test protected routes

---

## Troubleshooting

### Problem: CORS Error
**Solution:**
```javascript
// Backend: src/app.js
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173', // Your Vue dev server URL
  credentials: true
}));
```

### Problem: Token tidak persist setelah refresh
**Solution:**
```javascript
// main.js - Initialize auth from localStorage
const authStore = useAuthStore();
authStore.initializeAuth();
```

### Problem: 401 Unauthorized pada API calls
**Solution:**
```javascript
// Check if token is being sent
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Problem: Backend tidak running
**Solution:**
```bash
cd /path/to/backend
npm run dev
```

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3030/api
VITE_APP_TITLE=Admin Panel
```

### Usage in Code
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

axios.defaults.baseURL = API_BASE_URL;
```

---

## Default Admin Credentials

**For Development/Testing:**
```
Email: admin@example.com
Password: Admin123!
```

⚠️ **PENTING:** Ganti credentials ini di production!

---

## Next Steps

Setelah login berhasil, Anda bisa:

1. **Implementasi Dashboard**
   - Tampilkan statistik voting
   - Tampilkan data kader
   - Tampilkan agenda terbaru

2. **Implementasi Voting Management**
   - List votings
   - Create new voting
   - Update voting
   - View results

3. **Implementasi Kader Management**
   - List kader
   - Verify KTA
   - Block/Unblock kader

4. **Implementasi Agenda Management**
   - Create agenda
   - Update agenda
   - Delete agenda

Lihat dokumentasi lengkap di:
- `ADMIN_WEB_API_DOCUMENTATION.md` - API endpoints untuk admin
- `VOTING_SYSTEM_API_DOCUMENTATION.md` - API endpoints untuk voting
- `DEVELOPMENT_SETUP.md` - Setup development environment

---

## Support

Jika ada pertanyaan atau masalah:
1. Check dokumentasi API lainnya
2. Test endpoint dengan cURL terlebih dahulu
3. Check browser console untuk error details
4. Check backend logs untuk server errors

**Backend Server Status:**
```bash
curl http://localhost:3030/health
```

Expected Response:
```json
{
  "success": true,
  "timestamp": "2026-02-12T...",
  "version": "1.0.0",
  "environment": "development"
}
```

---

**Last Updated:** February 12, 2026
**Backend Version:** 1.0.0
**API Base URL:** http://localhost:3030/api
