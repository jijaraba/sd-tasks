<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout" fill="clear">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Profile</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="profile-container">
        <div class="profile-card">
          <div class="avatar-section">
            <ion-icon :icon="personCircleOutline" class="avatar-icon"></ion-icon>
            <h2 class="text-heading-3">{{ userName }}</h2>
            <p class="text-body user-email">{{ userEmail }}</p>
          </div>

          <div class="profile-info">
            <ion-card>
              <ion-card-content>
                <h3>Account Information</h3>
                <div class="info-item">
                  <span class="label">Name:</span>
                  <span class="value">{{ userName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Email:</span>
                  <span class="value">{{ userEmail }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Member since:</span>
                  <span class="value">{{ formatDate(new Date()) }}</span>
                </div>
              </ion-card-content>
            </ion-card>

            <ion-card>
              <ion-card-content>
                <h3>Quick Actions</h3>
                <ion-button expand="block" fill="outline" class="action-button">
                  <ion-icon :icon="settingsOutline" slot="start"></ion-icon>
                  Settings
                </ion-button>
                <ion-button expand="block" fill="outline" class="action-button" @click="handleLogout">
                  <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
                  Sign Out
                </ion-button>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent
} from '@ionic/vue';
import {
  personCircleOutline,
  settingsOutline,
  logOutOutline
} from 'ionicons/icons';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserData, logout } from '@/utils/auth';

const router = useRouter();
const user = getUserData();

const userName = computed(() => user?.name || 'User');
const userEmail = computed(() => user?.email || 'user@example.com');

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const handleLogout = () => {
  logout();
  router.replace('/login');
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
}

.avatar-icon {
  font-size: 120px;
  color: var(--ion-color-primary);
  margin-bottom: 16px;
}

.user-email {
  color: var(--ion-color-medium);
  margin: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-info ion-card {
  margin: 0;
}

.profile-info h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--ion-color-dark);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-color-light);
  font-family: 'Inter', sans-serif;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: var(--ion-color-medium);
}

.value {
  font-weight: 400;
  color: var(--ion-color-dark);
}

.action-button {
  margin-bottom: 12px;
  --border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.action-button:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 16px;
  }
  
  .avatar-icon {
    font-size: 100px;
  }
}
</style>
