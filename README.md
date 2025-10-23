# HotRide - Ride Sharing Mobile App

A full-stack ride-sharing application built with React Native (Expo) and Python (FastAPI).

## Project Structure

```
HotRide/
├── backend/          # FastAPI backend with MongoDB
└── mobile/           # React Native (Expo) mobile app
```

## Stage 1: Authentication System ✅

### Features Implemented

**Backend (FastAPI + MongoDB):**
- ✅ Email/Phone + Password authentication
- ✅ Google OAuth integration
- ✅ Apple Sign In integration
- ✅ JWT token generation and validation
- ✅ Password hashing with bcrypt
- ✅ MongoDB user storage
- ✅ CORS configuration for Expo

**Frontend (React Native + Expo):**
- ✅ Login screen with email/phone + password
- ✅ Google OAuth button (fully functional)
- ✅ Apple Sign In button (fully functional)
- ✅ Form validation
- ✅ Error handling with toast notifications
- ✅ Secure token storage with Expo SecureStore
- ✅ Navigation with Expo Router
- ✅ State management with Zustand

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure `.env` file (see backend/README.md)

5. Start MongoDB (local or MongoDB Atlas)

6. Run server:
```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

### Mobile App Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure `.env` file (see mobile/README.md)

4. Start Expo:
```bash
npm start
```

5. Run on device:
- Press `i` for iOS
- Press `a` for Android
- Scan QR code for physical device

## Technology Stack

### Backend
- Python 3.10+
- FastAPI
- MongoDB (Motor - async driver)
- JWT authentication
- bcrypt password hashing
- Google OAuth verification
- Apple Sign In verification

### Frontend
- React Native 0.73
- Expo ~50.0
- Expo Router (file-based routing)
- NativeWind (Tailwind CSS)
- Zustand (state management)
- Axios (API calls)
- Expo SecureStore (secure storage)
- Google Sign In SDK
- Apple Authentication SDK

## Development Notes

### Environment Variables

**Backend (.env):**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `APPLE_CLIENT_ID` - Apple bundle identifier
- `CORS_ORIGINS` - Allowed CORS origins

**Frontend (.env):**
- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `EXPO_PUBLIC_APPLE_CLIENT_ID` - Apple bundle identifier

### Network Configuration

For mobile testing on same network:
- Use your machine's local IP in `EXPO_PUBLIC_API_URL`
- Example: `http://192.168.1.5:8000/api`
- Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

## API Endpoints

### Authentication

- `POST /api/auth/login` - Email/Phone + Password login
- `POST /api/auth/google` - Google OAuth authentication
- `POST /api/auth/apple` - Apple Sign In authentication

API documentation available at: `http://localhost:8000/docs`

## Testing

### Manual Testing

1. Start backend server
2. Start mobile app
3. Try logging in with:
   - Email + password
   - Google account
   - Apple ID (iOS only)

### Test User

For development, you can create a test user directly in MongoDB:
```javascript
db.users.insertOne({
  email: "test@example.com",
  password_hash: "$2b$12$...", // Use backend to hash: "password123"
  oauth_provider: "email",
  is_active: true,
  is_email_verified: false,
  is_phone_verified: false,
  created_at: new Date(),
  updated_at: new Date()
})
```

## Next Steps (Stage 2)

- [ ] User registration with email/phone
- [ ] Profile setup screen (full name, photo)
- [ ] Email verification
- [ ] Phone verification with SMS
- [ ] Forgot password flow
- [ ] Password reset functionality

## Stage 3 & Beyond

- Home screen with map
- Ride booking
- Driver features
- Payment integration
- Ratings and reviews
- Push notifications

## Documentation

Detailed documentation available in:
- `backend/README.md` - Backend setup and API docs
- `mobile/README.md` - Mobile app setup and features

## License

Private project - All rights reserved

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.
