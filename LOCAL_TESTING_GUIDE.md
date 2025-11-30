# 🧪 Local Testing Guide - User Isolation Feature

## ✅ Current Status

### Backend Server: **RUNNING** ✅

- **Port:** 8000
- **Health Check:** http://localhost:8000/health
- **Database:** SQLite (ipo_data.db) with user isolation enabled

### Frontend Server: **NEEDS TO START**

- **Expected Port:** 5173
- **URL:** http://localhost:5173

---

## 🚀 Quick Start Commands

### Terminal 1: Backend (Already Running)

```bash
cd IPO_Alllotment_Final/backend
python main.py
```

**Status:** ✅ Running on http://localhost:8000

### Terminal 2: Frontend (Start This)

```bash
cd IPO_Alllotment_Final
npm run dev
```

**Expected:** Will run on http://localhost:5173

---

## 🔍 Testing User Isolation

### Test Scenario 1: Admin User

1. Open http://localhost:5173
2. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`
3. You should see existing data (if any)

### Test Scenario 2: Create New User

1. Go to **Admin** page (gear icon)
2. Register new user:
   - **Username:** `testuser`
   - **Password:** `test123`
3. Logout from admin

### Test Scenario 3: Test User Isolation

1. Login as `testuser` / `test123`
2. **Expected:** Empty dashboard (no applicants, no applications)
3. Click "Manage Users" → Add applicant:
   - **Name:** `Test User Applicant`
   - **Phone:** `1234567890`
   - **PAN:** `ABCDE1234F`
4. Create an IPO application for this applicant
5. Logout

### Test Scenario 4: Verify Isolation

1. Login as `admin` / `admin123`
2. **Expected:** You should NOT see "Test User Applicant"
3. Add your own applicant:
   - **Name:** `Admin Applicant`
4. Logout

### Test Scenario 5: Confirm Separation

1. Login as `testuser` / `test123`
2. **Expected:** You should ONLY see "Test User Applicant"
3. You should NOT see "Admin Applicant"

---

## ✅ Success Criteria

| Test                                     | Expected Result                    | Status |
| ---------------------------------------- | ---------------------------------- | ------ |
| Admin sees own data                      | ✅ Only admin's applicants visible |        |
| Test user sees empty dashboard initially | ✅ No data on first login          |        |
| Test user adds applicant                 | ✅ Applicant created successfully  |        |
| Admin doesn't see test user's data       | ✅ Isolation working               |        |
| Test user doesn't see admin's data       | ✅ Isolation working               |        |

---

## 🔧 Configuration

### Backend (main.py)

- **Port:** 8000
- **Database:** SQLite (local file)
- **User isolation:** ✅ ENABLED
- **Default user:** admin / admin123

### Frontend (vite.config.ts)

- **Dev Port:** 5173 (default)
- **API Proxy:** http://localhost:8000
- **Routes proxied:** /api, /auth, /admin

---

## 📊 API Endpoints to Test

### Auth Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Register new user
curl -X POST http://localhost:8000/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "test123"}'
```

### Data Endpoints (Requires Auth Token)

```bash
# List applicants (will only show current user's data)
curl http://localhost:8000/api?action=listUsers \
  -H "Authorization: Bearer YOUR_TOKEN"

# List applications (will only show current user's data)
curl http://localhost:8000/api?action=list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### Backend Not Running

```bash
cd IPO_Alllotment_Final/backend
python main.py
```

Check output for any errors.

### Frontend Not Starting

```bash
cd IPO_Alllotment_Final
npm install  # If node_modules missing
npm run dev
```

### Port Already in Use

```bash
# Check what's using port 8000
netstat -ano | findstr ":8000"

# Kill process if needed (replace PID)
taskkill /PID <PID> /F
```

### Can't Login

- Verify backend is running: http://localhost:8000/health
- Check browser console for errors
- Verify username/password: `admin` / `admin123`

### Seeing All Users' Data

- Check if migration ran successfully
- Verify `created_by` column exists in database
- Check backend logs for filter queries

---

## 📝 Database Verification

### Check Migration Status

```bash
cd IPO_Alllotment_Final/backend
python

# In Python shell:
from database import get_db
from models import Applicant, IpoApplication

db = next(get_db())

# Check if created_by column exists
applicant = db.query(Applicant).first()
if applicant:
    print(f"Applicant created_by: {applicant.created_by}")

app = db.query(IpoApplication).first()
if app:
    print(f"Application created_by: {app.created_by}")
```

---

## 🚀 Ready for Deployment

Once local testing is successful:

1. ✅ Verify user isolation working
2. ✅ Test with multiple users
3. ✅ Confirm data separation
4. ✅ Check all CRUD operations
5. ✅ Ready to push to production!

---

## 📞 Current Status Summary

- ✅ Backend: Running on port 8000
- ✅ Database: Migration applied successfully
- ✅ User Isolation: ENABLED
- ⏳ Frontend: Ready to start on port 5173

**Next Step:** Start the frontend server and begin testing!

```bash
npm run dev
```

Then open: http://localhost:5173
