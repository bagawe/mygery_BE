# 📋 Announcement & Voting Field Rules Documentation

**Dokumen:** Aturan Mandatory/Optional untuk Announcement dan Voting  
**Tanggal:** 12 Februari 2026  
**Backend:** Node.js/Express + Prisma + PostgreSQL  
**Branch:** heri01

---

## 📌 Table of Contents

1. [Overview](#overview)
2. [Database Schema Analysis](#database-schema-analysis)
3. [Announcement Field Rules](#announcement-field-rules)
4. [Voting Field Rules](#voting-field-rules)
5. [Validation Rules](#validation-rules)
6. [Frontend Implementation Guide](#frontend-implementation-guide)
7. [API Request Examples](#api-request-examples)
8. [Error Handling](#error-handling)
9. [Testing Guide](#testing-guide)

---

## 🎯 Overview

Dokumentasi ini menjelaskan aturan **mandatory** (wajib) dan **optional** (opsional) untuk field-field di **Announcement** dan **Voting System**.

### Key Points:
- ✅ **Text dan Image bisa OPTIONAL** (tergantung field)
- ✅ **Fleksibel:** Bisa hanya text, hanya image, atau keduanya
- ⚠️ **Beberapa field WAJIB** (title, question, optionText)

---

## 🗄️ Database Schema Analysis

### 1. Announcement Schema

```prisma
model Announcement {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(255)          // ✅ MANDATORY
  content   String?  @db.Text                  // ❌ OPTIONAL (NULL allowed)
  imageUrl  String?  @db.VarChar(500)          // ❌ OPTIONAL (NULL allowed)
  type      AnnouncementType @default(pengumuman)
  isActive  Boolean  @default(true)
  createdBy Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("announcements")
}

enum AnnouncementType {
  sambutan
  pengumuman
  download
  artikel
}
```

**Field Analysis:**

| Field | Type | Mandatory | Description |
|-------|------|-----------|-------------|
| `title` | String | ✅ **YES** | Judul announcement (max 255 char) |
| `content` | String? | ❌ **NO** | Isi text announcement (bisa NULL) |
| `imageUrl` | String? | ❌ **NO** | URL gambar/banner (bisa NULL) |
| `type` | Enum | ✅ **YES** | Default: `pengumuman` |
| `createdBy` | Int | ✅ **YES** | Admin ID yang membuat |

---

### 2. Voting Schema

```prisma
model Voting {
  id                Int              @id @default(autoincrement())
  uuid              String           @unique @default(uuid())
  title             String           @db.VarChar(255)    // ✅ MANDATORY
  question          String           @db.Text            // ✅ MANDATORY
  questionImageUrl  String?          @db.VarChar(500)    // ❌ OPTIONAL
  votingType        VotingType       @default(single)
  deadline          DateTime                             // ✅ MANDATORY
  isActive          Boolean          @default(true)
  createdBy         Int                                  // ✅ MANDATORY
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  options           VotingOption[]
  responses         VotingResponse[]

  @@map("votings")
}

model VotingOption {
  id              Int      @id @default(autoincrement())
  votingId        Int                                    // ✅ MANDATORY
  optionText      String   @db.VarChar(500)              // ✅ MANDATORY
  optionImageUrl  String?  @db.VarChar(500)              // ❌ OPTIONAL
  orderIndex      Int      @default(0)
  createdAt       DateTime @default(now())
  
  voting          Voting   @relation(fields: [votingId], references: [id], onDelete: Cascade)

  @@map("voting_options")
}

enum VotingType {
  single      // Hanya bisa pilih 1 jawaban
  multiple    // Bisa pilih beberapa jawaban
}
```

**Field Analysis:**

| Model | Field | Type | Mandatory | Description |
|-------|-------|------|-----------|-------------|
| **Voting** | `title` | String | ✅ **YES** | Judul voting (max 255 char) |
| | `question` | String | ✅ **YES** | Text pertanyaan (WAJIB) |
| | `questionImageUrl` | String? | ❌ **NO** | Gambar pertanyaan (bisa NULL) |
| | `votingType` | Enum | ✅ **YES** | Default: `single` |
| | `deadline` | DateTime | ✅ **YES** | Batas waktu voting |
| **VotingOption** | `optionText` | String | ✅ **YES** | Text opsi jawaban (WAJIB) |
| | `optionImageUrl` | String? | ❌ **NO** | Gambar opsi (bisa NULL) |

---

## 📢 Announcement Field Rules

### ✅ Valid Scenarios

#### Scenario 1: **Hanya Text** (Tanpa Gambar)
```json
{
  "title": "Pengumuman Rapat",
  "content": "Rapat koordinasi akan dilaksanakan besok pukul 10.00 WIB di ruang meeting.",
  "type": "pengumuman"
}
```
- ✅ `title`: Ada
- ✅ `content`: Ada text
- ❌ `imageUrl`: Tidak ada (OK - optional)

---

#### Scenario 2: **Hanya Image** (Tanpa Content)
```json
{
  "title": "Banner Perayaan HUT",
  "imageUrl": "https://server.com/uploads/banner-hut.jpg",
  "type": "pengumuman"
}
```
- ✅ `title`: Ada
- ❌ `content`: Tidak ada (OK - optional)
- ✅ `imageUrl`: Ada gambar

---

#### Scenario 3: **Text + Image** (Kombinasi)
```json
{
  "title": "Undangan Webinar",
  "content": "Kami mengundang Anda dalam webinar tentang teknologi AI. Daftar sekarang!",
  "imageUrl": "https://server.com/uploads/webinar-poster.jpg",
  "type": "artikel"
}
```
- ✅ `title`: Ada
- ✅ `content`: Ada text
- ✅ `imageUrl`: Ada gambar

---

### ❌ Invalid Scenarios

#### Scenario 4: **Title Kosong**
```json
{
  "content": "Ini adalah pengumuman penting",
  "imageUrl": "https://server.com/uploads/image.jpg"
}
```
**ERROR:** `title` is required  
❌ Title wajib diisi!

---

#### Scenario 5: **Content dan ImageUrl Keduanya Kosong**
```json
{
  "title": "Judul Saja",
  "type": "pengumuman"
}
```
**TIDAK RECOMMENDED:** Announcement tanpa isi apapun  
⚠️ Meskipun valid di database, sebaiknya minimal ada content ATAU imageUrl

---

### 📊 Announcement Field Summary

| Field | Required | Can be NULL | Recommendation |
|-------|----------|-------------|----------------|
| `title` | ✅ YES | ❌ NO | Always required |
| `content` | ❌ NO | ✅ YES | Optional, but recommended if no image |
| `imageUrl` | ❌ NO | ✅ YES | Optional, but recommended if no content |
| `type` | ✅ YES | ❌ NO | Default: `pengumuman` |

**Best Practice:** Minimal harus ada `content` ATAU `imageUrl` (salah satu atau keduanya)

---

## 🗳️ Voting Field Rules

### ✅ Valid Scenarios

#### Scenario 1: **Text Only Voting** (Tanpa Gambar)
```json
{
  "title": "Voting Ketua RT",
  "question": "Siapa pilihan Anda untuk Ketua RT periode 2026?",
  "votingType": "single",
  "deadline": "2026-03-01T23:59:59.000Z",
  "options": [
    { "optionText": "Bapak Ahmad" },
    { "optionText": "Bapak Budi" },
    { "optionText": "Bapak Chandra" }
  ]
}
```
- ✅ `question`: Ada text (WAJIB)
- ✅ `optionText`: Semua opsi punya text (WAJIB)
- ❌ `questionImageUrl`: Tidak ada (OK - optional)
- ❌ `optionImageUrl`: Tidak ada (OK - optional)

---

#### Scenario 2: **Question dengan Image**
```json
{
  "title": "Voting Logo Baru",
  "question": "Pilih logo yang menurut Anda paling sesuai:",
  "questionImageUrl": "https://server.com/uploads/logo-contest-banner.jpg",
  "votingType": "single",
  "deadline": "2026-02-20T23:59:59.000Z",
  "options": [
    { "optionText": "Logo A" },
    { "optionText": "Logo B" },
    { "optionText": "Logo C" }
  ]
}
```
- ✅ `question`: Ada text (WAJIB)
- ✅ `questionImageUrl`: Ada gambar (optional - enhancement)
- ✅ `optionText`: Semua opsi punya text (WAJIB)

---

#### Scenario 3: **Options dengan Image** (Voting Bergambar)
```json
{
  "title": "Voting Calon Ketua",
  "question": "Pilih calon Ketua Organisasi:",
  "votingType": "single",
  "deadline": "2026-03-15T23:59:59.000Z",
  "options": [
    {
      "optionText": "Calon 1: Ahmad Suryadi",
      "optionImageUrl": "https://server.com/uploads/calon-1-photo.jpg"
    },
    {
      "optionText": "Calon 2: Budi Santoso",
      "optionImageUrl": "https://server.com/uploads/calon-2-photo.jpg"
    },
    {
      "optionText": "Calon 3: Chandra Wijaya",
      "optionImageUrl": "https://server.com/uploads/calon-3-photo.jpg"
    }
  ]
}
```
- ✅ `question`: Ada text (WAJIB)
- ✅ `optionText`: Semua opsi punya text (WAJIB)
- ✅ `optionImageUrl`: Gambar per opsi (optional - enhancement)

---

#### Scenario 4: **Full Featured** (Question + Options dengan Gambar)
```json
{
  "title": "Voting Desain Merchandise",
  "question": "Pilih desain merchandise yang akan diproduksi:",
  "questionImageUrl": "https://server.com/uploads/merchandise-banner.jpg",
  "votingType": "multiple",
  "deadline": "2026-02-25T23:59:59.000Z",
  "options": [
    {
      "optionText": "Desain Kaos Model A",
      "optionImageUrl": "https://server.com/uploads/design-a.jpg"
    },
    {
      "optionText": "Desain Kaos Model B",
      "optionImageUrl": "https://server.com/uploads/design-b.jpg"
    },
    {
      "optionText": "Desain Tote Bag",
      "optionImageUrl": "https://server.com/uploads/design-totebag.jpg"
    }
  ]
}
```
- ✅ Semua text field mandatory: Ada
- ✅ Semua image field optional: Ada (enhancement)

---

### ❌ Invalid Scenarios

#### Scenario 5: **Question Kosong** (Hanya Gambar)
```json
{
  "title": "Voting Gambar",
  "questionImageUrl": "https://server.com/uploads/question-image.jpg",
  "votingType": "single",
  "deadline": "2026-02-20T23:59:59.000Z",
  "options": [
    { "optionText": "Opsi A" },
    { "optionText": "Opsi B" }
  ]
}
```
**ERROR:** `question` is required  
❌ Text pertanyaan WAJIB diisi! (Tidak boleh hanya gambar)

---

#### Scenario 6: **Option Text Kosong** (Hanya Gambar)
```json
{
  "title": "Voting Foto",
  "question": "Pilih foto terbaik:",
  "votingType": "single",
  "deadline": "2026-02-20T23:59:59.000Z",
  "options": [
    { "optionImageUrl": "https://server.com/uploads/photo-1.jpg" },
    { "optionImageUrl": "https://server.com/uploads/photo-2.jpg" }
  ]
}
```
**ERROR:** `optionText` is required for each option  
❌ Setiap opsi WAJIB punya text! (Tidak boleh hanya gambar)

---

#### Scenario 7: **Options Kurang dari 2**
```json
{
  "title": "Voting Tidak Valid",
  "question": "Pilih opsi:",
  "votingType": "single",
  "deadline": "2026-02-20T23:59:59.000Z",
  "options": [
    { "optionText": "Hanya 1 Opsi" }
  ]
}
```
**ERROR:** Voting must have at least 2 options  
❌ Minimal 2 opsi!

---

### 📊 Voting Field Summary

| Model | Field | Required | Can be NULL | Recommendation |
|-------|-------|----------|-------------|----------------|
| **Voting** | `title` | ✅ YES | ❌ NO | Always required |
| | `question` | ✅ YES | ❌ NO | **Text WAJIB** (bukan hanya gambar) |
| | `questionImageUrl` | ❌ NO | ✅ YES | Optional enhancement |
| | `votingType` | ✅ YES | ❌ NO | Default: `single` |
| | `deadline` | ✅ YES | ❌ NO | ISO 8601 format |
| **VotingOption** | `optionText` | ✅ YES | ❌ NO | **Text WAJIB** (bukan hanya gambar) |
| | `optionImageUrl` | ❌ NO | ✅ YES | Optional enhancement |

**Best Practice:**
- ✅ `question` dan `optionText` **WAJIB berisi text**
- ✅ Image hanya sebagai **pelengkap/enhancement**
- ✅ Minimal 2 options per voting

---

## ✅ Validation Rules

### Frontend Validation (Recommended)

#### Announcement Validation
```javascript
const validateAnnouncement = (form) => {
  const errors = {};

  // 1. Title validation (MANDATORY)
  if (!form.title || form.title.trim() === '') {
    errors.title = 'Title wajib diisi';
  } else if (form.title.length > 255) {
    errors.title = 'Title maksimal 255 karakter';
  }

  // 2. Type validation
  const validTypes = ['sambutan', 'pengumuman', 'download', 'artikel'];
  if (!validTypes.includes(form.type)) {
    errors.type = 'Type tidak valid';
  }

  // 3. Content atau ImageUrl validation (minimal salah satu)
  const hasContent = form.content && form.content.trim() !== '';
  const hasImage = form.imageUrl && form.imageUrl.trim() !== '';

  if (!hasContent && !hasImage) {
    errors.general = 'Minimal isi content ATAU upload gambar (salah satu wajib)';
  }

  // 4. ImageUrl format validation (optional)
  if (hasImage) {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(form.imageUrl)) {
      errors.imageUrl = 'Format URL gambar tidak valid';
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Usage example
const form = {
  title: 'Pengumuman',
  content: 'Isi pengumuman...',
  type: 'pengumuman'
};

const errors = validateAnnouncement(form);
if (errors) {
  console.error('Validation failed:', errors);
} else {
  // Submit form
}
```

---

#### Voting Validation
```javascript
const validateVoting = (form) => {
  const errors = {};

  // 1. Title validation (MANDATORY)
  if (!form.title || form.title.trim() === '') {
    errors.title = 'Title wajib diisi';
  } else if (form.title.length > 255) {
    errors.title = 'Title maksimal 255 karakter';
  }

  // 2. Question validation (MANDATORY - text wajib)
  if (!form.question || form.question.trim() === '') {
    errors.question = 'Question wajib diisi (tidak boleh hanya gambar)';
  }

  // 3. VotingType validation
  const validTypes = ['single', 'multiple'];
  if (!validTypes.includes(form.votingType)) {
    errors.votingType = 'Voting type tidak valid';
  }

  // 4. Deadline validation (MANDATORY)
  if (!form.deadline) {
    errors.deadline = 'Deadline wajib diisi';
  } else {
    const deadlineDate = new Date(form.deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      errors.deadline = 'Deadline harus di masa depan';
    }
  }

  // 5. Options validation (MANDATORY - minimal 2)
  if (!form.options || form.options.length < 2) {
    errors.options = 'Minimal 2 opsi jawaban diperlukan';
  } else {
    // Validate each option
    form.options.forEach((option, index) => {
      // OptionText WAJIB (tidak boleh hanya gambar)
      if (!option.optionText || option.optionText.trim() === '') {
        errors[`option_${index}`] = `Opsi ${index + 1}: Text wajib diisi (tidak boleh hanya gambar)`;
      } else if (option.optionText.length > 500) {
        errors[`option_${index}`] = `Opsi ${index + 1}: Text maksimal 500 karakter`;
      }
    });
  }

  // 6. QuestionImageUrl validation (optional)
  if (form.questionImageUrl && form.questionImageUrl.trim() !== '') {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(form.questionImageUrl)) {
      errors.questionImageUrl = 'Format URL gambar pertanyaan tidak valid';
    }
  }

  // 7. OptionImageUrl validation (optional)
  if (form.options) {
    form.options.forEach((option, index) => {
      if (option.optionImageUrl && option.optionImageUrl.trim() !== '') {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(option.optionImageUrl)) {
          errors[`option_image_${index}`] = `Opsi ${index + 1}: Format URL gambar tidak valid`;
        }
      }
    });
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Usage example
const form = {
  title: 'Voting Ketua',
  question: 'Pilih calon ketua:',
  votingType: 'single',
  deadline: '2026-03-01T23:59:59.000Z',
  options: [
    { optionText: 'Calon A' },
    { optionText: 'Calon B' }
  ]
};

const errors = validateVoting(form);
if (errors) {
  console.error('Validation failed:', errors);
} else {
  // Submit form
}
```

---

### Backend Validation (Prisma)

Backend validation dilakukan otomatis oleh Prisma berdasarkan schema:

#### Announcement Service
```javascript
// src/modules/announcement/announcement.service.js

async createAnnouncement(data) {
  const { title, content, imageUrl, type, createdBy } = data;

  // Prisma akan otomatis validasi:
  // - title: tidak boleh NULL (required)
  // - content: boleh NULL (optional)
  // - imageUrl: boleh NULL (optional)

  const announcement = await prisma.announcement.create({
    data: {
      title,           // MANDATORY
      content,         // OPTIONAL (bisa undefined/null)
      imageUrl,        // OPTIONAL (bisa undefined/null)
      type: type || 'pengumuman',
      isActive: true,
      createdBy
    }
  });

  return announcement;
}
```

#### Voting Service
```javascript
// src/modules/voting/voting.service.js

async createVoting(data, adminId) {
  const { title, question, questionImageUrl, votingType, deadline, options } = data;

  // Custom validation
  if (!options || options.length < 2) {
    throw new Error('Voting must have at least 2 options');
  }

  // Prisma akan otomatis validasi:
  // - title: tidak boleh NULL (required)
  // - question: tidak boleh NULL (required)
  // - questionImageUrl: boleh NULL (optional)
  // - optionText: tidak boleh NULL (required)
  // - optionImageUrl: boleh NULL (optional)

  const voting = await prisma.voting.create({
    data: {
      title,                // MANDATORY
      question,             // MANDATORY (text wajib)
      questionImageUrl,     // OPTIONAL (bisa undefined/null)
      votingType: votingType || 'single',
      deadline: new Date(deadline),
      createdBy: adminId,
      options: {
        create: options.map((opt, index) => ({
          optionText: opt.optionText,           // MANDATORY (text wajib)
          optionImageUrl: opt.optionImageUrl || null,  // OPTIONAL
          orderIndex: index
        }))
      }
    },
    include: {
      options: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  return voting;
}
```

---

## 💻 Frontend Implementation Guide

### Vue.js Form Components

#### Announcement Form
```vue
<template>
  <div class="announcement-form">
    <h2>Buat Announcement</h2>
    
    <!-- Title (MANDATORY) -->
    <div class="form-group">
      <label for="title">Title <span class="required">*</span></label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        placeholder="Masukkan judul announcement"
        maxlength="255"
        required
      />
      <span v-if="errors.title" class="error">{{ errors.title }}</span>
    </div>

    <!-- Type (MANDATORY) -->
    <div class="form-group">
      <label for="type">Type <span class="required">*</span></label>
      <select id="type" v-model="form.type" required>
        <option value="sambutan">Sambutan</option>
        <option value="pengumuman">Pengumuman</option>
        <option value="download">Download</option>
        <option value="artikel">Artikel</option>
      </select>
    </div>

    <!-- Content (OPTIONAL) -->
    <div class="form-group">
      <label for="content">Content <span class="optional">(optional)</span></label>
      <textarea
        id="content"
        v-model="form.content"
        placeholder="Masukkan isi announcement (optional jika ada gambar)"
        rows="5"
      ></textarea>
      <p class="hint">💡 Content atau Gambar minimal salah satu harus diisi</p>
    </div>

    <!-- Image Upload (OPTIONAL) -->
    <div class="form-group">
      <label>Image <span class="optional">(optional)</span></label>
      <ImageUpload
        v-model="form.imageUrl"
        label="Upload Banner/Image"
        foto-type="announcement"
      />
      <p class="hint">💡 Image atau Content minimal salah satu harus diisi</p>
    </div>

    <!-- Preview -->
    <div v-if="form.imageUrl" class="preview">
      <h4>Preview Image:</h4>
      <img :src="form.imageUrl" alt="Preview" />
    </div>

    <!-- Submit Button -->
    <button @click="handleSubmit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Creating...' : 'Create Announcement' }}
    </button>

    <!-- Error Message -->
    <div v-if="errors.general" class="error-box">
      {{ errors.general }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ImageUpload from '@/components/ImageUpload.vue';

const form = ref({
  title: '',
  content: '',
  imageUrl: '',
  type: 'pengumuman'
});

const errors = ref({});
const isSubmitting = ref(false);

const validateForm = () => {
  errors.value = {};

  // Title validation (MANDATORY)
  if (!form.value.title || form.value.title.trim() === '') {
    errors.value.title = 'Title wajib diisi';
  }

  // Content atau ImageUrl minimal salah satu
  const hasContent = form.value.content && form.value.content.trim() !== '';
  const hasImage = form.value.imageUrl && form.value.imageUrl.trim() !== '';

  if (!hasContent && !hasImage) {
    errors.value.general = 'Minimal isi content ATAU upload gambar';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    const response = await fetch('http://localhost:3030/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(form.value)
    });

    if (response.ok) {
      alert('Announcement created successfully!');
      // Reset form
      form.value = {
        title: '',
        content: '',
        imageUrl: '',
        type: 'pengumuman'
      };
    } else {
      const error = await response.json();
      errors.value.general = error.message || 'Failed to create announcement';
    }
  } catch (error) {
    errors.value.general = 'Network error: ' + error.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.required {
  color: red;
  font-weight: bold;
}
.optional {
  color: #666;
  font-size: 0.9em;
}
.hint {
  font-size: 0.85em;
  color: #666;
  margin-top: 5px;
}
.error {
  color: red;
  font-size: 0.9em;
}
.error-box {
  background: #fee;
  border: 1px solid red;
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  color: red;
}
.preview img {
  max-width: 300px;
  border-radius: 8px;
  margin-top: 10px;
}
</style>
```

---

#### Voting Form
```vue
<template>
  <div class="voting-form">
    <h2>Buat Voting</h2>
    
    <!-- Title (MANDATORY) -->
    <div class="form-group">
      <label for="title">Title <span class="required">*</span></label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        placeholder="Masukkan judul voting"
        maxlength="255"
        required
      />
      <span v-if="errors.title" class="error">{{ errors.title }}</span>
    </div>

    <!-- Question (MANDATORY - TEXT WAJIB) -->
    <div class="form-group">
      <label for="question">Question <span class="required">* (Text Wajib)</span></label>
      <textarea
        id="question"
        v-model="form.question"
        placeholder="Masukkan pertanyaan voting (WAJIB berisi text, tidak boleh hanya gambar)"
        rows="3"
        required
      ></textarea>
      <p class="hint">⚠️ Text pertanyaan WAJIB diisi (tidak boleh hanya mengandalkan gambar)</p>
      <span v-if="errors.question" class="error">{{ errors.question }}</span>
    </div>

    <!-- Question Image (OPTIONAL) -->
    <div class="form-group">
      <label>Question Image <span class="optional">(optional - enhancement)</span></label>
      <ImageUpload
        v-model="form.questionImageUrl"
        label="Upload Gambar Pertanyaan (Optional)"
        foto-type="voting"
      />
      <p class="hint">💡 Gambar pertanyaan bersifat opsional (pelengkap saja)</p>
    </div>

    <!-- Voting Type (MANDATORY) -->
    <div class="form-group">
      <label for="votingType">Voting Type <span class="required">*</span></label>
      <select id="votingType" v-model="form.votingType" required>
        <option value="single">Single Choice (Pilih 1)</option>
        <option value="multiple">Multiple Choice (Pilih beberapa)</option>
      </select>
    </div>

    <!-- Deadline (MANDATORY) -->
    <div class="form-group">
      <label for="deadline">Deadline <span class="required">*</span></label>
      <input
        id="deadline"
        v-model="form.deadline"
        type="datetime-local"
        required
      />
      <span v-if="errors.deadline" class="error">{{ errors.deadline }}</span>
    </div>

    <!-- Options (MANDATORY - MIN 2, TEXT WAJIB PER OPTION) -->
    <div class="form-group">
      <label>Options <span class="required">* (Min 2 opsi, Text per opsi WAJIB)</span></label>
      
      <div v-for="(option, index) in form.options" :key="index" class="option-item">
        <h4>Opsi {{ index + 1 }}</h4>
        
        <!-- Option Text (MANDATORY) -->
        <input
          v-model="option.optionText"
          type="text"
          placeholder="Masukkan text opsi (WAJIB, tidak boleh hanya gambar)"
          maxlength="500"
          required
        />
        <p class="hint">⚠️ Text opsi WAJIB diisi (tidak boleh hanya gambar)</p>
        <span v-if="errors[`option_${index}`]" class="error">
          {{ errors[`option_${index}`] }}
        </span>

        <!-- Option Image (OPTIONAL) -->
        <ImageUpload
          v-model="option.optionImageUrl"
          :label="`Upload Gambar Opsi ${index + 1} (Optional)`"
          foto-type="voting"
        />
        <p class="hint">💡 Gambar opsi bersifat opsional (pelengkap saja)</p>

        <!-- Remove Option Button -->
        <button
          v-if="form.options.length > 2"
          @click="removeOption(index)"
          class="btn-remove"
        >
          Hapus Opsi {{ index + 1 }}
        </button>
      </div>

      <!-- Add Option Button -->
      <button @click="addOption" class="btn-add">+ Tambah Opsi</button>
      <span v-if="errors.options" class="error">{{ errors.options }}</span>
    </div>

    <!-- Submit Button -->
    <button @click="handleSubmit" :disabled="isSubmitting" class="btn-submit">
      {{ isSubmitting ? 'Creating...' : 'Create Voting' }}
    </button>

    <!-- Error Message -->
    <div v-if="errors.general" class="error-box">
      {{ errors.general }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ImageUpload from '@/components/ImageUpload.vue';

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

const errors = ref({});
const isSubmitting = ref(false);

const addOption = () => {
  form.value.options.push({ optionText: '', optionImageUrl: '' });
};

const removeOption = (index) => {
  if (form.value.options.length > 2) {
    form.value.options.splice(index, 1);
  }
};

const validateForm = () => {
  errors.value = {};

  // Title validation (MANDATORY)
  if (!form.value.title || form.value.title.trim() === '') {
    errors.value.title = 'Title wajib diisi';
  }

  // Question validation (MANDATORY - text wajib)
  if (!form.value.question || form.value.question.trim() === '') {
    errors.value.question = 'Question wajib diisi (tidak boleh hanya gambar)';
  }

  // Deadline validation (MANDATORY)
  if (!form.value.deadline) {
    errors.value.deadline = 'Deadline wajib diisi';
  } else {
    const deadlineDate = new Date(form.value.deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      errors.value.deadline = 'Deadline harus di masa depan';
    }
  }

  // Options validation (MANDATORY - min 2, text wajib)
  if (form.value.options.length < 2) {
    errors.value.options = 'Minimal 2 opsi diperlukan';
  } else {
    form.value.options.forEach((option, index) => {
      if (!option.optionText || option.optionText.trim() === '') {
        errors.value[`option_${index}`] = `Opsi ${index + 1}: Text wajib diisi (tidak boleh hanya gambar)`;
      }
    });
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    const response = await fetch('http://localhost:3030/api/admin/votings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(form.value)
    });

    if (response.ok) {
      alert('Voting created successfully!');
      // Reset form
      form.value = {
        title: '',
        question: '',
        questionImageUrl: '',
        votingType: 'single',
        deadline: '',
        options: [
          { optionText: '', optionImageUrl: '' },
          { optionText: '', optionImageUrl: '' }
        ]
      };
    } else {
      const error = await response.json();
      errors.value.general = error.message || 'Failed to create voting';
    }
  } catch (error) {
    errors.value.general = 'Network error: ' + error.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.required {
  color: red;
  font-weight: bold;
}
.optional {
  color: #666;
  font-size: 0.9em;
}
.hint {
  font-size: 0.85em;
  color: #666;
  margin-top: 5px;
}
.error {
  color: red;
  font-size: 0.9em;
  display: block;
  margin-top: 5px;
}
.error-box {
  background: #fee;
  border: 1px solid red;
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  color: red;
}
.option-item {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  background: #f9f9f9;
}
.btn-add {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
.btn-remove {
  background: #f44336;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
.btn-submit {
  background: #2196F3;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}
.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

---

## 📡 API Request Examples

### Create Announcement

#### Example 1: Text Only
```bash
curl -X POST http://localhost:3030/api/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Rapat Koordinasi",
    "content": "Rapat koordinasi akan dilaksanakan besok pukul 10.00 WIB.",
    "type": "pengumuman"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "id": 1,
    "title": "Rapat Koordinasi",
    "content": "Rapat koordinasi akan dilaksanakan besok pukul 10.00 WIB.",
    "imageUrl": null,
    "type": "pengumuman",
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2026-02-12T10:00:00.000Z",
    "updatedAt": "2026-02-12T10:00:00.000Z"
  }
}
```

---

#### Example 2: Image Only
```bash
curl -X POST http://localhost:3030/api/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Banner HUT RI",
    "imageUrl": "http://localhost:3030/uploads/profiles/banner-hut.jpg",
    "type": "pengumuman"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "id": 2,
    "title": "Banner HUT RI",
    "content": null,
    "imageUrl": "http://localhost:3030/uploads/profiles/banner-hut.jpg",
    "type": "pengumuman",
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2026-02-12T10:05:00.000Z",
    "updatedAt": "2026-02-12T10:05:00.000Z"
  }
}
```

---

#### Example 3: Text + Image
```bash
curl -X POST http://localhost:3030/api/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Webinar AI Technology",
    "content": "Kami mengundang Anda dalam webinar tentang AI. Daftar sekarang!",
    "imageUrl": "http://localhost:3030/uploads/profiles/webinar-poster.jpg",
    "type": "artikel"
  }'
```

---

### Create Voting

#### Example 1: Text Only Voting
```bash
curl -X POST http://localhost:3030/api/admin/votings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Voting Ketua RT",
    "question": "Siapa pilihan Anda untuk Ketua RT periode 2026?",
    "votingType": "single",
    "deadline": "2026-03-01T23:59:59.000Z",
    "options": [
      { "optionText": "Bapak Ahmad" },
      { "optionText": "Bapak Budi" },
      { "optionText": "Bapak Chandra" }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Voting created successfully",
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Voting Ketua RT",
    "question": "Siapa pilihan Anda untuk Ketua RT periode 2026?",
    "questionImageUrl": null,
    "votingType": "single",
    "deadline": "2026-03-01T23:59:59.000Z",
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2026-02-12T10:00:00.000Z",
    "updatedAt": "2026-02-12T10:00:00.000Z",
    "options": [
      {
        "id": 1,
        "votingId": 1,
        "optionText": "Bapak Ahmad",
        "optionImageUrl": null,
        "orderIndex": 0,
        "createdAt": "2026-02-12T10:00:00.000Z"
      },
      {
        "id": 2,
        "votingId": 1,
        "optionText": "Bapak Budi",
        "optionImageUrl": null,
        "orderIndex": 1,
        "createdAt": "2026-02-12T10:00:00.000Z"
      },
      {
        "id": 3,
        "votingId": 1,
        "optionText": "Bapak Chandra",
        "optionImageUrl": null,
        "orderIndex": 2,
        "createdAt": "2026-02-12T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### Example 2: Full Featured (Question + Options with Images)
```bash
curl -X POST http://localhost:3030/api/admin/votings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Voting Desain Logo",
    "question": "Pilih desain logo yang menurut Anda paling sesuai:",
    "questionImageUrl": "http://localhost:3030/uploads/profiles/logo-contest-banner.jpg",
    "votingType": "single",
    "deadline": "2026-02-20T23:59:59.000Z",
    "options": [
      {
        "optionText": "Desain Logo A - Modern Minimalis",
        "optionImageUrl": "http://localhost:3030/uploads/profiles/logo-a.jpg"
      },
      {
        "optionText": "Desain Logo B - Classic Elegant",
        "optionImageUrl": "http://localhost:3030/uploads/profiles/logo-b.jpg"
      },
      {
        "optionText": "Desain Logo C - Bold Colorful",
        "optionImageUrl": "http://localhost:3030/uploads/profiles/logo-c.jpg"
      }
    ]
  }'
```

---

## ❌ Error Handling

### Common Errors

#### Error 1: Title Missing (Announcement)
**Request:**
```json
{
  "content": "Ini adalah pengumuman penting",
  "type": "pengumuman"
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

#### Error 2: Question Missing (Voting)
**Request:**
```json
{
  "title": "Voting Test",
  "questionImageUrl": "http://localhost:3030/uploads/profiles/image.jpg",
  "votingType": "single",
  "deadline": "2026-03-01T23:59:59.000Z",
  "options": [
    { "optionText": "Opsi A" },
    { "optionText": "Opsi B" }
  ]
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "question",
      "message": "Question text is required (cannot be image only)"
    }
  ]
}
```

---

#### Error 3: Option Text Missing (Voting)
**Request:**
```json
{
  "title": "Voting Foto",
  "question": "Pilih foto terbaik:",
  "votingType": "single",
  "deadline": "2026-02-20T23:59:59.000Z",
  "options": [
    { "optionImageUrl": "http://localhost:3030/uploads/profiles/photo-1.jpg" },
    { "optionImageUrl": "http://localhost:3030/uploads/profiles/photo-2.jpg" }
  ]
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "options[0].optionText",
      "message": "Option text is required (cannot be image only)"
    },
    {
      "field": "options[1].optionText",
      "message": "Option text is required (cannot be image only)"
    }
  ]
}
```

---

#### Error 4: Insufficient Options (Voting)
**Request:**
```json
{
  "title": "Voting Invalid",
  "question": "Pilih opsi:",
  "votingType": "single",
  "deadline": "2026-02-20T23:59:59.000Z",
  "options": [
    { "optionText": "Hanya 1 Opsi" }
  ]
}
```

**Response:**
```json
{
  "success": false,
  "message": "Voting must have at least 2 options"
}
```

---

## 🧪 Testing Guide

### Test Case 1: Announcement - Text Only ✅
```javascript
describe('Announcement - Text Only', () => {
  it('should create announcement with text only (no image)', async () => {
    const data = {
      title: 'Pengumuman Rapat',
      content: 'Rapat akan dilaksanakan besok pukul 10.00 WIB.',
      type: 'pengumuman'
    };

    const response = await fetch('http://localhost:3030/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(data)
    });

    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.title).toBe(data.title);
    expect(result.data.content).toBe(data.content);
    expect(result.data.imageUrl).toBeNull();
  });
});
```

---

### Test Case 2: Announcement - Image Only ✅
```javascript
describe('Announcement - Image Only', () => {
  it('should create announcement with image only (no content)', async () => {
    const data = {
      title: 'Banner HUT RI',
      imageUrl: 'http://localhost:3030/uploads/profiles/banner.jpg',
      type: 'pengumuman'
    };

    const response = await fetch('http://localhost:3030/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(data)
    });

    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.title).toBe(data.title);
    expect(result.data.content).toBeNull();
    expect(result.data.imageUrl).toBe(data.imageUrl);
  });
});
```

---

### Test Case 3: Announcement - Missing Title ❌
```javascript
describe('Announcement - Missing Title', () => {
  it('should fail when title is missing', async () => {
    const data = {
      content: 'Content without title',
      type: 'pengumuman'
    };

    const response = await fetch('http://localhost:3030/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(data)
    });

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.message).toContain('title');
  });
});
```

---

### Test Case 4: Voting - Text Only ✅
```javascript
describe('Voting - Text Only', () => {
  it('should create voting with text only (no images)', async () => {
    const data = {
      title: 'Voting Ketua RT',
      question: 'Siapa pilihan Anda?',
      votingType: 'single',
      deadline: '2026-03-01T23:59:59.000Z',
      options: [
        { optionText: 'Calon A' },
        { optionText: 'Calon B' },
        { optionText: 'Calon C' }
      ]
    };

    const response = await fetch('http://localhost:3030/api/admin/votings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(data)
    });

    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.question).toBe(data.question);
    expect(result.data.questionImageUrl).toBeNull();
    expect(result.data.options).toHaveLength(3);
    expect(result.data.options[0].optionText).toBe('Calon A');
    expect(result.data.options[0].optionImageUrl).toBeNull();
  });
});
```

---

### Test Case 5: Voting - Missing Question ❌
```javascript
describe('Voting - Missing Question', () => {
  it('should fail when question text is missing', async () => {
    const data = {
      title: 'Voting Test',
      questionImageUrl: 'http://localhost:3030/uploads/profiles/image.jpg',
      votingType: 'single',
      deadline: '2026-03-01T23:59:59.000Z',
      options: [
        { optionText: 'Opsi A' },
        { optionText: 'Opsi B' }
      ]
    };

    const response = await fetch('http://localhost:3030/api/admin/votings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(data)
    });

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.message).toContain('question');
  });
});
```

---

### Test Case 6: Voting - Missing Option Text ❌
```javascript
describe('Voting - Missing Option Text', () => {
  it('should fail when option text is missing', async () => {
    const data = {
      title: 'Voting Foto',
      question: 'Pilih foto terbaik:',
      votingType: 'single',
      deadline: '2026-02-20T23:59:59.000Z',
      options: [
        { optionImageUrl: 'http://localhost:3030/uploads/profiles/photo-1.jpg' },
        { optionImageUrl: 'http://localhost:3030/uploads/profiles/photo-2.jpg' }
      ]
    };

    const response = await fetch('http://localhost:3030/api/admin/votings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(data)
    });

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.message).toContain('optionText');
  });
});
```

---

### Test Case 7: Voting - Full Featured ✅
```javascript
describe('Voting - Full Featured', () => {
  it('should create voting with question image and option images', async () => {
    const data = {
      title: 'Voting Desain Logo',
      question: 'Pilih desain logo yang paling sesuai:',
      questionImageUrl: 'http://localhost:3030/uploads/profiles/banner.jpg',
      votingType: 'single',
      deadline: '2026-02-20T23:59:59.000Z',
      options: [
        {
          optionText: 'Desain A - Modern',
          optionImageUrl: 'http://localhost:3030/uploads/profiles/logo-a.jpg'
        },
        {
          optionText: 'Desain B - Classic',
          optionImageUrl: 'http://localhost:3030/uploads/profiles/logo-b.jpg'
        },
        {
          optionText: 'Desain C - Bold',
          optionImageUrl: 'http://localhost:3030/uploads/profiles/logo-c.jpg'
        }
      ]
    };

    const response = await fetch('http://localhost:3030/api/admin/votings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(data)
    });

    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.question).toBe(data.question);
    expect(result.data.questionImageUrl).toBe(data.questionImageUrl);
    expect(result.data.options).toHaveLength(3);
    expect(result.data.options[0].optionText).toBe('Desain A - Modern');
    expect(result.data.options[0].optionImageUrl).toBe(data.options[0].optionImageUrl);
  });
});
```

---

## 📝 Summary

### Key Takeaways

#### 1. **Announcement Rules:**
- ✅ **Title:** MANDATORY (wajib)
- ❌ **Content:** OPTIONAL (boleh NULL)
- ❌ **ImageUrl:** OPTIONAL (boleh NULL)
- 💡 **Best Practice:** Minimal ada content ATAU imageUrl (salah satu)

#### 2. **Voting Rules:**
- ✅ **Title:** MANDATORY (wajib)
- ✅ **Question:** MANDATORY - **TEXT WAJIB** (tidak boleh hanya gambar)
- ❌ **QuestionImageUrl:** OPTIONAL (pelengkap saja)
- ✅ **OptionText:** MANDATORY - **TEXT WAJIB** per opsi (tidak boleh hanya gambar)
- ❌ **OptionImageUrl:** OPTIONAL per opsi (pelengkap saja)
- 💡 **Best Practice:** Minimal 2 opsi, text wajib ada di question dan setiap option

#### 3. **Image Philosophy:**
- 🎨 Image bersifat **enhancement** (pelengkap)
- 📝 Text tetap **primary content** untuk voting
- ⚖️ Announcement lebih fleksibel (bisa text only atau image only)
- ♿ Text wajib untuk **accessibility** dan **context**

---

## 📞 Support

Jika ada pertanyaan atau butuh klarifikasi tentang aturan mandatory/optional fields:

1. **Check Database Schema:** `prisma/schema.prisma`
2. **Check Service Logic:** `src/modules/announcement/` dan `src/modules/voting/`
3. **Test Endpoints:** Gunakan Postman/cURL dengan contoh di dokumentasi ini
4. **Validation Error:** Baca error message untuk detail field yang missing

---

## 📚 Related Documentation

- **Image Upload Guide:** `docimageuploadnoturl.md`
- **Voting System API:** `VOTING_SYSTEM_API_DOCUMENTATION.md`
- **Auto Suggest Endpoints:** `docs/AUTO_SUGGEST_ENDPOINTS.md`
- **Database Schema:** `prisma/schema.prisma`

---

**Last Updated:** 12 Februari 2026  
**Version:** 1.0  
**Status:** ✅ Complete
