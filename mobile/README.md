# HotRide Mobile App

React Native mobile application for HotRide ride-sharing service.

## Tech Stack

- **React Native** with Expo ~50.0.0
- **Expo Router** for file-based navigation
- **NativeWind** (Tailwind for React Native)
- **Zustand** for state management
- **Axios** for API calls
- **Expo SecureStore** for secure token storage
- **Google Sign In** & **Apple Sign In** for OAuth

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 15+ (Mac only)
- Android: Android Studio with Android SDK

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Configure environment variables in `.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
EXPO_PUBLIC_APPLE_CLIENT_ID=com.hotride.app
```

Replace `YOUR_LOCAL_IP` with your machine's local IP address.

### OAuth Configuration

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google Sign-In" API
4. Create OAuth 2.0 credentials:
   - **Android**: Add SHA-1 certificate fingerprint
   - **iOS**: Add bundle identifier `com.hotride.app`
5. Copy Client ID to `.env` file

#### Apple Sign In Setup (iOS only)

1. Go to [Apple Developer](https://developer.apple.com)
2. Register App ID with "Sign In with Apple" capability
3. Use bundle identifier: `com.hotride.app`
4. Enable Sign In with Apple in Xcode project

### Running the App

Start Expo development server:
```bash
npm start
```

Run on specific platform:
- iOS Simulator: Press `i` (Mac only)
- Android Emulator: Press `a`
- Physical Device: Scan QR code with Expo Go app

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── login.tsx          # Login screen
│   ├── profile-setup.tsx  # Profile setup placeholder
│   ├── _layout.tsx        # Root layout with navigation
│   └── index.tsx          # Entry redirect
├── components/
│   ├── ui/                # Reusable UI components
│   └── auth/              # Authentication components
├── services/              # API services
├── hooks/                 # Custom React hooks
├── store/                 # Zustand state management
├── utils/                 # Utility functions
├── constants/             # App constants
└── assets/               # Images and fonts
```

## Features (Stage 1)

- ✅ Email/Phone + Password login
- ✅ Google OAuth authentication
- ✅ Apple Sign In authentication
- ✅ Form validation
- ✅ Error handling with toast notifications
- ✅ Secure token storage
- ✅ JWT authentication
- ✅ Navigation with Expo Router

## Network Configuration

For testing on physical devices:
- Ensure device is on the same WiFi network as development machine
- Use your machine's local IP in `EXPO_PUBLIC_API_URL`
- Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

For emulators:
- **iOS Simulator**: Use `http://localhost:8000/api`
- **Android Emulator**: Use `http://10.0.2.2:8000/api`

## Next Steps (Stage 2)

- User registration
- Profile setup completion
- Email verification
- Phone verification with SMS
- Forgot password flow
- Password reset

## Troubleshooting

### Google Sign In Issues
- Verify SHA-1 certificate matches Google Console
- Check `GOOGLE_CLIENT_ID` in `.env`
- Ensure Google Play Services available (Android)

### Apple Sign In Issues
- Only works on iOS devices/simulators
- Verify bundle identifier matches Apple Developer
- Check Xcode capabilities enabled

### Network Connection Issues
- Verify backend is running
- Check `EXPO_PUBLIC_API_URL` is correct
- Ensure CORS is configured on backend
- Try using Expo tunnel: `npx expo start --tunnel`

## Documentation

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [Google Sign In](https://react-native-google-signin.github.io/docs/)
- [Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
