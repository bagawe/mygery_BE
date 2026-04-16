# 🔴 CRITICAL - Double User Bug Fix Required

**Date:** 16 April 2026  
**Priority:** 🔴 CRITICAL - BLOCKS MOBILE & WEB DEPLOYMENT  
**Reported by:** Web Admin Team  
**Status:** ⏳ AWAITING BACKEND FIX

---

## 📋 Issue Summary

**Problem:** Verify endpoints creating 2 user records instead of 1

When admin verifies a user from web panel:
- Expected: User role updated (1 record in database)
- Actual: New user created + old user remains (2 records in database)

---

## 🔍 Root Cause Analysis

### Web Frontend (CORRECT ✅)
- Web panel calls API correctly
- Web does NOT modify database directly
- Web is passing correct verification request to backend

### Backend API (WRONG ❌)
- Backend receives verification request
- **Backend uses `prisma.user.create()` instead of `prisma.user.update()`**
- Backend creates NEW user instead of updating existing user
- Result: Duplicate user records in database

---

## 📍 Affected Endpoints

**All 3 kader verification endpoints have this issue:**

```
1. POST /api/kader/confirm/point1/:id
   - Confirms existing kader (old members)
   - Should: UPDATE user confirmation status
   - Currently: Creates new user ❌

2. POST /api/kader/confirm/point2/:id
   - Upgrades simpatisan to kader
   - Should: UPDATE simpatisan role to kader
   - Currently: Creates new user ❌

3. POST /api/kader/confirm/simpatisan/:id
   - Alias for point2 (Alur 3 Web)
   - Should: UPDATE user role
   - Currently: Creates new user ❌
```

---

## 🛠️ Required Fix

### Current (WRONG):
```javascript
async confirmPoint2(userId, adminId) {
  // ❌ WRONG - This creates new user
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      roles: { create: { role: 'kader', isActive: true } }
    }
  });
  return user;
}
```

### Fixed (CORRECT):
```javascript
async confirmPoint2(userId, adminId) {
  const id = parseInt(userId);
  
  // ✅ CORRECT - Uses transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    // 1. Find existing user (will error if not found)
    const user = await tx.user.findUnique({
      where: { id },
      include: { roles: true }
    });

    if (!user) throw new Error('User not found');

    // 2. Deactivate old role
    await tx.userRole.updateMany({
      where: { userId: id, role: 'simpatisan' },
      data: { isActive: false }
    });

    // 3. Upsert new role (update if exists, create only if new)
    await tx.userRole.upsert({
      where: { userId_role: { userId: id, role: 'kader' } },
      update: { isActive: true },
      create: { userId: id, role: 'kader', isActive: true }
    });

    // 4. UPDATE user fields (NOT CREATE)
    return tx.user.update({
      where: { id },
      data: {
        kaderPoint2Confirmed: true,
        kaderPoint2ConfirmedAt: new Date(),
        kaderPoint2ConfirmedBy: parseInt(adminId)
      },
      include: { roles: { select: { role: true, isActive: true } } }
    });
  });
}
```

### Key Changes:
- ✅ Use `findUnique` before update (fail fast if user doesn't exist)
- ✅ Use `$transaction` for atomicity
- ✅ Use `update` for user fields (not `create`)
- ✅ Use `upsert` for role management (prevents duplicates)
- ✅ Add database unique constraint: `@@unique([userId, role])`

---

## 🗄️ Database Schema Update

Add unique constraint to prevent duplicate roles:

```prisma
model UserRole {
  id    Int     @id @default(autoincrement())
  userId Int
  role  String
  isActive Boolean @default(true)
  user  User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // ✅ Add this constraint:
  @@unique([userId, role])
  
  @@index([userId])
  @@index([role])
}
```

If constraint already exists, verify it with:
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_role';
```

---

## 🧪 Testing Requirements

### Test 1: Single User Update
```bash
# Before: User ID 25 exists as simpatisan
# Verify: POST /api/kader/confirm/point2/25
# After: User ID 25 still exists (NOT 26 created)
# Database check:
SELECT id, email, role FROM users WHERE email='test@test.com';
# Expected: 1 row (not 2)
```

### Test 2: Double-Click Prevention
```bash
# Rapid double-click verify button
# First request: Creates kader role ✅
# Second request: Should error (already kader) or idempotent update
# Database check: Should still have 1 user record (not 3)
```

### Test 3: Unique Constraint Enforcement
```bash
# Try to insert duplicate (userId, role)
# Database should reject with UNIQUE constraint error
# Result: Prevents 2 users with same role
```

### Test 4: Transaction Atomicity
```bash
# Simulate transaction failure midway
# Result: Either all operations succeed or all rollback
# Database should not have partial state (1 user + missing role)
```

---

## 📋 Implementation Checklist

- [ ] **Analyze** current verify endpoint implementations
  - [ ] Check confirmPoint1 implementation
  - [ ] Check confirmPoint2 implementation
  - [ ] Check confirmSimpatisan implementation (alias?)

- [ ] **Update** all 3 endpoints
  - [ ] confirmPoint1 - use UPDATE + transaction
  - [ ] confirmPoint2 - use UPDATE + transaction
  - [ ] confirmSimpatisan - use UPDATE + transaction

- [ ] **Add** database constraint
  - [ ] Add `@@unique([userId, role])` if missing
  - [ ] Verify constraint exists with SQL query
  - [ ] Create migration if needed

- [ ] **Test** locally
  - [ ] Single user update works ✅
  - [ ] Double-click doesn't create duplicates ✅
  - [ ] Transaction rolls back on error ✅
  - [ ] Unique constraint prevents duplicates ✅

- [ ] **Deploy** to staging
  - [ ] Run all tests in staging
  - [ ] Test web verify button
  - [ ] Check database for duplicates
  - [ ] Run database cleanup script if needed

- [ ] **Clean** existing duplicates
  - [ ] Find duplicate users in database
  - [ ] Merge data if necessary
  - [ ] Delete duplicate records
  - [ ] Verify data integrity

- [ ] **Deploy** to production
  - [ ] Backup database first
  - [ ] Deploy code fix
  - [ ] Deploy migration (if any)
  - [ ] Clean duplicate records
  - [ ] Monitor logs

- [ ] **Notify** teams
  - [ ] Mobile team - can deploy
  - [ ] Web admin team - can use verify button
  - [ ] Share fix details

---

## 📊 Blocking Issues

**This fix is blocking:**

1. **Mobile Team**
   - Cannot use kader verification feature
   - Risk of data inconsistency
   - Cannot reliably assign roles

2. **Web Admin Team**
   - Cannot verify users safely
   - Verify button creates duplicates
   - Database integrity compromised

3. **Production Deployment**
   - Cannot go live with verify feature broken
   - Data cleanup needed if deployed
   - Risk of customer-facing bugs

---

## 🔗 Related Files

**Backend Code:**
- `src/modules/kader/kader.service.js` - Verify endpoint implementations
- `src/modules/kader/kader.controller.js` - Controller methods
- `src/modules/kader/kader.routes.js` - Route definitions
- `prisma/schema.prisma` - Database schema
- `prisma/migrations/` - Migration files

**Documentation:**
- `docs/BUG_DOUBLE_DATA_USER.md` - Original bug report
- `FE_TEAMS_SUMMARY.md` - Impact on mobile/web teams

---

## 💬 Communication

### For Web Admin Team:
"Backend verify endpoints are creating duplicate users. Please wait for backend fix before using the verify button in production. ETA: [date]"

### For Mobile Team:
"Kader verification feature blocked due to backend double-user bug. Backend team fixing now. Deployment delayed until fix confirmed. ETA: [date]"

### For Backend Team:
"CRITICAL: Verify endpoints use CREATE instead of UPDATE. This creates duplicate users in database. Fix required ASAP:
1. Change CREATE to UPDATE in confirmPoint1, confirmPoint2, confirmSimpatisan
2. Add unique constraint (userId, role)
3. Wrap in transaction
4. Test double-click scenario
5. Deploy to staging for verification"

---

## 📈 Timeline

```
NOW:        Fix identified & documented
T+1hr:      Backend starts implementation
T+2hr:      Code changes & testing complete
T+3hr:      Deploy to staging
T+4hr:      Smoke tests & verification
T+5hr:      Clean duplicate records
T+6hr:      Deploy to production
T+7hr:      Notify teams - ready for deployment
T+8hr:      Mobile & Web deploy
```

---

## ✅ Success Criteria

- ✅ No more duplicate user records created
- ✅ Verify endpoints use UPDATE not CREATE
- ✅ Unique constraint prevents duplicates at DB level
- ✅ All 3 endpoints wrapped in transaction
- ✅ Double-click test passes (single user record)
- ✅ Mobile team can deploy safely
- ✅ Web admin can use verify button safely
- ✅ Production deployment unblocked

---

**Priority:** 🔴 CRITICAL  
**Blocking:** Mobile & Web team deployment  
**Action:** Backend team fix immediately  
**Status:** ⏳ AWAITING IMPLEMENTATION
