<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon aria-hidden="true" :icon="homeOutline" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon aria-hidden="true" :icon="listOutline" />
          <ion-label>Tasks</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon aria-hidden="true" :icon="personOutline" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { homeOutline, listOutline, personOutline } from 'ionicons/icons';
</script>

<style scoped>
ion-tab-bar {
  --background: var(--sd-surface-primary);
  --border: 1px solid var(--sd-border-light);
  --color: var(--sd-gray-500);
  --color-selected: var(--sd-orange);
  box-shadow: var(--sd-shadow-sm);
}

ion-tab-button {
  --color: var(--sd-gray-500);
  --color-selected: var(--sd-orange);
  --padding-top: var(--sd-space-3);
  --padding-bottom: var(--sd-space-2);
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease-in-out;
}

ion-tab-button:hover:not(.tab-selected) {
  --color: var(--sd-gray-700);
}

ion-tab-button.tab-selected {
  --color: var(--sd-orange);
  --background: rgba(240, 106, 106, 0.05);
}

ion-tab-button ion-icon {
  font-size: 22px;
  margin-bottom: var(--sd-space-1);
}

ion-tab-button ion-label {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
ion-tab-button.tab-selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 3px;
  background: var(--sd-orange);
  border-radius: 0 0 var(--sd-radius-xs) var(--sd-radius-xs);
}
@media (max-width: 480px) {
  ion-tab-button ion-icon {
    font-size: 20px;
  }
  
  ion-tab-button ion-label {
    font-size: 10px;
  }
}
</style>
