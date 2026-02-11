# 🗳️ VOTING SYSTEM - COMPLETE API DOCUMENTATION

**Date:** February 11, 2026  
**Backend Version:** v1.0.0  
**Base URL (Development):** `http://localhost:3030/api`  
**Base URL (Production):** `https://api.mygerindra.com/api`

---

## 📋 **OVERVIEW**

Sistem Voting memungkinkan:
- ✅ **Admin Web** membuat voting dan mengelola hasil
- ✅ **Kader Mobile** menjawab voting di aplikasi mobile
- ✅ **Single Choice** atau **Multiple Choice** voting
- ✅ Pertanyaan dan jawaban bisa berisi **text + gambar**
- ✅ **Time limit** - voting ada deadline
- ✅ **1 kader = 1 vote** per voting (no duplicate)
- ✅ Admin bisa **perpanjang deadline**
- ✅ **Log admin** yang create voting

---

## 🗂️ **DATABASE SCHEMA**

### **`votings` Table**
```sql
id                INT PRIMARY KEY
uuid              VARCHAR(36) UNIQUE
title             VARCHAR(255)        -- Judul voting
question          TEXT                -- Pertanyaan voting
questionImageUrl  VARCHAR(500)        -- Gambar pertanyaan (optional)
votingType        ENUM('single', 'multiple')  -- Jenis voting
deadline          TIMESTAMP           -- Batas waktu voting
isActive          BOOLEAN DEFAULT TRUE
createdBy         INT                 -- Admin yang create
createdAt         TIMESTAMP
updatedAt         TIMESTAMP
```

### **`voting_options` Table**
```sql
id              INT PRIMARY KEY
votingId        INT FOREIGN KEY
optionText      VARCHAR(500)        -- Text jawaban
optionImageUrl  VARCHAR(500)        -- Gambar jawaban (optional)
orderIndex      INT                 -- Urutan tampilan
createdAt       TIMESTAMP
```

### **`voting_responses` Table**
```sql
id              INT PRIMARY KEY
votingId        INT FOREIGN KEY
userId          INT                 -- Kader yang voting
selectedOptions JSON                -- Array: [1, 3] atau [2]
answeredAt      TIMESTAMP

UNIQUE(votingId, userId)  -- 1 user hanya bisa vote 1x
```

---

## 🔐 **AUTHENTICATION**

### **Admin (Web)**
```javascript
// Login sebagai admin
POST /api/auth/login
{
  "identifier": "admin@example.com",
  "password": "Admin123!"
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "name": "Admin", "roles": [{"role": "admin"}] }
  }
}
```

### **Kader (Mobile)**
```javascript
// Login sebagai kader
POST /api/auth/login
{
  "identifier": "kader@example.com",
  "password": "Kader123!"
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 5, "name": "Kader User", "roles": [{"role": "kader"}] }
  }
}
```

### **Authorization Header**
Semua endpoint memerlukan header:
```
Authorization: Bearer <accessToken>
```

---

## 🌐 **WEB ADMIN ENDPOINTS**

> ⚠️ **CATATAN:** Semua endpoint Admin memerlukan role **admin**

---

### **1. Create Voting**
**Target:** Admin Web Panel  
**Endpoint:** `POST /api/voting`  
**Access:** Admin only

**Request Body:**
```json
{
  "title": "Pemilihan Ketua DPD",
  "question": "Siapa calon ketua DPD Jakarta yang Anda pilih?",
  "questionImageUrl": "https://example.com/images/candidates.jpg",
  "votingType": "single",
  "deadline": "2026-02-20T23:59:59.000Z",
  "options": [
    {
      "optionText": "Budi Santoso",
      "optionImageUrl": "https://example.com/images/budi.jpg"
    },
    {
      "optionText": "Ahmad Hidayat",
      "optionImageUrl": "https://example.com/images/ahmad.jpg"
    },
    {
      "optionText": "Siti Nurhaliza",
      "optionImageUrl": null
    }
  ]
}
```

**Field Descriptions:**
- `title` (required): Judul voting (max 255 char)
- `question` (required): Pertanyaan voting
- `questionImageUrl` (optional): URL gambar pertanyaan
- `votingType` (required): `"single"` atau `"multiple"`
  - `single`: Kader hanya bisa pilih 1 jawaban
  - `multiple`: Kader bisa pilih beberapa jawaban
- `deadline` (required): Batas waktu voting (ISO 8601 format)
- `options` (required): Array opsi jawaban (minimal 2)
  - `optionText` (required): Text jawaban
  - `optionImageUrl` (optional): URL gambar jawaban

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Voting created successfully",
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pemilihan Ketua DPD",
    "question": "Siapa calon ketua DPD Jakarta yang Anda pilih?",
    "questionImageUrl": "https://example.com/images/candidates.jpg",
    "votingType": "single",
    "deadline": "2026-02-20T23:59:59.000Z",
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2026-02-11T09:30:00.000Z",
    "updatedAt": "2026-02-11T09:30:00.000Z",
    "options": [
      {
        "id": 1,
        "votingId": 1,
        "optionText": "Budi Santoso",
        "optionImageUrl": "https://example.com/images/budi.jpg",
        "orderIndex": 0
      },
      {
        "id": 2,
        "votingId": 1,
        "optionText": "Ahmad Hidayat",
        "optionImageUrl": "https://example.com/images/ahmad.jpg",
        "orderIndex": 1
      },
      {
        "id": 3,
        "votingId": 1,
        "optionText": "Siti Nurhaliza",
        "optionImageUrl": null,
        "orderIndex": 2
      }
    ]
  }
}
```

**Vue.js Example:**
```javascript
// composables/useVoting.js
import apiClient from '@/api/axios';

export const useVoting = () => {
  const createVoting = async (formData) => {
    try {
      const { data } = await apiClient.post('/voting', formData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  return { createVoting };
};

// Component usage
<script setup>
import { ref } from 'vue';
import { useVoting } from '@/composables/useVoting';

const { createVoting } = useVoting();

const form = ref({
  title: '',
  question: '',
  questionImageUrl: '',
  votingType: 'single',
  deadline: '',
  options: [
    { optionText: '', optionImageUrl: '' },
    { optionText: '', optionImageUrl: '' }
  ]
});

const submitVoting = async () => {
  try {
    const result = await createVoting(form.value);
    alert('Voting berhasil dibuat!');
  } catch (error) {
    alert('Gagal: ' + error.message);
  }
};
</script>
```

---

### **2. Get All Votings**
**Target:** Admin Web Panel  
**Endpoint:** `GET /api/voting`  
**Access:** Admin only

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by status (`true` | `false`)
- `search` (optional): Search by title or question

**Request:**
```
GET /api/voting?page=1&limit=20&isActive=true&search=ketua
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Pemilihan Ketua DPD",
      "question": "Siapa calon ketua DPD Jakarta yang Anda pilih?",
      "questionImageUrl": "https://example.com/images/candidates.jpg",
      "votingType": "single",
      "deadline": "2026-02-20T23:59:59.000Z",
      "isActive": true,
      "createdBy": 1,
      "createdAt": "2026-02-11T09:30:00.000Z",
      "updatedAt": "2026-02-11T09:30:00.000Z",
      "options": [
        {
          "id": 1,
          "optionText": "Budi Santoso",
          "optionImageUrl": "https://example.com/images/budi.jpg",
          "orderIndex": 0
        },
        {
          "id": 2,
          "optionText": "Ahmad Hidayat",
          "optionImageUrl": "https://example.com/images/ahmad.jpg",
          "orderIndex": 1
        }
      ],
      "totalResponses": 150,
      "isExpired": false
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

**Vue.js Example:**
```javascript
const fetchVotings = async (filters = {}) => {
  const { data } = await apiClient.get('/voting', { params: filters });
  return data;
};

// Usage
const votings = ref([]);
const pagination = ref({});

const loadVotings = async () => {
  const result = await fetchVotings({ page: 1, limit: 20, isActive: true });
  votings.value = result.data;
  pagination.value = result.pagination;
};
```

---

### **3. Get Voting Detail with Statistics**
**Target:** Admin Web Panel  
**Endpoint:** `GET /api/voting/:id`  
**Access:** Admin only

**Request:**
```
GET /api/voting/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pemilihan Ketua DPD",
    "question": "Siapa calon ketua DPD Jakarta yang Anda pilih?",
    "questionImageUrl": "https://example.com/images/candidates.jpg",
    "votingType": "single",
    "deadline": "2026-02-20T23:59:59.000Z",
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2026-02-11T09:30:00.000Z",
    "updatedAt": "2026-02-11T09:30:00.000Z",
    "options": [
      {
        "id": 1,
        "optionText": "Budi Santoso",
        "optionImageUrl": "https://example.com/images/budi.jpg",
        "orderIndex": 0,
        "voteCount": 85,
        "percentage": "56.67"
      },
      {
        "id": 2,
        "optionText": "Ahmad Hidayat",
        "optionImageUrl": "https://example.com/images/ahmad.jpg",
        "orderIndex": 1,
        "voteCount": 50,
        "percentage": "33.33"
      },
      {
        "id": 3,
        "optionText": "Siti Nurhaliza",
        "optionImageUrl": null,
        "orderIndex": 2,
        "voteCount": 15,
        "percentage": "10.00"
      }
    ],
    "totalResponses": 150,
    "isExpired": false
  }
}
```

**Untuk Chart/Graph:**
```javascript
const chartData = {
  labels: data.options.map(opt => opt.optionText),
  datasets: [{
    label: 'Votes',
    data: data.options.map(opt => opt.voteCount),
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
  }]
};
```

---

### **4. Update Voting**
**Target:** Admin Web Panel  
**Endpoint:** `PUT /api/voting/:id`  
**Access:** Admin only

**Request Body (all fields optional):**
```json
{
  "title": "Pemilihan Ketua DPD (Updated)",
  "question": "Updated question text",
  "questionImageUrl": "https://example.com/new-image.jpg",
  "votingType": "multiple",
  "deadline": "2026-02-25T23:59:59.000Z",
  "isActive": false,
  "options": [
    {
      "optionText": "New Option 1",
      "optionImageUrl": null
    },
    {
      "optionText": "New Option 2",
      "optionImageUrl": "https://example.com/option2.jpg"
    }
  ]
}
```

**⚠️ IMPORTANT:** 
- Jika `options` disertakan, semua opsi lama akan **diganti** dengan yang baru
- Voting yang sudah ada responses tetap bisa diupdate (hati-hati!)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Voting updated successfully",
  "data": {
    "id": 1,
    "title": "Pemilihan Ketua DPD (Updated)",
    // ... updated data with statistics
  }
}
```

---

### **5. Extend Voting Deadline**
**Target:** Admin Web Panel  
**Endpoint:** `PATCH /api/voting/:id/extend`  
**Access:** Admin only

**Use Case:** Admin ingin memperpanjang waktu voting karena partisipasi rendah atau ada permintaan dari kader.

**Request Body:**
```json
{
  "deadline": "2026-03-01T23:59:59.000Z"
}
```

**Request:**
```
PATCH /api/voting/1/extend
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Voting deadline extended successfully",
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pemilihan Ketua DPD",
    "deadline": "2026-03-01T23:59:59.000Z",
    // ... other fields
  }
}
```

**Vue.js Example:**
```javascript
const extendDeadline = async (votingId, newDeadline) => {
  const { data } = await apiClient.patch(`/voting/${votingId}/extend`, {
    deadline: newDeadline
  });
  return data;
};

// Usage in component
const handleExtend = async () => {
  const newDate = '2026-03-01T23:59:59.000Z';
  await extendDeadline(votingId, newDate);
  alert('Deadline berhasil diperpanjang!');
};
```

---

### **6. Delete Voting**
**Target:** Admin Web Panel  
**Endpoint:** `DELETE /api/voting/:id`  
**Access:** Admin only

**Request:**
```
DELETE /api/voting/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Voting deleted successfully"
}
```

**⚠️ WARNING:** Delete akan menghapus:
- Voting record
- Semua voting options (CASCADE)
- Semua voting responses (CASCADE)

---

### **7. Get Voting Results**
**Target:** Admin Web Panel  
**Endpoint:** `GET /api/voting/:id/results`  
**Access:** Admin only

**Request:**
```
GET /api/voting/1/results
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "voting": {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Pemilihan Ketua DPD",
      "question": "Siapa calon ketua DPD Jakarta yang Anda pilih?",
      "votingType": "single",
      "deadline": "2026-02-20T23:59:59.000Z",
      "isExpired": false,
      "totalResponses": 150
    },
    "options": [
      {
        "id": 1,
        "optionText": "Budi Santoso",
        "voteCount": 85,
        "percentage": "56.67"
      },
      {
        "id": 2,
        "optionText": "Ahmad Hidayat",
        "voteCount": 50,
        "percentage": "33.33"
      },
      {
        "id": 3,
        "optionText": "Siti Nurhaliza",
        "voteCount": 15,
        "percentage": "10.00"
      }
    ],
    "responseDetails": [
      {
        "userId": 5,
        "selectedOptions": [1],
        "answeredAt": "2026-02-11T10:00:00.000Z"
      },
      {
        "userId": 7,
        "selectedOptions": [1],
        "answeredAt": "2026-02-11T10:05:00.000Z"
      }
      // ... 148 more responses
    ]
  }
}
```

**Use Case:** 
- Export ke Excel/PDF
- Analisis statistik detail
- Audit trail siapa voting apa

---

### **8. Get Voting Statistics**
**Target:** Admin Dashboard  
**Endpoint:** `GET /api/voting/stats`  
**Access:** Admin only

**Request:**
```
GET /api/voting/stats
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 10,
    "expired": 15,
    "totalResponses": 3450
  }
}
```

**Vue.js Dashboard Example:**
```vue
<template>
  <div class="stats-grid">
    <StatCard 
      title="Total Voting" 
      :value="stats.total"
      icon="ballot"
    />
    <StatCard 
      title="Active Voting" 
      :value="stats.active"
      icon="check-circle"
      color="green"
    />
    <StatCard 
      title="Expired Voting" 
      :value="stats.expired"
      icon="clock"
      color="gray"
    />
    <StatCard 
      title="Total Responses" 
      :value="stats.totalResponses"
      icon="users"
      color="blue"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api/axios';

const stats = ref({});

onMounted(async () => {
  const { data } = await apiClient.get('/voting/stats');
  stats.value = data.data;
});
</script>
```

---

## 📱 **MOBILE APP ENDPOINTS (KADER ONLY)**

> ⚠️ **CATATAN:** Semua endpoint Mobile memerlukan role **kader**

---

### **9. Get Active Votings**
**Target:** Mobile App - Home Screen  
**Endpoint:** `GET /api/voting/active`  
**Access:** Kader only

**UI Flow:**
1. Kader buka aplikasi
2. Di beranda ada menu/button "Voting" 
3. Klik menu → masuk halaman list voting
4. API ini dipanggil untuk load list voting

**Request:**
```
GET /api/voting/active
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Pemilihan Ketua DPD",
      "question": "Siapa calon ketua DPD Jakarta yang Anda pilih?",
      "questionImageUrl": "https://example.com/images/candidates.jpg",
      "votingType": "single",
      "deadline": "2026-02-20T23:59:59.000Z",
      "isActive": true,
      "createdAt": "2026-02-11T09:30:00.000Z",
      "options": [
        {
          "id": 1,
          "optionText": "Budi Santoso",
          "optionImageUrl": "https://example.com/images/budi.jpg",
          "orderIndex": 0
        },
        {
          "id": 2,
          "optionText": "Ahmad Hidayat",
          "optionImageUrl": "https://example.com/images/ahmad.jpg",
          "orderIndex": 1
        }
      ],
      "totalResponses": 150,
      "hasVoted": false
    },
    {
      "id": 2,
      "uuid": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Program Prioritas 2026",
      "question": "Pilih program prioritas yang harus dikerjakan tahun ini",
      "questionImageUrl": null,
      "votingType": "multiple",
      "deadline": "2026-02-25T23:59:59.000Z",
      "isActive": true,
      "createdAt": "2026-02-11T10:00:00.000Z",
      "options": [
        {
          "id": 4,
          "optionText": "Pembangunan Infrastruktur",
          "optionImageUrl": null,
          "orderIndex": 0
        },
        {
          "id": 5,
          "optionText": "Kesehatan Gratis",
          "optionImageUrl": null,
          "orderIndex": 1
        },
        {
          "id": 6,
          "optionText": "Pendidikan Murah",
          "optionImageUrl": null,
          "orderIndex": 2
        }
      ],
      "totalResponses": 85,
      "hasVoted": true
    }
  ],
  "count": 2
}
```

**Key Fields:**
- `hasVoted`: `true` jika kader sudah voting, `false` jika belum
- `votingType`: 
  - `"single"` → UI: Radio button (pilih 1)
  - `"multiple"` → UI: Checkbox (pilih banyak)

**Flutter Example:**
```dart
// lib/services/voting_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/environment.dart';

class VotingService {
  static Future<List<Voting>> getActiveVotings() async {
    final token = await getToken(); // From SharedPreferences
    
    final response = await http.get(
      Uri.parse('${Environment.apiBaseUrl}/voting/active'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((json) => Voting.fromJson(json))
          .toList();
    } else {
      throw Exception('Failed to load votings');
    }
  }
}

// lib/screens/voting_list_screen.dart
import 'package:flutter/material.dart';
import '../services/voting_service.dart';

class VotingListScreen extends StatefulWidget {
  @override
  _VotingListScreenState createState() => _VotingListScreenState();
}

class _VotingListScreenState extends State<VotingListScreen> {
  List<Voting> votings = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadVotings();
  }

  Future<void> loadVotings() async {
    try {
      final data = await VotingService.getActiveVotings();
      setState(() {
        votings = data;
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal memuat voting: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Voting')),
      body: loading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: loadVotings,
              child: ListView.builder(
                itemCount: votings.length,
                itemBuilder: (context, index) {
                  final voting = votings[index];
                  return Card(
                    margin: EdgeInsets.all(16),
                    child: ListTile(
                      leading: voting.hasVoted
                          ? Icon(Icons.check_circle, color: Colors.green)
                          : Icon(Icons.ballot, color: Colors.orange),
                      title: Text(
                        voting.title,
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(height: 4),
                          Text(voting.question, maxLines: 2),
                          SizedBox(height: 4),
                          Text(
                            'Deadline: ${formatDate(voting.deadline)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                          if (voting.hasVoted)
                            Chip(
                              label: Text('Sudah Voting'),
                              backgroundColor: Colors.green[100],
                            ),
                        ],
                      ),
                      trailing: Icon(Icons.arrow_forward_ios),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => VotingDetailScreen(
                              votingId: voting.id,
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
    );
  }
}
```

---

### **10. Get Voting Detail**
**Target:** Mobile App - Detail Voting  
**Endpoint:** `GET /api/voting/:id/detail`  
**Access:** Kader only

**Request:**
```
GET /api/voting/1/detail
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pemilihan Ketua DPD",
    "question": "Siapa calon ketua DPD Jakarta yang Anda pilih?",
    "questionImageUrl": "https://example.com/images/candidates.jpg",
    "votingType": "single",
    "deadline": "2026-02-20T23:59:59.000Z",
    "isActive": true,
    "createdAt": "2026-02-11T09:30:00.000Z",
    "options": [
      {
        "id": 1,
        "votingId": 1,
        "optionText": "Budi Santoso",
        "optionImageUrl": "https://example.com/images/budi.jpg",
        "orderIndex": 0
      },
      {
        "id": 2,
        "votingId": 1,
        "optionText": "Ahmad Hidayat",
        "optionImageUrl": "https://example.com/images/ahmad.jpg",
        "orderIndex": 1
      },
      {
        "id": 3,
        "votingId": 1,
        "optionText": "Siti Nurhaliza",
        "optionImageUrl": null,
        "orderIndex": 2
      }
    ],
    "totalResponses": 150,
    "hasVoted": false,
    "userSelectedOptions": null,
    "isExpired": false
  }
}
```

**If User Already Voted:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Program Prioritas 2026",
    "votingType": "multiple",
    // ... other fields
    "hasVoted": true,
    "userSelectedOptions": [4, 6],
    "isExpired": false
  }
}
```

**Flutter Detail Screen Example:**
```dart
// lib/screens/voting_detail_screen.dart
class VotingDetailScreen extends StatefulWidget {
  final int votingId;
  
  VotingDetailScreen({required this.votingId});

  @override
  _VotingDetailScreenState createState() => _VotingDetailScreenState();
}

class _VotingDetailScreenState extends State<VotingDetailScreen> {
  Voting? voting;
  List<int> selectedOptions = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadVotingDetail();
  }

  Future<void> loadVotingDetail() async {
    try {
      final data = await VotingService.getVotingDetail(widget.votingId);
      setState(() {
        voting = data;
        loading = false;
        
        // If already voted, show selected options
        if (data.hasVoted && data.userSelectedOptions != null) {
          selectedOptions = List<int>.from(data.userSelectedOptions);
        }
      });
    } catch (e) {
      setState(() => loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal memuat detail: $e')),
      );
    }
  }

  void toggleOption(int optionId) {
    if (voting == null || voting!.hasVoted) return;

    setState(() {
      if (voting!.votingType == 'single') {
        // Single choice: replace selection
        selectedOptions = [optionId];
      } else {
        // Multiple choice: toggle
        if (selectedOptions.contains(optionId)) {
          selectedOptions.remove(optionId);
        } else {
          selectedOptions.add(optionId);
        }
      }
    });
  }

  Future<void> submitVote() async {
    if (selectedOptions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Pilih minimal 1 opsi')),
      );
      return;
    }

    try {
      await VotingService.submitVote(widget.votingId, selectedOptions);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Voting berhasil!'), backgroundColor: Colors.green),
      );
      
      // Reload detail to show "Sudah voting"
      loadVotingDetail();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal submit: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(title: Text('Loading...')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (voting == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Error')),
        body: Center(child: Text('Voting tidak ditemukan')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(voting!.title)),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question Image
            if (voting!.questionImageUrl != null)
              Image.network(
                voting!.questionImageUrl!,
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            
            SizedBox(height: 16),
            
            // Question Text
            Text(
              voting!.question,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            
            SizedBox(height: 8),
            
            // Info
            Row(
              children: [
                Icon(Icons.access_time, size: 16, color: Colors.grey),
                SizedBox(width: 4),
                Text(
                  'Deadline: ${formatDate(voting!.deadline)}',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
            
            SizedBox(height: 4),
            
            Row(
              children: [
                Icon(Icons.people, size: 16, color: Colors.grey),
                SizedBox(width: 4),
                Text(
                  '${voting!.totalResponses} orang sudah voting',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
            
            SizedBox(height: 16),
            
            // Voting Type Info
            Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    voting!.votingType == 'single' 
                      ? Icons.radio_button_checked 
                      : Icons.check_box,
                    color: Colors.blue,
                  ),
                  SizedBox(width: 8),
                  Text(
                    voting!.votingType == 'single'
                      ? 'Pilih 1 jawaban'
                      : 'Bisa pilih lebih dari 1 jawaban',
                    style: TextStyle(color: Colors.blue[900]),
                  ),
                ],
              ),
            ),
            
            SizedBox(height: 16),
            
            // Options
            Text(
              'Pilihan:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            
            SizedBox(height: 8),
            
            ...voting!.options.map((option) {
              final isSelected = selectedOptions.contains(option.id);
              final isDisabled = voting!.hasVoted || voting!.isExpired;
              
              return Card(
                margin: EdgeInsets.only(bottom: 12),
                color: isDisabled 
                  ? Colors.grey[200]
                  : (isSelected ? Colors.blue[50] : Colors.white),
                child: InkWell(
                  onTap: isDisabled ? null : () => toggleOption(option.id),
                  child: Padding(
                    padding: EdgeInsets.all(12),
                    child: Row(
                      children: [
                        // Checkbox/Radio
                        voting!.votingType == 'single'
                          ? Icon(
                              isSelected 
                                ? Icons.radio_button_checked 
                                : Icons.radio_button_unchecked,
                              color: isDisabled ? Colors.grey : Colors.blue,
                            )
                          : Icon(
                              isSelected 
                                ? Icons.check_box 
                                : Icons.check_box_outline_blank,
                              color: isDisabled ? Colors.grey : Colors.blue,
                            ),
                        
                        SizedBox(width: 12),
                        
                        // Option Image (if exists)
                        if (option.optionImageUrl != null) ...[
                          Image.network(
                            option.optionImageUrl!,
                            width: 50,
                            height: 50,
                            fit: BoxFit.cover,
                          ),
                          SizedBox(width: 12),
                        ],
                        
                        // Option Text
                        Expanded(
                          child: Text(
                            option.optionText,
                            style: TextStyle(
                              fontSize: 16,
                              color: isDisabled ? Colors.grey : Colors.black,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
            
            SizedBox(height: 24),
            
            // Submit Button
            if (!voting!.hasVoted && !voting!.isExpired)
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: selectedOptions.isEmpty ? null : submitVote,
                  child: Text('Submit Voting', style: TextStyle(fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            
            // Already Voted Message
            if (voting!.hasVoted)
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green),
                ),
                child: Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Anda sudah voting pada voting ini',
                        style: TextStyle(color: Colors.green[900]),
                      ),
                    ),
                  ],
                ),
              ),
            
            // Expired Message
            if (voting!.isExpired)
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red),
                ),
                child: Row(
                  children: [
                    Icon(Icons.access_time, color: Colors.red),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Voting sudah ditutup',
                        style: TextStyle(color: Colors.red[900]),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
```

---

### **11. Submit Vote**
**Target:** Mobile App - Submit Voting  
**Endpoint:** `POST /api/voting/:id/vote`  
**Access:** Kader only

**Request:**
```
POST /api/voting/1/vote
```

**Request Body (Single Choice):**
```json
{
  "selectedOptions": [2]
}
```

**Request Body (Multiple Choice):**
```json
{
  "selectedOptions": [4, 6, 7]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Vote submitted successfully",
  "data": {
    "id": 150,
    "votingId": 1,
    "userId": 5,
    "selectedOptions": [2],
    "answeredAt": "2026-02-11T14:30:00.000Z"
  }
}
```

**Error Responses:**

**Already Voted (400):**
```json
{
  "success": false,
  "message": "You have already voted on this voting"
}
```

**Deadline Passed (400):**
```json
{
  "success": false,
  "message": "Voting deadline has passed"
}
```

**Invalid Option Count for Single Choice (400):**
```json
{
  "success": false,
  "message": "You can only select one option for this voting"
}
```

**Flutter Submit Example:**
```dart
// lib/services/voting_service.dart
static Future<void> submitVote(int votingId, List<int> selectedOptions) async {
  final token = await getToken();
  
  final response = await http.post(
    Uri.parse('${Environment.apiBaseUrl}/voting/$votingId/vote'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'selectedOptions': selectedOptions,
    }),
  );
  
  if (response.statusCode != 201) {
    final error = json.decode(response.body);
    throw Exception(error['message'] ?? 'Failed to submit vote');
  }
}
```

---

### **12. Get My Voting History**
**Target:** Mobile App - History Screen  
**Endpoint:** `GET /api/voting/my-votes`  
**Access:** Kader only

**Request:**
```
GET /api/voting/my-votes?page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 150,
      "votingId": 1,
      "voting": {
        "id": 1,
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Pemilihan Ketua DPD",
        "question": "Siapa calon ketua DPD Jakarta yang Anda pilih?",
        "questionImageUrl": "https://example.com/images/candidates.jpg",
        "votingType": "single",
        "deadline": "2026-02-20T23:59:59.000Z",
        "isExpired": false
      },
      "selectedOptions": [2],
      "selectedOptionsDetail": [
        {
          "id": 2,
          "optionText": "Ahmad Hidayat",
          "optionImageUrl": "https://example.com/images/ahmad.jpg",
          "orderIndex": 1
        }
      ],
      "answeredAt": "2026-02-11T14:30:00.000Z"
    },
    {
      "id": 85,
      "votingId": 2,
      "voting": {
        "id": 2,
        "uuid": "660e8400-e29b-41d4-a716-446655440001",
        "title": "Program Prioritas 2026",
        "question": "Pilih program prioritas yang harus dikerjakan tahun ini",
        "questionImageUrl": null,
        "votingType": "multiple",
        "deadline": "2026-02-25T23:59:59.000Z",
        "isExpired": false
      },
      "selectedOptions": [4, 6],
      "selectedOptionsDetail": [
        {
          "id": 4,
          "optionText": "Pembangunan Infrastruktur",
          "optionImageUrl": null,
          "orderIndex": 0
        },
        {
          "id": 6,
          "optionText": "Pendidikan Murah",
          "optionImageUrl": null,
          "orderIndex": 2
        }
      ],
      "answeredAt": "2026-02-11T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

**Flutter History Screen Example:**
```dart
// lib/screens/voting_history_screen.dart
class VotingHistoryScreen extends StatefulWidget {
  @override
  _VotingHistoryScreenState createState() => _VotingHistoryScreenState();
}

class _VotingHistoryScreenState extends State<VotingHistoryScreen> {
  List<VotingHistory> history = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadHistory();
  }

  Future<void> loadHistory() async {
    try {
      final data = await VotingService.getMyVotingHistory();
      setState(() {
        history = data;
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal memuat history: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('History Voting')),
      body: loading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: history.length,
              itemBuilder: (context, index) {
                final item = history[index];
                return Card(
                  margin: EdgeInsets.all(16),
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.voting.title,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Dijawab: ${formatDate(item.answeredAt)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Pilihan Anda:',
                          style: TextStyle(fontWeight: FontWeight.w500),
                        ),
                        SizedBox(height: 4),
                        ...item.selectedOptionsDetail.map((opt) => 
                          Padding(
                            padding: EdgeInsets.only(left: 8, top: 4),
                            child: Row(
                              children: [
                                Icon(Icons.check, size: 16, color: Colors.green),
                                SizedBox(width: 4),
                                Expanded(child: Text(opt.optionText)),
                              ],
                            ),
                          ),
                        ).toList(),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
```

---

## 🔄 **COMPLETE FLUTTER INTEGRATION**

### **Complete API Client**
```dart
// lib/services/voting_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/environment.dart';
import '../models/voting.dart';

class VotingService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  // Get active votings
  static Future<List<Voting>> getActiveVotings() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('${Environment.apiBaseUrl}/voting/active'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((json) => Voting.fromJson(json))
          .toList();
    } else {
      throw Exception('Failed to load active votings');
    }
  }

  // Get voting detail
  static Future<Voting> getVotingDetail(int votingId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('${Environment.apiBaseUrl}/voting/$votingId/detail'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Voting.fromJson(data['data']);
    } else {
      throw Exception('Failed to load voting detail');
    }
  }

  // Submit vote
  static Future<void> submitVote(int votingId, List<int> selectedOptions) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${Environment.apiBaseUrl}/voting/$votingId/vote'),
      headers: headers,
      body: json.encode({'selectedOptions': selectedOptions}),
    );

    if (response.statusCode != 201) {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Failed to submit vote');
    }
  }

  // Get voting history
  static Future<List<VotingHistory>> getMyVotingHistory() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('${Environment.apiBaseUrl}/voting/my-votes'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((json) => VotingHistory.fromJson(json))
          .toList();
    } else {
      throw Exception('Failed to load voting history');
    }
  }
}
```

### **Voting Model**
```dart
// lib/models/voting.dart
class Voting {
  final int id;
  final String uuid;
  final String title;
  final String question;
  final String? questionImageUrl;
  final String votingType; // 'single' or 'multiple'
  final DateTime deadline;
  final bool isActive;
  final List<VotingOption> options;
  final int totalResponses;
  final bool hasVoted;
  final List<int>? userSelectedOptions;
  final bool isExpired;

  Voting({
    required this.id,
    required this.uuid,
    required this.title,
    required this.question,
    this.questionImageUrl,
    required this.votingType,
    required this.deadline,
    required this.isActive,
    required this.options,
    required this.totalResponses,
    required this.hasVoted,
    this.userSelectedOptions,
    required this.isExpired,
  });

  factory Voting.fromJson(Map<String, dynamic> json) {
    return Voting(
      id: json['id'],
      uuid: json['uuid'],
      title: json['title'],
      question: json['question'],
      questionImageUrl: json['questionImageUrl'],
      votingType: json['votingType'],
      deadline: DateTime.parse(json['deadline']),
      isActive: json['isActive'],
      options: (json['options'] as List)
          .map((opt) => VotingOption.fromJson(opt))
          .toList(),
      totalResponses: json['totalResponses'],
      hasVoted: json['hasVoted'],
      userSelectedOptions: json['userSelectedOptions'] != null
          ? List<int>.from(json['userSelectedOptions'])
          : null,
      isExpired: json['isExpired'],
    );
  }
}

class VotingOption {
  final int id;
  final String optionText;
  final String? optionImageUrl;
  final int orderIndex;

  VotingOption({
    required this.id,
    required this.optionText,
    this.optionImageUrl,
    required this.orderIndex,
  });

  factory VotingOption.fromJson(Map<String, dynamic> json) {
    return VotingOption(
      id: json['id'],
      optionText: json['optionText'],
      optionImageUrl: json['optionImageUrl'],
      orderIndex: json['orderIndex'],
    );
  }
}
```

---

## ⚠️ **BUSINESS RULES & VALIDATION**

### **Backend Validation:**
1. ✅ Voting harus punya minimal 2 options
2. ✅ Single choice: user hanya bisa pilih 1 option
3. ✅ Multiple choice: user bisa pilih >= 1 option
4. ✅ 1 user hanya bisa vote 1x per voting (UNIQUE constraint)
5. ✅ Tidak bisa vote setelah deadline
6. ✅ Tidak bisa vote jika isActive = false
7. ✅ Hanya kader yang bisa vote (simpatisan tidak bisa)

### **Frontend Validation:**
1. ✅ Tampilkan badge "Sudah Voting" jika hasVoted = true
2. ✅ Disable submit button jika sudah vote atau expired
3. ✅ Tampilkan countdown timer untuk deadline
4. ✅ Validasi minimal 1 option selected sebelum submit

---

## 📊 **USE CASES**

### **Use Case 1: Admin Creates Single Choice Voting**
```
1. Admin login ke web panel
2. Klik menu "Voting" → "Create New"
3. Fill form:
   - Title: "Pemilihan Ketua DPD"
   - Question: "Siapa yang Anda pilih?"
   - Type: Single Choice
   - Deadline: 2026-02-20 23:59
   - Upload question image (optional)
   - Add 3 options with images
4. Click "Create"
5. Voting muncul di mobile app untuk semua kader
```

### **Use Case 2: Kader Votes on Mobile**
```
1. Kader buka aplikasi
2. Di beranda, klik menu "Voting"
3. Muncul list voting aktif
4. Pilih voting "Pemilihan Ketua DPD"
5. Baca pertanyaan & lihat foto kandidat
6. Pilih 1 kandidat (radio button)
7. Klik "Submit Voting"
8. Muncul success message
9. Status berubah jadi "Sudah Voting"
```

### **Use Case 3: Admin Extends Deadline**
```
1. Admin login
2. Lihat voting statistics
3. Partisipasi rendah (50/1000 kader)
4. Admin klik "Extend Deadline"
5. Pilih tanggal baru: 2026-02-25
6. Kader yang belum vote masih bisa vote
```

### **Use Case 4: Admin Views Results**
```
1. Admin login
2. Klik voting "Pemilihan Ketua DPD"
3. Lihat hasil real-time:
   - Budi: 85 votes (56.67%)
   - Ahmad: 50 votes (33.33%)
   - Siti: 15 votes (10%)
4. Export to Excel/PDF
```

---

## 🎨 **UI/UX RECOMMENDATIONS**

### **Web Admin Panel:**
```vue
<template>
  <div class="voting-dashboard">
    <!-- Statistics Cards -->
    <div class="stats-grid">
      <StatCard title="Total Voting" :value="stats.total" />
      <StatCard title="Active" :value="stats.active" color="green" />
      <StatCard title="Expired" :value="stats.expired" color="gray" />
      <StatCard title="Total Responses" :value="stats.totalResponses" />
    </div>
    
    <!-- Voting List Table -->
    <VotingTable :votings="votings" @edit="handleEdit" @delete="handleDelete" />
    
    <!-- Create Button -->
    <button @click="showCreateModal = true">+ Create Voting</button>
    
    <!-- Results Chart -->
    <VotingResultsChart :voting="selectedVoting" />
  </div>
</template>
```

### **Mobile App:**
```dart
// Home Screen - Add Voting Menu
BottomNavigationBar(
  items: [
    BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
    BottomNavigationBarItem(icon: Icon(Icons.calendar), label: 'Agenda'),
    BottomNavigationBarItem(icon: Icon(Icons.ballot), label: 'Voting'),
    BottomNavigationBarItem(icon: Icon(Icons.article), label: 'My Gerindra'),
  ],
)

// Voting List - Show Badge for New Voting
Badge(
  label: Text('New'),
  child: Icon(Icons.ballot),
)
```

---

## 🚀 **TESTING GUIDE**

### **1. Create Test Data**

**Login as Admin:**
```bash
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@example.com",
    "password": "Admin123!"
  }'
```

**Create Voting:**
```bash
curl -X POST http://localhost:3030/api/voting \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Pemilihan Ketua DPD",
    "question": "Siapa yang Anda pilih?",
    "questionImageUrl": "https://example.com/image.jpg",
    "votingType": "single",
    "deadline": "2026-02-20T23:59:59.000Z",
    "options": [
      {"optionText": "Budi Santoso", "optionImageUrl": "https://example.com/budi.jpg"},
      {"optionText": "Ahmad Hidayat", "optionImageUrl": null},
      {"optionText": "Siti Nurhaliza", "optionImageUrl": null}
    ]
  }'
```

### **2. Test as Kader**

**Login as Kader:**
```bash
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "kader@example.com",
    "password": "Kader123!"
  }'
```

**Get Active Votings:**
```bash
curl http://localhost:3030/api/voting/active \
  -H "Authorization: Bearer YOUR_KADER_TOKEN"
```

**Submit Vote:**
```bash
curl -X POST http://localhost:3030/api/voting/1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KADER_TOKEN" \
  -d '{
    "selectedOptions": [2]
  }'
```

---

## 📝 **DEPLOYMENT CHECKLIST**

- [ ] Backend migration applied
- [ ] Prisma Client regenerated
- [ ] Voting routes registered in app.js
- [ ] Test all admin endpoints
- [ ] Test all mobile endpoints
- [ ] Test role-based access (admin vs kader)
- [ ] Test voting deadline validation
- [ ] Test duplicate vote prevention
- [ ] Web admin panel implemented
- [ ] Mobile voting screen implemented
- [ ] Push notification untuk voting baru (optional)
- [ ] Email notification untuk voting baru (optional)

---

## 🐛 **TROUBLESHOOTING**

### **Error: "You have already voted"**
- User sudah submit vote sebelumnya
- Check `/api/voting/my-votes` untuk lihat history

### **Error: "Voting deadline has passed"**
- Deadline sudah lewat
- Admin perlu extend deadline via `/api/voting/:id/extend`

### **Error: "You can only select one option"**
- User pilih >1 option di single choice voting
- Frontend harus enforce radio button (not checkbox)

### **Error: "Insufficient permissions"**
- User bukan kader (mungkin simpatisan)
- Check user roles via `/api/user/profile`

---

## 📞 **SUPPORT**

**Backend Team:**
- Email: backend@mygerindra.com
- Slack: #backend-support

**Frontend Web Team:**
- Email: web@mygerindra.com
- Slack: #frontend-web

**Frontend Mobile Team:**
- Email: mobile@mygerindra.com
- Slack: #frontend-mobile

---

**Last Updated:** February 11, 2026  
**Documentation Version:** 1.0.0  
**API Version:** 1.0.0
