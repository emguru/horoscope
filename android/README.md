# Daily Horoscope - Android App

React Native (Expo) Android app for the horoscope natal chart reading. Connects to the Next.js backend API.

## Prerequisites

1. **Backend running**: The Next.js app must be deployed or running. Configure in the app via **Settings** (⚙):
   - **Android emulator**: `http://10.0.2.2:3000`
   - **Physical device**: Your computer's IP, e.g. `http://192.168.1.100:3000`
   - **Production**: Your deployed URL, e.g. `https://your-app.vercel.app`

2. **API keys** (optional): Enable "Use custom API keys" in Settings to enter FreeAstro and OpenAI keys. Otherwise the backend uses its `.env.local` keys.

3. **Node.js** and **npm**

4. **Android Studio** (for emulator and/or APK build)

## Development

```bash
# From project root
cd android
npm install
npm run android
```

Ensure the Next.js backend is running (`npm run dev` in the parent folder) and both are on the same network when using a physical device.

## Build APK

### Option 1: EAS Build (recommended – no Android Studio needed)

Build in the cloud with Expo Application Services:

```bash
cd android
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

The APK will be available for download when the build completes. Run `eas init` first if prompted.

### Option 2: Local build (requires Android Studio + Android SDK)

1. Install [Android Studio](https://developer.android.com/studio) and set up the Android SDK
2. Set `ANDROID_HOME` (e.g. `C:\Users\YourName\AppData\Local\Android\Sdk`)
3. Run:

```bash
cd android
npm run build:apk
```

The APK will be at: `android/android/app/build/outputs/apk/release/app-release.apk`

**Important:** The release APK has the JavaScript bundle packaged inside. It runs **standalone** on the device—no USB connection or same-network setup needed. The app uses the phone's Wi‑Fi or mobile data for API calls (OpenAI, FreeAstro, etc.).

For a quick release build without regenerating native code: `npm run build:release`

## Config

Use the **Settings** button (⚙) in the app to configure:
- **API Base URL** – Backend URL (required)
- **Use custom API keys** – Toggle to enter FreeAstro and OpenAI keys in the app
