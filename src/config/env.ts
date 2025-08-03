interface EnvironmentConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  APP_NAME: string;
  APP_VERSION: string;
  APP_DESCRIPTION: string;
  AUTH_TOKEN_KEY: string;
  AUTH_USER_KEY: string;
  DEV_MODE: boolean;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_OFFLINE_MODE: boolean;
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  ENABLE_ANALYTICS: boolean;
  DEFAULT_THEME: 'light' | 'dark';
  ENABLE_DARK_MODE: boolean;
  DEFAULT_LANGUAGE: string;
  STORAGE_PREFIX: string;
  CACHE_DURATION: number;
  RETRY_ATTEMPTS: number;
  RETRY_DELAY: number;
}
function getEnvVar(key: string, defaultValue: any = undefined, type: 'string' | 'number' | 'boolean' = 'string'): any {
  const value = import.meta.env[key];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    console.warn(`Environment variable ${key} is not defined`);
    return undefined;
  }

  switch (type) {
    case 'number':
      const numValue = Number(value);
      return isNaN(numValue) ? defaultValue : numValue;
    case 'boolean':
      return value === 'true' || value === '1';
    default:
      return value;
  }
}
export const env: EnvironmentConfig = {
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000/api'),
  API_TIMEOUT: getEnvVar('VITE_API_TIMEOUT', 10000, 'number'),
  APP_NAME: getEnvVar('VITE_APP_NAME', 'SD Tasks'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  APP_DESCRIPTION: getEnvVar('VITE_APP_DESCRIPTION', 'Task Management Application'),
  AUTH_TOKEN_KEY: getEnvVar('VITE_AUTH_TOKEN_KEY', 'token'),
  AUTH_USER_KEY: getEnvVar('VITE_AUTH_USER_KEY', 'user'),
  DEV_MODE: getEnvVar('VITE_DEV_MODE', true, 'boolean'),
  DEBUG_MODE: getEnvVar('VITE_DEBUG_MODE', false, 'boolean'),
  LOG_LEVEL: getEnvVar('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
  ENABLE_OFFLINE_MODE: getEnvVar('VITE_ENABLE_OFFLINE_MODE', true, 'boolean'),
  ENABLE_PUSH_NOTIFICATIONS: getEnvVar('VITE_ENABLE_PUSH_NOTIFICATIONS', false, 'boolean'),
  ENABLE_ANALYTICS: getEnvVar('VITE_ENABLE_ANALYTICS', false, 'boolean'),
  DEFAULT_THEME: getEnvVar('VITE_DEFAULT_THEME', 'light') as 'light' | 'dark',
  ENABLE_DARK_MODE: getEnvVar('VITE_ENABLE_DARK_MODE', false, 'boolean'),
  DEFAULT_LANGUAGE: getEnvVar('VITE_DEFAULT_LANGUAGE', 'en'),
  STORAGE_PREFIX: getEnvVar('VITE_STORAGE_PREFIX', 'sd_tasks_'),
  CACHE_DURATION: getEnvVar('VITE_CACHE_DURATION', 3600000, 'number'),
  RETRY_ATTEMPTS: getEnvVar('VITE_RETRY_ATTEMPTS', 3, 'number'),
  RETRY_DELAY: getEnvVar('VITE_RETRY_DELAY', 1000, 'number'),
};
export const envUtils = {
  isDevelopment: () => env.DEV_MODE,
  isProduction: () => !env.DEV_MODE,
  isDebugEnabled: () => env.DEBUG_MODE,
  
  log: (level: string, message: string, ...args: any[]) => {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(env.LOG_LEVEL);
    const messageLevelIndex = levels.indexOf(level);
    
    if (messageLevelIndex >= currentLevelIndex) {
      switch (level) {
        case 'debug':
          console.debug(`[${env.APP_NAME}] ${message}`, ...args);
          break;
        case 'info':
          console.info(`[${env.APP_NAME}] ${message}`, ...args);
          break;
        case 'warn':
          console.warn(`[${env.APP_NAME}] ${message}`, ...args);
          break;
        case 'error':
          console.error(`[${env.APP_NAME}] ${message}`, ...args);
          break;
        default:
          console.log(`[${env.APP_NAME}] ${message}`, ...args);
      }
    }
  },
  
  getStorageKey: (key: string) => `${env.STORAGE_PREFIX}${key}`,
  
  getApiUrl: (endpoint: string) => `${env.API_BASE_URL}${endpoint}`,
};
export const validateEnvironment = (): boolean => {
  const requiredVars = [
    'API_BASE_URL',
    'APP_NAME',
    'APP_VERSION'
  ];

  const missing = requiredVars.filter(key => !env[key as keyof EnvironmentConfig]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  envUtils.log('info', 'Environment configuration loaded successfully', {
    mode: env.DEV_MODE ? 'development' : 'production',
    apiUrl: env.API_BASE_URL,
    version: env.APP_VERSION
  });
  
  return true;
};

export default env;