# IMAGE UPLOAD CORRECTION GUIDE

**Date:** February 12, 2026  
**For:** Frontend Web Developer  
**Purpose:** Koreksi implementasi upload gambar untuk Voting & Announcement

---

## ⚠️ PENTING: KESALAHAN IMPLEMENTASI YANG DITEMUKAN

Frontend Web Developer membuat fitur **Voting** dan **Pengumuman** dengan cara yang **SALAH**:

### ❌ **YANG SALAH:**
- Input URL manual untuk gambar
- User harus paste URL sendiri
- Tidak ada upload file functionality

### ✅ **YANG BENAR:**
- Upload file dari komputer user
- Otomatis dapat URL dari server
- User-friendly dengan drag & drop

---

## 🚫 IMPLEMENTASI YANG SALAH

### **Current Implementation (SALAH):**

```vue
<!-- ❌ JANGAN SEPERTI INI -->
<template>
  <div class="form-group">
    <label>Question Image URL</label>
    <input 
      v-model="form.questionImageUrl" 
      type="text" 
      placeholder="Paste image URL here"
    />
  </div>

  <div class="form-group">
    <label>Option 1 Image URL</label>
    <input 
      v-model="form.options[0].optionImageUrl" 
      type="text" 
      placeholder="Paste image URL here"
    />
  </div>

  <div class="form-group">
    <label>Banner Image URL</label>
    <input 
      v-model="form.imageUrl" 
      type="text" 
      placeholder="Paste image URL here"
    />
  </div>
</template>
```

### **Masalah dengan Implementasi Ini:**

1. ❌ **Tidak User-Friendly**
   - User harus manual cari URL gambar dari internet
   - User harus copy-paste URL
   - User bingung dari mana dapat URL

2. ❌ **Security Risk**
   - Gambar dari URL eksternal (arbitrary URL)
   - Bisa link ke situs berbahaya
   - Tidak ada kontrol atas konten

3. ❌ **Reliability Issue**
   - Gambar di URL eksternal bisa hilang kapan saja
   - Link bisa broken setelah beberapa waktu
   - Tidak ada jaminan gambar selalu available

4. ❌ **No Validation**
   - Tidak ada cek format file
   - Tidak ada cek ukuran file
   - Bisa input URL yang bukan gambar

5. ❌ **No Preview**
   - User tidak bisa lihat gambar sebelum submit
   - Tidak tahu apakah URL valid
   - Bad UX

---

## ✅ IMPLEMENTASI YANG BENAR

### **Correct Implementation:**

```vue
<!-- ✅ YANG BENAR -->
<template>
  <div class="form-group">
    <ImageUpload
      v-model="form.questionImageUrl"
      label="Question Image"
      foto-type="voting"
    />
  </div>

  <div class="form-group">
    <ImageUpload
      v-model="form.options[0].optionImageUrl"
      label="Option 1 Image"
      foto-type="voting"
    />
  </div>

  <div class="form-group">
    <ImageUpload
      v-model="form.imageUrl"
      label="Banner Image"
      foto-type="announcement"
    />
  </div>
</template>
```

### **Keuntungan Implementasi Ini:**

1. ✅ **User-Friendly**
   - User tinggal pilih file dari komputer
   - Click atau drag & drop
   - Otomatis upload

2. ✅ **Secure**
   - Gambar disimpan di server sendiri
   - Full control atas konten
   - No external URL risk

3. ✅ **Reliable**
   - Gambar tersimpan permanent di server
   - Link tidak akan broken
   - Always available

4. ✅ **With Validation**
   - Auto cek format (JPEG/PNG/GIF/WebP)
   - Auto cek ukuran (max 5MB)
   - Clear error messages

5. ✅ **With Preview**
   - Real-time image preview
   - User bisa lihat gambar sebelum submit
   - Better UX

---

## 🔄 FLOW YANG BENAR

### **User Journey:**

```
1. User buka form Create Voting
         ↓
2. User lihat area upload "Click or drag image here"
         ↓
3. User klik area atau drag & drop file gambar
         ↓
4. File otomatis ter-upload ke server (dengan progress bar)
         ↓
5. Server save file dan return URL
         ↓
6. URL otomatis ter-isi di form (user tidak perlu tahu URL)
         ↓
7. Preview gambar muncul
         ↓
8. User lanjut isi form lainnya
         ↓
9. User submit form (dengan URL gambar yang sudah ter-isi)
         ↓
10. Done! ✅
```

### **Technical Flow:**

```
User pilih file (image.jpg)
         ↓
Frontend: FormData.append('file', file)
         ↓
Frontend: POST /api/users/profile/upload-foto
         ↓
Backend: Receive file & validate
         ↓
Backend: Save to /uploads/profiles/voting-1-123.jpg
         ↓
Backend: Return URL
         ↓
Response: { fileUrl: "http://localhost:3030/uploads/profiles/voting-1-123.jpg" }
         ↓
Frontend: Auto-fill form.questionImageUrl = fileUrl
         ↓
User submit form
         ↓
POST /api/voting with questionImageUrl
```

---

## 🎨 COMPONENT YANG BENAR

### **1. ImageUpload.vue Component**

File: `src/components/ImageUpload.vue`

```vue
<template>
  <div class="image-upload-wrapper">
    <label :for="inputId" class="upload-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div class="upload-container">
      <!-- Hidden File Input -->
      <input
        :id="inputId"
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        @change="handleFileSelect"
        style="display: none"
      />

      <!-- Upload Area (Before Upload) -->
      <div
        v-if="!modelValue"
        class="upload-area"
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        :class="{ 'is-dragging': isDragging }"
      >
        <div class="upload-icon">📷</div>
        <p class="upload-text">{{ placeholder }}</p>
        <p class="upload-subtext">JPEG, PNG, GIF, WebP (Max 5MB)</p>
        <button type="button" class="upload-button">
          Choose File
        </button>
      </div>

      <!-- Preview Area (After Upload) -->
      <div v-else class="preview-area">
        <img :src="modelValue" :alt="label" class="preview-image" />
        
        <div class="upload-info">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: uploading ? uploadProgress + '%' : '100%' }"
            ></div>
          </div>
          
          <p v-if="uploading" class="status-text">
            Uploading... {{ uploadProgress }}%
          </p>
          <p v-else class="success-text">
            ✅ Uploaded successfully
          </p>
        </div>

        <button 
          type="button" 
          @click="removeImage"
          class="remove-button"
        >
          ❌ Remove Image
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        ⚠️ {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useImageUpload } from '@/composables/useImageUpload';

const props = defineProps({
  modelValue: String,
  label: {
    type: String,
    default: 'Image'
  },
  placeholder: {
    type: String,
    default: 'Click or drag image here'
  },
  fotoType: {
    type: String,
    default: 'voting',
    validator: (value) => ['voting', 'announcement', 'profil', 'ktp'].includes(value)
  },
  required: Boolean
});

const emit = defineEmits(['update:modelValue']);

const fileInput = ref(null);
const isDragging = ref(false);
const error = ref(null);
const { uploadImage, uploading, uploadProgress } = useImageUpload();

const inputId = computed(() => `upload-${Math.random().toString(36).substr(2, 9)}`);

const triggerFileInput = () => {
  if (!uploading.value) {
    fileInput.value?.click();
  }
};

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0];
  if (file) {
    await uploadFile(file);
  }
};

const handleFileDrop = async (event) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    await uploadFile(file);
  }
};

const uploadFile = async (file) => {
  try {
    error.value = null;

    // Validation
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      error.value = 'Invalid format. Please use JPEG, PNG, GIF, or WebP.';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      error.value = 'File too large. Maximum size is 5MB.';
      return;
    }

    // Upload to server
    const url = await uploadImage(file, props.fotoType);
    
    // Emit URL to parent
    emit('update:modelValue', url);
  } catch (err) {
    error.value = err.message || 'Upload failed. Please try again.';
    console.error('Upload error:', err);
  }
};

const removeImage = () => {
  emit('update:modelValue', null);
  error.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>

<style scoped>
.image-upload-wrapper {
  margin-bottom: 20px;
}

.upload-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

.required {
  color: #e53e3e;
  margin-left: 4px;
}

.upload-container {
  position: relative;
}

/* Upload Area (before upload) */
.upload-area {
  border: 2px dashed #4299e1;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f7fafc;
}

.upload-area:hover {
  border-color: #3182ce;
  background-color: #edf2f7;
}

.upload-area.is-dragging {
  border-color: #48bb78;
  background-color: #c6f6d5;
  transform: scale(1.02);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  margin: 0 0 8px 0;
  color: #2d3748;
  font-weight: 500;
  font-size: 16px;
}

.upload-subtext {
  margin: 0 0 20px 0;
  color: #718096;
  font-size: 13px;
}

.upload-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

/* Preview Area (after upload) */
.preview-area {
  border: 2px solid #48bb78;
  border-radius: 12px;
  padding: 16px;
  background-color: #f0fff4;
  position: relative;
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 400px;
  border-radius: 8px;
  object-fit: contain;
  margin-bottom: 16px;
  display: block;
  background-color: white;
}

.upload-info {
  margin-bottom: 12px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.status-text {
  margin: 0;
  color: #d69e2e;
  font-size: 13px;
  font-weight: 500;
}

.success-text {
  margin: 0;
  color: #38a169;
  font-size: 13px;
  font-weight: 600;
}

.remove-button {
  width: 100%;
  background-color: #fc8181;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.remove-button:hover {
  background-color: #f56565;
  transform: translateY(-1px);
}

/* Error Message */
.error-message {
  color: #e53e3e;
  font-size: 13px;
  margin-top: 8px;
  padding: 10px 12px;
  background-color: #fed7d7;
  border-radius: 6px;
  border-left: 4px solid #e53e3e;
}
</style>
```

### **2. useImageUpload.js Composable**

File: `src/composables/useImageUpload.js`

```javascript
import { ref } from 'vue';
import axios from 'axios';

export function useImageUpload() {
  const uploading = ref(false);
  const uploadProgress = ref(0);
  const error = ref(null);

  /**
   * Upload image to server
   * @param {File} file - Image file
   * @param {string} fotoType - Type: 'voting', 'announcement', 'profil', 'ktp'
   * @returns {Promise<string>} - Image URL
   */
  const uploadImage = async (file, fotoType = 'voting') => {
    if (!file) {
      throw new Error('No file provided');
    }

    uploading.value = true;
    uploadProgress.value = 0;
    error.value = null;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fotoType', fotoType);

      const response = await axios.post('/users/profile/upload-foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          }
        }
      });

      if (response.data.success) {
        uploadProgress.value = 100;
        
        // Wait a bit to show 100% before hiding progress
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return response.data.data.fileUrl;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      error.value = errorMessage;
      throw new Error(errorMessage);
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
      } catch (err) {
        console.error(`Failed to upload file ${i + 1}:`, err);
        throw err;
      }
    }
    
    return urls;
  };

  return {
    uploadImage,
    uploadMultipleImages,
    uploading,
    uploadProgress,
    error
  };
}
```

---

## 📝 VOTING FORM - IMPLEMENTASI YANG BENAR

File: `src/views/CreateVoting.vue`

```vue
<template>
  <div class="create-voting-page">
    <div class="page-header">
      <h1>Create New Voting</h1>
      <p>Create a new voting for members</p>
    </div>

    <form @submit.prevent="handleSubmit" class="voting-form">
      <!-- Basic Info -->
      <div class="form-section">
        <h2>Basic Information</h2>

        <div class="form-group">
          <label>Voting Title *</label>
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="Enter voting title"
            required
          />
        </div>

        <div class="form-group">
          <label>Question *</label>
          <textarea 
            v-model="form.question" 
            placeholder="Enter voting question"
            rows="4"
            required
          ></textarea>
        </div>

        <!-- 🔑 UPLOAD QUESTION IMAGE (NOT INPUT URL) -->
        <ImageUpload
          v-model="form.questionImageUrl"
          label="Question Image (Optional)"
          placeholder="Click or drag question image"
          foto-type="voting"
        />

        <div class="form-row">
          <div class="form-group">
            <label>Voting Type *</label>
            <select v-model="form.votingType" required>
              <option value="single">Single Choice (1 answer)</option>
              <option value="multiple">Multiple Choice (many answers)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Deadline *</label>
            <input 
              v-model="form.deadline" 
              type="datetime-local" 
              required
            />
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="form-section">
        <h2>Options</h2>
        
        <div 
          v-for="(option, index) in form.options" 
          :key="index"
          class="option-card"
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
            <input 
              v-model="option.optionText" 
              type="text" 
              placeholder="Enter option text"
              required
            />
          </div>

          <!-- 🔑 UPLOAD OPTION IMAGE (NOT INPUT URL) -->
          <ImageUpload
            v-model="option.optionImageUrl"
            :label="`Option ${index + 1} Image (Optional)`"
            :placeholder="`Click or drag option ${index + 1} image`"
            foto-type="voting"
          />
        </div>

        <button 
          type="button" 
          @click="addOption"
          class="btn-add-option"
        >
          + Add Option
        </button>
      </div>

      <!-- Submit -->
      <div class="form-actions">
        <button type="button" @click="$router.back()" class="btn-cancel">
          Cancel
        </button>
        <button 
          type="submit" 
          :disabled="loading"
          class="btn-submit"
        >
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
const loading = ref(false);

const form = ref({
  title: '',
  question: '',
  questionImageUrl: null,  // ✅ Will be auto-filled after upload
  votingType: 'single',
  deadline: '',
  options: [
    { optionText: '', optionImageUrl: null },
    { optionText: '', optionImageUrl: null }
  ]
});

const addOption = () => {
  form.value.options.push({ 
    optionText: '', 
    optionImageUrl: null 
  });
};

const removeOption = (index) => {
  form.value.options.splice(index, 1);
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    // Validation
    if (!form.value.title.trim()) {
      alert('Please enter voting title');
      return;
    }

    if (!form.value.question.trim()) {
      alert('Please enter voting question');
      return;
    }

    if (form.value.options.some(opt => !opt.optionText.trim())) {
      alert('All options must have text');
      return;
    }

    if (form.value.options.length < 2) {
      alert('Please add at least 2 options');
      return;
    }

    // Submit
    const payload = {
      title: form.value.title,
      question: form.value.question,
      questionImageUrl: form.value.questionImageUrl,  // ✅ URL from upload
      votingType: form.value.votingType,
      deadline: new Date(form.value.deadline).toISOString(),
      options: form.value.options.map((opt, index) => ({
        optionText: opt.optionText,
        optionImageUrl: opt.optionImageUrl,  // ✅ URL from upload
        orderIndex: index
      }))
    };

    console.log('Creating voting:', payload);

    const response = await axios.post('/voting', payload);

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

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  color: #1a202c;
  margin-bottom: 8px;
}

.page-header p {
  color: #718096;
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

.form-section:last-of-type {
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
  font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.option-card {
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 2px solid #e2e8f0;
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
  margin: 0;
}

.btn-remove {
  padding: 6px 12px;
  background-color: #fed7d7;
  color: #c53030;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-remove:hover {
  background-color: #fc8181;
  color: white;
}

.btn-add-option {
  width: 100%;
  padding: 12px;
  background: white;
  color: #667eea;
  border: 2px dashed #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-option:hover {
  background: #f7fafc;
  border-color: #5568d3;
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
  transition: all 0.2s;
}

.btn-cancel {
  background: #edf2f7;
  color: #4a5568;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

---

## 📝 ANNOUNCEMENT FORM - IMPLEMENTASI YANG BENAR

File: `src/views/CreateAnnouncement.vue`

```vue
<template>
  <div class="create-announcement-page">
    <div class="page-header">
      <h1>Create New Announcement</h1>
      <p>Create a new announcement for members</p>
    </div>

    <form @submit.prevent="handleSubmit" class="announcement-form">
      <div class="form-group">
        <label>Title *</label>
        <input 
          v-model="form.title" 
          type="text" 
          placeholder="Enter announcement title"
          required
        />
      </div>

      <div class="form-group">
        <label>Type *</label>
        <select v-model="form.type" required>
          <option value="sambutan">Sambutan</option>
          <option value="pengumuman">Pengumuman Umum</option>
          <option value="download">Download (AD/ART, etc)</option>
          <option value="artikel">Artikel</option>
        </select>
      </div>

      <div class="form-group">
        <label>Content *</label>
        <textarea 
          v-model="form.content" 
          placeholder="Enter announcement content"
          rows="10"
          required
        ></textarea>
      </div>

      <!-- 🔑 UPLOAD BANNER IMAGE (NOT INPUT URL) -->
      <ImageUpload
        v-model="form.imageUrl"
        label="Banner Image (Optional)"
        placeholder="Click or drag banner image"
        foto-type="announcement"
      />

      <div class="form-group">
        <label class="checkbox-label">
          <input 
            v-model="form.isActive" 
            type="checkbox"
          />
          <span>Active (Visible to users)</span>
        </label>
      </div>

      <div class="form-actions">
        <button type="button" @click="$router.back()" class="btn-cancel">
          Cancel
        </button>
        <button 
          type="submit" 
          :disabled="loading"
          class="btn-submit"
        >
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
const loading = ref(false);

const form = ref({
  title: '',
  type: 'pengumuman',
  content: '',
  imageUrl: null,  // ✅ Will be auto-filled after upload
  isActive: true
});

const handleSubmit = async () => {
  loading.value = true;

  try {
    if (!form.value.title.trim()) {
      alert('Please enter announcement title');
      return;
    }

    if (!form.value.content.trim()) {
      alert('Please enter announcement content');
      return;
    }

    const payload = {
      title: form.value.title,
      type: form.value.type,
      content: form.value.content,
      imageUrl: form.value.imageUrl,  // ✅ URL from upload
      isActive: form.value.isActive
    };

    console.log('Creating announcement:', payload);

    const response = await axios.post('/announcement', payload);

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
.create-announcement-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  color: #1a202c;
  margin-bottom: 8px;
}

.page-header p {
  color: #718096;
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
  font-size: 14px;
}

.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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
  transition: all 0.2s;
}

.btn-cancel {
  background: #edf2f7;
  color: #4a5568;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

---

## ✅ CHECKLIST UNTUK FRONTEND WEB

### **IMMEDIATE ACTIONS (URGENT):**

- [ ] **STOP** development saat ini
- [ ] **HAPUS** semua `<input type="text">` untuk image URL di:
  - [ ] Create Voting form
  - [ ] Edit Voting form
  - [ ] Create Announcement form
  - [ ] Edit Announcement form
- [ ] **COPY** file `ImageUpload.vue` component dari dokumentasi ini
- [ ] **COPY** file `useImageUpload.js` composable dari dokumentasi ini
- [ ] **REPLACE** semua input URL dengan `<ImageUpload>` component
- [ ] **TEST** upload functionality untuk semua form
- [ ] **VERIFY** gambar tersimpan di server dengan benar

### **TESTING CHECKLIST:**

- [ ] Test upload question image di voting form
- [ ] Test upload option images di voting form
- [ ] Test upload banner di announcement form
- [ ] Test drag & drop functionality
- [ ] Test file validation (format & size)
- [ ] Test image preview
- [ ] Test remove image
- [ ] Test submit form dengan gambar
- [ ] Test submit form tanpa gambar (optional)

---

## 🧪 TESTING GUIDE

### **Manual Testing Steps:**

1. **Test Upload Endpoint:**
```bash
curl -X POST http://localhost:3030/api/users/profile/upload-foto \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "fotoType=voting"
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "fileUrl": "http://localhost:3030/uploads/profiles/voting-1-123456.jpg"
  }
}
```

2. **Test Create Voting with Images:**
```bash
curl -X POST http://localhost:3030/api/voting \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Voting",
    "question": "Test Question?",
    "questionImageUrl": "http://localhost:3030/uploads/profiles/question.jpg",
    "votingType": "single",
    "deadline": "2026-12-31T23:59:59Z",
    "options": [
      {
        "optionText": "Option 1",
        "optionImageUrl": "http://localhost:3030/uploads/profiles/option1.jpg",
        "orderIndex": 0
      },
      {
        "optionText": "Option 2",
        "optionImageUrl": "http://localhost:3030/uploads/profiles/option2.jpg",
        "orderIndex": 1
      }
    ]
  }'
```

3. **Test Create Announcement with Image:**
```bash
curl -X POST http://localhost:3030/api/announcement \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "type": "pengumuman",
    "content": "Test content",
    "imageUrl": "http://localhost:3030/uploads/profiles/banner.jpg",
    "isActive": true
  }'
```

---

## 📚 ADDITIONAL RESOURCES

### **Upload Specifications:**
- **Endpoint:** `POST /api/users/profile/upload-foto`
- **Method:** multipart/form-data
- **Max File Size:** 5MB
- **Allowed Formats:** JPEG, JPG, PNG, GIF, WebP
- **Storage Location:** `/uploads/profiles/`
- **File Access:** `http://localhost:3030/uploads/profiles/filename.jpg`

### **Related Documentation:**
- `IMAGE_UPLOAD_GUIDE.md` - Complete image upload guide
- `VOTING_SYSTEM_API_DOCUMENTATION.md` - Voting API details
- `ADMIN_WEB_API_DOCUMENTATION.md` - Admin web API details

---

## 🚨 IMPORTANT NOTES

1. **Gambar HARUS di-upload**, bukan input URL manual
2. **Component sudah siap pakai** - tinggal copy-paste
3. **Testing wajib** sebelum deploy
4. **User experience** jauh lebih baik dengan upload file
5. **Security** lebih terjamin dengan upload ke server sendiri

---

**File ini WAJIB dibaca dan diimplementasikan oleh Frontend Web Developer!**

**Deadline:** Perbaiki implementasi ASAP sebelum deployment.

**Last Updated:** February 12, 2026
