# CCTV Camera Mapping Mobile Application

Standalone React Native (Expo) mobile application for the CCTV Camera Detection & Mapping System.

---

## 📱 Quick Start

### 1. Prerequisites
- Ensure the Spring Boot backend is running on `http://localhost:8088`.
- Node.js installed.
- Install the **Expo Go** app on your physical mobile phone (iOS / Android) OR have an Android emulator / iOS simulator running.

### 2. Launch Mobile App
From the project root:
```bash
cd mobile-app
npm start
```

### 3. Open on Device / Simulator
- **Physical Phone**: Scan the terminal QR code with the **Expo Go** app (or the iOS Camera app). Ensure your phone is connected to the same Wi-Fi network as your development computer.
- **Android Emulator**: Press `a` in the terminal.
- **iOS Simulator (Mac)**: Press `i` in the terminal.
- **Web Preview**: Press `w` in the terminal.

---

## 🌐 Network Configuration for Real Devices

When connecting from a physical phone over Wi-Fi, `localhost` points to the phone itself.
1. Find your computer's local IP address (e.g. `192.168.1.15`).
2. Go to the **Profile** tab in the mobile app.
3. In the **Backend API Endpoint** card, set your URL:
   ```
   http://192.168.1.15:8088/api/v1
   ```
4. Tap the save icon. Future API requests will route to your development machine!

---

## 🛡️ Role-Based Workflows & Demo Accounts

Use the one-tap demo buttons on the Login screen:

| Role | Username | Password | Features Accessible |
|---|---|---|---|
| **Admin** | `admin` | `password` | Command KPI Dashboard, CCTV Directory, Verification Queue (Approve / Reject) |
| **Police Officer** | `officer1` | `password` | Command KPI Dashboard, CCTV Directory, FIR Crime Dossiers, Haversine Radar Proximity Search, Evidence Footage Requisitions |
| **Surveyor** | `surveyor1` | `password` | Command KPI Dashboard, CCTV Directory, My Field Surveys, 4-Stage Camera Registration Form |

---

## 🎨 Design System

Built strictly following the **Mastercard Editorial Aesthetic** specified in `DESIGN (3).md`:
- **Background**: `#F3F0EE` (Warm canvas cream)
- **Primary Ink**: `#141413` (Deep ink black)
- **Accent**: `#CF4500` (Signal terracotta / orange)
- **Cards**: 28px stadium radius with subtle drop shadows
- **Buttons**: 20px pill radius with bold labels
- **Navigation**: 32px floating bottom pill navbar with Lucide icons

---

## 📂 Architecture

```
mobile-app/
├── assets/                  ← Badges, logo, and hero imagery
├── src/
│   ├── api/
│   │   └── client.js        ← Axios client with Bearer token interceptor
│   ├── config/
│   │   └── env.js           ← Dynamic host resolution (Android / iOS / LAN)
│   ├── context/
│   │   └── AuthContext.js   ← Token persistence & role helper methods
│   ├── theme/
│   │   └── colors.js        ← Mastercard editorial color tokens
│   ├── components/
│   │   ├── Header.js        ← Police header banner with status tag
│   │   ├── Card.js          ← 28px stadium container
│   │   ├── Button.js        ← Pill action button with loading state
│   │   ├── Input.js         ← Styled form inputs
│   │   └── StatusBadge.js   ← Active, Offline, Pending, Resolved badges
│   ├── screens/
│   │   ├── auth/LoginScreen.js
│   │   ├── dashboard/DashboardScreen.js
│   │   ├── cameras/CameraListScreen.js
│   │   ├── cameras/RegisterCameraScreen.js
│   │   ├── investigations/InvestigationsScreen.js
│   │   ├── surveys/MySurveysScreen.js
│   │   ├── verification/VerificationQueueScreen.js
│   │   └── profile/ProfileScreen.js
│   └── navigation/
│       ├── RootNavigator.js
│       └── BottomTabNavigator.js
├── App.js
├── app.json
└── package.json
```
