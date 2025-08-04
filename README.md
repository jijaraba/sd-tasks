# SD Tasks - Task Management Application

A modern task management application built with Ionic Vue and featuring an Asana-inspired design system.

## 📱 Overview

SD Tasks is a full-featured task management application that provides:
- User authentication with JWT
- Complete task CRUD operations
- Real-time task statistics and dashboard
- Asana-inspired professional design
- Cross-platform mobile support
- Offline capabilities

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Android Studio** (for Android builds)
- **Java 17** (for Android builds)

### Installation

1. **Clone the repository and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd sd-tasks
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your backend API URL
   # VITE_API_BASE_URL=http://localhost:3000/api
   ```

4. **Configure environment for your target platform:**

   **For Web Development:**
   ```bash
   ./switch-env.sh web
   ```

   **For Android Emulator:**
   ```bash
   ./switch-env.sh android
   ```

   **Manual Configuration:**
   - Web: `VITE_API_BASE_URL=http://localhost:3000/api`
   - Android: `VITE_API_BASE_URL=http://10.0.2.2:3000/api`

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   ```
   http://localhost:5173
   ```

## ⚙️ Environment Configuration

The Ionic project automatically uses the API URL from the `.env` file. The API service is configured to read from `VITE_API_BASE_URL`.

### Environment Switcher Script

Use the included script to easily switch between development environments:

```bash
# Check current configuration
./switch-env.sh

# Switch to web development (localhost)
./switch-env.sh web

# Switch to Android emulator (10.0.2.2)
./switch-env.sh android
```

### Manual Configuration

Edit the `.env` file directly:

```bash
# For web development
VITE_API_BASE_URL=http://localhost:3000/api

# For Android emulator  
VITE_API_BASE_URL=http://10.0.2.2:3000/api

# For production
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### How It Works

1. **Environment Loading**: Vite loads variables from `.env` file
2. **API Service**: Uses `env.API_BASE_URL` from environment config  
3. **URL Construction**: `envUtils.getApiUrl(endpoint)` builds full URLs
4. **Automatic**: No code changes needed, just update `.env` file

## 🛠️ Minimum Steps to Run Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Application
Open `http://localhost:5173` in your browser

## 📱 Android Build Instructions

### Prerequisites for Android

1. **Install Android Studio**
   - Download from [Android Studio](https://developer.android.com/studio)
   - Install Android SDK and build tools

2. **Install Java 17**
   ```bash
   # On macOS with Homebrew
   brew install openjdk@17
   
   # Set JAVA_HOME
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
   ```

### Android Build Steps

#### Method 1: Automated Script (Recommended)
```bash
# 1. Build the web application
npm run build

# 2. Add Android platform (first time only)
npx cap add android

# 3. Sync with Android platform
npx cap sync android

# 4. Build APK using Gradle
cd android
./gradlew assembleDebug

# 5. Find your APK at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Method 2: Using Android Studio
```bash
# 1. Build the web application
npm run build

# 2. Sync with Android platform
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. In Android Studio:
# - Build → Build Bundle(s) / APK(s) → Build APK(s)
```

#### Method 3: One-Command Build
```bash
# Complete build and sync
ionic capacitor build android
```

### APK Location
After successful build, your APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📋 Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Environment-Specific Builds
```bash
npm run build:staging    # Build for staging
npm run build:production # Build for production
```

### Testing
```bash
npm run test:unit        # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run lint             # Run ESLint
```

### Environment Management
```bash
npm run env:check        # Check environment variables
npm run env:validate     # Validate environment configuration
```

### Capacitor Commands
```bash
npx cap add android      # Add Android platform
npx cap sync android     # Sync web assets to Android
npx cap open android     # Open in Android Studio
npx cap run android      # Build and run on device
```

## 🌍 Environment Configuration

The application supports multiple environments:

### Development (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true
```

### Production (`.env.production`)
```env
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
```

### Staging (`.env.staging`)
```env
VITE_API_BASE_URL=https://staging-api.your-domain.com/api
VITE_DEV_MODE=false
VITE_DEBUG_MODE=true
```

## 🏗️ Project Structure

```
sd-tasks/
├── src/
│   ├── components/          # Reusable Vue components
│   ├── views/              # Page components
│   │   ├── SplashScreen.vue # Splash screen (2s)
│   │   ├── LoginPage.vue    # User login
│   │   ├── RegisterPage.vue # User registration
│   │   ├── Tab1Page.vue     # Home dashboard
│   │   ├── Tab2Page.vue     # Tasks management
│   │   ├── Tab3Page.vue     # User profile
│   │   └── TabsPage.vue     # Main tab navigation
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   ├── theme/              # Asana-inspired theme
│   └── router/             # Vue Router configuration
├── android/                # Generated Android project
├── public/                 # Static assets
├── tests/                  # Test files
├── .env.example           # Environment template
└── capacitor.config.ts    # Capacitor configuration
```

## 🎨 Features

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes and API endpoints
- Automatic token management

### Task Management
- Create, read, update, delete tasks
- Task prioritization (low, medium, high)
- Status tracking (pending, in progress, completed, cancelled)
- Due date management
- Search and filtering capabilities

### Dashboard
- Real-time task statistics
- Recent tasks overview
- Status breakdown charts
- Quick action buttons

### Design
- Asana-inspired color palette and typography
- Inter font family
- Responsive mobile-first design
- Professional card-based layouts
- Consistent spacing and shadows

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Clear Capacitor cache
npx cap sync android --force
```

#### Android Build Issues
```bash
# Check Java version
java -version

# Clean Gradle cache
cd android
./gradlew clean

# Rebuild
./gradlew assembleDebug
```

#### Environment Issues
```bash
# Validate environment
npm run env:validate

# Check environment variables
npm run env:check
```

### Java Version Issues
If you encounter Java compatibility issues:

```bash
# Install Java 17
brew install openjdk@17

# Set JAVA_HOME for current session
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

# Add to your shell profile for permanent setting
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home' >> ~/.zshrc
```

## 📱 Device Testing

### Android Device/Emulator
```bash
# Run on connected device
npx cap run android

# Run on specific device
npx cap run android --target=device_id
```

### Browser Testing
```bash
# Test in browser with device simulation
npm run dev
# Open browser dev tools and enable device simulation
```

## 🚀 Deployment

### Web Deployment
```bash
# Build for production
npm run build:production

# Deploy the dist/ folder to your web server
```

### Android App Store
1. Generate signed APK in Android Studio
2. Follow Google Play Store guidelines
3. Upload APK/AAB to Play Console

## 📚 Documentation

- [Environment Configuration Guide](./ENV_CONFIG.md)
- [Ionic Framework Documentation](https://ionicframework.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Vue.js Documentation](https://vuejs.org/guide/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your environment configuration
3. Ensure all prerequisites are installed
4. Check the browser console for errors
5. Review the Ionic/Capacitor documentation

## 📞 Contact

For questions or support, please contact the development team.