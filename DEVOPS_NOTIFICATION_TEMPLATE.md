# Email Template untuk Tim DevOps

---

**Subject:** [DEPLOY REQUEST] Radar Location Tracking Feature - Branch heri01

---

Hi DevOps Team,

Saya sudah push fitur baru **Radar Location Tracking** ke branch `heri01` dan siap untuk di-deploy ke production.

## 📦 Quick Summary

**Feature:** Real-time location tracking dengan role-based filtering  
**Branch:** `heri01`  
**Commit:** `40a1fb1`  
**Priority:** Medium  
**Risk:** Low (no breaking changes)  
**Downtime:** ~30 seconds (during restart)

## 🔄 What's Changed

- ✅ 6 new API endpoints untuk location tracking
- ✅ 2 new database tables (user_locations, location_history)
- ✅ 1 new dependency (node-cron for cleanup jobs)
- ✅ Migration file included
- ✅ No breaking changes to existing features

## 📋 Deployment Steps (Summary)

1. **Backup database** (IMPORTANT!)
2. Pull from `heri01` branch
3. Run `npm install` (new dependency: node-cron)
4. Run `npx prisma migrate deploy` (adds 2 new tables)
5. Restart server
6. Verify endpoints working

**Full detailed guide:** See `DEPLOYMENT_GUIDE_RADAR.md` in repository

## ✅ Ready for Deploy?

- [x] Code tested locally ✅
- [x] All endpoints working ✅
- [x] Migration tested ✅
- [x] Documentation complete ✅
- [x] No breaking changes ✅
- [x] Safe to rollback ✅

## 📊 Resource Impact

- CPU: Low
- Memory: ~5-10 MB additional
- Database: 2 new tables (initially empty)
- Cron Job: Daily at 2 AM (cleanup old data)

## 🔗 Important Links

- **Deployment Guide:** `DEPLOYMENT_GUIDE_RADAR.md`
- **API Documentation:** `docs/RADAR_API_DOCUMENTATION.md`
- **Repository:** https://github.com/bagawe/mygery_BE
- **Branch:** heri01
- **Commit:** 40a1fb1

## ⏰ Preferred Deploy Window

- **When:** Next maintenance window / off-peak hours
- **Duration:** ~10-15 minutes
- **Downtime:** ~30 seconds (during server restart)

## 📞 Contact

Jika ada pertanyaan atau butuh info lebih lanjut, feel free to reach out!

**Backend:** [Your Name/Contact]  
**Available:** [Your availability]

---

Thanks! 🚀

[Your Name]

---

# Alternative: Slack/Chat Message Template

---

📢 **New Feature Ready for Deploy!**

**Feature:** Radar Location Tracking 📍  
**Branch:** `heri01`  
**Commit:** `40a1fb1`

**What's New:**
• 6 API endpoints untuk location tracking
• 2 database tables baru
• Role-based filtering (jobseeker/company/admin)
• Auto-cleanup cron job (daily 2 AM)

**Deploy Required:**
✅ Pull branch `heri01`
✅ `npm install` (node-cron added)
✅ `npx prisma migrate deploy`
✅ Restart server

**Risk:** 🟢 Low - No breaking changes
**Docs:** See `DEPLOYMENT_GUIDE_RADAR.md`

Ready when you are! Let me know if you need any info 👍

---

# Alternative: Jira/Ticket Template

---

**Title:** Deploy Radar Location Tracking Feature to Production

**Type:** Deployment Request

**Priority:** Medium

**Description:**
Deploy Radar Location Tracking feature yang sudah di-push ke branch `heri01`.

**Branch:** heri01
**Commit Hash:** 40a1fb1

**Changes:**
- 6 new API endpoints
- 2 new database tables (user_locations, location_history)
- 1 new cron job (daily cleanup at 2 AM)
- 1 new dependency (node-cron@3.0.3)

**Migration Required:** Yes
- Migration: 20260108040924_add_radar_feature
- Tables Added: user_locations, location_history
- Safe: Yes (no existing data affected)

**Deployment Steps:**
1. Backup database
2. `git pull origin heri01`
3. `npm install`
4. `npx prisma migrate deploy`
5. Restart server

**Verification:**
- Server logs show "Location history cleanup job scheduled"
- Endpoint `/api/radar/my-status` returns 401 (not 404)
- Tables `user_locations` and `location_history` exist

**Documentation:**
- Deployment Guide: DEPLOYMENT_GUIDE_RADAR.md
- API Documentation: docs/RADAR_API_DOCUMENTATION.md

**Rollback Plan:** Simple git reset + npm install (detailed in guide)

**Breaking Changes:** None

**Estimated Downtime:** 30 seconds (during restart)

**Preferred Deploy Window:** Off-peak hours

**Contact:** [Your Name/Email]

---
