# IPO Allotment Manager

A full-stack application for managing IPO allotments and tracking applications. Built with React frontend and Python FastAPI backend with SQLite database.

## Features

- **User Authentication**: Login, registration with email OTP verification, password recovery
- **User Management**: Create and manage applicants (name, PAN, phone)
- **IPO Management**: Create IPOs with name and amount
- **Application Tracking**: Add multiple users to IPOs, track money sent/received, allotment status
- **Advanced Filtering**: Filter by IPO name, allotment status, and search across fields
- **Sorting & Pagination**: Sort by any column and paginate through results
- **Summary Dashboard**: View total applicants, allotted count, and money tracking for selected IPO
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **TailwindCSS** for styling
- **Lucide React** for icons

### Backend
- **Python 3.10+** with FastAPI
- **SQLite** database with SQLAlchemy ORM
- **bcrypt** for password hashing
- **SMTP** for email OTP verification

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- pip (Python package manager)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd IPO_Alllotment
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python -m uvicorn main:app --host 0.0.0.0 --port 9000
```

The backend will run on `http://localhost:9000`

### 3. Frontend Setup

```bash
# Navigate to project root (if in backend folder)
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173` (or next available port)

### 4. Configure Email (Optional)

To enable email OTP verification for registration and password recovery, update `backend/email_service.py`:

```python
SENDER_EMAIL = "your-email@gmail.com"
SENDER_APP_PASSWORD = "your-app-password"
```

For Gmail, you need to:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: Google Account > Security > App Passwords
3. Use the 16-character app password in the configuration

## Default Login

After first startup, a default admin user is created:
- **Username**: `admin`
- **Password**: `admin123`

## Project Structure

```
IPO_Alllotment/
├── backend/
│   ├── main.py              # FastAPI application & routes
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # Database configuration
│   ├── auth.py              # Authentication utilities
│   ├── email_service.py     # Email OTP service
│   ├── requirements.txt     # Python dependencies
│   └── ipo_data.db          # SQLite database (auto-created)
├── src/
│   ├── components/          # React components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── TopNav.tsx
│   │   ├── FiltersPanel.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── ApplicantsTable.tsx
│   │   ├── Pagination.tsx
│   │   ├── CreateIpoModal.tsx
│   │   ├── AddApplicationsModal.tsx
│   │   ├── EditApplicationModal.tsx
│   │   ├── UserManagementModal.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   └── Toast.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useApi.ts
│   │   ├── useFetchRows.ts
│   │   ├── useIpoList.ts
│   │   └── usePagination.ts
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── services/            # API client
│   │   └── ApiClient.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx              # Main application
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── package.json
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with username/password |
| POST | `/auth/logout` | Logout and invalidate token |
| GET | `/auth/verify` | Verify authentication token |
| POST | `/auth/register/send-otp` | Send registration OTP to email |
| POST | `/auth/register/verify-otp` | Verify OTP and create account |
| POST | `/auth/forgot-password/send-otp` | Send password recovery OTP |
| POST | `/auth/forgot-password/verify-otp` | Verify OTP and reset password |

### Data Operations (Requires Auth)

| Method | Endpoint | Action | Description |
|--------|----------|--------|-------------|
| GET | `/api?action=list` | list | Get all IPO applications |
| GET | `/api?action=listIpos` | listIpos | Get all IPO names |
| GET | `/api?action=listUsers` | listUsers | Get all applicants |
| GET | `/api?action=getAppliedUsers&ipoName=X` | getAppliedUsers | Get users applied to an IPO |
| POST | `/api` | addUser | Add new applicant |
| POST | `/api` | updateUser | Update applicant details |
| POST | `/api` | deleteUser | Delete applicant |
| POST | `/api` | addIpo | Create new IPO |
| POST | `/api` | addBulkApplications | Add multiple users to an IPO |
| POST | `/api` | updateRow | Update application status |
| POST | `/api` | deleteRow | Delete application |

## Data Models

### User (Login Account)
```typescript
{
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
}
```

### Applicant (IPO Applicant)
```typescript
{
  id: string;
  name: string;
  phone: string;
  pan: string;
  createdAt: string;
}
```

### IPO
```typescript
{
  name: string;
  amount: number;
}
```

### IPO Application
```typescript
{
  id: string;
  ipoName: string;
  userId: string;
  userName: string;
  userPan: string;
  userPhone: string;
  ipoAmount: number;
  moneySent: boolean;
  moneyReceived: boolean;
  allotmentStatus: "Pending" | "Allotted" | "Not Allotted";
  createdAt: string;
}
```

## Business Rules

1. **Money Received Auto-Reset**: When allotment status is set to "Not Allotted", money received is automatically set to false
2. **User Deletion Protection**: Users with existing applications cannot be deleted
3. **Duplicate Prevention**: Same user cannot apply to the same IPO twice

## Building for Production

### Frontend
```bash
npm run build
```
Output will be in the `dist/` directory.

### Backend
Deploy using any ASGI server (uvicorn, gunicorn with uvicorn workers):
```bash
uvicorn main:app --host 0.0.0.0 --port 9000 --workers 4
```

## Troubleshooting

### Backend won't start
- Ensure Python 3.10+ is installed
- Install all requirements: `pip install -r requirements.txt`
- Check if port 9000 is available

### Frontend can't connect to backend
- Verify backend is running on port 9000
- Check CORS settings in `main.py` include your frontend port
- Verify `VITE_API_BASE_URL` environment variable if set

### Email OTP not working
- Verify Gmail app password is correct (16 characters, no spaces)
- Ensure 2FA is enabled on your Google account
- Check spam folder for OTP emails

### Database issues
- Delete `backend/ipo_data.db` to reset the database
- Restart the backend to recreate tables

## License

MIT
