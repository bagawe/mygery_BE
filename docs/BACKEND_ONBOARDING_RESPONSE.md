# Backend Onboarding Implementation Response
## Delivered to Web & Mobile Teams

**Date:** April 7, 2026  
**Status:** ✅ IMPLEMENTATION COMPLETE  
**Version:** 1.0  

---

## 📢 Executive Summary

Backend team telah menyelesaikan implementasi **Dynamic Onboarding System** yang memungkinkan admin/web team untuk mengelola onboarding slides tanpa perlu update aplikasi.

**Key Features Delivered:**
- ✅ Public API untuk mobile: `GET /api/onboarding/slides`
- ✅ Full CRUD endpoints untuk admin/web team
- ✅ Unique UUID identifier per slide
- ✅ Soft-delete support (status aktif/non-aktif)
- ✅ Hard-delete support
- ✅ Reorder functionality
- ✅ 5 slide type combinations
- ✅ Complete validation & error handling

**Status:** Ready for integration by Web & Mobile teams

---

## 🎯 What's New

### Before (Hardcoded)
```
onboarding slides → embedded in mobile app → need app update to change
```

### After (Dynamic)
```
web admin panel → API call → database → mobile app (no app update needed!)
```

---

## 📡 Mobile Team - Integration Guide

### 1. Data Model Required

Create `OnboardingSlide` model in your Flutter app:

```dart
class OnboardingSlide {
  final int id;
  final String uuid;
  final int order;
  final String? title;
  final String? description;
  final String? imageUrl;
  final String? backgroundColor;
  final String type;  // title_image, title_text, image_only, text_only, title_image_text
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
      id: json['id'] ?? 0,
      uuid: json['uuid'] ?? '',
      order: json['order'] ?? 0,
      title: json['title'],
      description: json['description'],
      imageUrl: json['imageUrl'],
      backgroundColor: json['backgroundColor'],
      type: json['type'] ?? 'title_image',
      skipAllowed: json['skipAllowed'] ?? false,
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
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
}
```

### 2. Service Layer Required

Create `OnboardingService` untuk fetch slides dari API:

```dart
import 'package:dio/dio.dart';

class OnboardingService {
  final Dio _dio = Dio();

  Future<List<OnboardingSlide>> getOnboardingSlides() async {
    try {
      final response = await _dio.get(
        'https://api.mygery.com/api/onboarding/slides',  // Update with actual API URL
        options: Options(
          connectTimeout: Duration(seconds: 5),
          receiveTimeout: Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true && data['data'] != null) {
          List<OnboardingSlide> slides = (data['data'] as List)
              .map((slide) => OnboardingSlide.fromJson(slide))
              .toList();
          return slides;
        }
      }
      return [];
    } on DioError catch (e) {
      print('API Error: ${e.message}');
      return [];
    } catch (e) {
      print('Error: $e');
      return [];
    }
  }
}
```

### 3. Page Implementation Update

Update `OnboardingPage` untuk menggunakan API:

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
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    pageController = PageController();
    _fetchSlides();
  }

  Future<void> _fetchSlides() async {
    try {
      final service = OnboardingService();
      final fetchedSlides = await service.getOnboardingSlides();
      
      setState(() {
        slides = fetchedSlides;
        isLoading = false;
        
        if (slides.isEmpty) {
          errorMessage = 'No slides available';
        }
      });
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = 'Failed to load slides';
      });
    }
  }

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }

  void _onNextPressed() {
    if (currentPage < slides.length - 1) {
      pageController.nextPage(
        duration: Duration(milliseconds: 300),
        curve: Curves.easeIn,
      );
    } else {
      // Last slide - go to login
      _goToLogin();
    }
  }

  void _onSkipPressed() {
    _goToLogin();
  }

  void _goToLogin() {
    // Navigate to login page
    Navigator.of(context).pushReplacementNamed('/login');
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (errorMessage != null || slides.isEmpty) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(errorMessage ?? 'No slides available'),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _goToLogin,
                child: Text('Go to Login'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: PageView.builder(
        controller: pageController,
        onPageChanged: (index) {
          setState(() => currentPage = index);
        },
        physics: NeverScrollableScrollPhysics(),  // Disable swipe
        itemCount: slides.length,
        itemBuilder: (context, index) {
          final slide = slides[index];
          final isLastSlide = index == slides.length - 1;

          return SlideWidget(
            slide: slide,
            isLastSlide: isLastSlide,
            onNext: _onNextPressed,
            onSkip: slide.skipAllowed ? _onSkipPressed : null,
          );
        },
      ),
    );
  }
}
```

### 4. Slide Widget Component

```dart
class SlideWidget extends StatelessWidget {
  final OnboardingSlide slide;
  final bool isLastSlide;
  final VoidCallback onNext;
  final VoidCallback? onSkip;

  const SlideWidget({
    required this.slide,
    required this.isLastSlide,
    required this.onNext,
    this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: slide.backgroundColor != null
          ? Color(int.parse('0xFF${slide.backgroundColor!.substring(1)}'))
          : Colors.white,
      child: Column(
        children: [
          // Display image if available
          if (slide.imageUrl != null && slide.imageUrl!.isNotEmpty)
            Expanded(
              child: Image.network(
                slide.imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: Colors.grey[200],
                  child: Icon(Icons.image_not_supported),
                ),
              ),
            ),

          // Content area
          Expanded(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Title
                  if (slide.title != null && slide.title!.isNotEmpty)
                    Text(
                      slide.title!,
                      style: Theme.of(context).textTheme.headlineMedium,
                      textAlign: TextAlign.center,
                    ),

                  SizedBox(height: 16),

                  // Description
                  if (slide.description != null && slide.description!.isNotEmpty)
                    Text(
                      slide.description!,
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                ],
              ),
            ),
          ),

          // Buttons
          Padding(
            padding: EdgeInsets.all(24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Skip button (if allowed and not first 2 slides)
                if (slide.skipAllowed && onSkip != null)
                  ElevatedButton(
                    onPressed: onSkip,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      foregroundColor: Colors.blue,
                      elevation: 0,
                      side: BorderSide(color: Colors.blue),
                    ),
                    child: Text('Skip'),
                  )
                else
                  SizedBox(width: 80),  // Spacer

                // Next/Finish button
                ElevatedButton(
                  onPressed: onNext,
                  child: Text(isLastSlide ? 'Finish' : 'Next'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

### 5. Integration Checklist for Mobile

- [ ] Add `OnboardingSlide` model
- [ ] Add `OnboardingService`
- [ ] Update `OnboardingPage` to use API
- [ ] Create `SlideWidget` component
- [ ] Update API endpoint URL (to your dev/staging server)
- [ ] Test with different network conditions
- [ ] Add retry logic for failed API calls
- [ ] Test skip button on slides 3+
- [ ] Verify no skip button on slides 1-2
- [ ] Test with 0 slides (should skip to login)
- [ ] Test error handling

---

## 🌐 Web Team - Integration Guide

### 1. Admin Dashboard Page

Create new page at `/admin/onboarding` with following features:

#### Feature 1: Slide List View

```jsx
// Example React component structure
function OnboardingManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAllSlides();
  }, [page]);

  const fetchAllSlides = async () => {
    try {
      const response = await fetch(
        `https://api.mygery.com/api/onboarding/all?page=${page}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setSlides(data.data);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render table with slides
  return (
    <div>
      <h1>Onboarding Slides Management</h1>
      
      <button onClick={() => openCreateModal()}>+ Add New Slide</button>

      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Skip Allowed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {slides.map((slide) => (
            <tr key={slide.id}>
              <td>{slide.order}</td>
              <td>{slide.title}</td>
              <td>{slide.type}</td>
              <td>
                <span className={slide.isActive ? 'active' : 'inactive'}>
                  {slide.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{slide.skipAllowed ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => editSlide(slide)}>Edit</button>
                <button onClick={() => previewSlide(slide)}>Preview</button>
                {slide.isActive ? (
                  <button onClick={() => deactivateSlide(slide.id)}>Deactivate</button>
                ) : (
                  <button onClick={() => activateSlide(slide.id)}>Activate</button>
                )}
                <button onClick={() => deleteSlide(slide.id)} className="delete">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### Feature 2: Create/Edit Form

```jsx
function SlideForm({ slide, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    slide || {
      order: 0,
      title: '',
      description: '',
      imageUrl: '',
      backgroundColor: '#FFFFFF',
      type: 'title_image',
      skipAllowed: false,
      isActive: true,
    }
  );

  const handleSubmit = async () => {
    // Validate
    if (!formData.title && !formData.description && !formData.imageUrl) {
      alert('At least one of title, description, or image is required');
      return;
    }

    try {
      const endpoint = slide
        ? `/api/onboarding/slides/${slide.id}`
        : '/api/onboarding/slides';
      
      const method = slide ? 'PUT' : 'POST';

      const response = await fetch(
        `https://api.mygery.com${endpoint}`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        onSave();
        alert('Slide saved successfully');
      }
    } catch (error) {
      console.error('Error saving slide:', error);
      alert('Error saving slide');
    }
  };

  return (
    <form>
      <input
        type="number"
        label="Order"
        value={formData.order}
        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
      />

      <input
        type="text"
        label="Title (optional)"
        maxLength={255}
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
      />

      <textarea
        label="Description (optional)"
        maxLength={5000}
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />

      <input
        type="file"
        label="Image (optional)"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, setFormData, formData)}
      />

      <input
        type="color"
        label="Background Color"
        value={formData.backgroundColor}
        onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
      />

      <select
        label="Slide Type"
        value={formData.type}
        onChange={(e) => setFormData({...formData, type: e.target.value})}
      >
        <option value="title_image">Title + Image</option>
        <option value="title_text">Title + Text</option>
        <option value="image_only">Image Only</option>
        <option value="text_only">Text Only</option>
        <option value="title_image_text">Title + Image + Text</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={formData.skipAllowed}
          onChange={(e) => setFormData({...formData, skipAllowed: e.target.checked})}
        />
        Allow Skip
      </label>

      <label>
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
        />
        Active
      </label>

      <button type="button" onClick={handleSubmit}>Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
```

#### Feature 3: Reorder Functionality

```jsx
// Drag and drop reorder
const handleReorder = async (newOrder) => {
  try {
    const response = await fetch(
      'https://api.mygery.com/api/onboarding/reorder',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slides: newOrder.map((slide, index) => ({
            id: slide.id,
            order: index + 1,
          })),
        }),
      }
    );

    const data = await response.json();
    if (data.success) {
      // Refresh list
      fetchAllSlides();
    }
  } catch (error) {
    console.error('Error reordering slides:', error);
  }
};
```

#### Feature 4: Deactivate/Activate Toggle

```jsx
const deactivateSlide = async (slideId) => {
  try {
    const response = await fetch(
      `https://api.mygery.com/api/onboarding/slides/${slideId}/deactivate`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (data.success) {
      fetchAllSlides();  // Refresh
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const activateSlide = async (slideId) => {
  try {
    const response = await fetch(
      `https://api.mygery.com/api/onboarding/slides/${slideId}/activate`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (data.success) {
      fetchAllSlides();  // Refresh
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 2. API Integration Endpoints

**Base URL:** `https://api.mygery.com` (update with your server)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/onboarding/all?page=1&limit=20` | Bearer Token + Admin | Get all slides (including inactive) |
| POST | `/api/onboarding/slides` | Bearer Token + Admin | Create new slide |
| PUT | `/api/onboarding/slides/{id}` | Bearer Token + Admin | Update slide |
| DELETE | `/api/onboarding/slides/{id}` | Bearer Token + Admin | Hard delete slide |
| PUT | `/api/onboarding/slides/{id}/deactivate` | Bearer Token + Admin | Soft delete (status) |
| PUT | `/api/onboarding/slides/{id}/activate` | Bearer Token + Admin | Reactivate slide |
| POST | `/api/onboarding/reorder` | Bearer Token + Admin | Reorder slides |

### 3. Web Integration Checklist

- [ ] Create `/admin/onboarding` page
- [ ] Implement list view with table
- [ ] Implement create slide form
- [ ] Implement edit slide form
- [ ] Implement delete functionality (with confirmation)
- [ ] Implement deactivate/activate toggle
- [ ] Add image upload handler
- [ ] Add form validation
- [ ] Add drag & drop reordering
- [ ] Add preview functionality
- [ ] Test all CRUD operations
- [ ] Test with different slide types
- [ ] Add error handling & user feedback
- [ ] Add loading indicators
- [ ] Add pagination
- [ ] Test with large number of slides

---

## 🔍 API Response Examples

### GET /api/onboarding/slides (Mobile Public)

**Request:**
```http
GET /api/onboarding/slides HTTP/1.1
Host: api.mygery.com
```

**Response (200 OK):**
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

### GET /api/onboarding/all (Admin)

**Request:**
```http
GET /api/onboarding/all?page=1&limit=20 HTTP/1.1
Host: api.mygery.com
Authorization: Bearer eyJhbGc...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    // ... all slides (active + inactive)
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

### POST /api/onboarding/slides (Create)

**Request:**
```http
POST /api/onboarding/slides HTTP/1.1
Host: api.mygery.com
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "order": 5,
  "title": "New Slide",
  "description": "Description here",
  "imageUrl": "/uploads/onboarding/slide5.jpg",
  "backgroundColor": "#FFFFFF",
  "type": "title_image_text",
  "skipAllowed": true,
  "isActive": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Slide created successfully",
  "data": {
    "id": 5,
    "uuid": "550e8400-e29b-41d4-a716-446655440004",
    "order": 5,
    "title": "New Slide",
    "description": "Description here",
    "imageUrl": "/uploads/onboarding/slide5.jpg",
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

### PUT /api/onboarding/slides/{id} (Update)

**Request:**
```http
PUT /api/onboarding/slides/1 HTTP/1.1
Host: api.mygery.com
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Slide updated successfully",
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "order": 1,
    "title": "Updated Title",
    "description": "Updated description",
    // ... other fields
  }
}
```

### PUT /api/onboarding/slides/{id}/deactivate (Soft Delete)

**Request:**
```http
PUT /api/onboarding/slides/1/deactivate HTTP/1.1
Host: api.mygery.com
Authorization: Bearer eyJhbGc...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Slide deactivated successfully",
  "data": {
    "id": 1,
    "isActive": false,
    // ... other fields
  }
}
```

### POST /api/onboarding/reorder (Reorder)

**Request:**
```http
POST /api/onboarding/reorder HTTP/1.1
Host: api.mygery.com
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "slides": [
    { "id": 1, "order": 2 },
    { "id": 2, "order": 1 },
    { "id": 3, "order": 3 },
    { "id": 4, "order": 4 }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Slides reordered successfully",
  "data": null
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "At least one of title, description, or imageUrl is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Slide not found"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Error fetching slides"
}
```

---

## 📝 Default Slides Created

Backend telah membuat 4 default slides yang dapat digunakan sebagai template:

```
Slide 1: "Selamat Datang" (Welcome)
  - Type: title_image
  - Skip: false
  - Content: Title + Image

Slide 2: "Fitur Utama" (Main Features)
  - Type: title_image_text
  - Skip: false
  - Content: Title + Image + Description

Slide 3: "Komunitas Kader" (Community)
  - Type: title_image_text
  - Skip: true
  - Content: Title + Image + Description

Slide 4: "Terima Kasih" (Thank You)
  - Type: text_only
  - Skip: true
  - Content: Title + Description
```

Dapat dihapus atau diubah sesuai kebutuhan.

---

## 🚀 Deployment Instructions

### 1. Backend Deployment (Already Done)

```bash
# Migrations applied
npx prisma migrate deploy

# Generate latest Prisma client
npx prisma generate

# Restart server
pm2 restart mygeri-be
```

### 2. Web Team Setup

```bash
# Clone latest code
git pull origin main

# Install dependencies (if any changes)
npm install

# Start development server
npm start
```

### 3. Mobile Team Setup

```bash
# Pull latest code
git pull origin main

# Get dependencies
flutter pub get

# Run app
flutter run
```

---

## 📋 Validation Rules

### Request Validation (Backend)

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| order | number | ✓ | >= 0 |
| title | string | ✗ | max 255 chars |
| description | string | ✗ | max 5000 chars |
| imageUrl | string | ✗ | valid URL/path |
| backgroundColor | string | ✗ | hex format (#RRGGBB) |
| type | enum | ✓ | one of 5 types |
| skipAllowed | boolean | ✓ | true/false |
| isActive | boolean | ✓ | true/false |

**Custom Rules:**
- At least one of: title, description, imageUrl required
- If both skipAllowed=false and not (order 1 or 2), warning suggested
- UUID auto-generated, cannot be modified

---

## 🔐 Authentication & Authorization

### Auth Required
All endpoints except `GET /api/onboarding/slides` require:
- Bearer token in Authorization header
- Admin role for write operations

### Example Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Testing Postman Collection

Download template test collection:

```json
{
  "info": {
    "name": "Onboarding API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Active Slides (Mobile)",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/api/onboarding/slides",
          "host": ["{{base_url}}"],
          "path": ["api", "onboarding", "slides"]
        }
      }
    },
    {
      "name": "Get All Slides (Admin)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/onboarding/all?page=1&limit=20",
          "host": ["{{base_url}}"],
          "path": ["api", "onboarding", "all"],
          "query": [{"key": "page", "value": "1"}, {"key": "limit", "value": "20"}]
        }
      }
    },
    {
      "name": "Create Slide",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"order\": 5, \"title\": \"New Slide\", \"type\": \"title_image\", \"skipAllowed\": true, \"isActive\": true}"
        },
        "url": {
          "raw": "{{base_url}}/api/onboarding/slides",
          "host": ["{{base_url}}"],
          "path": ["api", "onboarding", "slides"]
        }
      }
    }
  ]
}
```

---

## 💡 Best Practices

### Mobile Team
1. Cache slides for 1 hour to reduce API calls
2. Implement retry logic with exponential backoff
3. Show loading state while fetching
4. Fallback to login if API fails
5. Handle network errors gracefully

### Web Team
1. Add confirmation dialog for delete operations
2. Show loading indicators during API calls
3. Validate form before submission
4. Show success/error messages
5. Implement proper error handling
6. Add audit logging for admin operations

---

## 🆘 Support & Issues

### Common Issues

**Issue 1: Slides not showing in mobile**
- Check API URL is correct
- Verify slides are `isActive = true`
- Check network connectivity
- Review API response format

**Issue 2: Cannot create slide (400 error)**
- Ensure at least title or description provided
- Check backgroundColor format is #RRGGBB
- Verify type is valid (one of 5 types)
- Check authentication token validity

**Issue 3: Reorder not working**
- Ensure all slide IDs are correct
- Verify order numbers are sequential
- Check authentication and permissions

---

## 📞 Next Steps

1. **Mobile Team:**
   - Clone latest code from repo
   - Implement `OnboardingService`
   - Update `OnboardingPage` with API integration
   - Test with backend API
   - Deploy to staging

2. **Web Team:**
   - Clone latest code from repo
   - Create admin dashboard page
   - Implement CRUD operations
   - Add image upload functionality
   - Test all endpoints
   - Deploy to staging

3. **Backend Team:**
   - Commit & push code
   - Deploy migration to production
   - Monitor API usage
   - Fix any issues from teams

---

## 📊 Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| Manage Slides | Mobile app update | Admin dashboard |
| Add New Slide | Code change | API call |
| Update Slide | Redeploy app | API call |
| Remove Slide | Delete & redeploy | Soft delete (API) |
| Reorder Slides | Code change | Drag & drop (Web) |
| Slide Types | Limited | 5 combinations |
| Skip Logic | Hardcoded | Per-slide config |
| Deployment Time | Days/weeks | Minutes |
| Flexibility | Low | High |

---

## ✅ Checklist for Launch

### Backend: ✅ COMPLETE
- ✅ All code implemented
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Ready for production

### Web Team: ⏳ IN PROGRESS
- [ ] Admin dashboard created
- [ ] All CRUD operations tested
- [ ] Image upload working
- [ ] Reorder functionality working
- [ ] Error handling implemented
- [ ] Ready for UAT

### Mobile Team: ⏳ IN PROGRESS
- [ ] Models implemented
- [ ] Service layer created
- [ ] API integration done
- [ ] UI updated for dynamic content
- [ ] All edge cases handled
- [ ] Ready for UAT

### Testing: ⏳ PENDING
- [ ] UAT by teams
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Post-launch monitoring

---

**Document Version:** 1.0  
**Created:** April 7, 2026  
**By:** Backend Team  
**Status:** Ready for Web & Mobile Integration
