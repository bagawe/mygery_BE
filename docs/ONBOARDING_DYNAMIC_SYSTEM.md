# Dynamic Onboarding System - Requirements & Implementation

**Dibuat:** April 7, 2026  
**Status:** ✅ BACKEND IMPLEMENTATION COMPLETE  
**Priority:** Medium  
**Owner:** Backend Team ✅, Web Team (Pending), Frontend Team (Pending)

---

## 📋 Executive Summary

Sistem onboarding dinamis yang memungkinkan admin/web team untuk membuat dan mengatur onboarding slides tanpa perlu update app. Setiap slide dapat dikonfigurasi dengan berbagai kombinasi konten (judul, text, image).

**Current State:** ✅ Backend implementasi selesai (Prisma schema, API endpoints, service layer)  
**Next State:** Web team buat admin dashboard, Frontend team update mobile app

---

## ✅ Backend Implementation Status

### Completed:
- ✅ Prisma schema dengan OnboardingSlide model
- ✅ Database migration dengan default 4 slides
- ✅ Unique UUID untuk setiap slide
- ✅ Status aktif/non-aktif (soft delete)
- ✅ Semua 7 API endpoints
- ✅ Service layer dengan full business logic
- ✅ Input validation dan error handling

### API Endpoints Ready:
1. ✅ `GET /api/onboarding/slides` - Public endpoint (mobile)
2. ✅ `GET /api/onboarding/all` - Admin endpoint
3. ✅ `POST /api/onboarding/slides` - Create slide (admin)
4. ✅ `PUT /api/onboarding/slides/:id` - Update slide (admin)
5. ✅ `DELETE /api/onboarding/slides/:id` - Hard delete (admin)
6. ✅ `PUT /api/onboarding/slides/:id/deactivate` - Soft delete (admin)
7. ✅ `PUT /api/onboarding/slides/:id/activate` - Activate (admin)
8. ✅ `POST /api/onboarding/reorder` - Reorder slides (admin)

---

## 🎯 Feature Requirements

### 1. Frontend Behavior (Mobile - Flutter)

#### Slide Navigation Rules
```
Slide 1 (First):
  - Cannot skip (tombol skip disabled)
  - Only "Next" button shown
  - Gesture back disabled

Slide 2 (Second):
  - Cannot skip (tombol skip disabled)
  - Only "Next" button shown
  - Gesture back disabled

Slide 3+ (Remaining):
  - Can skip (skip button enabled)
  - "Next" dan "Skip" buttons shown
  - Gesture back disabled

Last Slide:
  - "Finish" button instead of "Next"
  - "Skip" button available
  - Clicking Skip atau Finish goes to Login Page
```

#### UI Components per Slide
Slide dapat menampilkan kombinasi dari:
- **Title** (optional) - Heading text
- **Image** (optional) - Hero image/illustration
- **Description** (optional) - Body text/paragraph
- **Background Color** (optional) - Custom background

**Layout Combinations:**
1. Title + Image (Title top, image below)
2. Title + Description (Stacked text)
3. Image Only (Full height image)
4. Description Only (Full height text)
5. Title + Image + Description (Complete layout)

---

## 🔌 Backend Specification

### 1. Database Schema (✅ IMPLEMENTED)

**Table: `onboarding_slides`**

```sql
CREATE TABLE onboarding_slides (
  id SERIAL PRIMARY KEY,
  uuid TEXT UNIQUE NOT NULL,
  
  -- Content
  order INT NOT NULL DEFAULT 0,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  imageUrl VARCHAR(500) NULL,
  backgroundColor VARCHAR(7) NULL,
  
  -- Metadata
  type ENUM('title_image', 'title_text', 'image_only', 'text_only', 'title_image_text') DEFAULT 'title_image',
  skipAllowed BOOLEAN DEFAULT true,
  isActive BOOLEAN DEFAULT true,
  createdBy INT NULL,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (createdBy) REFERENCES users(id),
  INDEX idx_order (order),
  INDEX idx_active (isActive)
);
```

**Features:**
- ✅ UUID untuk unique identifier setiap slide
- ✅ Status aktif/non-aktif (bukan hard delete, soft delete supported)
- ✅ Support semua 5 type kombinasi
- ✅ Flexible content (optional title, description, image)

---

### 2. API Endpoints (✅ IMPLEMENTED)

#### Public Endpoint - Get Active Slides

**Endpoint:** `GET /api/onboarding/slides`

**Query Parameters:** None

**Response Format (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "order": 1,
      "title": "Selamat Datang",
      "description": null,
      "imageUrl": "/uploads/onboarding/welcome-1.png",
      "backgroundColor": null,
      "type": "title_image",
      "skipAllowed": false,
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    },
    {
      "id": 2,
      "uuid": "550e8400-e29b-41d4-a716-446655440001",
      "order": 2,
      "title": "Fitur Utama",
      "description": "Explore semua fitur menarik aplikasi kami",
      "imageUrl": "/uploads/onboarding/features-2.png",
      "backgroundColor": "#F5F5F5",
      "type": "title_image_text",
      "skipAllowed": false,
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    },
    {
      "id": 3,
      "uuid": "550e8400-e29b-41d4-a716-446655440002",
      "order": 3,
      "title": "Komunitas Kader",
      "description": "Bergabunglah dengan ribuan kader lainnya",
      "imageUrl": "/uploads/onboarding/community-3.jpg",
      "backgroundColor": null,
      "type": "title_image_text",
      "skipAllowed": true,
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    },
    {
      "id": 4,
      "uuid": "550e8400-e29b-41d4-a716-446655440003",
      "order": 4,
      "title": "Terima Kasih",
      "description": "Sekarang Anda siap memulai perjalanan!",
      "imageUrl": null,
      "backgroundColor": "#FFFFFF",
      "type": "text_only",
      "skipAllowed": true,
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 4,
    "activeCount": 4
  }
}
```

**Response Format (Error - 500):**
```json
{
  "success": false,
  "message": "Error message",
  "data": []
}
```

**Implementation Notes:**
- ✅ Return only `isActive = true` slides
- ✅ Order by `order` ASC
- ✅ Include full imageUrl path
- ✅ No authentication required (public endpoint)

---

#### Admin Endpoint - Get All Slides (including inactive)

**Endpoint:** `GET /api/onboarding/all`

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 20)
```

**Response Format (Success - 200):**
```json
{
  "success": true,
  "data": [
    // ... slides including inactive ones
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1,
    "hasNextPage": false
  }
}
```

**Auth Required:** ✅ Bearer token + admin role

---

#### Create Slide

**Endpoint:** `POST /api/onboarding/slides`

**Auth Required:** ✅ Bearer token + admin role

**Request Body:**
```json
{
  "order": 5,
  "title": "Komunitas Baru",
  "description": "Bergabunglah sekarang",
  "imageUrl": "/uploads/onboarding/new-slide.jpg",
  "backgroundColor": "#FFFFFF",
  "type": "title_image_text",
  "skipAllowed": true,
  "isActive": true
}
```

**Validation Rules:**
- ✅ `order` - Required (integer >= 0)
- ✅ `title` - Optional (max 255 chars)
- ✅ `description` - Optional (max 5000 chars)
- ✅ `imageUrl` - Optional (valid URL/path)
- ✅ `backgroundColor` - Optional (hex color #RRGGBB)
- ✅ `type` - Required (one of 5 types)
- ✅ `skipAllowed` - Required (boolean)
- ✅ `isActive` - Required (boolean)
- ✅ At least one of: title, description, imageUrl required

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Slide created successfully",
  "data": {
    "id": 5,
    "uuid": "550e8400-e29b-41d4-a716-446655440004",
    "order": 5,
    "title": "Komunitas Baru",
    "description": "Bergabunglah sekarang",
    "imageUrl": "/uploads/onboarding/new-slide.jpg",
    "backgroundColor": "#FFFFFF",
    "type": "title_image_text",
    "skipAllowed": true,
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2026-04-07T10:00:00Z",
    "updatedAt": "2026-04-07T10:00:00Z"
  }
}
```

---

#### Update Slide

**Endpoint:** `PUT /api/onboarding/slides/:id`

**Auth Required:** ✅ Bearer token + admin role

**Request Body:** (same as create, all optional except type)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Slide updated successfully",
  "data": { /* updated slide */ }
}
```

**Response (Not Found - 404):**
```json
{
  "success": false,
  "message": "Slide not found"
}
```

---

#### Delete Slide (Hard Delete)

**Endpoint:** `DELETE /api/onboarding/slides/:id`

**Auth Required:** ✅ Bearer token + admin role

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Slide deleted successfully",
  "data": null
}
```

---

#### Deactivate Slide (Soft Delete)

**Endpoint:** `PUT /api/onboarding/slides/:id/deactivate`

**Auth Required:** ✅ Bearer token + admin role

**Purpose:** Disable slide without deleting (can be reactivated later)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Slide deactivated successfully",
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "isActive": false,
    // ... other fields
  }
}
```

---

#### Activate Slide

**Endpoint:** `PUT /api/onboarding/slides/:id/activate`

**Auth Required:** ✅ Bearer token + admin role

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Slide activated successfully",
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "isActive": true,
    // ... other fields
  }
}
```

---

#### Reorder Slides

**Endpoint:** `POST /api/onboarding/reorder`

**Auth Required:** ✅ Bearer token + admin role

**Request Body:**
```json
{
  "slides": [
    { "id": 1, "order": 2 },
    { "id": 2, "order": 1 },
    { "id": 3, "order": 3 },
    { "id": 4, "order": 4 }
  ]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Slides reordered successfully",
  "data": null
}
```

---

## 🌐 Web Dashboard Requirements (Next: Web Team)

### 1. Admin Panel Page: Onboarding Manager

**URL:** `/admin/onboarding`

#### Features:
1. **List View**
   - Table dengan semua onboarding slides
   - Columns: Order, Title, Type, Active Status, Actions
   - Sort by order (drag & drop to reorder)
   - Filter: Active/Inactive
   - Actions: Edit, Delete, Deactivate/Activate, Preview

2. **Create New Slide**
   - Button: "+ Add New Slide"
   - Opens modal/form dengan fields:
     - Order (auto-increment, can be changed)
     - Title (text input, optional)
     - Description (textarea, optional)
     - Image Upload (file picker, optional)
     - Background Color (color picker, optional)
     - Type (dropdown: 5 options)
     - Skip Allowed (toggle)
     - Active (toggle)
     - Save Button

3. **Edit Slide**
   - Click edit button in list
   - Opens form dengan existing data
   - Save changes
   - Show validation errors

4. **Delete/Deactivate Slide**
   - Delete button dengan confirmation (hard delete)
   - Deactivate button untuk soft delete
   - Atau toggle "Active" status

5. **Reorder Slides**
   - Drag & drop interface
   - Update order number
   - Auto-save on drop

6. **Preview**
   - Show slide preview sebelum save
   - Desktop dan mobile view
   - Live preview berdasarkan type

---

## 📱 Frontend (Flutter) Requirements (Next: Frontend Team)

### 1. Updated OnboardingPage Component

**Current Structure (Example):**
```dart
class OnboardingPage extends StatefulWidget {
  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  late PageController pageController;
  int currentPage = 0;
  List<OnboardingSlide> slides = [];
  bool isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _fetchOnboardingSlides();
  }
  
  Future<void> _fetchOnboardingSlides() async {
    try {
      final service = OnboardingService();
      final fetchedSlides = await service.getSlides();
      setState(() {
        slides = fetchedSlides;
        isLoading = false;
      });
    } catch (e) {
      print('Error fetching slides: $e');
      setState(() => isLoading = false);
    }
  }
  
  // ... rest of implementation
}
```

### 2. OnboardingService (Required)

**Path:** `lib/services/onboarding_service.dart`

```dart
class OnboardingService {
  final _apiService = ApiService();

  Future<List<OnboardingSlide>> getSlides() async {
    try {
      final response = await _apiService.get('/onboarding/slides');
      if (response['success'] == true) {
        final List<dynamic> dataList = response['data'] ?? [];
        return dataList
            .map((json) => OnboardingSlide.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error: $e');
      return [];
    }
  }
}
```

### 3. OnboardingSlide Model (Required)

```dart
class OnboardingSlide {
  final int id;
  final String uuid;
  final int order;
  final String? title;
  final String? description;
  final String? imageUrl;
  final String? backgroundColor;
  final String type;
  final bool skipAllowed;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  // ... factory constructor, toJson, etc
}
```

---

## 🔄 User Flow

### First Time User (No Skip):
```
Onboarding Page (API Call GET /onboarding/slides)
    ↓ Get active slides
Display Slide 1 (skipAllowed=false, no skip button)
    ↓ Next
Display Slide 2 (skipAllowed=false, no skip button)
    ↓ Next
Display Slide 3 (skipAllowed=true, skip button enabled)
    ↓ Next or Skip
Display Slide 4 (Last slide, skipAllowed=true)
    ↓ Finish or Skip
    ↓
Login Page
```

### User Skips:
```
Onboarding Page
    ↓
Display Slide 3 (skipAllowed=true)
    ↓ Skip
    ↓
Login Page (Bypass remaining slides)
```

---

## 📊 Implementation Checklist

### Backend Team: ✅ COMPLETE
- ✅ Create `onboarding_slides` table
- ✅ Create `GET /api/onboarding/slides` endpoint
- ✅ Create `GET /api/onboarding/all` endpoint (admin)
- ✅ Create `POST /api/onboarding/slides` endpoint (admin)
- ✅ Create `PUT /api/onboarding/slides/:id` endpoint (admin)
- ✅ Create `DELETE /api/onboarding/slides/:id` endpoint (admin)
- ✅ Create `PUT /api/onboarding/slides/:id/deactivate` endpoint (admin)
- ✅ Create `PUT /api/onboarding/slides/:id/activate` endpoint (admin)
- ✅ Create `POST /api/onboarding/reorder` endpoint (admin)
- ✅ Add input validation
- ✅ Add permissions check (admin only for write)
- ✅ Add UUID for each slide
- ✅ Add soft delete support (status aktif/non-aktif)
- ✅ Test endpoints dengan Postman

### Web Team: ⏳ PENDING
- [ ] Create Onboarding Manager page at `/admin/onboarding`
- [ ] Create list view dengan CRUD operations
- [ ] Create form untuk add/edit slides
- [ ] Add drag & drop reordering
- [ ] Add preview functionality
- [ ] Add image upload handler
- [ ] Add deactivate/activate toggle
- [ ] Test semua CRUD operations
- [ ] Integrate dengan backend API

### Frontend Team: ⏳ PENDING
- [ ] Create `OnboardingSlide` model
- [ ] Create `OnboardingService`
- [ ] Update `OnboardingPage` untuk use API
- [ ] Implement dynamic slide rendering
- [ ] Implement skip logic
- [ ] Handle loading state
- [ ] Handle error fallback
- [ ] Test dengan berbagai slide configurations

---

## 🧪 Testing Scenarios

### Scenario 1: Default Setup (4 Slides)
```
Slide 1: Title + Image (No Skip)
Slide 2: Title + Description + Image (No Skip)
Slide 3: Title + Description (Skip allowed)
Slide 4: Text Only (Skip allowed, Last)
→ Expected: Navigate through all, skip on 3-4
```

### Scenario 2: Mixed Content Types
```
Slide 1: Image Only (No Skip)
Slide 2: Text Only (No Skip)
Slide 3: Title Only (Skip allowed)
→ Expected: All types render correctly
```

### Scenario 3: Empty Slides
```
No active slides in database
→ Expected: Skip to Login Page
```

### Scenario 4: API Error
```
API returns error
→ Expected: Show error message or fallback
```

### Scenario 5: Admin Operations
```
Create new slide → GET all → Update → Deactivate → Activate → Delete
→ Expected: All CRUD operations work correctly
```

---

## 📝 Notes & Best Practices

1. **Image Handling (Web):**
   - Store images di `/uploads/onboarding/` directory
   - Optimize images (resize, compress)
   - Support JPG dan PNG formats
   - Max file size: 5MB

2. **Performance:**
   - Cache slides untuk 1 hour (optional di frontend)
   - Lazy load images
   - Minimize API calls

3. **Accessibility:**
   - Add alt text ke images
   - Ensure color contrast untuk text
   - Add semantic HTML/accessibility labels

4. **Fallback:**
   - Jika no active slides, skip ke Login
   - Jika API fails, show error atau use default slides

5. **Future Enhancements:**
   - A/B testing (show different slides to different users)
   - Analytics (track which slides users see)
   - Animations per slide type
   - Video support (future)

---

## 🔗 Git Commit Info

**Backend Commit:** `[pending push]`

**Files Created:**
- `src/modules/onboarding/onboarding.service.js`
- `src/modules/onboarding/onboarding.controller.js`
- `src/modules/onboarding/onboarding.routes.js`
- `prisma/migrations/20260407020000_add_onboarding_slides_model/migration.sql`

**Files Modified:**
- `prisma/schema.prisma` (added OnboardingSlide model + enum)
- `src/app.js` (registered onboarding routes)

---

## 📞 Next Steps

1. **Backend:** Push code ke git (done)
2. **Web Team:** Clone latest, create admin dashboard
3. **Frontend Team:** Clone latest, update onboarding page
4. **Testing:** Koordinasi testing antar teams
5. **Deployment:** Deploy ke staging/production

---

**Document Version:** 2.0  
**Last Updated:** April 7, 2026  
**Status:** ✅ Backend Complete - Ready for Web & Frontend Teams  

---

## 📋 Executive Summary

Sistem onboarding dinamis yang memungkinkan admin/web team untuk membuat dan mengatur onboarding slides tanpa perlu update app. Setiap slide dapat dikonfigurasi dengan berbagai kombinasi konten (judul, text, image).

**Current State:** Hardcoded 3 slides (static)  
**Target State:** Dynamic slides dari database via API

---

## 🎯 Feature Requirements

### 1. Frontend Behavior

#### Slide Navigation Rules
```
Slide 1 (First):
  - Cannot skip (tombol skip disabled)
  - Only "Next" button shown
  - Gesture back disabled

Slide 2 (Second):
  - Cannot skip (tombol skip disabled)
  - Only "Next" button shown
  - Gesture back disabled

Slide 3+ (Remaining):
  - Can skip (skip button enabled)
  - "Next" dan "Skip" buttons shown
  - Gesture back disabled

Last Slide:
  - "Finish" button instead of "Next"
  - "Skip" button available
  - Clicking Skip atau Finish goes to Login Page
```

#### UI Components per Slide
Slide dapat menampilkan kombinasi dari:
- **Title** (optional) - Heading text
- **Image** (optional) - Hero image/illustration
- **Description** (optional) - Body text/paragraph
- **Background Color** (optional) - Custom background

**Layout Combinations:**
1. Title + Image (Title top, image below)
2. Title + Description (Stacked text)
3. Image Only (Full height image)
4. Description Only (Full height text)
5. Title + Image + Description (Complete layout)

---

## 🔌 Backend Requirements

### 1. Database Schema

**Create Table: `onboarding_slides`**

```sql
CREATE TABLE onboarding_slides (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  
  -- Content
  order INT NOT NULL DEFAULT 0,  -- Display order (1, 2, 3, ...)
  title VARCHAR(255),             -- Optional: Slide title
  description LONGTEXT,           -- Optional: Slide description/body text
  imageUrl VARCHAR(500),          -- Optional: Image URL (from /uploads/)
  backgroundColor VARCHAR(7),     -- Optional: Hex color (e.g., #FFFFFF)
  
  -- Metadata
  isActive BOOLEAN DEFAULT true,  -- Can disable slide without deleting
  skipAllowed BOOLEAN DEFAULT true, -- Slide 1-2 should be false
  type ENUM('title-image', 'title-text', 'image-only', 'text-only', 'title-image-text') DEFAULT 'title-image',
  
  createdBy INT,                  -- Admin ID who created
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (createdBy) REFERENCES users(id),
  INDEX idx_order (order),
  INDEX idx_active (isActive)
);
```

**Example Data:**
```sql
INSERT INTO onboarding_slides (order, title, description, imageUrl, skipAllowed, type, isActive) VALUES
(1, 'Selamat Datang', NULL, '/uploads/onboarding/welcome-1.png', false, 'title-image', true),
(2, 'Fitur Utama', 'Explore semua fitur menarik aplikasi kami', '/uploads/onboarding/features-2.png', false, 'title-image-text', true),
(3, 'Komunitas Kader', 'Bergabunglah dengan ribuan kader lainnya', '/uploads/onboarding/community-3.jpg', true, 'title-image-text', true),
(4, 'Terima Kasih', 'Sekarang Anda siap memulai perjalanan!', NULL, true, 'text-only', true);
```

---

### 2. Backend API Endpoint

#### Get All Onboarding Slides

**Endpoint:** `GET /api/onboarding/slides`

**Query Parameters:**
```
None (returns all active slides)
```

**Response Format (Success):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "order": 1,
      "title": "Selamat Datang",
      "description": null,
      "imageUrl": "/uploads/onboarding/welcome-1.png",
      "backgroundColor": null,
      "type": "title-image",
      "skipAllowed": false,
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    },
    {
      "id": 2,
      "uuid": "550e8400-e29b-41d4-a716-446655440001",
      "order": 2,
      "title": "Fitur Utama",
      "description": "Explore semua fitur menarik aplikasi kami",
      "imageUrl": "/uploads/onboarding/features-2.png",
      "backgroundColor": "#F5F5F5",
      "type": "title-image-text",
      "skipAllowed": false,
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    },
    {
      "id": 3,
      "uuid": "550e8400-e29b-41d4-a716-446655440002",
      "order": 3,
      "title": "Komunitas Kader",
      "description": "Bergabunglah dengan ribuan kader lainnya",
      "imageUrl": "/uploads/onboarding/community-3.jpg",
      "backgroundColor": null,
      "type": "title-image-text",
      "skipAllowed": true,
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    },
    {
      "id": 4,
      "uuid": "550e8400-e29b-41d4-a716-446655440003",
      "order": 4,
      "title": "Terima Kasih",
      "description": "Sekarang Anda siap memulai perjalanan!",
      "imageUrl": null,
      "backgroundColor": "#FFFFFF",
      "type": "text-only",
      "skipAllowed": true,
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 4,
    "activeCount": 4
  }
}
```

**Response Format (Error):**
```json
{
  "success": false,
  "message": "Error message",
  "data": []
}
```

**Implementation Notes:**
- Return only `isActive = true` slides
- Order by `order` ASC
- Include full imageUrl path (can be absolute or relative)
- No authentication required (public endpoint for login page)

---

#### Create/Update Onboarding Slide (Admin Only)

**Endpoints:**
- `POST /api/onboarding/slides` - Create new slide
- `PUT /api/onboarding/slides/:id` - Update existing slide
- `DELETE /api/onboarding/slides/:id` - Delete slide

**Request Body (POST/PUT):**
```json
{
  "order": 3,
  "title": "Komunitas Kader",
  "description": "Bergabunglah dengan ribuan kader lainnya",
  "imageUrl": "/uploads/onboarding/community-3.jpg",
  "backgroundColor": "#FFFFFF",
  "type": "title-image-text",
  "skipAllowed": true,
  "isActive": true
}
```

**Required/Optional Fields:**
- `order` - Required (integer)
- `title` - Optional (string, max 255)
- `description` - Optional (string, max 5000)
- `imageUrl` - Optional (string URL)
- `backgroundColor` - Optional (hex color)
- `type` - Required (enum: title-image, title-text, image-only, text-only, title-image-text)
- `skipAllowed` - Required (boolean)
- `isActive` - Required (boolean)

**Validation Rules:**
```
- order must be positive integer
- title max 255 characters
- description max 5000 characters
- imageUrl must be valid URL or path
- backgroundColor must be valid hex color (#RRGGBB)
- type must be one of: title-image, title-text, image-only, text-only, title-image-text
- Must have at least one of: title, description, imageUrl
- Require admin role for POST/PUT/DELETE
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Slide created/updated successfully",
  "data": {
    "id": 5,
    "uuid": "550e8400-e29b-41d4-a716-446655440004",
    "order": 3,
    "title": "Komunitas Kader",
    "description": "Bergabunglah dengan ribuan kader lainnya",
    "imageUrl": "/uploads/onboarding/community-3.jpg",
    "backgroundColor": "#FFFFFF",
    "type": "title-image-text",
    "skipAllowed": true,
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2026-04-07T10:00:00Z",
    "updatedAt": "2026-04-07T10:00:00Z"
  }
}
```

---

## 🌐 Web Dashboard Requirements

### 1. Admin Panel Page: Onboarding Manager

**URL:** `/admin/onboarding`

#### Features:
1. **List View**
   - Table with all onboarding slides
   - Columns: Order, Title, Type, Active Status, Actions
   - Sort by order (drag & drop to reorder)
   - Filter: Active/Inactive
   - Actions: Edit, Delete, Preview

2. **Create New Slide**
   - Button: "+ Add New Slide"
   - Opens modal/form with fields:
     - Order (auto-increment, can be changed)
     - Title (text input, optional)
     - Description (textarea, optional)
     - Image Upload (file picker, optional)
     - Background Color (color picker, optional)
     - Type (dropdown: title-image, title-text, image-only, text-only, title-image-text)
     - Skip Allowed (toggle)
     - Active (toggle)
     - Save Button

3. **Edit Slide**
   - Click edit button in list
   - Opens form with existing data
   - Save changes
   - Show validation errors

4. **Delete Slide**
   - Delete button with confirmation
   - Hard delete or soft delete (based on backend)

5. **Reorder Slides**
   - Drag & drop interface
   - Update order number
   - Auto-save on drop

6. **Preview**
   - Show slide preview before save
   - Desktop and mobile view
   - Live preview of layout based on type

#### Form Layout Example:
```
┌─────────────────────────────────┐
│ Create Onboarding Slide         │
├─────────────────────────────────┤
│ Order: [  1  ]                  │
│ Title: [________________]       │
│ Description: [_____________]   │
│ Image: [Upload File] or [URL]   │
│ Background Color: [Color Picker]│
│ Type: [Dropdown ▼]              │
│ Skip Allowed: [Toggle]          │
│ Active: [Toggle]                │
├─────────────────────────────────┤
│ [Cancel]  [Preview] [Save]      │
└─────────────────────────────────┘
```

---

## 📱 Frontend (Flutter) Requirements

### 1. Updated OnboardingPage Component

**Current Structure:**
```dart
class OnboardingPage extends StatefulWidget {
  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  late PageController pageController;
  int currentPage = 0;
  List<OnboardingSlide> slides = [];
  bool isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _fetchOnboardingSlides();
  }
  
  Future<void> _fetchOnboardingSlides() async {
    try {
      final service = OnboardingService();
      final fetchedSlides = await service.getSlides();
      setState(() {
        slides = fetchedSlides;
        isLoading = false;
      });
    } catch (e) {
      print('Error fetching slides: $e');
      // Handle error or use default slides
      setState(() => isLoading = false);
    }
  }
  
  bool get _canSkip => currentPage >= 2 && currentPage < slides.length - 1;
  bool get _isLastSlide => currentPage == slides.length - 1;
  
  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    if (slides.isEmpty) {
      return LoginPage(); // Fallback to login if no slides
    }
    
    return Scaffold(
      body: Stack(
        children: [
          PageView.builder(
            controller: pageController,
            onPageChanged: (page) {
              setState(() => currentPage = page);
            },
            itemCount: slides.length,
            physics: NeverScrollableScrollPhysics(), // Prevent swipe
            itemBuilder: (context, index) {
              return _buildSlide(slides[index]);
            },
          ),
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_canSkip)
                  TextButton(
                    onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
                    child: Text('Skip'),
                  )
                else
                  SizedBox(width: 60),
                Spacer(),
                ElevatedButton(
                  onPressed: () {
                    if (_isLastSlide) {
                      Navigator.of(context).pushReplacementNamed('/login');
                    } else {
                      pageController.nextPage(
                        duration: Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    }
                  },
                  child: Text(_isLastSlide ? 'Finish' : 'Next'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSlide(OnboardingSlide slide) {
    return Container(
      color: slide.backgroundColor != null 
        ? Color(int.parse('0xFF${slide.backgroundColor!.substring(1)}'))
        : Colors.white,
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (slide.imageUrl != null)
              Image.network(slide.imageUrl!, height: 300),
            SizedBox(height: 30),
            if (slide.title != null)
              Text(
                slide.title!,
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
            SizedBox(height: 20),
            if (slide.description != null)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  slide.description!,
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
```

### 2. OnboardingService

**Path:** `lib/services/onboarding_service.dart`

```dart
import 'package:mygeri/models/onboarding_slide.dart';
import 'api_service.dart';

class OnboardingService {
  static final OnboardingService _instance = OnboardingService._internal();
  factory OnboardingService() => _instance;
  OnboardingService._internal();

  final _apiService = ApiService();

  Future<List<OnboardingSlide>> getSlides() async {
    try {
      print('📱 OnboardingService: Fetching slides...');
      
      final response = await _apiService.get('/onboarding/slides');

      if (response['success'] == true) {
        final List<dynamic> dataList = response['data'] ?? [];
        final slides = dataList
            .map((json) => OnboardingSlide.fromJson(json as Map<String, dynamic>))
            .toList();
        
        // Sort by order
        slides.sort((a, b) => a.order.compareTo(b.order));
        
        print('✅ OnboardingService: Got ${slides.length} slides');
        return slides;
      } else {
        print('⚠️ OnboardingService: API returned success=false');
        return [];
      }
    } catch (e) {
      print('❌ OnboardingService: Error fetching slides - $e');
      return [];
    }
  }
}
```

### 3. OnboardingSlide Model

**Path:** `lib/models/onboarding_slide.dart`

```dart
class OnboardingSlide {
  final int id;
  final String uuid;
  final int order;
  final String? title;
  final String? description;
  final String? imageUrl;
  final String? backgroundColor;
  final String type;
  final bool skipAllowed;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  OnboardingSlide({
    required this.id,
    required this.uuid,
    required this.order,
    this.title,
    this.description,
    this.imageUrl,
    this.backgroundColor,
    required this.type,
    required this.skipAllowed,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OnboardingSlide.fromJson(Map<String, dynamic> json) {
    return OnboardingSlide(
      id: json['id'] as int,
      uuid: json['uuid'] as String,
      order: json['order'] as int,
      title: json['title'] as String?,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      backgroundColor: json['backgroundColor'] as String?,
      type: json['type'] as String,
      skipAllowed: json['skipAllowed'] as bool,
      isActive: json['isActive'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'uuid': uuid,
    'order': order,
    'title': title,
    'description': description,
    'imageUrl': imageUrl,
    'backgroundColor': backgroundColor,
    'type': type,
    'skipAllowed': skipAllowed,
    'isActive': isActive,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
```

---

## 🔄 User Flow

### First Time User (No Skip):
```
Onboarding Page (API Call)
    ↓
Display Slide 1 (Skip disabled)
    ↓ Next
Display Slide 2 (Skip disabled)
    ↓ Next
Display Slide 3 (Skip enabled)
    ↓ Next or Skip
Display Slide 4 (Last slide, Skip enabled)
    ↓ Finish or Skip
    ↓
Login Page
```

### User Skips:
```
Onboarding Page
    ↓
Display Slide 1 (Skip disabled)
    ↓ Next
Display Slide 2 (Skip disabled)
    ↓ Next
Display Slide 3 (Skip enabled)
    ↓ Skip
    ↓
Login Page (Bypass remaining slides)
```

---

## 📊 Implementation Checklist

### Backend Team:
- [ ] Create `onboarding_slides` table
- [ ] Create `GET /api/onboarding/slides` endpoint
- [ ] Create `POST /api/onboarding/slides` endpoint (admin)
- [ ] Create `PUT /api/onboarding/slides/:id` endpoint (admin)
- [ ] Create `DELETE /api/onboarding/slides/:id` endpoint (admin)
- [ ] Add input validation
- [ ] Add permissions check (admin only for write)
- [ ] Test with Postman/Insomnia

### Web Team:
- [ ] Create Onboarding Manager page at `/admin/onboarding`
- [ ] Create list view with CRUD operations
- [ ] Create form for add/edit slides
- [ ] Add drag & drop reordering
- [ ] Add preview functionality
- [ ] Add image upload handler
- [ ] Test all CRUD operations

### Frontend Team:
- [ ] Create `OnboardingSlide` model
- [ ] Create `OnboardingService`
- [ ] Update `OnboardingPage` to use API
- [ ] Implement dynamic slide rendering
- [ ] Implement skip logic (first 2 no skip, rest yes)
- [ ] Handle loading state
- [ ] Handle error fallback
- [ ] Test with various slide configurations

---

## 🧪 Testing Scenarios

### Scenario 1: Default Setup (4 Slides)
```
Slide 1: Title + Image (No Skip)
Slide 2: Title + Description + Image (No Skip)
Slide 3: Title + Description (Skip allowed)
Slide 4: Text Only (Skip allowed, Last)
→ Expected: Navigate through all, skip on 3-4
```

### Scenario 2: Mixed Content Types
```
Slide 1: Image Only (No Skip)
Slide 2: Text Only (No Skip)
Slide 3: Title Only (Skip allowed)
→ Expected: All types render correctly
```

### Scenario 3: Empty Slides
```
No slides in database
→ Expected: Skip to Login Page
```

### Scenario 4: API Error
```
API returns error
→ Expected: Show error message or fallback to Login
```

---

## 📝 Notes & Best Practices

1. **Image Handling:**
   - Store images in `/uploads/onboarding/` directory
   - Optimize images (resize, compress)
   - Support both JPG and PNG formats
   - Max file size: 5MB

2. **Performance:**
   - Cache slides for 1 hour (optional)
   - Lazy load images
   - Minimize API calls

3. **Accessibility:**
   - Add alt text to images
   - Ensure color contrast for text
   - Add semantic HTML

4. **Fallback:**
   - If no slides available, skip to Login
   - If API fails, show error or use default slides

5. **Future Enhancements:**
   - A/B testing (show different slides to different users)
   - Analytics (track which slides users see)
   - Animations per slide type
   - Video support (future)

---

## 📞 Contact & Questions

**For Implementation Questions:**
- Backend Team: Reach out for database schema or endpoint specs
- Web Team: Check UI/UX requirements in admin panel
- Frontend Team: Check OnboardingService usage

**Git Workflow:**
1. Backend creates endpoints + database
2. Web creates admin dashboard
3. Frontend updates onboarding page
4. Comprehensive testing before merge to main

---

**Document Version:** 1.0  
**Last Updated:** April 7, 2026  
**Status:** Ready for Implementation  
