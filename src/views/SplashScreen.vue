<template>
  <ion-page>
    <ion-content class="splash-content">
      <div class="splash-container">
        <div class="logo-container">
          <ion-icon 
            :icon="checkboxOutline" 
            class="logo-icon"
          ></ion-icon>
          <h1 class="app-title">SD Tasks</h1>
          <p class="app-subtitle">Organize your life</p>
        </div>
        
        <div class="loading-container">
          <ion-spinner name="crescent" class="loading-spinner"></ion-spinner>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, 
  IonContent, 
  IonIcon, 
  IonSpinner 
} from '@ionic/vue';
import { checkboxOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const router = useRouter();

onMounted(() => {
  // Navigate to login after 2 seconds
  setTimeout(() => {
    router.replace('/login');
  }, 2000);
});
</script>

<style scoped>
.splash-content {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: white;
}

.logo-container {
  margin-bottom: 60px;
}

.logo-icon {
  font-size: 80px;
  color: white;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

.app-title {
  font-size: 48px;
  font-weight: bold;
  margin: 0;
  margin-bottom: 10px;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.app-subtitle {
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
  font-weight: 300;
}

.loading-container {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
}

.loading-spinner {
  --color: white;
  width: 32px;
  height: 32px;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@media (max-width: 768px) {
  .app-title {
    font-size: 36px;
  }
  
  .logo-icon {
    font-size: 60px;
  }
}
</style>