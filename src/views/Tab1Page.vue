<template>
  <ion-page>
    <ion-header class="sd-header">
      <ion-toolbar class="sd-toolbar">
        <ion-title class="sd-header-title">Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout" fill="clear" class="sd-header-button">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Dashboard</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- SD Welcome Section -->
      <div class="sd-welcome-section">
        <div class="sd-welcome-content">
          <h2 class="sd-heading-2">Good {{ getTimeOfDay() }}, {{ userName }}!</h2>
          <p class="sd-body">Six Degrees IT Solutions</p>
        </div>
        <div class="sd-date-info">
          <span class="sd-caption">{{ getCurrentDate() }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading your stats...</p>
      </div>

      <!-- Error State -->
      <ion-card v-if="error && !loading" color="danger" class="error-card">
        <ion-card-content>
          <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
          <p>{{ error }}</p>
          <ion-button @click="loadDashboardData" fill="clear" color="light">
            <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
            Retry
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- SD Stats Section -->
      <div v-if="!loading && !error" class="sd-stats-container">
        
        <!-- Key Metrics -->
        <div class="sd-metrics-grid">
          <div class="sd-metric-card primary">
            <div class="sd-metric-header">
              <div class="sd-metric-icon-container primary">
                <ion-icon :icon="listOutline" class="sd-metric-icon"></ion-icon>
              </div>
              <div class="sd-metric-info">
                <div class="sd-metric-label">Total Tasks</div>
                <div class="sd-metric-number">{{ stats.total || 0 }}</div>
              </div>
            </div>
          </div>

          <div class="sd-metric-card success">
            <div class="sd-metric-header">
              <div class="sd-metric-icon-container success">
                <ion-icon :icon="checkmarkCircleOutline" class="sd-metric-icon"></ion-icon>
              </div>
              <div class="sd-metric-info">
                <div class="sd-metric-label">Completed</div>
                <div class="sd-metric-number">{{ stats.completed || 0 }}</div>
                <div class="sd-metric-subtitle">
                  {{ completionPercentage }}% completion rate
                </div>
              </div>
            </div>
          </div>

          <div class="sd-metric-card warning">
            <div class="sd-metric-header">
              <div class="sd-metric-icon-container warning">
                <ion-icon :icon="timeOutline" class="sd-metric-icon"></ion-icon>
              </div>
              <div class="sd-metric-info">
                <div class="sd-metric-label">Pending</div>
                <div class="sd-metric-number">{{ stats.pending || 0 }}</div>
              </div>
            </div>
          </div>

          <div class="sd-metric-card progress">
            <div class="sd-metric-header">
              <div class="sd-metric-icon-container progress">
                <ion-icon :icon="playCircleOutline" class="sd-metric-icon"></ion-icon>
              </div>
              <div class="sd-metric-info">
                <div class="sd-metric-label">In Progress</div>
                <div class="sd-metric-number">{{ getStatusCount('in_progress') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Breakdown -->
        <ion-card class="breakdown-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="pieChartOutline"></ion-icon>
              Task Status Breakdown
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="status-breakdown">
              <div v-for="status in statusBreakdown" :key="status.status" class="status-item">
                <div class="status-info">
                  <div class="status-label">
                    <div :class="`status-dot ${status.status}`"></div>
                    {{ formatStatusLabel(status.status) }}
                  </div>
                  <div class="status-count">{{ status.count }}</div>
                </div>
                <div class="status-bar">
                  <div 
                    class="status-progress" 
                    :class="status.status"
                    :style="{ width: `${getStatusPercentage(status.count)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Quick Actions -->
        <ion-card class="actions-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="flashOutline"></ion-icon>
              Quick Actions
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="actions-grid">
              <ion-button 
                expand="block" 
                fill="outline" 
                @click="goToCreateTask"
                class="action-button"
              >
                <ion-icon :icon="addOutline" slot="start"></ion-icon>
                Create New Task
              </ion-button>
              
              <ion-button 
                expand="block" 
                fill="outline" 
                @click="goToAllTasks"
                class="action-button"
              >
                <ion-icon :icon="listOutline" slot="start"></ion-icon>
                View All Tasks
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Recent Activity -->
        <ion-card v-if="recentTasks.length > 0" class="recent-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="timeOutline"></ion-icon>
              Recent Tasks
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="recent-tasks">
              <div 
                v-for="task in recentTasks.slice(0, 5)" 
                :key="task.id" 
                class="recent-task-item"
                @click="goToTaskDetail(task.id)"
              >
                <div class="task-info">
                  <h4>{{ task.title }}</h4>
                  <p v-if="task.description">{{ truncateText(task.description, 50) }}</p>
                  <div class="task-meta">
                    <ion-chip :color="getPriorityColor(task.priority)" size="small">
                      {{ task.priority }}
                    </ion-chip>
                    <ion-chip :color="getStatusColor(task.status)" size="small">
                      {{ formatStatusLabel(task.status) }}
                    </ion-chip>
                  </div>
                </div>
                <ion-icon :icon="chevronForwardOutline" class="arrow-icon"></ion-icon>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Refresh Button -->
        <div class="refresh-section">
          <ion-button 
            @click="loadDashboardData" 
            fill="clear" 
            :disabled="loading"
          >
            <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
            Refresh Data
          </ion-button>
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonChip,
  toastController,
} from '@ionic/vue';
import {
  listOutline,
  checkmarkCircleOutline,
  timeOutline,
  playCircleOutline,
  pieChartOutline,
  flashOutline,
  addOutline,
  chevronForwardOutline,
  refreshOutline,
  logOutOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { apiService } from '@/services/api';
import { getUserData, logout } from '@/utils/auth';

const router = useRouter();

// Reactive data
const loading = ref(true);
const error = ref('');
const stats = ref<any>({});
const recentTasks = ref<any[]>([]);

// User info
const user = getUserData();
const userName = computed(() => user?.name || 'User');

// Computed properties
const statusBreakdown = computed(() => {
  if (!stats.value.byStatus) return [];
  return stats.value.byStatus.map((item: any) => ({
    status: item.status,
    count: parseInt(item.count)
  }));
});

const completionPercentage = computed(() => {
  if (!stats.value.total || stats.value.total === 0) return 0;
  return Math.round((stats.value.completed / stats.value.total) * 100);
});

// Methods
const getStatusCount = (status: string) => {
  const statusItem = statusBreakdown.value.find((item: any) => item.status === status);
  return statusItem ? statusItem.count : 0;
};

const getStatusPercentage = (count: number) => {
  if (!stats.value.total || stats.value.total === 0) return 0;
  return (count / stats.value.total) * 100;
};

const formatStatusLabel = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'danger';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'medium';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'primary';
    case 'pending': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'medium';
  }
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const loadDashboardData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Load stats and recent tasks in parallel
    const [statsResponse, tasksResponse] = await Promise.all([
      apiService.getTaskStats(),
      apiService.getTasks()
    ]);

    if (statsResponse.success) {
      stats.value = (statsResponse.data as any).stats;
    } else {
      throw new Error(statsResponse.error || 'Failed to load stats');
    }

    if (tasksResponse.success) {
      recentTasks.value = (tasksResponse.data as any).tasks || [];
    } else {
      // Stats loaded successfully, but tasks failed - show warning
      const toast = await toastController.create({
        message: 'Could not load recent tasks',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load dashboard data';
    console.error('Dashboard error:', err);
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  logout();
  router.replace('/login');
};

const goToCreateTask = () => {
  router.push('/tabs/tab2');
};

const goToAllTasks = () => {
  router.push('/tabs/tab2');
};

const goToTaskDetail = (taskId: number) => {
  // Navigate to task detail - implement when task detail page is created
  console.log('Navigate to task:', taskId);
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Lifecycle
onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.sd-header {
  box-shadow: var(--sd-shadow-sm);
}

.sd-toolbar {
  --background: var(--sd-surface-primary);
  --border-color: var(--sd-border-light);
  --color: var(--sd-gray-900);
}

.sd-header-title {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: var(--sd-gray-900);
}

.sd-header-button {
  --color: var(--sd-gray-600);
  --border-radius: var(--sd-radius-md);
  --padding-start: var(--sd-space-2);
  --padding-end: var(--sd-space-2);
}

.sd-header-button:hover {
  --background: var(--sd-gray-100);
  --color: var(--sd-gray-700);
}

.sd-welcome-section {
  background: var(--sd-surface-primary);
  border-bottom: 1px solid var(--sd-border-light);
  padding: var(--sd-space-8) var(--sd-space-4) var(--sd-space-6);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.sd-welcome-content h2 {
  margin: 0 0 var(--sd-space-2) 0;
  color: var(--sd-gray-900);
}

.sd-welcome-content p {
  margin: 0;
  color: var(--sd-gray-600);
}

.sd-date-info {
  text-align: right;
}

.sd-date-info .sd-caption {
  color: var(--sd-gray-500);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--sd-space-20) var(--sd-space-4);
  text-align: center;
}

.loading-container p {
  margin-top: var(--sd-space-4);
  color: var(--sd-gray-500);
  font-family: 'Inter', sans-serif;
}

.error-card {
  margin: var(--sd-space-4);
  text-align: center;
  background: var(--sd-red-light);
  border: 1px solid var(--sd-red);
  color: var(--sd-red-dark);
}

.error-icon {
  font-size: 48px;
  margin-bottom: var(--sd-space-4);
  color: var(--sd-red);
}

.sd-stats-container {
  padding: var(--sd-space-6) var(--sd-space-4);
  max-width: 1200px;
  margin: 0 auto;
}

.sd-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--sd-space-4);
  margin-bottom: var(--sd-space-8);
}

.sd-metric-card {
  background: var(--sd-surface-primary);
  border: 1px solid var(--sd-border-light);
  border-radius: var(--sd-radius-lg);
  padding: var(--sd-space-6);
  transition: all 0.2s ease-in-out;
  box-shadow: var(--sd-shadow-sm);
}

.sd-metric-card:hover {
  border-color: var(--sd-border-medium);
  box-shadow: var(--sd-shadow-md);
  transform: translateY(-1px);
}

.sd-metric-header {
  display: flex;
  align-items: flex-start;
  gap: var(--sd-space-4);
}

.sd-metric-icon-container {
  width: 48px;
  height: 48px;
  border-radius: var(--sd-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sd-metric-icon-container.primary {
  background: rgba(240, 106, 106, 0.1);
  border: 1px solid rgba(240, 106, 106, 0.3);
}

.sd-metric-icon-container.success {
  background: rgba(114, 221, 154, 0.1);
  border: 1px solid rgba(114, 221, 154, 0.3);
}

.sd-metric-icon-container.warning {
  background: rgba(255, 214, 102, 0.1);
  border: 1px solid rgba(255, 214, 102, 0.3);
}

.sd-metric-icon-container.progress {
  background: rgba(19, 212, 170, 0.1);
  border: 1px solid rgba(19, 212, 170, 0.3);
}

.sd-metric-icon {
  font-size: 24px;
}

.sd-metric-icon-container.primary .sd-metric-icon {
  color: var(--sd-orange);
}

.sd-metric-icon-container.success .sd-metric-icon {
  color: var(--sd-green-dark);
}

.sd-metric-icon-container.warning .sd-metric-icon {
  color: var(--sd-yellow-dark);
}

.sd-metric-icon-container.progress .sd-metric-icon {
  color: var(--sd-teal-dark);
}

.sd-metric-info {
  flex: 1;
  min-width: 0;
}

.sd-metric-label {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-sm);
  font-weight: 500;
  color: var(--sd-gray-600);
  margin-bottom: var(--sd-space-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sd-metric-number {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-3xl);
  font-weight: 700;
  color: var(--sd-gray-900);
  line-height: var(--sd-leading-tight);
  margin-bottom: var(--sd-space-1);
}

.sd-metric-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-sm);
  color: var(--sd-gray-500);
  font-weight: 400;
}

@media (max-width: 768px) {
  .sd-welcome-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sd-space-4);
    padding: var(--sd-space-6) var(--sd-space-4);
  }
  
  .sd-date-info {
    text-align: left;
  }
  
  .sd-metrics-grid {
    grid-template-columns: 1fr;
    gap: var(--sd-space-3);
  }
  
  .sd-metric-card {
    padding: var(--sd-space-4);
  }
  
  .sd-metric-header {
    gap: var(--sd-space-3);
  }
  
  .sd-metric-icon-container {
    width: 40px;
    height: 40px;
  }
  
  .sd-metric-icon {
    font-size: 20px;
  }
  
  .sd-metric-number {
    font-size: var(--sd-text-2xl);
  }
}

@media (max-width: 480px) {
  .sd-stats-container {
    padding: var(--sd-space-4) var(--sd-space-3);
  }
  
  .sd-welcome-section {
    padding: var(--sd-space-4) var(--sd-space-3);
  }
  
  .sd-metrics-grid {
    gap: var(--sd-space-2);
  }
}
</style>
