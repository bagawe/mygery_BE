# Admin Web Panel - Vue.js Requirements

## 📋 Overview

Admin web panel menggunakan Vue.js untuk mengelola:
1. **Konfirmasi Registrasi Kader** (Point 1 & 2 - Lama & Baru)
2. **Konfirmasi Cetak KTA**
3. **Manajemen Agenda** (Kalender untuk mobile)
4. **My Gerindra** (Pengumuman, posting admin)
5. **User Management** (Blokir/Copot blokir via IP)

## 🎯 Fitur Utama

### 1. Konfirmasi Registrasi Kader

#### Point 1 & 2 System
- **Point 1**: Kader lama (sudah terdaftar sebelumnya)
- **Point 2**: Kader baru (registrasi baru)
- Admin konfirmasi setelah verifikasi dokumen

#### Database Schema Update
```sql
-- Tambah kolom untuk kader confirmation
ALTER TABLE users ADD COLUMN kader_point_1_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN kader_point_1_confirmed_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN kader_point_1_confirmed_by INT NULL;

ALTER TABLE users ADD COLUMN kader_point_2_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN kader_point_2_confirmed_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN kader_point_2_confirmed_by INT NULL;

-- IP device untuk simpatisan
ALTER TABLE users ADD COLUMN device_ip VARCHAR(45) NULL;
ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN blocked_by INT NULL;
ALTER TABLE users ADD COLUMN block_reason TEXT NULL;
```

### 2. Agenda Management

#### Database Schema
```sql
CREATE TABLE agendas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NULL,
  location VARCHAR(255),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 3. My Gerindra (Pengumuman)

#### Database Schema
```sql
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  image_url VARCHAR(500),
  type ENUM('sambutan', 'pengumuman', 'download', 'artikel') DEFAULT 'pengumuman',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## 🔧 Backend API Requirements

### 1. Kader Confirmation APIs

#### Get Pending Kader Confirmations
```http
GET /api/admin/kader/pending-confirmations?point=1&page=1&limit=20
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "confirmations": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "kader",
        "point_1_pending": true,
        "point_2_pending": false,
        "documents": ["ktp.jpg", "sk_kader.pdf"],
        "created_at": "2026-02-09T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "has_more": true
    }
  }
}
```

#### Confirm Kader Point
```http
POST /api/admin/kader/confirm-point
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "user_id": 1,
  "point": 1,
  "confirmed": true,
  "notes": "Dokumen lengkap dan valid"
}
```

#### Get Kader Statistics
```http
GET /api/admin/kader/statistics
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_kader": 150,
    "point_1_confirmed": 120,
    "point_2_confirmed": 95,
    "pending_point_1": 30,
    "pending_point_2": 55,
    "confirmation_rate": "80.00"
  }
}
```

### 2. Agenda APIs

#### Create Agenda
```http
POST /api/admin/agenda
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "title": "Rapat Koordinasi Wilayah",
  "description": "Rapat koordinasi kader wilayah Jakarta",
  "date": "2026-02-15",
  "time": "14:00",
  "location": "Sekretariat DPD Jakarta"
}
```

#### Get All Agendas
```http
GET /api/admin/agenda?page=1&limit=20&month=2026-02
Authorization: Bearer {admin_token}
```

#### Update Agenda
```http
PUT /api/admin/agenda/{id}
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "title": "Updated Title",
  "description": "Updated description",
  "date": "2026-02-16",
  "time": "15:00",
  "location": "Updated location"
}
```

#### Delete Agenda
```http
DELETE /api/admin/agenda/{id}
Authorization: Bearer {admin_token}
```

#### Get Agenda for Mobile (Public)
```http
GET /api/agenda?month=2026-02
```
(No auth required for mobile view)

### 3. Announcement APIs

#### Create Announcement
```http
POST /api/admin/announcements
Content-Type: multipart/form-data
Authorization: Bearer {admin_token}

{
  "title": "Sambutan Ketua Umum",
  "content": "Assalamualaikum...",
  "type": "sambutan",
  "image": {file}
}
```

#### Get All Announcements
```http
GET /api/admin/announcements?page=1&limit=20&type=all
Authorization: Bearer {admin_token}
```

#### Update Announcement
```http
PUT /api/admin/announcements/{id}
Content-Type: multipart/form-data
Authorization: Bearer {admin_token}

{
  "title": "Updated Title",
  "content": "Updated content",
  "is_active": true
}
```

#### Delete Announcement
```http
DELETE /api/admin/announcements/{id}
Authorization: Bearer {admin_token}
```

#### Get Active Announcements for Mobile
```http
GET /api/announcements?type=sambutan
```
(No auth required for mobile view)

### 4. User Management APIs

#### Block/Unblock User
```http
POST /api/admin/users/block
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "user_id": 1,
  "block": true,
  "reason": "Pelanggaran aturan",
  "block_ip": true
}
```

#### Get Blocked Users
```http
GET /api/admin/users/blocked?page=1&limit=20
Authorization: Bearer {admin_token}
```

#### Get User Details
```http
GET /api/admin/users/{id}
Authorization: Bearer {admin_token}
```

---

## 🎨 Frontend Web (Vue.js) Requirements

### Tech Stack
- **Vue.js 3** with Composition API
- **Vue Router** for navigation
- **Pinia** for state management
- **Axios** for API calls
- **Element Plus** or **Quasar** for UI components
- **FullCalendar** for agenda calendar
- **VueUpload** for file uploads

### Project Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.vue
│   │   ├── Header.vue
│   │   └── AdminLayout.vue
│   ├── kader/
│   │   ├── KaderConfirmationList.vue
│   │   ├── KaderConfirmationCard.vue
│   │   └── KaderStatistics.vue
│   ├── agenda/
│   │   ├── AgendaCalendar.vue
│   │   ├── AgendaForm.vue
│   │   └── AgendaList.vue
│   ├── announcements/
│   │   ├── AnnouncementForm.vue
│   │   ├── AnnouncementList.vue
│   │   └── AnnouncementEditor.vue
│   └── users/
│       ├── UserBlockList.vue
│       ├── UserBlockForm.vue
│       └── UserDetails.vue
├── views/
│   ├── Dashboard.vue
│   ├── KaderManagement.vue
│   ├── AgendaManagement.vue
│   ├── AnnouncementManagement.vue
│   └── UserManagement.vue
├── router/
│   └── index.js
├── stores/
│   ├── auth.js
│   ├── kader.js
│   ├── agenda.js
│   ├── announcements.js
│   └── users.js
├── services/
│   ├── api.js
│   └── upload.js
└── utils/
    ├── constants.js
    └── helpers.js
```

### Key Components Implementation

#### 1. Kader Confirmation Component
```vue
<template>
  <div class="kader-confirmations">
    <div class="filters">
      <el-select v-model="pointFilter" placeholder="Pilih Point">
        <el-option label="Point 1" value="1" />
        <el-option label="Point 2" value="2" />
      </el-select>
      <el-input
        v-model="searchQuery"
        placeholder="Cari nama..."
        style="width: 200px"
      />
    </div>

    <div class="confirmation-list">
      <el-card
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-card"
      >
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <el-tag :type="getPointStatus(user)">
            {{ getPointLabel(user) }}
          </el-tag>
        </div>

        <div class="documents">
          <h4>Dokumen:</h4>
          <div v-for="doc in user.documents" :key="doc">
            <el-link :href="doc.url" target="_blank">
              {{ doc.name }}
            </el-link>
          </div>
        </div>

        <div class="actions">
          <el-button
            type="success"
            @click="confirmKader(user.id, pointFilter, true)"
          >
            Konfirmasi
          </el-button>
          <el-button
            type="danger"
            @click="confirmKader(user.id, pointFilter, false)"
          >
            Tolak
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useKaderStore } from '@/stores/kader'

const kaderStore = useKaderStore()
const pointFilter = ref('1')
const searchQuery = ref('')

const filteredUsers = computed(() => {
  return kaderStore.pendingConfirmations.filter(user => {
    const matchesPoint = pointFilter.value === '1'
      ? user.point_1_pending
      : user.point_2_pending
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesPoint && matchesSearch
  })
})

const getPointStatus = (user) => {
  if (pointFilter.value === '1') {
    return user.point_1_pending ? 'warning' : 'success'
  }
  return user.point_2_pending ? 'warning' : 'success'
}

const getPointLabel = (user) => {
  const point = pointFilter.value
  const confirmed = point === '1' ? user.point_1_confirmed : user.point_2_confirmed
  return confirmed ? `Point ${point} Confirmed` : `Pending Point ${point}`
}

const confirmKader = async (userId, point, confirmed) => {
  try {
    await kaderStore.confirmKaderPoint(userId, point, confirmed)
    ElMessage.success(confirmed ? 'Kader dikonfirmasi' : 'Konfirmasi ditolak')
  } catch (error) {
    ElMessage.error('Gagal mengkonfirmasi kader')
  }
}
</script>
```

#### 2. Agenda Calendar Component
```vue
<template>
  <div class="agenda-calendar">
    <div class="calendar-header">
      <h2>Agenda Management</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        Tambah Agenda
      </el-button>
    </div>

    <FullCalendar
      ref="calendarRef"
      :options="calendarOptions"
      class="calendar"
    />

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="Agenda Baru"
      width="600px"
    >
      <el-form :model="agendaForm" label-width="120px">
        <el-form-item label="Judul">
          <el-input v-model="agendaForm.title" />
        </el-form-item>
        <el-form-item label="Deskripsi">
          <el-input
            v-model="agendaForm.description"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
        <el-form-item label="Tanggal">
          <el-date-picker
            v-model="agendaForm.date"
            type="date"
            format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="Waktu">
          <el-time-picker
            v-model="agendaForm.time"
            format="HH:mm"
          />
        </el-form-item>
        <el-form-item label="Lokasi">
          <el-input v-model="agendaForm.location" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">Batal</el-button>
        <el-button type="primary" @click="saveAgenda">
          Simpan
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useAgendaStore } from '@/stores/agenda'

const agendaStore = useAgendaStore()
const calendarRef = ref(null)
const showCreateDialog = ref(false)
const agendaForm = ref({
  title: '',
  description: '',
  date: null,
  time: null,
  location: ''
})

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  events: [],
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  height: 'auto'
})

onMounted(async () => {
  await loadAgendas()
})

const loadAgendas = async () => {
  await agendaStore.fetchAgendas()
  calendarOptions.value.events = agendaStore.agendas.map(agenda => ({
    id: agenda.id,
    title: agenda.title,
    date: agenda.date,
    extendedProps: agenda
  }))
}

const handleDateClick = (info) => {
  agendaForm.value.date = info.dateStr
  showCreateDialog.value = true
}

const handleEventClick = (info) => {
  // Show edit dialog
  const agenda = info.event.extendedProps
  agendaForm.value = { ...agenda }
  showCreateDialog.value = true
}

const saveAgenda = async () => {
  try {
    if (agendaForm.value.id) {
      await agendaStore.updateAgenda(agendaForm.value)
    } else {
      await agendaStore.createAgenda(agendaForm.value)
    }
    showCreateDialog.value = false
    await loadAgendas()
  } catch (error) {
    console.error('Error saving agenda:', error)
  }
}
</script>
```

#### 3. Announcement Management Component
```vue
<template>
  <div class="announcements">
    <div class="header">
      <h2>My Gerindra - Pengumuman</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        Tambah Pengumuman
      </el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="Sambutan" name="sambutan" />
      <el-tab-pane label="Pengumuman" name="pengumuman" />
      <el-tab-pane label="Download" name="download" />
      <el-tab-pane label="Artikel" name="artikel" />
    </el-tabs>

    <div class="announcement-list">
      <el-card
        v-for="announcement in filteredAnnouncements"
        :key="announcement.id"
        class="announcement-card"
      >
        <div class="card-header">
          <h3>{{ announcement.title }}</h3>
          <el-switch
            v-model="announcement.is_active"
            @change="toggleActive(announcement)"
          />
        </div>

        <div class="content-preview">
          <p>{{ truncateText(announcement.content, 100) }}</p>
          <img
            v-if="announcement.image_url"
            :src="announcement.image_url"
            alt="Announcement image"
            class="preview-image"
          />
        </div>

        <div class="actions">
          <el-button @click="editAnnouncement(announcement)">
            Edit
          </el-button>
          <el-button type="danger" @click="deleteAnnouncement(announcement)">
            Hapus
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="Pengumuman Baru"
      width="800px"
    >
      <el-form :model="announcementForm" label-width="120px">
        <el-form-item label="Tipe">
          <el-select v-model="announcementForm.type">
            <el-option label="Sambutan" value="sambutan" />
            <el-option label="Pengumuman" value="pengumuman" />
            <el-option label="Download" value="download" />
            <el-option label="Artikel" value="artikel" />
          </el-select>
        </el-form-item>

        <el-form-item label="Judul">
          <el-input v-model="announcementForm.title" />
        </el-form-item>

        <el-form-item label="Konten">
          <el-input
            v-model="announcementForm.content"
            type="textarea"
            :rows="6"
          />
        </el-form-item>

        <el-form-item label="Gambar">
          <el-upload
            ref="uploadRef"
            :on-change="handleFileChange"
            :auto-upload="false"
            :show-file-list="false"
          >
            <el-button type="primary">Pilih Gambar</el-button>
          </el-upload>
          <img
            v-if="imagePreview"
            :src="imagePreview"
            alt="Preview"
            class="image-preview"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">Batal</el-button>
        <el-button type="primary" @click="saveAnnouncement">
          Simpan
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAnnouncementStore } from '@/stores/announcements'

const announcementStore = useAnnouncementStore()
const activeTab = ref('sambutan')
const showCreateDialog = ref(false)
const announcementForm = ref({
  title: '',
  content: '',
  type: 'sambutan',
  image: null
})
const imagePreview = ref('')

const filteredAnnouncements = computed(() => {
  return announcementStore.announcements.filter(
    announcement => announcement.type === activeTab.value
  )
})

const handleTabClick = () => {
  // Load announcements for selected type
  announcementStore.fetchAnnouncements(activeTab.value)
}

const handleFileChange = (file) => {
  announcementForm.value.image = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const saveAnnouncement = async () => {
  try {
    const formData = new FormData()
    formData.append('title', announcementForm.value.title)
    formData.append('content', announcementForm.value.content)
    formData.append('type', announcementForm.value.type)
    if (announcementForm.value.image) {
      formData.append('image', announcementForm.value.image)
    }

    await announcementStore.createAnnouncement(formData)
    showCreateDialog.value = false
    await announcementStore.fetchAnnouncements(activeTab.value)
  } catch (error) {
    console.error('Error saving announcement:', error)
  }
}

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>
```

#### 4. User Block Management Component
```vue
<template>
  <div class="user-management">
    <div class="header">
      <h2>Manajemen User</h2>
      <el-input
        v-model="searchQuery"
        placeholder="Cari user..."
        style="width: 300px"
      />
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Semua User" name="all" />
      <el-tab-pane label="User Diblokir" name="blocked" />
    </el-tabs>

    <div class="user-list">
      <el-card
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-card"
      >
        <div class="user-info">
          <div class="avatar">
            <img :src="user.avatar" :alt="user.name" />
          </div>
          <div class="details">
            <h3>{{ user.name }}</h3>
            <p>{{ user.email }}</p>
            <el-tag :type="user.role === 'kader' ? 'success' : 'info'">
              {{ user.role }}
            </el-tag>
            <p v-if="user.device_ip" class="ip-info">
              IP: {{ user.device_ip }}
            </p>
          </div>
        </div>

        <div class="status">
          <el-tag :type="user.is_blocked ? 'danger' : 'success'">
            {{ user.is_blocked ? 'Diblokir' : 'Aktif' }}
          </el-tag>
          <p v-if="user.blocked_at" class="block-date">
            Diblokir: {{ formatDate(user.blocked_at) }}
          </p>
        </div>

        <div class="actions">
          <el-button
            v-if="!user.is_blocked"
            type="danger"
            @click="showBlockDialog(user)"
          >
            Blokir
          </el-button>
          <el-button
            v-else
            type="success"
            @click="unblockUser(user.id)"
          >
            Copot Blokir
          </el-button>
          <el-button @click="viewUserDetails(user)">
            Detail
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Block Dialog -->
    <el-dialog
      v-model="showBlockDialogVisible"
      title="Blokir User"
      width="500px"
    >
      <el-form :model="blockForm" label-width="120px">
        <el-form-item label="Alasan Blokir">
          <el-input
            v-model="blockForm.reason"
            type="textarea"
            :rows="3"
            placeholder="Masukkan alasan blokir..."
          />
        </el-form-item>
        <el-form-item label="Blokir IP juga?">
          <el-switch v-model="blockForm.blockIp" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBlockDialogVisible = false">Batal</el-button>
        <el-button type="danger" @click="confirmBlock">
          Blokir User
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/users'

const userStore = useUserStore()
const activeTab = ref('all')
const searchQuery = ref('')
const showBlockDialogVisible = ref(false)
const selectedUser = ref(null)
const blockForm = ref({
  reason: '',
  blockIp: false
})

const filteredUsers = computed(() => {
  let users = activeTab.value === 'blocked'
    ? userStore.blockedUsers
    : userStore.allUsers

  if (searchQuery.value) {
    users = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return users
})

const showBlockDialog = (user) => {
  selectedUser.value = user
  blockForm.value = { reason: '', blockIp: false }
  showBlockDialogVisible.value = true
}

const confirmBlock = async () => {
  try {
    await userStore.blockUser({
      userId: selectedUser.value.id,
      reason: blockForm.value.reason,
      blockIp: blockForm.value.blockIp
    })
    showBlockDialogVisible.value = false
  } catch (error) {
    console.error('Error blocking user:', error)
  }
}

const unblockUser = async (userId) => {
  try {
    await userStore.unblockUser(userId)
  } catch (error) {
    console.error('Error unblocking user:', error)
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('id-ID')
}
</script>
```

---

## 📱 Frontend Mobile Updates

### 1. New API Integrations

#### Agenda Calendar Integration
```typescript
// services/agendaService.ts
export const getAgendaByMonth = async (year: number, month: number) => {
  const response = await api.get(`/api/agenda?month=${year}-${month.toString().padStart(2, '0')}`);
  return response.data;
};

// In calendar component
const loadAgendaForMonth = async (date: Date) => {
  const agendas = await getAgendaByMonth(date.getFullYear(), date.getMonth() + 1);
  // Update calendar events
  setCalendarEvents(agendas.map(agenda => ({
    id: agenda.id,
    title: agenda.title,
    date: agenda.date,
    time: agenda.time,
    location: agenda.location,
    description: agenda.description
  })));
};
```

#### Announcement Integration
```typescript
// services/announcementService.ts
export const getAnnouncements = async (type?: string) => {
  const params = type ? { type } : {};
  const response = await api.get('/api/announcements', { params });
  return response.data;
};

// In My Gerindra screen
const loadAnnouncements = async () => {
  const [sambutan, pengumuman, downloads] = await Promise.all([
    getAnnouncements('sambutan'),
    getAnnouncements('pengumuman'),
    getAnnouncements('download')
  ]);

  setSambutan(sambutan);
  setPengumuman(pengumuman);
  setDownloads(downloads);
};
```

### 2. Registration Updates

#### Add Device IP Capture
```typescript
// In registration screen
import DeviceInfo from 'react-native-device-info';

const getDeviceIP = async () => {
  // For iOS
  if (Platform.OS === 'ios') {
    // iOS doesn't allow direct IP access, use a workaround
    return 'ios-device'; // Or implement server-side IP detection
  }

  // For Android - use react-native-network-info
  const { NetworkInfo } = require('react-native-network-info');
  const ipAddress = await NetworkInfo.getIPV4Address();
  return ipAddress;
};

// In registration form
const handleRegistration = async (formData) => {
  const deviceIP = await getDeviceIP();

  const registrationData = {
    ...formData,
    device_ip: deviceIP
  };

  await registerUser(registrationData);
};
```

### 3. User Status Checks

#### Add Block Status Check
```typescript
// services/authService.ts
export const checkUserStatus = async () => {
  const response = await api.get('/api/auth/me');
  const user = response.data.data;

  if (user.is_blocked) {
    // Handle blocked user
    await logoutUser();
    Alert.alert('Akun Diblokir', 'Akun Anda telah diblokir oleh admin.');
    return false;
  }

  return true;
};

// Check on app launch
const initializeApp = async () => {
  const isUserValid = await checkUserStatus();
  if (!isUserValid) {
    // Redirect to login
  }
};
```

### 4. UI Updates

#### Agenda Calendar Screen
```tsx
// screens/AgendaScreen.tsx
import { Calendar } from 'react-native-calendars';
import { useAgenda } from '../hooks/useAgenda';

const AgendaScreen = () => {
  const { agendas, loadAgendaForMonth } = useAgenda();

  const markedDates = agendas.reduce((acc, agenda) => {
    acc[agenda.date] = {
      marked: true,
      dotColor: '#e74c3c',
      selectedColor: '#e74c3c'
    };
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onMonthChange={(month) => loadAgendaForMonth(month)}
        onDayPress={(day) => {
          const agendaForDay = agendas.filter(a => a.date === day.dateString);
          if (agendaForDay.length > 0) {
            // Show agenda details
            showAgendaDetails(agendaForDay);
          }
        }}
      />

      <FlatList
        data={agendas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AgendaCard agenda={item} />
        )}
      />
    </View>
  );
};
```

#### My Gerindra Screen Updates
```tsx
// screens/MyGerindraScreen.tsx
import { useAnnouncements } from '../hooks/useAnnouncements';

const MyGerindraScreen = () => {
  const { sambutan, pengumuman, downloads, loadAnnouncements } = useAnnouncements();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Sambutan Section */}
      <Section title="Sambutan">
        {sambutan.map(item => (
          <AnnouncementCard key={item.id} item={item} />
        ))}
      </Section>

      {/* Pengumuman Section */}
      <Section title="Pengumuman">
        {pengumuman.map(item => (
          <AnnouncementCard key={item.id} item={item} />
        ))}
      </Section>

      {/* Download Section */}
      <Section title="Download">
        {downloads.map(item => (
          <DownloadCard key={item.id} item={item} />
        ))}
      </Section>
    </ScrollView>
  );
};
```

### 5. Error Handling Updates

#### Handle Blocked User
```typescript
// utils/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response?.status === 403) {
    const message = error.response.data.message;
    if (message.includes('blocked')) {
      // User is blocked
      logoutUser();
      Alert.alert('Akun Diblokir', 'Akun Anda telah diblokir oleh admin.');
      return;
    }
  }

  // Handle other errors
  Alert.alert('Error', error.response?.data?.message || 'Terjadi kesalahan');
};
```

---

## 🗄️ Database Schema Changes

### Migration Scripts

```sql
-- Migration: Add kader confirmation fields
ALTER TABLE users ADD COLUMN kader_point_1_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN kader_point_1_confirmed_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN kader_point_1_confirmed_by INT NULL;

ALTER TABLE users ADD COLUMN kader_point_2_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN kader_point_2_confirmed_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN kader_point_2_confirmed_by INT NULL;

-- Migration: Add device IP and block fields
ALTER TABLE users ADD COLUMN device_ip VARCHAR(45) NULL;
ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN blocked_by INT NULL;
ALTER TABLE users ADD COLUMN block_reason TEXT NULL;

-- Migration: Create agendas table
CREATE TABLE agendas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NULL,
  location VARCHAR(255),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Migration: Create announcements table
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  image_url VARCHAR(500),
  type ENUM('sambutan', 'pengumuman', 'download', 'artikel') DEFAULT 'pengumuman',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_users_device_ip ON users(device_ip);
CREATE INDEX idx_users_is_blocked ON users(is_blocked);
CREATE INDEX idx_agendas_date ON agendas(date);
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_active ON announcements(is_active);
```

---

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Add kader confirmation fields to User model
- [ ] Create Agenda model and APIs
- [ ] Create Announcement model and APIs
- [ ] Add user blocking APIs
- [ ] Update KTA confirmation logic
- [ ] Add file upload for announcements
- [ ] Update authentication middleware

### Frontend Web (Vue.js) Tasks
- [ ] Setup Vue.js project with required dependencies
- [ ] Create admin authentication system
- [ ] Implement kader confirmation interface
- [ ] Build agenda calendar management
- [ ] Create announcement management with rich text editor
- [ ] Develop user blocking interface
- [ ] Add file upload functionality
- [ ] Implement responsive design

### Frontend Mobile Tasks
- [ ] Add device IP capture on registration
- [ ] Implement agenda calendar display
- [ ] Add My Gerindra announcement display
- [ ] Update user status checks
- [ ] Handle blocked user scenarios
- [ ] Add error handling for blocked users
- [ ] Update navigation and UI

### Testing Tasks
- [ ] Test kader confirmation workflow
- [ ] Test agenda creation and display
- [ ] Test announcement posting and viewing
- [ ] Test user blocking functionality
- [ ] Test file upload and display
- [ ] Test mobile calendar integration
- [ ] Test blocked user handling

---

## 🚀 Next Steps

1. **Start with Backend**: Implement database schema and APIs
2. **Build Web Admin**: Create Vue.js admin panel
3. **Update Mobile App**: Integrate new features
4. **Testing**: Comprehensive testing of all features
5. **Deployment**: Deploy web admin and update mobile apps

---

**Date:** February 9, 2026
**Version:** 2.0 - Admin Web Panel & Mobile Updates
