<template>
  <ion-page>
    <ion-content class="login-content">
      <div class="login-container">
        <div class="header-section">
          <ion-icon :icon="checkboxOutline" class="logo"></ion-icon>
          <h1>Welcome Back</h1>
          <p>Sign in to continue to SD Tasks</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <ion-item class="form-item">
            <ion-label position="stacked">Email</ion-label>
            <ion-input
              v-model="email"
              type="email"
              placeholder="Enter your email"
              required
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <ion-item class="form-item">
            <ion-label position="stacked">Password</ion-label>
            <ion-input
              v-model="password"
              type="password"
              placeholder="Enter your password"
              required
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <ion-button
            expand="block"
            type="submit"
            class="login-button"
            :disabled="loading || !email || !password"
          >
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Sign In</span>
          </ion-button>
        </form>

        <div class="footer-section">
          <p>
            Don't have an account?
            <ion-button
              fill="clear"
              size="small"
              @click="goToRegister"
              :disabled="loading"
            >
              Sign Up
            </ion-button>
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  toastController,
} from '@ionic/vue';
import { checkboxOutline } from 'ionicons/icons';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { setAuthToken, setUserData } from '@/utils/auth';

const router = useRouter();

// Form data
const email = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store the token and user data
      setAuthToken(data.token);
      setUserData(data.user);
      
      // Show success message
      const toast = await toastController.create({
        message: 'Login successful!',
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      // Navigate to main app
      router.replace('/tabs/tab1');
    } else {
      // Show error message
      const toast = await toastController.create({
        message: data.error || 'Login failed',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  } catch (error) {
    console.error('Login error:', error);
    const toast = await toastController.create({
      message: 'Network error. Please try again.',
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
.login-content {
  --background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  font-size: 60px;
  color: var(--ion-color-primary);
  margin-bottom: 20px;
}

.header-section h1 {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: var(--ion-color-dark);
}

.header-section p {
  color: var(--ion-color-medium);
  margin: 0;
  font-size: 16px;
}

.login-form {
  margin-bottom: 30px;
}

.form-item {
  margin-bottom: 20px;
  --border-radius: 12px;
  --inner-padding-end: 16px;
  --inner-padding-start: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
}

.login-button {
  margin-top: 20px;
  --border-radius: 12px;
  height: 48px;
  font-weight: 600;
}

.footer-section {
  text-align: center;
}

.footer-section p {
  color: var(--ion-color-medium);
  margin: 0;
}

.footer-section ion-button {
  --color: var(--ion-color-primary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .login-container {
    padding: 16px;
  }
  
  .header-section h1 {
    font-size: 24px;
  }
  
  .logo {
    font-size: 50px;
  }
}
</style>