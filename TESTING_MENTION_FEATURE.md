# 🧪 TESTING GUIDE - Mention Notification Feature

## 📋 Prerequisites

1. ✅ Server running on `http://localhost:3030`
2. ✅ Database migrated with `postId` field in `user_history` table
3. ✅ At least 2 test users (for mention testing)
4. ✅ Valid access tokens for both users

---

## 🔄 **STEP 1: Run Migration**

```bash
# Navigate to project root
cd /Users/mac/development/mygery_BE

# Make script executable
chmod +x scripts/migrate-mention-feature.sh

# Run migration
./scripts/migrate-mention-feature.sh

# Or manually
npx prisma generate
npx prisma migrate dev --name add_postid_to_history
```

---

## 🚀 **STEP 2: Restart Server**

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

---

## 🧪 **STEP 3: Test Endpoints**

### Setup Test Users

```bash
# Login as User A (will create post)
curl -X POST "http://localhost:3030/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@example.com",
    "password": "Admin123!"
  }'

# Save token
export TOKEN_A="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Login as User B (will receive mention)
curl -X POST "http://localhost:3030/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user2@example.com",
    "password": "User123!"
  }'

# Save token
export TOKEN_B="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Test 1: Create Post with Single Mention

```bash
echo "=== Test 1: Create Post with Single Mention ==="

curl -X POST "http://localhost:3030/api/posts" \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "content=Hello @admin, how are you? #greeting"

# Expected:
# - Post created successfully
# - History entry created for @admin user
# - postId linked to history
```

---

### Test 2: Create Post with Multiple Mentions

```bash
echo "=== Test 2: Create Post with Multiple Mentions ==="

curl -X POST "http://localhost:3030/api/posts" \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "content=Hey @admin and @testuser, check this out! #announcement"

# Expected:
# - Post created
# - 2 history entries created (one for each user)
# - Both with same postId
```

---

### Test 3: Get User History (with postId)

```bash
echo "=== Test 3: Get User History ==="

curl -X GET "http://localhost:3030/api/history?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN_B"

# Expected Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1,
#       "type": "mention",
#       "description": "Admin menyebut Anda dalam postingan",
#       "postId": 1,  // ✅ Must have postId
#       "metadata": {...},
#       "createdAt": "..."
#     }
#   ]
# }
```

---

### Test 4: Get History by Type

```bash
echo "=== Test 4: Get Only Mentions ==="

curl -X GET "http://localhost:3030/api/history/type/mention" \
  -H "Authorization: Bearer $TOKEN_B"

# Expected:
# - Only mention type history
# - All items have postId
```

---

### Test 5: Verify Post Detail Accessible

```bash
echo "=== Test 5: Get Post Detail ==="

# Get postId from history response (e.g., postId = 1)
curl -X GET "http://localhost:3030/api/posts/1" \
  -H "Authorization: Bearer $TOKEN_B"

# Expected:
# - Post details returned
# - User can see the post that mentioned them
```

---

### Test 6: Delete History Entry

```bash
echo "=== Test 6: Delete Specific History ==="

curl -X DELETE "http://localhost:3030/api/history/1" \
  -H "Authorization: Bearer $TOKEN_B"

# Expected:
# - History deleted
# - Post still exists (only history deleted)
```

---

### Test 7: Clear All History

```bash
echo "=== Test 7: Clear All History ==="

curl -X DELETE "http://localhost:3030/api/history" \
  -H "Authorization: Bearer $TOKEN_B"

# Expected:
# - All user history deleted
# - Posts still exist
```

---

## ✅ **VERIFICATION CHECKLIST**

### Backend Features:
- [ ] Migration completed without errors
- [ ] `user_history` table has `postId` column
- [ ] Foreign key constraint exists
- [ ] POST /api/posts extracts mentions from content
- [ ] History entries created for mentioned users
- [ ] GET /api/history returns postId field
- [ ] GET /api/history/type/:type works
- [ ] DELETE history endpoints work

### Mention Extraction:
- [ ] Single mention detected: `@username`
- [ ] Multiple mentions detected: `@user1 @user2`
- [ ] Case insensitive: `@Admin` = `@admin`
- [ ] No duplicate notifications for same username
- [ ] Author doesn't get notification for mentioning themselves

### History Types:
- [ ] `mention` type has postId
- [ ] `create_post` type has postId
- [ ] `login` type has postId = null
- [ ] Other types have postId = null

### Data Integrity:
- [ ] Post deletion sets postId to null in history (ON DELETE SET NULL)
- [ ] History can exist without post
- [ ] User can have multiple history entries for same post

---

## 🐛 **TROUBLESHOOTING**

### Issue 1: Migration Fails

```bash
# Check Prisma schema
npx prisma validate

# Reset database (⚠️ DEVELOPMENT ONLY)
npx prisma migrate reset

# Re-run migration
npx prisma migrate dev
```

### Issue 2: postId Not Returned

**Check:**
1. `select` clause includes `postId: true`
2. Prisma client regenerated: `npx prisma generate`
3. Server restarted after migration

### Issue 3: Mentions Not Detected

**Debug:**
```javascript
// Add console.log in post.service.js
const mentions = this.extractMentions(content);
console.log('Extracted mentions:', mentions);
```

### Issue 4: History Not Created

**Check:**
1. Username exists in database
2. Username matches (case insensitive)
3. Check server logs for errors
4. Verify `createMentionNotifications` is called

---

## 📊 **EXPECTED DATABASE STATE**

### After Creating Post with Mention:

**posts table:**
```sql
SELECT * FROM posts WHERE id = 1;
```
| id | userId | content | createdAt |
|----|--------|---------|-----------|
| 1 | 1 | Hello @admin | 2025-12-30 10:00:00 |

**user_history table:**
```sql
SELECT * FROM user_history WHERE type = 'mention';
```
| id | userId | type | description | postId | createdAt |
|----|--------|------|-------------|--------|-----------|
| 1 | 2 | mention | Admin menyebut Anda | 1 | 2025-12-30 10:00:00 |
| 2 | 1 | create_post | Anda membuat postingan | 1 | 2025-12-30 10:00:00 |

---

## 🎯 **SUCCESS CRITERIA**

### ✅ All tests pass if:

1. **Mention Detection:**
   - Mentions extracted correctly from content
   - Multiple mentions handled
   - Case insensitive matching

2. **Notification Creation:**
   - History entry created for each mentioned user
   - postId correctly linked
   - Description includes author name

3. **API Responses:**
   - GET /api/history returns postId
   - postId is null for non-post history
   - Pagination works correctly

4. **Data Integrity:**
   - Foreign key constraints work
   - Cascade delete behavior correct
   - No orphaned records

---

## 📱 **FRONTEND INTEGRATION TEST**

### Flutter Side Verification:

```dart
// 1. Fetch history
final history = await HistoryService.getUserHistory();

// 2. Check postId exists
assert(history[0].postId != null);

// 3. Check isClickable
assert(history[0].isClickable == true);

// 4. Fetch post by postId
final post = await PostService.getPostById(history[0].postId!);

// 5. Verify post content
assert(post.content.contains('@username'));
```

---

## 🔄 **CONTINUOUS TESTING**

### Run After Each Code Change:

```bash
# Quick test script
./test-mention-feature.sh

# Or manual
npm test
```

### Monitor Logs:

```bash
# Watch server logs
tail -f logs/server.log

# Filter mention notifications
tail -f logs/server.log | grep "mention"
```

---

## 📞 **SUPPORT**

If tests fail:
1. Check server logs
2. Verify database migration
3. Confirm Prisma client generated
4. Review error messages
5. Contact backend team

---

**Testing Completed:** ✅ / ❌  
**Date:** ___________  
**Tested By:** ___________  
**Notes:** ___________

---

**END OF TESTING GUIDE**