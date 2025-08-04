<template>
  <div v-if="showBadge" :class="['offline-task-badge', badgeClass]">
    <ion-icon :icon="badgeIcon" class="badge-icon"></ion-icon>
    <span class="badge-text">{{ badgeText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import { 
  cloudOfflineOutline, 
  syncOutline, 
  warningOutline,
  addCircleOutline,
  createOutline,
  trashOutline
} from 'ionicons/icons';

interface Props {
  task: {
    isOffline?: boolean;
    needsSync?: boolean;
    action?: 'create' | 'update' | 'delete';
    id?: number;
    localId?: string;
  };
}

const props = defineProps<Props>();

// Computed properties
const showBadge = computed(() => {
  return props.task.isOffline || props.task.needsSync;
});

const badgeClass = computed(() => {
  if (props.task.action === 'delete') {
    return 'badge-delete';
  } else if (props.task.action === 'create') {
    return 'badge-create';
  } else if (props.task.action === 'update') {
    return 'badge-update';
  } else if (props.task.isOffline) {
    return 'badge-offline';
  }
  return 'badge-sync';
});

const badgeIcon = computed(() => {
  if (props.task.action === 'delete') {
    return trashOutline;
  } else if (props.task.action === 'create') {
    return addCircleOutline;
  } else if (props.task.action === 'update') {
    return createOutline;
  } else if (props.task.isOffline) {
    return cloudOfflineOutline;
  }
  return syncOutline;
});

const badgeText = computed(() => {
  if (props.task.action === 'delete') {
    return 'Delete pending';
  } else if (props.task.action === 'create') {
    return 'Created offline';
  } else if (props.task.action === 'update') {
    return 'Changes pending';
  } else if (props.task.isOffline) {
    return 'Offline';
  }
  return 'Sync pending';
});
</script>

<style scoped>
.offline-task-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sd-space-1);
  padding: 4px var(--sd-space-2);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-top: var(--sd-space-1);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}

.badge-icon {
  font-size: 0.875rem;
  flex-shrink: 0;
}

.badge-offline,
.badge-create {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15));
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
}

.badge-update,
.badge-sync {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.15));
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.1);
}

.badge-delete {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(248, 113, 113, 0.15));
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.1);
}

/* Hover effects */
.offline-task-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.badge-offline:hover,
.badge-create:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
  border-color: rgba(59, 130, 246, 0.4);
}

.badge-update:hover,
.badge-sync:hover {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.2));
  border-color: rgba(245, 158, 11, 0.4);
}

.badge-delete:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2));
  border-color: rgba(239, 68, 68, 0.4);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .badge-offline,
  .badge-create {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
    color: #93c5fd;
    border-color: rgba(59, 130, 246, 0.4);
  }

  .badge-update,
  .badge-sync {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.2));
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.4);
  }

  .badge-delete {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2));
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.4);
  }
}

/* Animation for new badges */
.offline-task-badge {
  animation: badgeSlideIn 0.3s ease-out;
}

@keyframes badgeSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .offline-task-badge {
    font-size: 0.7rem;
    padding: 3px 6px;
    gap: 2px;
  }

  .badge-icon {
    font-size: 0.8rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .offline-task-badge {
    border-width: 2px;
    font-weight: 700;
  }
  
  .badge-offline,
  .badge-create {
    background: #e0f2fe;
    color: #0d47a1;
    border-color: #1976d2;
  }

  .badge-update,
  .badge-sync {
    background: #fff3e0;
    color: #e65100;
    border-color: #f57c00;
  }

  .badge-delete {
    background: #ffebee;
    color: #b71c1c;
    border-color: #d32f2f;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .offline-task-badge {
    animation: none;
    transition: none;
  }
  
  .offline-task-badge:hover {
    transform: none;
  }
}

/* Print styles */
@media print {
  .offline-task-badge {
    background: white !important;
    color: black !important;
    border: 1px solid black !important;
    box-shadow: none !important;
  }
}
</style>