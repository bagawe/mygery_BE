# 🌐 ADMIN WEB PANEL - API DOCUMENTATION

**Target:** Vue.js Admin Panel  
**Date:** February 12, 2026  
**Backend Version:** v1.0.0  
**Base URL (Development):** `http://localhost:3030/api`  
**Base URL (Production):** `https://api.mygerindra.com/api`

> ⚠️ **PENTING:** Jika FE dan BE di laptop yang sama, gunakan `localhost`. Jangan pakai IP karena akan berubah-ubah saat pindah WiFi!

---

## 📚 RELATED DOCUMENTATION

- **[Admin Web Login Documentation](./ADMIN_WEB_LOGIN_DOCUMENTATION.md)** - Implementasi lengkap login untuk admin web panel
- **[Voting System API](./VOTING_SYSTEM_API_DOCUMENTATION.md)** - API untuk sistem voting
- **[Development Setup](./DEVELOPMENT_SETUP.md)** - Setup development environment

---

## 🔐 AUTHENTICATION

> 📖 **Untuk implementasi login lengkap dengan Vue.js code examples, lihat:** [ADMIN_WEB_LOGIN_DOCUMENTATION.md](./ADMIN_WEB_LOGIN_DOCUMENTATION.md)

### **Admin Login**
```javascript
POST /api/auth/login
Content-Type: application/json

// Request
{
  "identifier": "admin@example.com",
  "password": "Admin123!"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "uuid": "ddd1fc74-e88e-4b8d-9c53-f1218114be7f",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "38d74102cbe63ab0c09dbcbc07c47ef5...",
    "expiresIn": "1d"
  }
}
```

### **Authorization Header**
Semua endpoint admin memerlukan header:
```javascript
Authorization: Bearer <accessToken>
```

### **Vue.js Axios Setup**
```javascript
// api/axios.js
import axios from 'axios';

// Gunakan environment variable agar mudah switch development/production
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

**Environment Setup (`.env.development`):**
```bash
# Development - FE dan BE di laptop yang sama
VITE_API_BASE_URL=http://localhost:3030/api
```

**Environment Setup (`.env.production`):**
```bash
# Production
VITE_API_BASE_URL=https://api.mygerindra.com/api
```

---

## 📅 1. AGENDA MANAGEMENT

### **1.1 Create New Agenda**
```javascript
POST /api/agenda

// Request Body
{
  "title": "Rapat Koordinasi Wilayah",
  "description": "Rapat koordinasi dengan kader wilayah Jakarta",
  "date": "2026-02-15",      // Format: YYYY-MM-DD
  "time": "14:00",            // Format: HH:MM
  "location": "DPP Gerindra Jakarta"
}

// Response (201)
{
  "success": true,
  "message": "Agenda created successfully",
  "data": {
    "id": 1,
    "title": "Rapat Koordinasi Wilayah",
    "description": "Rapat koordinasi dengan kader wilayah Jakarta",
    "date": "2026-02-15T00:00:00.000Z",
    "time": "14:00",
    "location": "DPP Gerindra Jakarta",
    "createdBy": 1,
    "createdAt": "2026-02-09T09:23:35.586Z",
    "updatedAt": "2026-02-09T09:23:35.586Z"
  }
}
```

### **1.2 Get All Agendas (with Pagination)**
```javascript
GET /api/agenda?page=1&limit=20&month=2&year=2026

// Query Parameters (Optional):
// - page: number (default: 1)
// - limit: number (default: 20)
// - month: number (1-12)
// - year: number (e.g., 2026)

// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Rapat Koordinasi Wilayah",
      "description": "...",
      "date": "2026-02-15T00:00:00.000Z",
      "time": "14:00",
      "location": "DPP Gerindra Jakarta",
      "createdBy": 1,
      "createdAt": "2026-02-09T09:23:35.586Z",
      "updatedAt": "2026-02-09T09:23:35.586Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### **1.3 Get Single Agenda**
```javascript
GET /api/agenda/:id

// Response (200)
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Rapat Koordinasi Wilayah",
    "description": "...",
    "date": "2026-02-15T00:00:00.000Z",
    "time": "14:00",
    "location": "DPP Gerindra Jakarta",
    "createdBy": 1,
    "createdAt": "2026-02-09T09:23:35.586Z",
    "updatedAt": "2026-02-09T09:23:35.586Z"
  }
}
```

### **1.4 Update Agenda**
```javascript
PUT /api/agenda/:id

// Request Body (all fields optional)
{
  "title": "Updated Title",
  "description": "Updated description",
  "date": "2026-02-20",
  "time": "15:00",
  "location": "New Location"
}

// Response (200)
{
  "success": true,
  "message": "Agenda updated successfully",
  "data": { /* updated agenda object */ }
}
```

### **1.5 Delete Agenda**
```javascript
DELETE /api/agenda/:id

// Response (200)
{
  "success": true,
  "message": "Agenda deleted successfully"
}
```

### **1.6 Get Agenda Statistics**
```javascript
GET /api/agenda/stats

// Response (200)
{
  "success": true,
  "data": {
    "total": 50,
    "thisMonth": 12,
    "upcoming": 30
  }
}
```

### **Vue.js Component Example**
```vue
<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api/axios';

const agendas = ref([]);
const loading = ref(false);
const pagination = ref({});

const fetchAgendas = async (page = 1) => {
  loading.value = true;
  try {
    const { data } = await apiClient.get('/agenda', {
      params: { page, limit: 20 }
    });
    agendas.value = data.data;
    pagination.value = data.pagination;
  } catch (error) {
    console.error('Failed to fetch agendas:', error);
  } finally {
    loading.value = false;
  }
};

const createAgenda = async (formData) => {
  try {
    const { data } = await apiClient.post('/agenda', formData);
    await fetchAgendas(); // Refresh list
    return data;
  } catch (error) {
    console.error('Failed to create agenda:', error);
    throw error;
  }
};

const deleteAgenda = async (id) => {
  if (!confirm('Are you sure?')) return;
  try {
    await apiClient.delete(`/agenda/${id}`);
    await fetchAgendas(); // Refresh list
  } catch (error) {
    console.error('Failed to delete agenda:', error);
  }
};

onMounted(() => {
  fetchAgendas();
});
</script>
```

---

## 📢 2. ANNOUNCEMENTS MANAGEMENT

### **2.1 Create Announcement**
```javascript
POST /api/announcement

// Request Body
{
  "title": "Selamat Datang di My Gerindra",
  "content": "Terima kasih telah bergabung...",
  "type": "sambutan",  // sambutan | pengumuman | download | artikel
  "imageUrl": "https://example.com/image.jpg"  // Optional
}

// Response (201)
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "id": 1,
    "title": "Selamat Datang di My Gerindra",
    "content": "Terima kasih telah bergabung...",
    "imageUrl": "https://example.com/image.jpg",
    "type": "sambutan",
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2026-02-09T09:26:13.036Z",
    "updatedAt": "2026-02-09T09:26:13.036Z"
  }
}
```

### **2.2 Get All Announcements**
```javascript
GET /api/announcement?page=1&limit=20&type=sambutan&isActive=true

// Query Parameters (Optional):
// - page: number
// - limit: number
// - type: sambutan | pengumuman | download | artikel | all
// - isActive: true | false

// Response (200)
{
  "success": true,
  "data": [ /* array of announcements */ ],
  "pagination": {
    "total": 30,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

### **2.3 Get Single Announcement**
```javascript
GET /api/announcement/:id

// Response (200)
{
  "success": true,
  "data": { /* announcement object */ }
}
```

### **2.4 Update Announcement**
```javascript
PUT /api/announcement/:id

// Request Body (all fields optional)
{
  "title": "Updated Title",
  "content": "Updated content",
  "type": "pengumuman",
  "imageUrl": "https://example.com/new-image.jpg",
  "isActive": false
}

// Response (200)
{
  "success": true,
  "message": "Announcement updated successfully",
  "data": { /* updated announcement */ }
}
```

### **2.5 Toggle Active Status**
```javascript
PATCH /api/announcement/:id/toggle

// No body required

// Response (200)
{
  "success": true,
  "message": "Announcement activated successfully",  // or "deactivated"
  "data": {
    "id": 1,
    "isActive": true,
    // ... other fields
  }
}
```

### **2.6 Delete Announcement**
```javascript
DELETE /api/announcement/:id

// Response (200)
{
  "success": true,
  "message": "Announcement deleted successfully"
}
```

### **2.7 Get Announcement Statistics**
```javascript
GET /api/announcement/stats

// Response (200)
{
  "success": true,
  "data": {
    "total": 30,
    "active": 25,
    "inactive": 5,
    "byType": {
      "sambutan": 5,
      "pengumuman": 15,
      "download": 7,
      "artikel": 3
    }
  }
}
```

---

## 👥 3. KADER CONFIRMATION SYSTEM

### **3.1 Get Pending Point 1 (Old Members)**
```javascript
GET /api/kader/pending/point1

// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 3,
      "nik": "3201234567890123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08123456789",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "kaderPoint1Confirmed": false,
      "kaderPoint1ConfirmedAt": null,
      "roles": [{ "role": "kader" }]
    }
  ],
  "count": 10
}
```

### **3.2 Get Pending Point 2 (New Members)**
```javascript
GET /api/kader/pending/point2

// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 5,
      "nik": null,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "08198765432",
      "createdAt": "2026-02-01T08:00:00.000Z",
      "kaderPoint2Confirmed": false,
      "kaderPoint2ConfirmedAt": null,
      "roles": [{ "role": "simpatisan" }]
    }
  ],
  "count": 15
}
```

### **3.3 Confirm Point 1 (Old Member)**
```javascript
POST /api/kader/confirm/point1/:userId

// No body required

// Response (200)
{
  "success": true,
  "message": "Point 1 confirmation successful",
  "data": {
    "id": 3,
    "name": "John Doe",
    "kaderPoint1Confirmed": true,
    "kaderPoint1ConfirmedAt": "2026-02-09T10:00:00.000Z",
    "kaderPoint1ConfirmedBy": 1
  }
}
```

### **3.4 Confirm Point 2 (Upgrade to Kader)**
```javascript
POST /api/kader/confirm/point2/:userId

// No body required

// Response (200)
{
  "success": true,
  "message": "Point 2 confirmation successful - User upgraded to kader",
  "data": {
    "id": 5,
    "name": "Jane Smith",
    "kaderPoint2Confirmed": true,
    "kaderPoint2ConfirmedAt": "2026-02-09T10:05:00.000Z",
    "kaderPoint2ConfirmedBy": 1,
    "roles": [
      { "role": "simpatisan", "isActive": true },
      { "role": "kader", "isActive": true }  // NEW!
    ]
  }
}
```

### **3.5 Reject Point 1**
```javascript
POST /api/kader/reject/point1/:userId

// Request Body
{
  "reason": "Data tidak lengkap"
}

// Response (200)
{
  "success": true,
  "message": "Point 1 confirmation rejected",
  "data": {
    "userId": 3,
    "reason": "Data tidak lengkap"
  }
}
```

### **3.6 Reject Point 2**
```javascript
POST /api/kader/reject/point2/:userId

// Request Body
{
  "reason": "Belum memenuhi syarat"
}

// Response (200)
{
  "success": true,
  "message": "Point 2 upgrade rejected",
  "data": {
    "userId": 5,
    "reason": "Belum memenuhi syarat"
  }
}
```

### **3.7 Get Confirmation Statistics**
```javascript
GET /api/kader/stats

// Response (200)
{
  "success": true,
  "data": {
    "point1": {
      "totalKader": 50,
      "confirmed": 40,
      "pending": 10
    },
    "point2": {
      "totalSimpatisan": 100,
      "applied": 15,
      "confirmed": 12
    }
  }
}
```

### **3.8 Get Confirmed Users**
```javascript
GET /api/kader/confirmed?type=point1

// Query Parameters (Optional):
// - type: point1 | point2 | all

// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 3,
      "nik": "3201234567890123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08123456789",
      "kaderPoint1Confirmed": true,
      "kaderPoint1ConfirmedAt": "2026-02-09T10:00:00.000Z",
      "kaderPoint2Confirmed": false,
      "kaderPoint2ConfirmedAt": null,
      "roles": [{ "role": "kader" }]
    }
  ],
  "count": 40
}
```

### **Vue.js Kader Component Example**
```vue
<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api/axios';

const pendingPoint2 = ref([]);
const loading = ref(false);

const fetchPendingPoint2 = async () => {
  loading.value = true;
  try {
    const { data } = await apiClient.get('/kader/pending/point2');
    pendingPoint2.value = data.data;
  } catch (error) {
    console.error('Failed to fetch pending:', error);
  } finally {
    loading.value = false;
  }
};

const confirmPoint2 = async (userId) => {
  if (!confirm('Konfirmasi upgrade user ini ke kader?')) return;
  
  try {
    const { data } = await apiClient.post(`/kader/confirm/point2/${userId}`);
    alert(data.message);
    await fetchPendingPoint2(); // Refresh list
  } catch (error) {
    console.error('Failed to confirm:', error);
    alert('Gagal konfirmasi');
  }
};

const rejectPoint2 = async (userId) => {
  const reason = prompt('Alasan penolakan:');
  if (!reason) return;
  
  try {
    const { data } = await apiClient.post(`/kader/reject/point2/${userId}`, {
      reason
    });
    alert(data.message);
    await fetchPendingPoint2(); // Refresh list
  } catch (error) {
    console.error('Failed to reject:', error);
  }
};

onMounted(() => {
  fetchPendingPoint2();
});
</script>

<template>
  <div class="kader-confirmation">
    <h2>Pending Point 2 Confirmations</h2>
    
    <div v-if="loading">Loading...</div>
    
    <table v-else>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in pendingPoint2" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.phone }}</td>
          <td>
            <button @click="confirmPoint2(user.id)" class="btn-approve">
              Approve
            </button>
            <button @click="rejectPoint2(user.id)" class="btn-reject">
              Reject
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

## 🚫 4. USER BLOCKING MANAGEMENT

### **4.1 Block User**
```javascript
POST /api/admin/block/:userId

// Request Body
{
  "reason": "Spam posting",
  "deviceIp": "192.168.1.100"  // Optional
}

// Response (200)
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "id": 5,
    "name": "Spammer User",
    "email": "spammer@example.com",
    "deviceIp": "192.168.1.100",
    "isBlocked": true,
    "blockedAt": "2026-02-09T09:37:37.203Z",
    "blockedByAdmin": 1,
    "blockReason": "Spam posting"
  }
}
```

### **4.2 Unblock User**
```javascript
POST /api/admin/unblock/:userId

// No body required

// Response (200)
{
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "id": 5,
    "isBlocked": false,
    "blockedAt": null,
    "blockedByAdmin": null,
    "blockReason": null
  }
}
```

### **4.3 Get All Blocked Users**
```javascript
GET /api/admin/blocked

// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 5,
      "nik": null,
      "name": "Spammer User",
      "email": "spammer@example.com",
      "phone": null,
      "deviceIp": "192.168.1.100",
      "isBlocked": true,
      "blockedAt": "2026-02-09T09:37:37.203Z",
      "blockedByAdmin": 1,
      "blockReason": "Spam posting",
      "roles": [{ "role": "simpatisan" }]
    }
  ],
  "count": 1
}
```

### **4.4 Check if User/IP is Blocked**
```javascript
POST /api/admin/check-blocked

// Request Body
{
  "userId": 5,          // Optional
  "deviceIp": "192.168.1.100"  // Optional
}

// Response (200)
{
  "success": true,
  "data": {
    "blocked": true,
    "reason": "Spam posting",
    "blockedAt": "2026-02-09T09:37:37.203Z"
  }
}
```

### **4.5 Get Blocking Statistics**
```javascript
GET /api/admin/blocking-stats

// Response (200)
{
  "success": true,
  "data": {
    "totalBlocked": 10,
    "byRole": {
      "simpatisan": 7,
      "kader": 3
    }
  }
}
```

---

## 📦 COMPLETE VUEJS STORE EXAMPLE

```javascript
// stores/admin.js
import { defineStore } from 'pinia';
import apiClient from '@/api/axios';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    agendas: [],
    announcements: [],
    pendingKader: [],
    blockedUsers: [],
    stats: {},
    loading: false
  }),

  actions: {
    // AGENDA
    async fetchAgendas(params = {}) {
      this.loading = true;
      try {
        const { data } = await apiClient.get('/agenda', { params });
        this.agendas = data.data;
        return data;
      } finally {
        this.loading = false;
      }
    },

    async createAgenda(formData) {
      const { data } = await apiClient.post('/agenda', formData);
      await this.fetchAgendas();
      return data;
    },

    async deleteAgenda(id) {
      await apiClient.delete(`/agenda/${id}`);
      await this.fetchAgendas();
    },

    // ANNOUNCEMENTS
    async fetchAnnouncements(params = {}) {
      this.loading = true;
      try {
        const { data } = await apiClient.get('/announcement', { params });
        this.announcements = data.data;
        return data;
      } finally {
        this.loading = false;
      }
    },

    async createAnnouncement(formData) {
      const { data } = await apiClient.post('/announcement', formData);
      await this.fetchAnnouncements();
      return data;
    },

    async toggleAnnouncement(id) {
      await apiClient.patch(`/announcement/${id}/toggle`);
      await this.fetchAnnouncements();
    },

    // KADER
    async fetchPendingKader(type = 'point2') {
      this.loading = true;
      try {
        const { data } = await apiClient.get(`/kader/pending/${type}`);
        this.pendingKader = data.data;
        return data;
      } finally {
        this.loading = false;
      }
    },

    async confirmKader(userId, type = 'point2') {
      const { data } = await apiClient.post(`/kader/confirm/${type}/${userId}`);
      await this.fetchPendingKader(type);
      return data;
    },

    async rejectKader(userId, type, reason) {
      const { data } = await apiClient.post(`/kader/reject/${type}/${userId}`, {
        reason
      });
      await this.fetchPendingKader(type);
      return data;
    },

    // BLOCKING
    async fetchBlockedUsers() {
      this.loading = true;
      try {
        const { data } = await apiClient.get('/admin/blocked');
        this.blockedUsers = data.data;
        return data;
      } finally {
        this.loading = false;
      }
    },

    async blockUser(userId, reason, deviceIp = null) {
      const { data } = await apiClient.post(`/admin/block/${userId}`, {
        reason,
        deviceIp
      });
      await this.fetchBlockedUsers();
      return data;
    },

    async unblockUser(userId) {
      const { data } = await apiClient.post(`/admin/unblock/${userId}`);
      await this.fetchBlockedUsers();
      return data;
    },

    // STATS
    async fetchStats() {
      const [agendaStats, announcementStats, kaderStats, blockingStats] = 
        await Promise.all([
          apiClient.get('/agenda/stats'),
          apiClient.get('/announcement/stats'),
          apiClient.get('/kader/stats'),
          apiClient.get('/admin/blocking-stats')
        ]);

      this.stats = {
        agenda: agendaStats.data.data,
        announcement: announcementStats.data.data,
        kader: kaderStats.data.data,
        blocking: blockingStats.data.data
      };

      return this.stats;
    }
  }
});
```

---

## 🎨 UI RECOMMENDATIONS

### **Dashboard Cards**
```vue
<template>
  <div class="dashboard">
    <div class="stats-grid">
      <StatCard 
        title="Total Agendas" 
        :value="stats.agenda?.total || 0"
        icon="calendar"
      />
      <StatCard 
        title="Active Announcements" 
        :value="stats.announcement?.active || 0"
        icon="megaphone"
      />
      <StatCard 
        title="Pending Confirmations" 
        :value="(stats.kader?.point1?.pending || 0) + (stats.kader?.point2?.applied || 0)"
        icon="users"
      />
      <StatCard 
        title="Blocked Users" 
        :value="stats.blocking?.totalBlocked || 0"
        icon="ban"
      />
    </div>
  </div>
</template>
```

---

## ⚠️ ERROR HANDLING

```javascript
// Global error handler
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('adminToken');
      router.push('/login');
    } else if (error.response?.status === 403) {
      // Insufficient permissions
      alert('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      // Resource not found
      console.error('Resource not found');
    }
    return Promise.reject(error);
  }
);
```

---

## 🚀 DEPLOYMENT NOTES

1. **Environment Variables**
```javascript
// .env.production
VITE_API_BASE_URL=https://api.mygerindra.com/api
```

2. **Build Configuration**
```javascript
// vite.config.js
export default defineConfig({
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL)
  }
});
```

---

**Last Updated:** February 9, 2026  
**Questions?** Contact backend team
