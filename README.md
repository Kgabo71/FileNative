# FileNative - Expo Camera Implementation

A React Native Expo app that allows users to capture photos of questions, automatically or manually crop the question area, and preview the cropped region. Built for iOS and Android.

## Features

- 📸 **Camera Capture**: Open device camera and capture photos
- 🎯 **Auto-Box Detection**: Toggle to automatically detect and box the question area (Brainly-style)
- ✏️ **Manual Crop Box**: Drag and resize the crop box manually (Gauth-style)
- 🖼️ **Image Preview**: Preview the cropped question with drag-to-pan and zoom controls
- ✨ **Smooth Animations**: Optimized animations using React Native Reanimated
- 📱 **One-handed UX**: Designed for easy one-handed use with clear affordances

## Prerequisites

- Node.js 18+ installed
- iOS Simulator (for Mac) or Android Emulator
- Expo CLI installed globally: `npm install -g expo-cli` (optional, can use npx)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Kgabo71/FileNative.git
cd FileNative
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Running Locally

### iOS Simulator

1. Press `i` in the terminal after running `npm run dev` to open iOS Simulator
2. Or manually open iOS Simulator and scan the QR code

### Android Emulator

1. Press `a` in the terminal after running `npm run dev` to open Android Emulator
2. Or manually open Android Emulator and scan the QR code

### Physical Device

1. Install Expo Go app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in the terminal

## Project Structure

```
FileNative/
├── app/
│   ├── _layout.tsx          # Root layout with navigation
│   ├── index.tsx            # Main camera screen
│   ├── preview.tsx          # Preview screen with cropped image
│   └── +not-found.tsx       # 404 screen
├── components/
│   ├── CropBox.tsx          # Draggable/resizable crop box component
│   └── SplashScreen.tsx     # Custom splash screen with SVG logo
├── hooks/
│   └── useFrameworkReady.ts # Framework ready hook
└── package.json
```

## How It Works

### Screen 1: Camera Capture
1. App opens directly to camera view
2. Toggle "Auto Box" to enable/disable automatic question detection
3. Position question in the guide frame
4. Tap capture button to take photo
5. If auto-box is enabled, a crop box is automatically positioned
6. If disabled, a default box appears that can be manually adjusted

### Screen 2: Crop Adjustment
1. After capture, photo is displayed with overlay
2. Drag the crop box by its center to move it
3. Drag corner handles to resize
4. Drag edge handles to resize in one dimension
5. Tap "Retake" to go back to camera
6. Tap "Confirm" to proceed to preview

### Screen 3: Preview
1. Displays the cropped question image
2. Drag to pan around the image
3. Use zoom buttons to zoom in/out
4. Tap "Retake" to go back to camera
5. Tap "Confirm" to finalize (currently shows success alert)

## Decisions and Tradeoffs

### Crop Overlay Implementation

**Decision**: Built a custom `CropBox` component using React Native's `PanResponder` and `react-native-reanimated` for smooth animations.

**Rationale**:
- Native gesture handling provides better performance than third-party libraries
- Reanimated ensures 60fps animations even on mid-range devices
- Custom implementation gives full control over UX and behavior

**Tradeoffs**:
- More code to maintain vs using a library like `react-native-image-crop-picker`
- Manual implementation of all edge cases (bounds checking, handle detection)
- Future: Could integrate ML model for better auto-detection

### Image Handling

**Decision**: Used `expo-image-manipulator` for cropping operations instead of canvas-based solutions.

**Rationale**:
- Native implementation is more performant
- Works seamlessly with Expo's asset system
- Handles image format conversion automatically

**Tradeoffs**:
- Less flexible than canvas-based solutions for complex transformations
- Requires image URI passing between screens
- Could be optimized to use base64 for smaller images

### Auto-Box Detection

**Decision**: Implemented a simplified heuristic-based detection (centers box in upper-middle area).

**Rationale**:
- Quick to implement and test the flow
- Demonstrates the toggle functionality
- Provides reasonable default positioning

**Tradeoffs**:
- Not ML-based like real apps (Brainly/Gauth use ML models)
- May not work well for all question layouts
- Future: Would integrate a proper ML model (TensorFlow Lite, Core ML, or cloud API)

### Animation Choices

**Decision**: Used `react-native-reanimated` with `withSpring` for natural motion.

**Rationale**:
- Springs feel more natural than linear animations
- Runs on UI thread for 60fps performance
- Provides haptic feedback for better UX

**Tradeoffs**:
- Requires additional dependency (already in project)
- Slightly more complex than Animated API
- Spring animations might feel slower on some devices (can be tuned)

### Performance Optimizations

1. **Image Compression**: Images are compressed to 0.8 quality to reduce memory usage
2. **Lazy Loading**: Image size is calculated asynchronously
3. **Gesture Optimization**: PanResponder uses `useNativeDriver` implicitly through Reanimated
4. **Memory Management**: Images are not kept in memory longer than needed

## Known Limitations

1. **Auto-Box Detection**: Currently uses a simple heuristic. A real implementation would use ML (TensorFlow Lite, Core ML, or cloud API like Google Vision)

2. **Image Size**: Large images may cause memory issues on older devices. Could be optimized by:
   - Resizing before cropping
   - Using progressive loading
   - Implementing image compression options

3. **Zoom in Preview**: Currently uses button-based zoom. Could add pinch-to-zoom with gesture handler

4. **No Persistence**: Captured images are not saved to device. Could add:
   - Local storage with AsyncStorage
   - Photo library integration
   - Cloud backup option

5. **Error Handling**: Basic error handling is in place, but could be more comprehensive with:
   - Retry mechanisms
   - Better error messages
   - Offline support

## What Would I Do Next?

With more time, I would:

1. **ML Integration**: 
   - Integrate TensorFlow Lite or Core ML for real question detection
   - Train/fine-tune model on question dataset
   - Add confidence scoring

2. **Enhanced UX**:
   - Add pinch-to-zoom in preview screen
   - Implement undo/redo for crop adjustments
   - Add visual feedback during auto-detection

3. **Performance**:
   - Implement image caching
   - Add progressive image loading
   - Optimize for low-end Android devices

4. **Features**:
   - Multiple photo capture
   - Image filters/processing
   - Share functionality
   - History of captured questions

5. **Testing**:
   - Unit tests for crop logic
   - Integration tests for camera flow
   - E2E tests with Detox

6. **Accessibility**:
   - VoiceOver/TalkBack support
   - High contrast mode
   - Larger touch targets

## Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for web (if needed)
npm run build:web
```

## Tech Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Camera**: expo-camera
- **Image Processing**: expo-image-manipulator
- **Animations**: react-native-reanimated
- **Gestures**: react-native-gesture-handler
- **Icons**: @expo/vector-icons
- **Haptics**: expo-haptics

## License

This project is part of a coding assessment.

## Steps to Create the GitHub Repository

### 1. Create the repository on GitHub

1. Go to [github.com](https://github.com) and sign in as **Kgabo71**
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `FileNative`
4. Description: `A React Native Expo app for capturing and cropping question photos`
5. Choose **Public** or **Private**
6. Do not check "Add a README file", "Add .gitignore", or "Choose a license" (you already have these)
7. Click **"Create repository"**

### 2. Initialize Git and push to GitHub

Open your terminal in the project directory and run:

```bash
# Initialize git repository (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: FileNative - Question Capture App with Expo Camera"

# Add the remote repository
git remote add origin https://github.com/Kgabo71/FileNative.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 3. If you need to authenticate

If prompted for authentication:
- Use a Personal Access Token (PAT) instead of a password
- Or use GitHub CLI: `gh auth login`

### 4. Verify

After pushing, visit: `https://github.com/Kgabo71/FileNative`

Your repository should be live with all your code, README, and project files.


