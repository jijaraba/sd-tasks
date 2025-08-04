<template>
  <ion-page>
    <ion-content class="register-content">
      <div class="register-container">
        <div class="header-section">
          <ion-icon :icon="checkboxOutline" class="logo"></ion-icon>
          <h1>Create Account</h1>
          <p>Join SD Tasks to organize your life</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <ion-item class="form-item">
            <ion-label position="stacked">Full Name</ion-label>
            <ion-input
              v-model="name"
              type="text"
              placeholder="Enter your full name"
              required
              :disabled="loading"
            ></ion-input>
          </ion-item>

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

          <ion-item class="form-item">
            <ion-label position="stacked">Confirm Password</ion-label>
            <ion-input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <div v-if="password && confirmPassword && password !== confirmPassword" class="error-message">
            Passwords do not match
          </div>

          <ion-button
            expand="block"
            type="submit"
            class="register-button"
            :disabled="loading || !isFormValid"
          >
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Create Account</span>
          </ion-button>
        </form>

        <div class="footer-section">
          <p>
            Already have an account?
            <ion-button
              fill="clear"
              size="small"
              @click="goToLogin"
              :disabled="loading"
            >
              Sign In
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { setAuthToken, setUserData } from '@/utils/auth';
import { envUtils } from '@/config/env';

const router = useRouter();

// Form data
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const isFormValid = computed(() => {
  return (
    name.value.trim() !== '' &&
    email.value.trim() !== '' &&
    password.value.length >= 6 &&
    password.value === confirmPassword.value
  );
});

const handleRegister = async () => {
  if (!isFormValid.value) {
    const toast = await toastController.create({
      message: 'Please fill all fields correctly',
      duration: 3000,
      color: 'warning',
      position: 'top',
    });
    await toast.present();
    return;
  }

  loading.value = true;
  
  try {
    const response = await fetch(envUtils.getApiUrl('/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
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
        message: 'Account created successfully!',
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
        message: data.error || 'Registration failed',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  } catch (error) {
    console.error('Registration error:', error);
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

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-content {
  --background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.register-container {
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

.register-form {
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

.error-message {
  color: var(--ion-color-danger);
  font-size: 14px;
  margin-top: -10px;
  margin-bottom: 10px;
  padding-left: 16px;
}

.register-button {
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
  .register-container {
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