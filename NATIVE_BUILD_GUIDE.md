# The Cubby - Native Mobile App Build Guide

This project is configured with Capacitor to build native iOS and Android apps from the existing web codebase.

## Prerequisites

### For iOS
- macOS computer
- Xcode 15+ (free from Mac App Store)
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer Account ($99/year) for App Store distribution

### For Android
- Android Studio (free, available on macOS, Windows, Linux)
- Java JDK 17+
- Google Play Developer Account ($25 one-time) for Play Store distribution

## Project Structure

```
├── capacitor.config.ts    # Capacitor configuration
├── ios/                   # Native iOS project (Xcode)
│   └── App/
│       ├── App/           # iOS app source + web assets
│       └── Podfile        # iOS dependencies
├── android/               # Native Android project
│   └── app/
│       └── src/main/
│           ├── assets/public/  # Web assets copied here
│           └── java/           # Android source
└── dist/public/           # Built web assets (source)
```

## Setup on Your Local Machine

### 1. Clone the Repository

Download or clone this project to your local machine.

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Web Assets

```bash
npm run build
```

This builds the frontend into `dist/public/`.

### 4. Set the API URL

Before building for native, you need to tell the app where your backend server is running.

Create or edit a `.env` file:

```
VITE_API_URL=https://your-app.replit.app
```

Replace with your actual deployed Replit app URL.

Then rebuild:

```bash
npm run build
```

## Building for iOS

### 1. Sync Web Assets to iOS

```bash
npx cap sync ios
```

### 2. Install CocoaPods Dependencies

```bash
cd ios/App
pod install
cd ../..
```

### 3. Open in Xcode

```bash
npx cap open ios
```

### 4. Configure Signing in Xcode
- Select the "App" target
- Go to "Signing & Capabilities"
- Select your Apple Developer team
- Set a unique Bundle Identifier (e.g., `com.yourname.thecubby`)

### 5. Build and Run
- Select your target device or simulator
- Press Cmd+R to build and run

### 6. Submit to App Store
- In Xcode: Product → Archive
- Follow the App Store Connect submission flow

## Building for Android

### 1. Sync Web Assets to Android

```bash
npx cap sync android
```

### 2. Open in Android Studio

```bash
npx cap open android
```

### 3. Build and Run
- Select your target device or emulator
- Click the Run button (green play icon)

### 4. Generate Signed APK/AAB for Play Store
- In Android Studio: Build → Generate Signed Bundle/APK
- Create a keystore if you don't have one
- Choose Android App Bundle (AAB) for Play Store submission
- Follow the Google Play Console submission flow

## Updating the App

When you make changes to the web app:

```bash
# Rebuild web assets
npm run build

# Sync to native projects
npx cap sync

# Then open and rebuild in Xcode / Android Studio
npx cap open ios    # or android
```

## Capacitor Plugins Included

| Plugin | Purpose |
|--------|---------|
| @capacitor/camera | Native camera access for barcode scanning |
| @capacitor/haptics | Haptic feedback on interactions |
| @capacitor/keyboard | Keyboard event handling |
| @capacitor/status-bar | Status bar customization |
| @capacitor/splash-screen | Launch screen management |
| @capacitor/app | App lifecycle events, back button |
| @capacitor/browser | In-app browser for external links |

## App Configuration

Edit `capacitor.config.ts` to change:
- `appId`: Your unique app identifier (reverse domain notation)
- `appName`: Display name of the app
- `server.url`: Backend server URL (for development)
- Plugin configurations (splash screen, status bar colors, etc.)

## Customizing App Icons and Splash Screens

### iOS
Place your icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Android
Place your icons in `android/app/src/main/res/mipmap-*/`

You can use a tool like [capacitor-assets](https://github.com/ionic-team/capacitor-assets) to generate all required sizes:

```bash
npx @capacitor/assets generate
```

## Troubleshooting

### iOS: "pod install" fails
Make sure CocoaPods is installed: `sudo gem install cocoapods`

### Android: Gradle sync fails
- Make sure Android Studio has the required SDK installed
- Try: File → Sync Project with Gradle Files

### App shows blank screen
- Check that `VITE_API_URL` is set correctly in `.env`
- Make sure the backend server is running and accessible
- Check browser console in Xcode/Android Studio for errors

### API calls fail on native
- The deployed backend needs CORS configured to allow requests from capacitor://localhost (iOS) and https://localhost (Android)
- Check that your Replit app is published and accessible
