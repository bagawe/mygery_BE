# Backend Improvements & Action Items

**Dibuat:** April 7, 2026  
**Status:** Active Issues Found  
**Priority:** High  

---

## 📋 Executive Summary

Berdasarkan testing aplikasi Flutter (user: contoh, role: kader), ditemukan **3 endpoint errors** yang perlu diperbaiki di backend. Document ini berisi detailed action items untuk backend team.

---

## 🔴 Critical Issues Found

### 1. **Voting Active Endpoint - 404 NOT FOUND**

**Status:** ❌ MISSING ENDPOINT

#### Problem Details
```
Endpoint: /voting/active
Method: GET
Expected Response: List of active votings for kader role
Actual Response: 
{
  "success": false,
  "message": "Endpoint not found",
  "path": "/voting/active",
  "method": "GET"
}
```

#### What Frontend is Trying to Do
- Fetch semua active votings untuk ditampilkan di Voting Page
- Component: `lib/pages/voting/voting_page.dart`
- Service: `lib/services/voting_service.dart`

#### Backend Action Required

**Create Endpoint:**
```
GET /api/voting/active
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)

Response Format (Success):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "xxx-xxx-xxx",
      "title": "Voting Title",
      "description": "Voting Description",
      "startDate": "2026-04-01T00:00:00Z",
      "endDate": "2026-04-30T23:59:59Z",
      "status": "active", // active, closed, scheduled
      "createdBy": {
        "id": 1,
        "name": "Admin",
        "username": "admin"
      },
      "totalVotes": 1250,
      "userHasVoted": false,
      "options": [
        {
          "id": 1,
          "text": "Option 1",
          "voteCount": 600
        },
        {
          "id": 2,
          "text": "Option 2",
          "voteCount": 650
        }
      ],
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-07T08:30:42Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}

Response Format (Error):
{
  "success": false,
  "message": "Error message"
}
```

**Implementation Notes:**
- Only return votings dengan `status = "active"` dan `endDate >= now()`
- Include `userHasVoted` flag untuk mengetahui user sudah vote atau belum
- Calculate `voteCount` dari tabel voting_votes atau voting_options
- Support pagination untuk handle banyak votings

**Database Query Reference:**
```sql
SELECT 
  v.*,
  COUNT(vv.id) as totalVotes,
  MAX(CASE WHEN vv.userId = ? THEN 1 ELSE 0 END) as userHasVoted
FROM votings v
LEFT JOIN voting_options vo ON v.id = vo.votingId
LEFT JOIN voting_votes vv ON vo.id = vv.votingOptionId
WHERE v.status = 'active' AND v.endDate >= NOW()
GROUP BY v.id
ORDER BY v.createdAt DESC
LIMIT ? OFFSET ?;
```

---

### 2. **Agenda Endpoint - 403 FORBIDDEN (Permission Issue)**

**Status:** ⚠️ ENDPOINT EXISTS BUT PERMISSION DENIED

#### Problem Details
```
Endpoint: /api/agenda (or similar)
Method: GET
Current User: contoh (id: 10, role: kader)
Actual Response:
{
  "success": false,
  "message": "Forbidden: insufficient privileges",
}
```

#### What Frontend is Trying to Do
- Fetch agenda list untuk ditampilkan di Agenda Page
- Component: `lib/pages/agenda/agenda_page.dart`
- Service: `lib/services/agenda_service.dart`

#### Root Cause Analysis
User dengan role **"kader"** tidak punya permission untuk access agenda endpoint.

#### Backend Action Required

**Check & Fix Role Permissions:**

1. **Verify Endpoint Path:**
   - Current endpoint might be `/api/agenda` atau `/api/agendas`
   - Confirm exact path dengan checking middleware & route

2. **Update Role Permissions Table:**
   ```sql
   -- Check current permissions untuk role "kader"
   SELECT r.*, rp.* FROM roles r
   LEFT JOIN role_permissions rp ON r.id = rp.roleId
   WHERE r.role = 'kader';
   
   -- Should include permission untuk agenda:list atau similar
   -- If missing, add it:
   INSERT INTO role_permissions (roleId, permission, createdAt, updatedAt)
   SELECT id, 'agenda:list', NOW(), NOW() FROM roles WHERE role = 'kader';
   ```

3. **Verify Middleware Permission Check:**
   - Ensure middleware checking permissions secara benar
   - Pastikan user dengan role "kader" bisa access agenda

4. **Expected Response Format (After Fix):**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "uuid": "xxx-xxx-xxx",
         "title": "Agenda Title",
         "description": "Agenda Description",
         "startDate": "2026-04-15T10:00:00Z",
         "endDate": "2026-04-15T12:00:00Z",
         "location": "Jakarta, Pusat",
         "image": "/uploads/agenda/image-1.jpg",
         "createdBy": {
           "id": 2,
           "name": "Organizer Name",
           "username": "organizer"
         },
         "attendees": 150,
         "createdAt": "2026-04-01T08:00:00Z",
         "updatedAt": "2026-04-07T08:30:42Z"
       }
     ],
     "pagination": {
       "page": 1,
       "limit": 20,
       "total": 35,
       "pages": 2
     }
   }
   ```

---

### 3. **Announcement Endpoint - 403 FORBIDDEN (Permission Issue)**

**Status:** ⚠️ ENDPOINT EXISTS BUT PERMISSION DENIED

#### Problem Details
```
Endpoint: /api/announcement (or similar)
Method: GET
Current User: contoh (id: 10, role: kader)
Actual Response:
{
  "success": false,
  "message": "Forbidden: insufficient privileges"
}
```

#### What Frontend is Trying to Do
- Fetch announcement list untuk ditampilkan di Announcement Page
- Component: `lib/pages/announcement/announcement_page.dart`
- Service: `lib/services/announcement_service.dart`

#### Root Cause Analysis
User dengan role **"kader"** tidak punya permission untuk access announcement endpoint.

#### Backend Action Required

**Check & Fix Role Permissions:**

1. **Verify Endpoint Path:**
   - Current endpoint: `/api/announcement` atau `/api/announcements`
   - Confirm dengan checking backend routes

2. **Update Role Permissions Table:**
   ```sql
   -- Check current permissions
   SELECT r.*, rp.* FROM roles r
   LEFT JOIN role_permissions rp ON r.id = rp.roleId
   WHERE r.role = 'kader';
   
   -- Add permission if missing:
   INSERT INTO role_permissions (roleId, permission, createdAt, updatedAt)
   SELECT id, 'announcement:list', NOW(), NOW() FROM roles WHERE role = 'kader';
   ```

3. **Verify Middleware & Authorization:**
   - Check authorization middleware
   - Ensure role-based access control working correctly

4. **Expected Response Format (After Fix):**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "uuid": "xxx-xxx-xxx",
         "title": "Important Announcement",
         "content": "Announcement content here...",
         "type": "general", // general, urgent, event, etc
         "icon": "📢",
         "createdBy": {
           "id": 1,
           "name": "Admin",
           "username": "admin"
         },
         "createdAt": "2026-04-07T08:00:00Z",
         "updatedAt": "2026-04-07T08:30:42Z"
       }
     ],
     "pagination": {
       "page": 1,
       "limit": 20,
       "total": 12,
       "pages": 1
     }
   }
   ```

---

## 🟡 Minor Issues Found

### OnBackInvokedCallback Warning (Android)

**Status:** ⚠️ NON-CRITICAL WARNING

#### Issue
```
OnBackInvokedCallback is not enabled for the application.
Set 'android:enableOnBackInvokedCallback="true"' in the application manifest.
```

#### Impact
- Back button behavior on Android 13+ might not be optimal
- Not a blocker, but should be fixed for better UX

#### Frontend Action Required
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    ...
    android:enableOnBackInvokedCallback="true">
</application>
```

---

## ✅ Working Features

### Profile Service - Success
```
Endpoint: /api/profile
Method: GET
Status: 200 OK
User: contoh (id: 10, role: kader)
Action: Profile refreshed successfully
```

**Details:**
- User profile loaded correctly
- Role "kader" assigned properly
- All user data retrieved

---

## 📊 Implementation Priority

| Issue | Priority | Effort | Owner | Timeline |
|-------|----------|--------|-------|----------|
| Voting Active Endpoint | 🔴 HIGH | Medium | Backend | ASAP |
| Agenda Permission (kader) | 🔴 HIGH | Low | Backend | ASAP |
| Announcement Permission (kader) | 🔴 HIGH | Low | Backend | ASAP |
| OnBackInvokedCallback | 🟡 MEDIUM | Low | Frontend | Soon |

---

## 🔍 Testing Checklist

After implementing fixes, frontend team should test:

### Voting Feature
- [ ] GET `/api/voting/active` returns 200 with active votings list
- [ ] Response includes `userHasVoted` flag
- [ ] Pagination working correctly
- [ ] Voting page displays votings
- [ ] User can vote on active votings

### Agenda Feature
- [ ] GET `/api/agenda` returns 200 for kader role
- [ ] Agenda list displays correctly
- [ ] Pagination working
- [ ] User can view agenda details

### Announcement Feature
- [ ] GET `/api/announcement` returns 200 for kader role
- [ ] Announcement list displays correctly
- [ ] Pagination working
- [ ] Newest announcements appear first

### Overall
- [ ] All endpoints return consistent response format
- [ ] Error messages are clear
- [ ] Pagination works for all list endpoints
- [ ] No 404 errors for implemented endpoints

---

## 📝 Backend Debugging Steps

### 1. Check If Endpoints Exist
```bash
# List all registered routes
# (depends on your backend framework)

# For Express.js:
# Check routes/voting.js, routes/agenda.js, routes/announcement.js

# For Laravel:
# Check routes/api.php
```

### 2. Check Middleware & Permissions
```bash
# Verify role-based middleware is applied
# Check if user has necessary permissions

# Query database:
SELECT * FROM roles WHERE role = 'kader';
SELECT * FROM role_permissions WHERE roleId = (SELECT id FROM roles WHERE role = 'kader');
```

### 3. Check User's Actual Permissions
```bash
# Query user's role and permissions:
SELECT u.id, u.username, r.role, GROUP_CONCAT(rp.permission)
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
LEFT JOIN role_permissions rp ON r.id = rp.roleId
WHERE u.id = 10
GROUP BY u.id, r.id;
```

---

## 📞 Frontend Testing Information

**Test User Details:**
- Username: `contoh`
- User ID: 10
- Email: `contoh@example.com`
- Role: `kader`
- Profile: Complete with profile picture
- KTA Status: Not verified

**Testing Environment:**
- Backend URL: `http://103.127.96.136:3030`
- App: Flutter Mobile (Android)
- Test Date: April 7, 2026

---

## 📚 Related Documentation

- `/docs/API_NOTIFICATION.md` - Notification API Spec (Implemented ✅)
- `/docs/BACKEND_NOTIFICATION_RESPONSE.md` - Notification Backend Response
- `/docs/FRONTEND_NOTIFICATION_MIGRATION.md` - Frontend Notification Migration

---

## 🔗 Contact & Support

**For Questions:**
- Contact Frontend Team for testing results
- Share backend fixes via git commit
- Test endpoints using Postman/Insomnia before deploying

**Next Steps:**
1. Backend implements fixes above
2. Deploy to staging: `http://103.127.96.136:3030`
3. Frontend team validates
4. Deploy to production when all tests pass

---

**Last Updated:** April 7, 2026  
**Status:** 🔴 Issues Found - Awaiting Backend Action  
