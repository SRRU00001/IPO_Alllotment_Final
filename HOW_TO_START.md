# 🚀 How to Start the IPO Allotment System

## ⚡ Quick Start (Easiest Method)

### Method 1: Using Batch Files (Recommended)

1. **Start Backend:**
   - Double-click `backend/START_BACKEND.bat`
   - A window will open showing the backend server
   - Wait until you see "Uvicorn running on http://0.0.0.0:8000"

2. **Start Frontend:**
   - Double-click `START_FRONTEND.bat`
   - A window will open showing the frontend server
   - Wait until you see "Local: http://localhost:5173/"

3. **Open Browser:**
   - Go to http://localhost:5173
   - Login with: `admin` / `admin123`

---

## 🔧 Method 2: Manual Terminal Commands

### Terminal 1: Backend
```bash
cd IPO_Alllotment_Final/backend
python main.py
```

### Terminal 2: Frontend
```bash
cd IPO_Alllotment_Final
npm run dev
```

### Terminal 3: Open Browser
```
http://localhost:5173
```

---

## ✅ Verify Servers Are Running

### Check Backend:
```bash
curl http://localhost:8000/health
```
Expected: `{"status":"healthy","timestamp":"..."}`

### Check Frontend:
Open: http://localhost:5173
Expected: Login page

---

## 🔒 Test User Isolation

### Step 1: Login as Admin
- Username: `admin`
- Password: `admin123`

### Step 2: Create Test User
1. Click **Admin** button (gear icon, top right)
2. Click "Register New User" tab
3. Fill in:
   - Username: `testuser`
   - Password: `test123`
   - Confirm Password: `test123`
4. Click "Create account"
5. Logout (top right)

### Step 3: Verify Isolation
1. Login as `testuser` / `test123`
2. ✅ **Dashboard should be EMPTY** (proves isolation works!)
3. Click "Manage Users" → Add an applicant
4. Create some IPO applications
5. Logout

### Step 4: Confirm Separation
1. Login as `admin` / `admin123`
2. ✅ **Should NOT see testuser's data**
3. Each user sees ONLY their own data!

---

## 🐛 Troubleshooting

### Backend Won't Start
**Problem:** Port 8000 already in use

**Solution:**
```bash
# Find process using port 8000
netstat -ano | findstr ":8000"

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

### Frontend Won't Start
**Problem:** Port 5173 already in use

**Solution:**
```bash
# Find process using port 5173
netstat -ano | findstr ":5173"

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

### Frontend Shows "Connection Refused"
**Problem:** Frontend trying to connect to wrong port

**Solution:**
1. Make sure backend is running on port 8000
2. Check browser console (F12) for errors
3. Verify `vite.config.ts` has `target: 'http://localhost:8000'`

### Can't Login
**Problem:** Invalid credentials

**Solution:**
- Default admin credentials: `admin` / `admin123`
- Check backend logs for authentication errors
- Verify backend is running: http://localhost:8000/health

---

## 📊 Port Configuration

| Service  | Port | URL                        |
| -------- | ---- | -------------------------- |
| Backend  | 8000 | http://localhost:8000      |
| Frontend | 5173 | http://localhost:5173      |
| Database | N/A  | SQLite file (ipo_data.db) |

---

## 🎯 Expected Behavior

### User Isolation:
- ✅ Admin sees only admin's data
- ✅ Testuser sees only testuser's data
- ✅ No data sharing between users
- ✅ Each user has private dashboard

### Shared Data:
- ✅ IPO Names (shared across all users)
- ❌ Applicants (isolated per user)
- ❌ Applications (isolated per user)

---

## 📁 File Structure

```
IPO_Alllotment_Final/
├── backend/
│   ├── main.py              # Backend server
│   ├── models.py            # Database models (with created_by)
│   ├── database.py          # Database connection
│   ├── ipo_data.db          # SQLite database
│   └── START_BACKEND.bat    # Start script
├── src/
│   ├── config.ts            # API configuration
│   └── components/          # React components
├── vite.config.ts           # Vite configuration (port 8000)
└── START_FRONTEND.bat       # Start script
```

---

## 🚀 Ready for Deployment

Once local testing is complete:

```bash
# Commit changes
git add .
git commit -m "feat: implement user isolation for multi-user support"

# Push to production
git push origin main
```

---

## 📞 Quick Reference

### Start Both Servers:
1. Double-click `backend/START_BACKEND.bat`
2. Double-click `START_FRONTEND.bat`
3. Open http://localhost:5173

### Login:
- Admin: `admin` / `admin123`
- Test: `testuser` / `test123` (create this first)

### Health Checks:
- Backend: http://localhost:8000/health
- Frontend: http://localhost:5173

---

**That's it! You're ready to test the user isolation feature!** 🎉

