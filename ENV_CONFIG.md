# SD Tasks - Environment Configuration Guide

## 📋 Overview

This guide explains how to configure environment variables for the SD Tasks Ionic application across different deployment environments.

## 🌍 Environment Files

The application supports multiple environment configurations:

- **`.env`** - Default development environment
- **`.env.production`** - Production environment
- **`.env.staging`** - Staging environment
- **`.env.local`** - Local overrides (not tracked in git)

## 📝 Environment Variables

### 🔌 API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` | ✅ |
| `VITE_API_TIMEOUT` | Request timeout in milliseconds | `10000` | ❌ |

### 📱 Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_APP_NAME` | Application display name | `SD Tasks` | ✅ |
| `VITE_APP_VERSION` | Application version | `1.0.0` | ✅ |
| `VITE_APP_DESCRIPTION` | Application description | `Task Management Application` | ❌ |

### 🔐 Authentication Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_AUTH_TOKEN_KEY` | Local storage key for auth token | `sd_tasks_token` | ❌ |
| `VITE_AUTH_USER_KEY` | Local storage key for user data | `sd_tasks_user` | ❌ |

### 🛠️ Development Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_DEV_MODE` | Enable development mode | `true` | ❌ |
| `VITE_DEBUG_MODE` | Enable debug logging | `true` | ❌ |
| `VITE_LOG_LEVEL` | Logging level (`debug`, `info`, `warn`, `error`) | `debug` | ❌ |

### 🎛️ Feature Flags

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ENABLE_OFFLINE_MODE` | Enable offline functionality | `true` | ❌ |
| `VITE_ENABLE_PUSH_NOTIFICATIONS` | Enable push notifications | `false` | ❌ |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `false` | ❌ |

### 🎨 UI Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_DEFAULT_THEME` | Default theme (`light`, `dark`) | `light` | ❌ |
| `VITE_ENABLE_DARK_MODE` | Enable dark mode toggle | `false` | ❌ |
| `VITE_DEFAULT_LANGUAGE` | Default language code | `en` | ❌ |

### 💾 Storage Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_STORAGE_PREFIX` | Local storage key prefix | `sd_tasks_` | ❌ |
| `VITE_CACHE_DURATION` | Cache duration in milliseconds | `3600000` | ❌ |

### 🌐 Network Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_RETRY_ATTEMPTS` | Number of retry attempts for failed requests | `3` | ❌ |
| `VITE_RETRY_DELAY` | Delay between retries in milliseconds | `1000` | ❌ |

## 🚀 Usage Examples

### Development Environment

```bash
# .env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Production Environment

```bash
# .env.production
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_ENABLE_ANALYTICS=true
```

### Staging Environment

```bash
# .env.staging
VITE_API_BASE_URL=https://staging-api.your-domain.com/api
VITE_APP_NAME=SD Tasks (Staging)
VITE_DEV_MODE=false
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=warn
```

## 🔧 Configuration in Code

### Accessing Environment Variables

```typescript
import { env, envUtils } from '@/config/env';

// Get API URL
const apiUrl = env.API_BASE_URL;

// Check if development mode
if (env.DEV_MODE) {
  console.log('Running in development mode');
}

// Use utility functions
const fullApiUrl = envUtils.getApiUrl('/tasks');
const storageKey = envUtils.getStorageKey('user_preferences');
```

### Environment-Specific Logging

```typescript
import { envUtils } from '@/config/env';

// Logs will only appear based on LOG_LEVEL setting
envUtils.log('debug', 'Debug message');
envUtils.log('info', 'Info message');
envUtils.log('warn', 'Warning message');
envUtils.log('error', 'Error message');
```

### Conditional Features

```typescript
import { env } from '@/config/env';

// Show analytics only if enabled
if (env.ENABLE_ANALYTICS) {
  // Initialize analytics
}

// Enable offline mode
if (env.ENABLE_OFFLINE_MODE) {
  // Setup service worker
}
```

## 🏗️ Build Commands

### Development Build
```bash
npm run dev
# Uses .env file
```

### Production Build
```bash
npm run build
# Uses .env.production file
```

### Custom Environment Build
```bash
npm run build --mode staging
# Uses .env.staging file
```

## 🔒 Security Considerations

### ⚠️ Important Notes

1. **Client-Side Exposure**: All `VITE_*` variables are exposed to the client-side code
2. **No Secrets**: Never store sensitive data (API keys, secrets) in these files
3. **Git Ignore**: Add `.env.local` to `.gitignore` for local-only configurations

### ✅ Safe to Include

- API endpoints (public URLs)
- Feature flags
- UI configuration
- Application metadata

### ❌ Never Include

- API keys or secrets
- Database credentials
- Private tokens
- Sensitive configuration

## 🔄 Environment Switching

### Local Development

```bash
# Copy example environment
cp .env .env.local

# Edit local configuration
vim .env.local

# Local file takes precedence
npm run dev
```

### CI/CD Pipeline

```bash
# Set environment variables in CI/CD
export VITE_API_BASE_URL=https://api.production.com/api
export VITE_ENABLE_ANALYTICS=true

# Build with environment variables
npm run build
```

## 🧪 Testing Environment Variables

```typescript
// src/config/env.test.ts
import { env, validateEnvironment } from './env';

describe('Environment Configuration', () => {
  test('should load required variables', () => {
    expect(env.API_BASE_URL).toBeDefined();
    expect(env.APP_NAME).toBeDefined();
  });

  test('should validate environment', () => {
    expect(validateEnvironment()).toBe(true);
  });
});
```

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Ionic Environment Configuration](https://ionicframework.com/docs/react/config)
- [Vue.js Environment Variables](https://cli.vuejs.org/guide/mode-and-env.html)

## 🐛 Troubleshooting

### Environment Variable Not Loading

1. Check variable name starts with `VITE_`
2. Restart development server after changes
3. Verify file is in project root
4. Check for syntax errors in .env file

### API Connection Issues

1. Verify `VITE_API_BASE_URL` is correct
2. Check network connectivity
3. Ensure backend is running
4. Review CORS configuration

### Build Issues

1. Check all required variables are set
2. Verify environment file exists
3. Run `npm run build --verbose` for details
4. Clear node_modules and reinstall if needed