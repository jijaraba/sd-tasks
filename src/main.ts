import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { validateEnvironment, env, envUtils } from './config/env';
import { initializeOfflineServices } from './services/offlineServices';

import { IonicVue } from '@ionic/vue';
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';
import './theme/variables.css';
if (!validateEnvironment()) {
  throw new Error('Environment configuration validation failed');
}

envUtils.log('info', `Starting ${env.APP_NAME} v${env.APP_VERSION}`);

const app = createApp(App)
  .use(IonicVue)
  .use(router);

// Initialize offline services and mount app
Promise.all([
  router.isReady(),
  initializeOfflineServices()
]).then(() => {
  app.mount('#app');
  envUtils.log('info', 'Application mounted successfully with offline capabilities');
}).catch(error => {
  console.error('Failed to initialize application:', error);
  // Mount app anyway but with limited functionality
  router.isReady().then(() => {
    app.mount('#app');
    envUtils.log('warn', 'Application mounted with limited offline capabilities');
  });
});
