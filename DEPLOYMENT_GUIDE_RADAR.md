# 🚀 Deployment Guide - Radar Location Tracking Feature

**Date:** January 8, 2026  
**Branch:** `heri01`  
**Feature:** Radar Location Tracking API  
**Priority:** Medium  
**Breaking Changes:** None

---

## 📦 What's New

Radar Location Tracking adalah fitur baru yang memungkinkan user untuk:
- Share lokasi real-time mereka
- Melihat lokasi user lain dalam radius tertentu
- Privacy control (enable/disable sharing)
- Role-based filtering (simpatisan, kader, admin)
- Auto-cleanup location history (30 hari)

---

## 🔄 Changes Summary

### New Files Added:
- `src/modules/radar/radar.service.js` - Business logic
- `src/modules/radar/radar.controller.js` - HTTP handlers
- `src/modules/radar/radar.routes.js` - API routes
- `src/jobs/locationCleanup.js` - Cron job for cleanup
- `docs/RADAR_API_DOCUMENTATION.md` - API documentation

### Modified Files:
- `prisma/schema.prisma` - Added UserLocation & LocationHistory models
- `src/app.js` - Registered radar routes
- `src/server.js` - Initialize cleanup cron job
- `src/middlewares/authMiddleware.js` - Added role field
- `package.json` - Added node-cron dependency

### Database Changes:
- **New Table:** `user_locations` - Current user locations
- **New Table:** `location_history` - Historical location records
- **Migration:** `20260108040924_add_radar_feature`

---

## 📋 Deployment Steps for Production

### 1️⃣ Pre-Deployment Checklist

```bash
# ⚠️ IMPORTANT: Backup database first!
pg_dump $DATABASE_NAME > backup_radar_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_radar_*.sql
```

### 2️⃣ Pull Latest Code

```bash
cd /path/to/mygery_BE

# Stash any local changes (if needed)
git stash

# Pull from heri01 branch
git pull origin heri01

# Verify you're on correct commit
git log --oneline -1
# Should show: 40a1fb1 feat: implement Radar location tracking feature
```

### 3️⃣ Install Dependencies

```bash
# Install new dependency: node-cron
npm install

# Verify node-cron installed
npm list node-cron
# Should show: node-cron@3.0.3
```

### 4️⃣ Run Database Migration

```bash
# Production migration (SAFE - only adds new tables)
npx prisma migrate deploy

# Expected output:
# 1 migration found in prisma/migrations
# Applying migration `20260108040924_add_radar_feature`
# Migration applied successfully

# Verify tables created
npx prisma studio
# Check: user_locations and location_history tables exist
```

### 5️⃣ Generate Prisma Client (if needed)

```bash
npx prisma generate
```

### 6️⃣ Restart Application

```bash
# Choose based on your setup:

# Option A: PM2
pm2 restart mygeri_restapi
pm2 logs mygeri_restapi --lines 50

# Option B: Systemd
sudo systemctl restart mygeri-backend
sudo journalctl -u mygeri-backend -f

# Option C: Docker
docker-compose restart backend
docker-compose logs -f backend

# Option D: Manual
pkill -f "node ./src/server.js"
npm run start
```

---

## ✅ Verification Steps

### 1. Check Server Logs

Look for these success indicators:
```
✅ "📅 Location history cleanup job scheduled (daily at 2 AM)"
✅ "🚀 Server is running on port XXXX in production mode"
✅ No errors related to radar module
```

### 2. Verify Database Tables

```bash
# Connect to database
psql $DATABASE_URL

# Check tables exist
\dt user_locations
\dt location_history

# Check table structure
\d user_locations
\d location_history

# Exit
\q
```

### 3. Test Endpoints

```bash
# Get valid token first (replace with real credentials)
TOKEN=$(curl -s -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"Test123!"}' | \
  jq -r '.data.accessToken')

# Test 1: Health check (should return 200)
curl -I https://your-domain.com/health

# Test 2: Radar endpoint (should return 200, not 404)
curl -s -X GET https://your-domain.com/api/radar/my-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# Test 3: Toggle sharing (should return 200)
curl -s -X POST https://your-domain.com/api/radar/toggle-sharing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' | jq
```

### 4. Monitor Cron Job

```bash
# Check if cron job is registered (in application logs)
# Should see log at server startup:
grep "Location history cleanup job scheduled" /path/to/logs

# Cron will run daily at 2:00 AM server time
# Check server timezone:
timedatectl  # or just: date
```

---

## 🎯 New API Endpoints

All endpoints under `/api/radar`:

1. **GET** `/my-status` - Get user's location status
2. **POST** `/toggle-sharing` - Enable/disable location sharing
3. **POST** `/update-location` - Update user location (rate limited: 1/min)
4. **GET** `/locations` - Get nearby locations with filters
5. **GET** `/admin/location-history` - Get location history (admin only)
6. **GET** `/admin/stats` - Get statistics (admin only)

Full documentation: `docs/RADAR_API_DOCUMENTATION.md`

---

## 🔧 Configuration

### Environment Variables (No changes required)
```bash
DATABASE_URL=postgresql://...  # Must be configured
PORT=3030                      # Default port
NODE_ENV=production           # Must be production
JWT_SECRET=...                # Must be configured
```

### Cron Job Settings
- **Schedule:** Daily at 2:00 AM (server timezone)
- **Action:** Delete location_history records older than 30 days
- **Tables affected:** `location_history` only
- **Auto-starts:** Yes, on server startup

---

## ⚠️ Important Notes

### Safe to Deploy:
✅ **No breaking changes** to existing APIs  
✅ **No data migration** from existing tables  
✅ **Backward compatible** with current frontend  
✅ **Only adds new tables** (user_locations, location_history)  
✅ **Safe to rollback** if needed  

### Resource Impact:
- **CPU:** Low (only cron job at 2 AM)
- **Memory:** Low (~5-10 MB additional)
- **Database:** ~2 new tables (initially empty)
- **Network:** Depends on usage

### Rate Limiting:
- Location updates: **1 per minute per user**
- Prevents spam and reduces server load

---

## 🚨 Troubleshooting

### Problem: Migration Failed

```bash
# Check migration status
npx prisma migrate status

# View migration history
npx prisma migrate history

# If stuck, check database connection
npx prisma db pull
```

**Solution:** Check DATABASE_URL and database permissions

---

### Problem: Server Won't Start

```bash
# Check for port conflicts
lsof -i :3030

# Check logs
pm2 logs mygeri_restapi --err
# or
journalctl -u mygeri-backend -n 100
```

**Common causes:**
- Port already in use
- Missing node-cron package
- Database connection failed
- Migration not applied

---

### Problem: Endpoints Return 404

```bash
# Verify routes are registered
curl -I https://your-domain.com/api/radar/my-status

# Should return: 401 Unauthorized (NOT 404 Not Found)
```

**Solution:** 
- Ensure server restarted after deployment
- Check `src/app.js` has radar routes registered
- Verify no nginx/proxy issues

---

### Problem: Cron Job Not Running

**Check logs for:**
```
"📅 Location history cleanup job scheduled (daily at 2 AM)"
```

**Verify:**
- Server timezone: `date` or `timedatectl`
- node-cron installed: `npm list node-cron`
- No errors in application logs

---

## 📊 Monitoring

### What to Monitor:

1. **API Response Times**
   - `/api/radar/locations` - May be slower if many users
   - Target: < 500ms

2. **Database Performance**
   - Watch for slow queries on user_locations table
   - Indexes already optimized

3. **Cron Job Execution**
   - Verify cleanup runs daily at 2 AM
   - Check logs for "Cleaned up X old location history records"

4. **Error Rates**
   - Watch for 429 (rate limit) errors
   - Watch for 500 errors

---

## 🔙 Rollback Plan

If issues occur, rollback is simple:

```bash
# 1. Stop server
pm2 stop mygeri_restapi

# 2. Revert code
git reset --hard HEAD~1  # or specific commit before 40a1fb1
npm install

# 3. Rollback migration (OPTIONAL - only if needed)
npx prisma migrate resolve --rolled-back 20260108040924_add_radar_feature

# 4. Restart server
pm2 start mygeri_restapi

# 5. Restore database backup (if necessary)
psql $DATABASE_NAME < backup_radar_YYYYMMDD_HHMMSS.sql
```

**Note:** Radar feature is isolated, rollback won't affect existing features.

---

## 📞 Contact & Support

**Questions or Issues?**
- Backend Lead: [Your Name/Email]
- DevOps Team: [DevOps Contact]
- Documentation: `docs/RADAR_API_DOCUMENTATION.md`

**Deployment Window:**
- Recommended: Off-peak hours (low traffic)
- Duration: ~10-15 minutes
- Downtime: ~30 seconds (during restart)

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Server started successfully
- [ ] Database tables created (user_locations, location_history)
- [ ] Cron job registered (check logs)
- [ ] All 6 radar endpoints accessible
- [ ] Health check returns 200
- [ ] No errors in application logs
- [ ] No database connection errors
- [ ] Frontend team notified
- [ ] API documentation accessible

---

## 📝 Timeline

- **Code Pushed:** January 8, 2026
- **Ready for Deployment:** Now
- **Recommended Deploy:** Next maintenance window
- **Flutter Integration:** After successful deployment

---

**Deployment Status:** ⏳ Awaiting DevOps  
**Priority:** Medium  
**Risk Level:** Low  

---

*Generated: January 8, 2026*  
*Last Updated: January 8, 2026*
