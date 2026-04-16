# 📢 Template Pesan untuk Slack/Chat

## Untuk Backend Team:

```
🚨 CRITICAL - Double User Bug Root Cause Found!

Web team identified the issue:
- ✅ Web frontend is CORRECT (calls API properly)
- ❌ Backend is WRONG (uses create() instead of update())

Result: Verify button creates 2 users instead of updating 1

📍 AFFECTED ENDPOINTS:
  1. POST /api/kader/confirm/point1/:id
  2. POST /api/kader/confirm/point2/:id
  3. POST /api/kader/confirm/simpatisan/:id

🔧 FILES TO READ:
  - BACKEND_ACTION_REQUIRED.md (complete fix guide)
  - src/modules/kader/kader.service.js (code to change)

⚡ PRIORITY: IMMEDIATE
Timeline: Fix in next 1-2 hours to unblock mobile/web deployment

✅ Check commit 6fcb76b for detailed documentation
```

---

## Untuk Mobile Team:

```
⏸️ DEPLOYMENT ON HOLD - Critical backend bug found

The double user bug was identified by web team:
- Root cause: Backend verify endpoints create users instead of updating

📌 YOU CANNOT DEPLOY until backend fixes this
- If you deploy now, verify will create duplicate users
- Backend working on fix (~2-3 hours)
- Will notify when ready

📄 See FE_TEAMS_SUMMARY.md for complete details
📌 Watch for "Backend fix ready" notification
```

---

## Untuk Web Team (Admin):

```
⚠️ WAIT - Don't use verify button yet!

We found why verify creates 2 users:
- Backend uses create() instead of update() 🐛
- Your code is CORRECT ✅
- We need backend to fix it

🔧 Backend team is working on fix (~2-3 hours)
Once fixed, verify button will work properly

📄 Details: FE_TEAMS_SUMMARY.md
📌 Stand by for "fix deployed" notification
```

---

## Untuk Tech Lead / Project Manager:

```
📊 STATUS UPDATE - Issue #5 (Double User) IDENTIFIED

Web team found root cause:
- Issue: Backend verify endpoints use create() instead of update()
- Impact: Creates 2 users instead of 1 when verifying
- Responsibility: Backend team
- Status: CRITICAL - Blocks mobile & web deployment

📍 5 Issues Total:
  ✅ #1 JWT Session (30d) - FIXED & DEPLOYED ✅
  ✅ #2 Voting Active (admin) - FIXED & DEPLOYED ✅
  ✅ #3 Agenda Perms - Already correct ✅
  ✅ #4 Announcement Perms - Already correct ✅
  🔴 #5 Double User Bug - Root cause found, backend fixing NOW

⏱️ Timeline:
  - Backend fix: 1-2 hours
  - Testing: 1-2 hours
  - Prod deployment: 4-5 hours total
  - Mobile/Web can deploy after

📝 Documents:
  - BACKEND_ACTION_REQUIRED.md (backend guide)
  - FE_TEAMS_SUMMARY.md (team status)
  - CRITICAL_UPDATE_DOUBLE_USER_BUG.md (technical details)

Commits: 379be34 (fixes) + 6fcb76b (documentation)
```

---

## Untuk All Teams - Executive Summary:

```
✅ 2 issues fixed and deployed
✅ 2 issues verified already correct
🔴 1 issue root cause found - backend team fixing NOW

Web team pinpointed double user bug:
→ Backend uses CREATE instead of UPDATE

Status: ⏸️ All deployments on hold (4-5 hours remaining)
Next: Backend fix → QA test → Prod deploy → Mobile/Web deploy

Full details: Check pinned messages / GitHub repos
```

---

## For Git Commit Message Style:

```
🐛 fix: Replace user create() with update() in kader verification

Previously verify endpoints were creating new users instead of updating
existing users, resulting in duplicate user records.

BREAKING: This fixes the double user bug but changes endpoint behavior
- Users will now have single record with updated role
- Previous duplicate records should be cleaned up in migration

Related: Issue #5 (Double User Bug)
Fixes: All duplicate users from verify operations
```
