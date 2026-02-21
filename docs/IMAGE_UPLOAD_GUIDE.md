# 🖼️ Image Upload Guide - Voting & Announcement

**Date:** February 12, 2026  
**For:** Admin Web Panel (Vue.js)  
**Purpose:** Panduan lengkap upload gambar untuk Voting dan Announcement

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Upload Endpoint](#upload-endpoint)
3. [Voting dengan Gambar](#voting-dengan-gambar)
4. [Announcement dengan Gambar](#announcement-dengan-gambar)
5. [Vue.js Implementation](#vuejs-implementation)
6. [Testing & Examples](#testing--examples)

---

## Overview

### Fitur Image Support

**✅ Voting System:**
- **Question Image** (`questionImageUrl`): Gambar untuk pertanyaan voting
- **Option Images** (`optionImageUrl`): Gambar untuk setiap pilihan jawaban
- **Format:** JPEG, JPG, PNG, GIF, WebP
- **Max Size:** 5MB per file

**✅ Announcement:**
- **Image** (`imageUrl`): Gambar untuk pengumuman
- **Format:** JPEG, JPG, PNG, GIF, WebP
- **Max Size:** 5MB per file

### Upload Flow Diagram

```
┌──────────────────┐
│ Select Image     │
│ (File Input)     │
└────────┬─────────┘
         │
         │ 1. User pilih file
         ▼
┌──────────────────┐
│ Preview Image    │
│ (Optional)       │
└────────┬─────────┘
         │
         │ 2. Upload ke server
         ▼
┌──────────────────┐
│ POST /api/upload │
│ (multipart)      │
└────────┬─────────┘
         │
         │ 3. Server save file
         ▼
┌──────────────────┐
│ Return Image URL │
│ http://...image  │
└────────┬─────────┘
         │
         │ 4. Simpan URL
         ▼
┌──────────────────┐
│ Create Voting/   │
│ Announcement     │
│ with imageUrl    │
└──────────────────┘
```

---

## Upload Endpoint

### General Image Upload

**Endpoint:**
```
POST /api/users/profile/upload-foto
```

**Method:** POST (multipart/form-data)

**Authentication:** Required (Bearer Token)

**Request:**
```http
POST /api/users/profile/upload-foto
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [image file]
fotoType: "voting" | "announcement" | "profil" | "ktp"
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ Yes | Image file (JPEG/PNG/GIF/WebP) |
| `fotoType` | string | ✅ Yes | Type: "voting", "announcement", "profil", "ktp" |

**Success Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileName": "voting-1-1707745200000-123456789.jpg",
    "filePath": "/uploads/profiles/voting-1-1707745200000-123456789.jpg",
    "fileUrl": "http://localhost:3030/uploads/profiles/voting-1-1707745200000-123456789.jpg",
    "fileSize": 245678,
    "mimeType": "image/jpeg"
  }
}
```

**Error Responses:**

```json
// No file uploaded
{
  "success": false,
  "message": "No file uploaded"
}

// Invalid file type
{
  "success": false,
  "message": "Only image files are allowed (jpeg, jpg, png, gif, webp)"
}

// File too large
{
  "success": false,
  "message": "File too large. Maximum size is 5MB"
}
```

### ⚠️ Important Notes

1. **URL yang dikembalikan** harus disimpan di field `questionImageUrl`, `optionImageUrl`, atau `imageUrl`
2. **File disimpan** di server folder: `/uploads/profiles/`
3. **File dapat diakses** via: `http://localhost:3030/uploads/profiles/filename.jpg`
4. **Max file size:** 5MB
5. **Allowed formats:** JPEG, JPG, PNG, GIF, WebP

---

## Voting dengan Gambar

### 1. Create Voting dengan Question Image

**Step 1: Upload Question Image**
```javascript
POST /api/users/profile/upload-foto
Content-Type: multipart/form-data

file: question-image.jpg
fotoType: "voting"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileUrl": "http://localhost:3030/uploads/profiles/voting-1-1707745200000-123456789.jpg"
  }
}
```

**Step 2: Create Voting dengan URL gambar**
```javascript
POST /api/voting
Content-Type: application/json

{
  "title": "Pilih Ketua DPC",
  "question": "Siapa pilihan Anda untuk Ketua DPC periode 2026-2031?",
  "questionImageUrl": "http://localhost:3030/uploads/profiles/voting-1-1707745200000-123456789.jpg",  // ✅ URL dari upload
  "votingType": "single",
  "deadline": "2026-12-31T23:59:59Z",
  "options": [
    {
      "optionText": "Budi Santoso",
      "orderIndex": 1
    },
    {
      "optionText": "Ahmad Suryadi",
      "orderIndex": 2
    }
  ]
}
```

### 2. Create Voting dengan Option Images

**Step 1: Upload Images untuk setiap option**
```javascript
// Upload image untuk option 1
POST /api/users/profile/upload-foto
file: budi-photo.jpg
fotoType: "voting"

// Response:
{ "data": { "fileUrl": "http://localhost:3030/uploads/profiles/voting-1-1707745200001.jpg" }}

// Upload image untuk option 2
POST /api/users/profile/upload-foto
file: ahmad-photo.jpg
fotoType: "voting"

// Response:
{ "data": { "fileUrl": "http://localhost:3030/uploads/profiles/voting-1-1707745200002.jpg" }}
```

**Step 2: Create Voting dengan option images**
```javascript
POST /api/voting
Content-Type: application/json

{
  "title": "Pilih Calon Ketua",
  "question": "Siapa pilihan Anda?",
  "questionImageUrl": null,  // Tidak ada gambar pertanyaan
  "votingType": "single",
  "deadline": "2026-12-31T23:59:59Z",
  "options": [
    {
      "optionText": "Budi Santoso",
      "optionImageUrl": "http://localhost:3030/uploads/profiles/voting-1-1707745200001.jpg",  // ✅ Image option 1
      "orderIndex": 1
    },
    {
      "optionText": "Ahmad Suryadi",
      "optionImageUrl": "http://localhost:3030/uploads/profiles/voting-1-1707745200002.jpg",  // ✅ Image option 2
      "orderIndex": 2
    }
  ]
}
```

### 3. Create Voting dengan Question + Option Images

**Full Example dengan semua gambar:**
```javascript
POST /api/voting

{
  "title": "Pemilihan Ketua DPC 2026",
  "question": "Pilih calon ketua favorit Anda dari daftar berikut",
  "questionImageUrl": "http://localhost:3030/uploads/profiles/voting-question-123.jpg",  // ✅ Question image
  "votingType": "single",
  "deadline": "2026-12-31T23:59:59Z",
  "options": [
    {
      "optionText": "Budi Santoso, S.H.",
      "optionImageUrl": "http://localhost:3030/uploads/profiles/voting-option-budi.jpg",  // ✅ Option 1 image
      "orderIndex": 1
    },
    {
      "optionText": "Ahmad Suryadi, M.Si.",
      "optionImageUrl": "http://localhost:3030/uploads/profiles/voting-option-ahmad.jpg",  // ✅ Option 2 image
      "orderIndex": 2
    },
    {
      "optionText": "Siti Nurhaliza, S.E.",
      "optionImageUrl": "http://localhost:3030/uploads/profiles/voting-option-siti.jpg",  // ✅ Option 3 image
      "orderIndex": 3
    }
  ]
}
```

---

## Announcement dengan Gambar

### Create Announcement dengan Image

**Step 1: Upload Image**
```javascript
POST /api/users/profile/upload-foto
Content-Type: multipart/form-data

file: announcement-banner.jpg
fotoType: "announcement"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileUrl": "http://localhost:3030/uploads/profiles/announcement-1-1707745200000-123.jpg"
  }
}
```

**Step 2: Create Announcement dengan URL gambar**
```javascript
POST /api/announcement
Content-Type: application/json

{
  "title": "Selamat Datang di My Gerindra",
  "content": "Terima kasih telah bergabung dengan aplikasi My Gerindra...",
  "type": "sambutan",
  "imageUrl": "http://localhost:3030/uploads/profiles/announcement-1-1707745200000-123.jpg"  // ✅ URL dari upload
}
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "id": 5,
    "title": "Selamat Datang di My Gerindra",
    "content": "Terima kasih telah bergabung...",
    "imageUrl": "http://localhost:3030/uploads/profiles/announcement-1-1707745200000-123.jpg",
    "type": "sambutan",
    "isActive": true,
    "createdAt": "2026-02-12T10:00:00.000Z"
  }
}
```

---

## Vue.js Implementation

### 1. Image Upload Composable

```javascript
// composables/useImageUpload.js

import { ref } from 'vue';
import axios from 'axios';

export function useImageUpload() {
  const uploading = ref(false);
  const uploadProgress = ref(0);
  const uploadError = ref(null);

  /**
   * Upload single image
   * @param {File} file - Image file
   * @param {string} fotoType - Type: 'voting', 'announcement', 'profil', 'ktp'
   * @returns {Promise<string>} - Image URL
   */
  const uploadImage = async (file, fotoType = 'voting') => {
    if (!file) {
      throw new Error('No file selected');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    uploading.value = true;
    uploadProgress.value = 0;
    uploadError.value = null;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fotoType', fotoType);

      const response = await axios.post('/api/users/profile/upload-foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
        },
      });

      if (response.data.success) {
        console.log('✅ Image uploaded:', response.data.data.fileUrl);
        return response.data.data.fileUrl;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      uploadError.value = error.response?.data?.message || error.message || 'Upload failed';
      throw error;
    } finally {
      uploading.value = false;
    }
  };

  /**
   * Upload multiple images
   * @param {File[]} files - Array of image files
   * @param {string} fotoType - Type
   * @returns {Promise<string[]>} - Array of image URLs
   */
  const uploadMultipleImages = async (files, fotoType = 'voting') => {
    const urls = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadImage(files[i], fotoType);
        urls.push(url);
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}:`, error);
        throw error;
      }
    }
    
    return urls;
  };

  return {
    uploading,
    uploadProgress,
    uploadError,
    uploadImage,
    uploadMultipleImages,
  };
}
```

### 2. Image Upload Component

```vue
<!-- components/ImageUpload.vue -->
<template>
  <div class="image-upload-wrapper">
    <label v-if="label" class="upload-label">{{ label }}</label>

    <!-- Upload Area -->
    <div
      class="upload-area"
      :class="{ 'dragging': isDragging, 'has-image': previewUrl }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <!-- Preview Image -->
      <div v-if="previewUrl" class="image-preview">
        <img :src="previewUrl" :alt="label" />
        <button
          type="button"
          class="remove-btn"
          @click.stop="removeImage"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- Upload Prompt -->
      <div v-else class="upload-prompt">
        <svg class="upload-icon" viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
        </svg>
        <p class="prompt-text">{{ promptText }}</p>
        <p class="prompt-hint">{{ promptHint }}</p>
      </div>

      <!-- Upload Progress -->
      <div v-if="uploading" class="upload-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>
        <p class="progress-text">Uploading... {{ uploadProgress }}%</p>
      </div>

      <!-- Hidden File Input -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- Error Message -->
    <div v-if="uploadError" class="error-message">
      {{ uploadError }}
    </div>

    <!-- Help Text -->
    <p v-if="helpText" class="help-text">{{ helpText }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useImageUpload } from '@/composables/useImageUpload';

const props = defineProps({
  label: String,
  modelValue: String,
  fotoType: {
    type: String,
    default: 'voting',
  },
  promptText: {
    type: String,
    default: 'Click or drag image here',
  },
  promptHint: {
    type: String,
    default: 'JPEG, PNG, GIF, WebP (Max 5MB)',
  },
  helpText: String,
});

const emit = defineEmits(['update:modelValue']);

const { uploading, uploadProgress, uploadError, uploadImage } = useImageUpload();

const fileInput = ref(null);
const previewUrl = ref(props.modelValue || null);
const isDragging = ref(false);

// Trigger file input
const triggerFileInput = () => {
  if (!uploading.value) {
    fileInput.value?.click();
  }
};

// Handle file selection
const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await handleFile(file);
  }
};

// Handle drag and drop
const handleDrop = async (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    await handleFile(file);
  }
};

// Process file
const handleFile = async (file) => {
  try {
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to server
    const imageUrl = await uploadImage(file, props.fotoType);

    // Update with server URL
    previewUrl.value = imageUrl;
    emit('update:modelValue', imageUrl);
  } catch (error) {
    console.error('Upload failed:', error);
    previewUrl.value = null;
  }
};

// Remove image
const removeImage = () => {
  previewUrl.value = null;
  emit('update:modelValue', null);
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    previewUrl.value = newValue;
  }
);
</script>

<style scoped>
.image-upload-wrapper {
  width: 100%;
}

.upload-label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.upload-area {
  position: relative;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f7fafc;
}

.upload-area:hover {
  border-color: #667eea;
  background: #edf2f7;
}

.upload-area.dragging {
  border-color: #667eea;
  background: #e6fffa;
}

.upload-area.has-image {
  padding: 0;
  border-style: solid;
  background: transparent;
}

.image-preview {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: rgba(220, 38, 38, 0.9);
}

.upload-prompt {
  pointer-events: none;
}

.upload-icon {
  color: #a0aec0;
  margin-bottom: 12px;
}

.prompt-text {
  font-size: 16px;
  color: #4a5568;
  margin-bottom: 4px;
}

.prompt-hint {
  font-size: 13px;
  color: #a0aec0;
}

.upload-progress {
  margin-top: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}

.progress-text {
  margin-top: 8px;
  font-size: 13px;
  color: #4a5568;
}

.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 6px;
  font-size: 13px;
}

.help-text {
  margin-top: 8px;
  font-size: 12px;
  color: #718096;
}
</style>
```

### 3. Create Voting Form dengan Images

```vue
<!-- views/CreateVoting.vue -->
<template>
  <div class="create-voting-page">
    <h1>Create New Voting</h1>

    <form @submit.prevent="handleSubmit" class="voting-form">
      <!-- Basic Info -->
      <div class="form-section">
        <h2>Basic Information</h2>

        <div class="form-group">
          <label>Title *</label>
          <input v-model="form.title" type="text" required />
        </div>

        <div class="form-group">
          <label>Question *</label>
          <textarea v-model="form.question" rows="3" required></textarea>
        </div>

        <!-- Question Image Upload -->
        <ImageUpload
          v-model="form.questionImageUrl"
          label="Question Image (Optional)"
          foto-type="voting"
          prompt-text="Upload question image"
          help-text="Optional: Add an image to your voting question"
        />

        <div class="form-group">
          <label>Voting Type *</label>
          <select v-model="form.votingType" required>
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
          </select>
        </div>

        <div class="form-group">
          <label>Deadline *</label>
          <input v-model="form.deadline" type="datetime-local" required />
        </div>
      </div>

      <!-- Options -->
      <div class="form-section">
        <h2>Options</h2>

        <div
          v-for="(option, index) in form.options"
          :key="index"
          class="option-item"
        >
          <div class="option-header">
            <h3>Option {{ index + 1 }}</h3>
            <button
              v-if="form.options.length > 2"
              type="button"
              @click="removeOption(index)"
              class="btn-remove"
            >
              Remove
            </button>
          </div>

          <div class="form-group">
            <label>Option Text *</label>
            <input v-model="option.optionText" type="text" required />
          </div>

          <!-- Option Image Upload -->
          <ImageUpload
            v-model="option.optionImageUrl"
            :label="`Option ${index + 1} Image (Optional)`"
            foto-type="voting"
            prompt-text="Upload option image"
            :help-text="`Add an image for ${option.optionText || 'this option'}`"
          />
        </div>

        <button type="button" @click="addOption" class="btn-add-option">
          + Add Option
        </button>
      </div>

      <!-- Submit -->
      <div class="form-actions">
        <button type="button" @click="$router.back()" class="btn-cancel">
          Cancel
        </button>
        <button type="submit" :disabled="loading" class="btn-submit">
          {{ loading ? 'Creating...' : 'Create Voting' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import ImageUpload from '@/components/ImageUpload.vue';

const router = useRouter();

const form = ref({
  title: '',
  question: '',
  questionImageUrl: null,
  votingType: 'single',
  deadline: '',
  options: [
    { optionText: '', optionImageUrl: null, orderIndex: 1 },
    { optionText: '', optionImageUrl: null, orderIndex: 2 },
  ],
});

const loading = ref(false);

const addOption = () => {
  form.value.options.push({
    optionText: '',
    optionImageUrl: null,
    orderIndex: form.value.options.length + 1,
  });
};

const removeOption = (index) => {
  form.value.options.splice(index, 1);
  // Reorder
  form.value.options.forEach((opt, idx) => {
    opt.orderIndex = idx + 1;
  });
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    // Format deadline
    const deadline = new Date(form.value.deadline).toISOString();

    // Prepare data
    const data = {
      title: form.value.title,
      question: form.value.question,
      questionImageUrl: form.value.questionImageUrl,
      votingType: form.value.votingType,
      deadline: deadline,
      options: form.value.options.map((opt, idx) => ({
        optionText: opt.optionText,
        optionImageUrl: opt.optionImageUrl,
        orderIndex: idx,
      })),
    };

    console.log('Creating voting with data:', data);

    const response = await axios.post('/api/voting', data);

    if (response.data.success) {
      alert('Voting created successfully!');
      router.push('/voting');
    }
  } catch (error) {
    console.error('Failed to create voting:', error);
    alert(error.response?.data?.message || 'Failed to create voting');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.create-voting-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.voting-form {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e2e8f0;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h2 {
  font-size: 20px;
  color: #2d3748;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.option-item {
  padding: 20px;
  background: #f7fafc;
  border-radius: 12px;
  margin-bottom: 16px;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.option-header h3 {
  font-size: 16px;
  color: #2d3748;
}

.btn-remove {
  padding: 6px 12px;
  background: #fed7d7;
  color: #c53030;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-add-option {
  padding: 12px 24px;
  background: #edf2f7;
  color: #4a5568;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.btn-add-option:hover {
  background: #e2e8f0;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn-cancel,
.btn-submit {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  background: #edf2f7;
  color: #4a5568;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

### 4. Create Announcement Form dengan Image

```vue
<!-- views/CreateAnnouncement.vue -->
<template>
  <div class="create-announcement-page">
    <h1>Create Announcement</h1>

    <form @submit.prevent="handleSubmit" class="announcement-form">
      <div class="form-group">
        <label>Title *</label>
        <input v-model="form.title" type="text" required />
      </div>

      <div class="form-group">
        <label>Content *</label>
        <textarea v-model="form.content" rows="10" required></textarea>
      </div>

      <div class="form-group">
        <label>Type *</label>
        <select v-model="form.type" required>
          <option value="sambutan">Sambutan</option>
          <option value="pengumuman">Pengumuman</option>
          <option value="download">Download</option>
          <option value="artikel">Artikel</option>
        </select>
      </div>

      <!-- Image Upload -->
      <ImageUpload
        v-model="form.imageUrl"
        label="Announcement Image (Optional)"
        foto-type="announcement"
        prompt-text="Upload announcement banner"
        help-text="Add a banner image for this announcement"
      />

      <div class="form-actions">
        <button type="button" @click="$router.back()" class="btn-cancel">
          Cancel
        </button>
        <button type="submit" :disabled="loading" class="btn-submit">
          {{ loading ? 'Creating...' : 'Create Announcement' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import ImageUpload from '@/components/ImageUpload.vue';

const router = useRouter();

const form = ref({
  title: '',
  content: '',
  type: 'pengumuman',
  imageUrl: null,
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;

  try {
    const response = await axios.post('/api/announcement', form.value);

    if (response.data.success) {
      alert('Announcement created successfully!');
      router.push('/announcements');
    }
  } catch (error) {
    console.error('Failed to create announcement:', error);
    alert(error.response?.data?.message || 'Failed to create announcement');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Similar styling as CreateVoting */
.create-announcement-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.announcement-form {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn-cancel,
.btn-submit {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  background: #edf2f7;
  color: #4a5568;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

---

## Testing & Examples

### Test Upload Image

```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@example.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Upload image
curl -X POST http://localhost:3030/api/users/profile/upload-foto \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "fotoType=voting"

# Response:
# {
#   "success": true,
#   "data": {
#     "fileUrl": "http://localhost:3030/uploads/profiles/voting-1-1707745200000-123.jpg"
#   }
# }
```

### Test Create Voting dengan Image

```bash
# Create voting with question image and option images
curl -X POST http://localhost:3030/api/voting \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pilih Ketua DPC",
    "question": "Siapa pilihan Anda?",
    "questionImageUrl": "http://localhost:3030/uploads/profiles/voting-question-123.jpg",
    "votingType": "single",
    "deadline": "2026-12-31T23:59:59Z",
    "options": [
      {
        "optionText": "Budi Santoso",
        "optionImageUrl": "http://localhost:3030/uploads/profiles/voting-option-1.jpg",
        "orderIndex": 1
      },
      {
        "optionText": "Ahmad Suryadi",
        "optionImageUrl": "http://localhost:3030/uploads/profiles/voting-option-2.jpg",
        "orderIndex": 2
      }
    ]
  }'
```

### Test Create Announcement dengan Image

```bash
curl -X POST http://localhost:3030/api/announcement \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Selamat Datang",
    "content": "Terima kasih telah bergabung...",
    "type": "sambutan",
    "imageUrl": "http://localhost:3030/uploads/profiles/announcement-banner.jpg"
  }'
```

---

## Summary

### ✅ Voting System:

| Feature | Field Name | Optional | Example |
|---------|-----------|----------|---------|
| Question Image | `questionImageUrl` | ✅ Yes | "http://localhost:3030/uploads/..." |
| Option 1 Image | `options[0].optionImageUrl` | ✅ Yes | "http://localhost:3030/uploads/..." |
| Option 2 Image | `options[1].optionImageUrl` | ✅ Yes | "http://localhost:3030/uploads/..." |
| Option N Image | `options[n].optionImageUrl` | ✅ Yes | "http://localhost:3030/uploads/..." |

### ✅ Announcement:

| Feature | Field Name | Optional | Example |
|---------|-----------|----------|---------|
| Banner Image | `imageUrl` | ✅ Yes | "http://localhost:3030/uploads/..." |

### ✅ Upload Specifications:

- **Endpoint:** `POST /api/users/profile/upload-foto`
- **Method:** multipart/form-data
- **Max Size:** 5MB per file
- **Formats:** JPEG, JPG, PNG, GIF, WebP
- **Storage:** `/uploads/profiles/`
- **Access:** `http://localhost:3030/uploads/profiles/filename.jpg`

### ✅ Vue.js Components Ready:

- `ImageUpload.vue` - Drag & drop image uploader
- `useImageUpload.js` - Composable for upload logic
- `CreateVoting.vue` - Form dengan question + option images
- `CreateAnnouncement.vue` - Form dengan banner image

---

**Last Updated:** February 12, 2026  
**Documentation:** Complete  
**Status:** ✅ Ready to implement

**Related Files:**
- `VOTING_SYSTEM_API_DOCUMENTATION.md` - Voting API details
- `ADMIN_WEB_API_DOCUMENTATION.md` - Announcement API details
- `uploadMiddleware.js` - Backend upload handler
