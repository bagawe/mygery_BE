# Auto-Suggest Dropdown Endpoints Documentation

**Date:** February 12, 2026  
**For:** Admin Web Panel (Vue.js)  
**Purpose:** Dokumentasi endpoint untuk auto-suggest/autocomplete dropdown

---

## 📋 Table of Contents

1. [User Search Endpoint](#1-user-search-endpoint)
2. [Active IP Addresses Endpoint](#2-active-ip-addresses-endpoint)
3. [Vue.js Implementation](#vuejs-implementation)
4. [Code Examples](#code-examples)

---

## 1. User Search Endpoint

### Endpoint
```
GET /api/users/search
```

### Purpose
Mencari user berdasarkan nama, email, atau username untuk auto-suggest dropdown.

### Authentication
**Required:** Yes (Bearer Token)

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | ✅ Yes | - | Keyword pencarian (nama, email, atau username) |
| `limit` | number | ❌ No | 20 | Jumlah maksimal hasil |
| `excludeSelf` | boolean | ❌ No | true | Exclude current user dari hasil |

### Request Example

```bash
GET /api/users/search?q=john&limit=10
Authorization: Bearer <your_token>
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "username": "johndoe123",
      "fotoProfil": "https://example.com/uploads/profiles/john.jpg",
      "ktaVerified": true
    },
    {
      "id": 12,
      "uuid": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Johnny Walker",
      "email": "johnny@example.com",
      "username": "johnny_walker",
      "fotoProfil": null,
      "ktaVerified": false
    }
  ],
  "meta": {
    "total": 2,
    "limit": 10
  }
}
```

### Error Responses

#### Missing Query Parameter (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": ["q"],
      "message": "Query parameter 'q' is required"
    }
  ]
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Usage Notes

- ✅ Searches across: `name`, `email`, `username`
- ✅ Case-insensitive search
- ✅ Partial match supported
- ✅ Excludes current logged-in user by default
- ✅ Returns users with basic profile info
- ⚠️ Requires authentication token

---

## 2. Active IP Addresses Endpoint

### Endpoint
```
GET /api/admin/active-ips
```

### Purpose
Mendapatkan list IP address yang pernah digunakan user untuk login/akses, untuk auto-suggest dropdown saat blocking user.

### Authentication
**Required:** Yes (Bearer Token + Admin Role)

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | ❌ No | - | Filter IP yang mengandung keyword |
| `limit` | number | ❌ No | 50 | Jumlah maksimal hasil |
| `includeBlocked` | boolean | ❌ No | false | Include IP yang sudah di-block |

### Request Example

```bash
GET /api/admin/active-ips?limit=20&includeBlocked=false
Authorization: Bearer <admin_token>
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "deviceIp": "192.168.1.100",
      "userCount": 5,
      "lastSeen": "2026-02-12T10:30:00.000Z",
      "isBlocked": false,
      "users": [
        {
          "id": 10,
          "name": "John Doe",
          "email": "john@example.com"
        },
        {
          "id": 15,
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      ]
    },
    {
      "deviceIp": "10.0.0.55",
      "userCount": 2,
      "lastSeen": "2026-02-12T08:15:00.000Z",
      "isBlocked": false,
      "users": [
        {
          "id": 20,
          "name": "Bob Wilson",
          "email": "bob@example.com"
        }
      ]
    }
  ],
  "meta": {
    "total": 2,
    "limit": 20,
    "uniqueIPs": 2
  }
}
```

### Error Responses

#### Forbidden (403)
```json
{
  "success": false,
  "message": "Admin access required"
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Usage Notes

- ✅ Admin-only endpoint
- ✅ Returns IP addresses with user count
- ✅ Shows which users used each IP
- ✅ Sorted by last seen (most recent first)
- ✅ Can filter out blocked IPs
- ⚠️ Only shows IPs from users with `deviceIp` field filled

---

## Vue.js Implementation

### 1. User Search Autocomplete

#### Composable (composables/useUserSearch.js)
```javascript
import { ref } from 'vue';
import axios from 'axios';

export function useUserSearch() {
  const users = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const searchUsers = async (query, limit = 10) => {
    if (!query || query.length < 2) {
      users.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get('/api/users/search', {
        params: { q: query, limit }
      });

      users.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to search users';
      users.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    users,
    loading,
    error,
    searchUsers
  };
}
```

#### Component (components/UserAutocomplete.vue)
```vue
<template>
  <div class="autocomplete-wrapper">
    <label v-if="label">{{ label }}</label>
    
    <div class="autocomplete-container">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        @input="handleInput"
        @focus="showDropdown = true"
        @blur="handleBlur"
        class="autocomplete-input"
      />
      
      <div v-if="loading" class="loading-spinner">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" />
        </svg>
      </div>

      <div
        v-if="showDropdown && (users.length > 0 || loading)"
        class="dropdown"
      >
        <div v-if="loading" class="dropdown-item loading">
          Searching...
        </div>

        <div
          v-for="user in users"
          :key="user.id"
          class="dropdown-item"
          @mousedown="selectUser(user)"
        >
          <img
            :src="user.fotoProfil || '/default-avatar.png'"
            :alt="user.name"
            class="user-avatar"
          />
          <div class="user-info">
            <div class="user-name">
              {{ user.name }}
              <span v-if="user.ktaVerified" class="verified-badge">✓</span>
            </div>
            <div class="user-email">{{ user.email }}</div>
          </div>
        </div>

        <div v-if="!loading && users.length === 0" class="dropdown-item empty">
          No users found
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- Selected User Display -->
    <div v-if="selectedUser" class="selected-user">
      <img
        :src="selectedUser.fotoProfil || '/default-avatar.png'"
        :alt="selectedUser.name"
        class="selected-avatar"
      />
      <div class="selected-info">
        <strong>{{ selectedUser.name }}</strong>
        <span>{{ selectedUser.email }}</span>
      </div>
      <button @click="clearSelection" class="clear-btn">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserSearch } from '@/composables/useUserSearch';

const props = defineProps({
  label: String,
  placeholder: {
    type: String,
    default: 'Search users...'
  },
  modelValue: Object
});

const emit = defineEmits(['update:modelValue']);

const { users, loading, error, searchUsers } = useUserSearch();

const searchQuery = ref('');
const showDropdown = ref(false);
const selectedUser = ref(props.modelValue || null);

let debounceTimer = null;

const handleInput = () => {
  clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(() => {
    searchUsers(searchQuery.value);
  }, 300); // Debounce 300ms
};

const selectUser = (user) => {
  selectedUser.value = user;
  searchQuery.value = user.name;
  showDropdown.value = false;
  emit('update:modelValue', user);
};

const clearSelection = () => {
  selectedUser.value = null;
  searchQuery.value = '';
  emit('update:modelValue', null);
};

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

watch(() => props.modelValue, (newValue) => {
  selectedUser.value = newValue;
  if (newValue) {
    searchQuery.value = newValue.name;
  }
});
</script>

<style scoped>
.autocomplete-wrapper {
  width: 100%;
}

.autocomplete-container {
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.autocomplete-input:focus {
  outline: none;
  border-color: #667eea;
}

.loading-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f7fafc;
}

.dropdown-item.loading,
.dropdown-item.empty {
  justify-content: center;
  color: #718096;
  cursor: default;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 6px;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #48bb78;
  color: white;
  border-radius: 50%;
  font-size: 12px;
}

.user-email {
  font-size: 12px;
  color: #718096;
}

.selected-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #edf2f7;
  border-radius: 8px;
}

.selected-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.selected-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.selected-info strong {
  color: #2d3748;
}

.selected-info span {
  font-size: 12px;
  color: #718096;
}

.clear-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #cbd5e0;
  color: #2d3748;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: #a0aec0;
}

.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 6px;
  font-size: 13px;
}
</style>
```

#### Usage Example
```vue
<template>
  <div class="block-user-form">
    <h2>Block User</h2>
    
    <UserAutocomplete
      v-model="selectedUser"
      label="Select User to Block"
      placeholder="Type to search user..."
    />

    <button 
      @click="blockUser" 
      :disabled="!selectedUser"
      class="btn-block"
    >
      Block User
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UserAutocomplete from '@/components/UserAutocomplete.vue';
import axios from 'axios';

const selectedUser = ref(null);

const blockUser = async () => {
  if (!selectedUser.value) return;

  try {
    await axios.post(`/api/admin/block/${selectedUser.value.id}`, {
      reason: 'Violating terms of service',
      deviceIp: selectedUser.value.deviceIp
    });

    alert('User blocked successfully');
    selectedUser.value = null;
  } catch (error) {
    alert('Failed to block user');
  }
};
</script>
```

---

### 2. IP Address Autocomplete

#### Composable (composables/useIPSearch.js)
```javascript
import { ref } from 'vue';
import axios from 'axios';

export function useIPSearch() {
  const ips = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const searchIPs = async (query = '', limit = 50) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get('/api/admin/active-ips', {
        params: {
          q: query,
          limit,
          includeBlocked: false
        }
      });

      ips.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch IPs';
      ips.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    ips,
    loading,
    error,
    searchIPs
  };
}
```

#### Component (components/IPAutocomplete.vue)
```vue
<template>
  <div class="ip-autocomplete-wrapper">
    <label v-if="label">{{ label }}</label>
    
    <div class="autocomplete-container">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        class="autocomplete-input"
      />

      <div v-if="loading" class="loading-spinner">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" />
        </svg>
      </div>

      <div
        v-if="showDropdown && ips.length > 0"
        class="dropdown"
      >
        <div
          v-for="ip in filteredIPs"
          :key="ip.deviceIp"
          class="dropdown-item"
          @mousedown="selectIP(ip)"
        >
          <div class="ip-info">
            <div class="ip-address">{{ ip.deviceIp }}</div>
            <div class="ip-meta">
              {{ ip.userCount }} user(s) • Last seen: {{ formatDate(ip.lastSeen) }}
            </div>
          </div>
          <div class="user-preview">
            <div
              v-for="user in ip.users.slice(0, 2)"
              :key="user.id"
              class="user-tag"
            >
              {{ user.name }}
            </div>
            <div v-if="ip.userCount > 2" class="more-users">
              +{{ ip.userCount - 2 }} more
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedIP" class="selected-ip">
      <div class="ip-badge">{{ selectedIP }}</div>
      <button @click="clearSelection" class="clear-btn">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useIPSearch } from '@/composables/useIPSearch';

const props = defineProps({
  label: String,
  placeholder: {
    type: String,
    default: 'Enter or search IP address...'
  },
  modelValue: String
});

const emit = defineEmits(['update:modelValue']);

const { ips, loading, error, searchIPs } = useIPSearch();

const searchQuery = ref(props.modelValue || '');
const showDropdown = ref(false);
const selectedIP = ref(props.modelValue || null);

let debounceTimer = null;

const filteredIPs = computed(() => {
  if (!searchQuery.value) return ips.value;
  
  return ips.value.filter(ip =>
    ip.deviceIp.includes(searchQuery.value)
  );
});

const handleInput = () => {
  clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(() => {
    searchIPs(searchQuery.value);
  }, 300);
};

const handleFocus = () => {
  showDropdown.value = true;
  if (ips.value.length === 0) {
    searchIPs();
  }
};

const selectIP = (ip) => {
  selectedIP.value = ip.deviceIp;
  searchQuery.value = ip.deviceIp;
  showDropdown.value = false;
  emit('update:modelValue', ip.deviceIp);
};

const clearSelection = () => {
  selectedIP.value = null;
  searchQuery.value = '';
  emit('update:modelValue', null);
};

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false;
    
    // Allow manual IP entry
    if (searchQuery.value && !selectedIP.value) {
      selectedIP.value = searchQuery.value;
      emit('update:modelValue', searchQuery.value);
    }
  }, 200);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};
</script>

<style scoped>
/* Similar styling as UserAutocomplete */
.ip-autocomplete-wrapper {
  width: 100%;
}

.autocomplete-container {
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Monaco', 'Courier New', monospace;
  transition: border-color 0.2s;
}

.autocomplete-input:focus {
  outline: none;
  border-color: #667eea;
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f7fafc;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f7fafc;
}

.ip-info {
  flex: 1;
}

.ip-address {
  font-weight: 600;
  font-family: 'Monaco', 'Courier New', monospace;
  color: #2d3748;
  font-size: 14px;
}

.ip-meta {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

.user-preview {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.user-tag {
  padding: 4px 8px;
  background: #edf2f7;
  border-radius: 12px;
  font-size: 11px;
  color: #4a5568;
}

.more-users {
  padding: 4px 8px;
  background: #e6fffa;
  color: #234e52;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.selected-ip {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #edf2f7;
  border-radius: 8px;
}

.ip-badge {
  flex: 1;
  font-family: 'Monaco', 'Courier New', monospace;
  font-weight: 600;
  color: #2d3748;
}

.clear-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #cbd5e0;
  color: #2d3748;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: #a0aec0;
}

.loading-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

#### Usage Example
```vue
<template>
  <div class="block-form">
    <h2>Block User by IP</h2>
    
    <IPAutocomplete
      v-model="selectedIP"
      label="IP Address"
      placeholder="Enter or select IP address..."
    />

    <button @click="blockIP" :disabled="!selectedIP">
      Block IP
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import IPAutocomplete from '@/components/IPAutocomplete.vue';
import axios from 'axios';

const selectedIP = ref(null);

const blockIP = async () => {
  if (!selectedIP.value) return;

  try {
    await axios.post('/api/admin/block-ip', {
      deviceIp: selectedIP.value,
      reason: 'Suspicious activity'
    });

    alert('IP blocked successfully');
    selectedIP.value = null;
  } catch (error) {
    alert('Failed to block IP');
  }
};
</script>
```

---

## Code Examples

### Full Page Example: Block User Form

```vue
<template>
  <div class="block-user-page">
    <div class="page-header">
      <h1>Block User</h1>
      <p>Block users by username or IP address</p>
    </div>

    <div class="block-form-card">
      <form @submit.prevent="handleSubmit">
        <!-- User Selection -->
        <div class="form-section">
          <h3>Select User</h3>
          <UserAutocomplete
            v-model="form.user"
            label="Search User"
            placeholder="Type name, email, or username..."
          />
        </div>

        <!-- IP Address (Optional) -->
        <div class="form-section">
          <h3>IP Address (Optional)</h3>
          <IPAutocomplete
            v-model="form.deviceIp"
            label="Device IP"
            placeholder="Enter or select IP address..."
          />
          <p class="help-text">
            If specified, this IP will also be blocked
          </p>
        </div>

        <!-- Reason -->
        <div class="form-section">
          <label for="reason">Block Reason *</label>
          <textarea
            id="reason"
            v-model="form.reason"
            rows="4"
            placeholder="Enter reason for blocking this user..."
            required
          ></textarea>
        </div>

        <!-- Submit -->
        <div class="form-actions">
          <button type="button" @click="resetForm" class="btn-secondary">
            Reset
          </button>
          <button
            type="submit"
            :disabled="!canSubmit || loading"
            class="btn-primary"
          >
            {{ loading ? 'Blocking...' : 'Block User' }}
          </button>
        </div>
      </form>

      <!-- Success Message -->
      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import UserAutocomplete from '@/components/UserAutocomplete.vue';
import IPAutocomplete from '@/components/IPAutocomplete.vue';

const form = ref({
  user: null,
  deviceIp: null,
  reason: ''
});

const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const canSubmit = computed(() => {
  return form.value.user && form.value.reason.trim().length > 0;
});

const handleSubmit = async () => {
  if (!canSubmit.value) return;

  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    await axios.post(`/api/admin/block/${form.value.user.id}`, {
      reason: form.value.reason,
      deviceIp: form.value.deviceIp
    });

    successMessage.value = `User ${form.value.user.name} has been blocked successfully`;
    resetForm();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to block user';
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    user: null,
    deviceIp: null,
    reason: ''
  };
};
</script>

<style scoped>
.block-user-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  color: #1a202c;
  margin-bottom: 8px;
}

.page-header p {
  color: #718096;
}

.block-form-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 24px;
}

.form-section h3 {
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 12px;
}

.form-section label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.form-section textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.form-section textarea:focus {
  outline: none;
  border-color: #667eea;
}

.help-text {
  margin-top: 8px;
  font-size: 13px;
  color: #718096;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #edf2f7;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.alert {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.alert-success {
  background: #c6f6d5;
  color: #22543d;
}

.alert-error {
  background: #fed7d7;
  color: #c53030;
}
</style>
```

---

## Testing

### cURL Examples

#### Test User Search
```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@example.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Search users
curl -X GET "http://localhost:3030/api/users/search?q=admin&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### Test IP Search
```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@example.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Get active IPs
curl -X GET "http://localhost:3030/api/admin/active-ips?limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Summary

### Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/users/search` | GET | User | Search users by name/email/username |
| `/api/admin/active-ips` | GET | Admin | Get list of active IP addresses |

### Features

✅ **User Search:**
- Debounced search (300ms)
- Partial match support
- Shows user avatar, name, email
- KTA verified badge
- Exclude current user option

✅ **IP Search:**
- Shows user count per IP
- Last seen timestamp
- Associated users list
- Manual IP entry support
- Filter blocked IPs

### Vue.js Components Ready

- ✅ `UserAutocomplete.vue` - Complete component
- ✅ `IPAutocomplete.vue` - Complete component
- ✅ `useUserSearch()` - Composable
- ✅ `useIPSearch()` - Composable

**Last Updated:** February 12, 2026
