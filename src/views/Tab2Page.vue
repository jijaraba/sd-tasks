<template>
  <ion-page>
    <ion-header class="sd-header">
      <ion-toolbar class="sd-toolbar">
        <ion-title class="sd-header-title">Tasks</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshTasks" fill="clear" class="sd-header-button">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button @click="openCreateModal" fill="clear" class="sd-header-button">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tasks</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Search and Filter Section -->
      <div class="sd-search-section">
        <div class="sd-search-container">
          <ion-searchbar 
            v-model="searchText"
            placeholder="Search tasks..."
            @ionInput="handleSearch"
            show-clear-button="focus"
            class="sd-searchbar"
          ></ion-searchbar>
        </div>
        
        <div class="sd-filter-container">
          <div class="sd-filter-label">Filter by:</div>
          <div class="sd-filter-chips">
            <div 
              v-for="status in statusFilters" 
              :key="status.value"
              :class="['sd-filter-chip', { 'active': activeFilter === status.value }]"
              @click="setFilter(status.value)"
            >
              <ion-icon :icon="status.icon" class="filter-icon"></ion-icon>
              <span>{{ status.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading tasks...</p>
      </div>

      <!-- Error State -->
      <ion-card v-if="error && !loading" color="danger" class="error-card">
        <ion-card-content>
          <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
          <p>{{ error }}</p>
          <ion-button @click="loadTasks" fill="clear" color="light">
            <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
            Retry
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Empty State -->
      <div v-if="!loading && !error && filteredTasks.length === 0" class="empty-state">
        <ion-icon :icon="clipboardOutline" class="empty-icon"></ion-icon>
        <h3>{{ getEmptyStateTitle() }}</h3>
        <p>{{ getEmptyStateMessage() }}</p>
        <ion-button @click="openCreateModal" fill="outline" class="create-first-task">
          <ion-icon :icon="addOutline" slot="start"></ion-icon>
          Create Your First Task
        </ion-button>
      </div>

      <!-- Tasks List -->
      <div v-if="!loading && !error && filteredTasks.length > 0" class="sd-tasks-container">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id" 
          :class="['sd-task-card', { 'completed': task.status === 'completed' }]"
          @click="openTaskDetail(task)"
        >
          <!-- Task Header -->
          <div class="sd-task-header">
            <div class="sd-task-checkbox">
              <button 
                @click.stop="toggleTaskStatus(task)"
                :class="['sd-checkbox', { 'checked': task.status === 'completed' }]"
              >
                <ion-icon 
                  v-if="task.status === 'completed'"
                  :icon="checkboxOutline"
                  class="checkbox-icon checked"
                ></ion-icon>
                <div v-else class="checkbox-empty"></div>
              </button>
            </div>
            
            <div class="sd-task-content">
              <div class="sd-task-title">{{ task.title }}</div>
              <div v-if="task.description" class="sd-task-description">
                {{ truncateText(task.description, 120) }}
              </div>
            </div>
            
            <div class="sd-task-actions">
              <button 
                @click.stop="openEditModal(task)"
                class="sd-action-btn edit"
                title="Edit task"
              >
                <ion-icon :icon="createOutline"></ion-icon>
              </button>
              <button 
                @click.stop="confirmDeleteTask(task)"
                class="sd-action-btn delete"
                title="Delete task"
              >
                <ion-icon :icon="trashOutline"></ion-icon>
              </button>
            </div>
          </div>
          
          <!-- Task Meta Information -->
          <div class="sd-task-meta">
            <div class="sd-task-tags">
              <span :class="['sd-priority-tag', `priority-${task.priority}`]">
                {{ task.priority.toUpperCase() }}
              </span>
              <span :class="['sd-status-tag', `status-${task.status.replace('_', '-')}`]">
                {{ formatStatusLabel(task.status) }}
              </span>
            </div>
            
            <div v-if="task.dueDate" class="sd-due-date">
              <ion-icon :icon="calendarOutline" class="calendar-icon"></ion-icon>
              <span class="due-date-text">{{ formatDate(task.dueDate) }}</span>
            </div>
            
            <!-- Offline Task Badge -->
            <OfflineTaskBadge :task="task" />
          </div>
        </div>
      </div>

      <!-- SD-style Floating Action Button -->
      <div class="sd-fab-container">
        <button @click="openCreateModal" class="sd-fab">
          <ion-icon :icon="addOutline" class="fab-icon"></ion-icon>
          <span class="fab-text">Add Task</span>
        </button>
      </div>
    </ion-content>

    <!-- SD-style Create/Edit Task Modal -->
    <ion-modal :is-open="isModalOpen" @didDismiss="closeModal" class="sd-modal">
      <div class="sd-modal-content">
        <div class="sd-modal-header">
          <h2 class="sd-modal-title">{{ editingTask ? 'Edit Task' : 'Create New Task' }}</h2>
          <button @click="closeModal" class="sd-close-btn">
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>
        
        <form @submit.prevent="saveTask" class="sd-form">
          <div class="sd-form-group">
            <label class="sd-form-label">Task Name *</label>
            <input
              v-model="taskForm.title"
              type="text"
              placeholder="What needs to be done?"
              class="sd-form-input"
              required
              :disabled="saving"
            />
          </div>

          <div class="sd-form-group">
            <label class="sd-form-label">Description</label>
            <textarea
              v-model="taskForm.description"
              placeholder="Add more details about this task..."
              class="sd-form-textarea"
              rows="4"
              :disabled="saving"
            ></textarea>
          </div>

          <div class="sd-form-row">
            <div class="sd-form-group">
              <label class="sd-form-label">Priority</label>
              <select 
                v-model="taskForm.priority" 
                class="sd-form-select"
                :disabled="saving"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div class="sd-form-group">
              <label class="sd-form-label">Status</label>
              <select 
                v-model="taskForm.status" 
                class="sd-form-select"
                :disabled="saving"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div class="sd-form-group">
            <label class="sd-form-label">Due Date</label>
            <ion-datetime-button 
              datetime="dueDate" 
              :disabled="saving"
              class="sd-datetime-btn"
            ></ion-datetime-button>
            <ion-modal :keep-contents-mounted="true">
              <ion-datetime 
                id="dueDate" 
                v-model="taskForm.dueDate"
                presentation="date"
              ></ion-datetime>
            </ion-modal>
          </div>

          <div class="sd-form-actions">
            <button 
              type="button" 
              @click="closeModal"
              class="sd-button-secondary"
              :disabled="saving"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="saving || !taskForm.title.trim()"
              class="sd-button-primary"
            >
              <span v-if="saving" class="button-spinner">
                <ion-spinner name="crescent"></ion-spinner>
              </span>
              <span v-else>{{ editingTask ? 'Update Task' : 'Create Task' }}</span>
            </button>
          </div>
        </form>
      </div>
    </ion-modal>
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
  IonCardContent,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonModal,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  toastController,
  alertController,
} from '@ionic/vue';
import {
  addOutline,
  searchOutline,
  funnel,
  clipboardOutline,
  checkboxOutline,
  squareOutline,
  createOutline,
  trashOutline,
  closeOutline,
  calendarOutline,
  alertCircleOutline,
  refreshOutline,
  listOutline,
  timeOutline,
  checkmarkCircleOutline,
  playCircleOutline,
  stopCircleOutline,
} from 'ionicons/icons';
import { ref, computed, onMounted, watch } from 'vue';
import { useOfflineServices } from '@/services/offlineServices';
import OfflineTaskBadge from '@/components/OfflineTaskBadge.vue';

// Services
const { taskService, networkService } = useOfflineServices();

// Reactive data
const loading = taskService.getLoadingRef();
const error = taskService.getErrorRef();
const tasks = taskService.getTasksRef();
const saving = ref(false);
const searchText = ref('');
const activeFilter = ref('all');

// Modal state
const isModalOpen = ref(false);
const editingTask = ref<any>(null);

// Form data
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  dueDate: null as string | null,
});

// Filter options
const statusFilters = [
  { value: 'all', label: 'All', icon: listOutline },
  { value: 'pending', label: 'Pending', icon: timeOutline },
  { value: 'in_progress', label: 'In Progress', icon: playCircleOutline },
  { value: 'completed', label: 'Completed', icon: checkmarkCircleOutline },
  { value: 'cancelled', label: 'Cancelled', icon: stopCircleOutline },
];

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value;

  // Apply status filter
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(task => task.status === activeFilter.value);
  }

  // Apply search filter
  if (searchText.value.trim()) {
    const search = searchText.value.toLowerCase().trim();
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(search) ||
      (task.description && task.description.toLowerCase().includes(search))
    );
  }

  return filtered.sort((a, b) => new Date(b.createdAt || b.updatedAt || '').getTime() - new Date(a.createdAt || a.updatedAt || '').getTime());
});

// Computed properties
const isOffline = computed(() => taskService.isOffline());
const offlineTasksCount = computed(() => tasks.value.filter(task => task.needsSync || task.isOffline).length);

// Methods
const loadTasks = async () => {
  await taskService.getTasks();
};

const refreshTasks = async () => {
  await taskService.refreshTasks();
  showToast('Tasks refreshed');
};

const openCreateModal = () => {
  editingTask.value = null;
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: null,
  };
  isModalOpen.value = true;
};

const openEditModal = (task: any) => {
  editingTask.value = task;
  taskForm.value = {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate || null,
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingTask.value = null;
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: null,
  };
};

const saveTask = async () => {
  if (!taskForm.value.title.trim()) {
    showToast('Task title is required', 'warning');
    return;
  }

  saving.value = true;

  try {
    const taskData = {
      title: taskForm.value.title.trim(),
      description: taskForm.value.description?.trim() || '',
      priority: taskForm.value.priority as 'low' | 'medium' | 'high',
      status: taskForm.value.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      dueDate: taskForm.value.dueDate || undefined,
    };

    if (editingTask.value) {
      // Update existing task
      const result = await taskService.updateTask(editingTask.value.localId || editingTask.value.id, taskData);
      if (result) {
        showToast('Task updated successfully');
        closeModal();
      } else {
        showToast('Failed to update task', 'danger');
      }
    } else {
      // Create new task
      const result = await taskService.createTask(taskData);
      if (result) {
        showToast(isOffline.value ? 'Task created offline' : 'Task created successfully');
        closeModal();
      } else {
        showToast('Failed to create task', 'danger');
      }
    }
  } catch (err: any) {
    console.error('Save task error:', err);
    showToast(err.message || 'Failed to save task', 'danger');
  } finally {
    saving.value = false;
  }
};


const confirmDeleteTask = async (task: any) => {
  const alert = await alertController.create({
    header: 'Delete Task',
    message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => deleteTask(task),
      },
    ],
  });

  await alert.present();
};

const deleteTask = async (task: any) => {
  try {
    const success = await taskService.deleteTask(task.localId || task.id);
    if (success) {
      showToast(isOffline.value ? 'Task marked for deletion' : 'Task deleted successfully');
    } else {
      showToast('Failed to delete task', 'danger');
    }
  } catch (err: any) {
    console.error('Delete task error:', err);
    showToast(err.message || 'Failed to delete task', 'danger');
  }
};

const openTaskDetail = (task: any) => {
  // Open edit modal when clicking on task card
  openEditModal(task);
};

const setFilter = (filter: string) => {
  activeFilter.value = filter;
};

const handleSearch = (event: any) => {
  searchText.value = event.target.value;
};

const toggleTaskStatus = async (task: any) => {
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  await taskService.updateTask(task.localId || task.id, { status: newStatus });
  showToast(`Task marked as ${newStatus === 'completed' ? 'completed' : 'pending'}`);
};

const showToast = async (message: string, color: string = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'bottom',
  });
  await toast.present();
};

// Utility functions
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

const formatStatusLabel = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getEmptyStateTitle = () => {
  if (activeFilter.value === 'all') {
    return searchText.value ? 'No tasks found' : 'No tasks yet';
  }
  const filterLabel = statusFilters.find(f => f.value === activeFilter.value)?.label || '';
  return searchText.value ? `No ${filterLabel.toLowerCase()} tasks found` : `No ${filterLabel.toLowerCase()} tasks`;
};

const getEmptyStateMessage = () => {
  if (searchText.value) {
    return 'Try adjusting your search or filter criteria.';
  }
  if (activeFilter.value === 'all') {
    return 'Get started by creating your first task!';
  }
  return 'Tasks matching this status will appear here.';
};

// Lifecycle
onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
/* ==========================================
   SD-INSPIRED TASK MANAGEMENT STYLES
   ========================================== */

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

.sd-search-section {
  background: var(--sd-surface-secondary);
  border-bottom: 1px solid var(--sd-border-light);
  padding: var(--sd-space-4);
}

.sd-search-container {
  margin-bottom: var(--sd-space-4);
}

.sd-searchbar {
  --background: var(--sd-surface-primary);
  --border-radius: var(--sd-radius-md);
  --box-shadow: var(--sd-shadow-sm);
  --color: var(--sd-gray-700);
  --placeholder-color: var(--sd-gray-500);
  --icon-color: var(--sd-gray-400);
  font-family: 'Inter', sans-serif;
}

.sd-filter-container {
  display: flex;
  flex-direction: column;
  gap: var(--sd-space-2);
}

.sd-filter-label {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-sm);
  font-weight: 500;
  color: var(--sd-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sd-filter-chips {
  display: flex;
  gap: var(--sd-space-2);
  flex-wrap: wrap;
  overflow-x: auto;
  padding: var(--sd-space-1) 0;
}

.sd-filter-chip {
  display: flex;
  align-items: center;
  gap: var(--sd-space-1);
  padding: var(--sd-space-2) var(--sd-space-3);
  background: var(--sd-surface-primary);
  border: 1px solid var(--sd-border-light);
  border-radius: var(--sd-radius-full);
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-sm);
  font-weight: 500;
  color: var(--sd-gray-600);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  flex-shrink: 0;
}

.sd-filter-chip:hover {
  background: var(--sd-gray-50);
  border-color: var(--sd-border-medium);
  transform: translateY(-1px);
}

.sd-filter-chip.active {
  background: var(--sd-orange);
  border-color: var(--sd-orange);
  color: white;
}

.sd-filter-chip .filter-icon {
  font-size: 16px;
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
  font-size: var(--sd-text-base);
}

.error-card {
  margin: var(--sd-space-4);
  padding: var(--sd-space-6);
  background: var(--sd-red-light);
  border: 1px solid var(--sd-red);
  border-radius: var(--sd-radius-lg);
  text-align: center;
  color: var(--sd-red-dark);
}

.error-icon {
  font-size: 48px;
  margin-bottom: var(--sd-space-4);
  color: var(--sd-red);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--sd-space-20) var(--sd-space-4);
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: var(--sd-space-6);
  color: var(--sd-gray-300);
}

.empty-state h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: var(--sd-gray-900);
  margin: 0 0 var(--sd-space-3) 0;
  font-size: var(--sd-text-xl);
}

.empty-state p {
  font-family: 'Inter', sans-serif;
  margin: 0 0 var(--sd-space-6) 0;
  font-size: var(--sd-text-base);
  line-height: var(--sd-leading-normal);
  color: var(--sd-gray-600);
}

.create-first-task {
  background: var(--sd-orange);
  color: white;
  border: none;
  border-radius: var(--sd-radius-md);
  padding: var(--sd-space-3) var(--sd-space-6);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: var(--sd-text-base);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.create-first-task:hover {
  background: var(--sd-orange-dark);
  transform: translateY(-1px);
  box-shadow: var(--sd-shadow-md);
}

.sd-tasks-container {
  padding: var(--sd-space-4);
  max-width: 800px;
  margin: 0 auto;
}

.sd-task-card {
  background: var(--sd-surface-primary);
  border: 1px solid var(--sd-border-light);
  border-radius: var(--sd-radius-lg);
  margin-bottom: var(--sd-space-3);
  padding: var(--sd-space-4);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: var(--sd-shadow-sm);
}

.sd-task-card:hover {
  border-color: var(--sd-border-medium);
  box-shadow: var(--sd-shadow-md);
  transform: translateY(-1px);
}

.sd-task-card.completed {
  background: var(--sd-gray-50);
  border-color: var(--sd-gray-200);
}

.sd-task-card:last-child {
  margin-bottom: var(--sd-space-20); /* Space for FAB */
}

.sd-task-header {
  display: flex;
  align-items: flex-start;
  gap: var(--sd-space-3);
  margin-bottom: var(--sd-space-3);
}

.sd-task-checkbox {
  flex-shrink: 0;
  margin-top: 2px;
}

.sd-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--sd-gray-300);
  border-radius: var(--sd-radius-xs);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  padding: 0;
}

.sd-checkbox:hover {
  border-color: var(--sd-orange);
}

.sd-checkbox.checked {
  background: var(--sd-green);
  border-color: var(--sd-green);
}

.checkbox-empty {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.checkbox-icon.checked {
  color: white;
  font-size: 14px;
}

.sd-task-content {
  flex: 1;
  min-width: 0;
}

.sd-task-title {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-base);
  font-weight: 500;
  color: var(--sd-gray-900);
  line-height: var(--sd-leading-snug);
  margin: 0 0 var(--sd-space-1) 0;
  word-wrap: break-word;
}

.sd-task-card.completed .sd-task-title {
  text-decoration: line-through;
  color: var(--sd-gray-500);
}

.sd-task-description {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-sm);
  color: var(--sd-gray-600);
  line-height: var(--sd-leading-normal);
  margin: 0;
  word-wrap: break-word;
}

.sd-task-card.completed .sd-task-description {
  color: var(--sd-gray-400);
}

.sd-task-actions {
  display: flex;
  gap: var(--sd-space-1);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.sd-task-card:hover .sd-task-actions {
  opacity: 1;
}

.sd-action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--sd-border-light);
  border-radius: var(--sd-radius-sm);
  background: var(--sd-surface-primary);
  color: var(--sd-gray-500);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  padding: 0;
}

.sd-action-btn:hover {
  border-color: var(--sd-border-medium);
  background: var(--sd-gray-50);
}

.sd-action-btn.edit:hover {
  color: var(--sd-orange);
  border-color: var(--sd-orange);
}

.sd-action-btn.delete:hover {
  color: var(--sd-red);
  border-color: var(--sd-red);
}

.sd-task-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sd-space-3);
  flex-wrap: wrap;
}

.sd-task-tags {
  display: flex;
  gap: var(--sd-space-2);
  flex-wrap: wrap;
}

.sd-priority-tag,
.sd-status-tag {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-xs);
  font-weight: 500;
  padding: var(--sd-space-1) var(--sd-space-2);
  border-radius: var(--sd-radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sd-priority-tag.priority-high {
  background: rgba(253, 154, 154, 0.15);
  color: var(--sd-red-dark);
  border: 1px solid rgba(253, 154, 154, 0.3);
}

.sd-priority-tag.priority-medium {
  background: rgba(255, 214, 102, 0.15);
  color: var(--sd-yellow-dark);
  border: 1px solid rgba(255, 214, 102, 0.3);
}

.sd-priority-tag.priority-low {
  background: rgba(114, 221, 154, 0.15);
  color: var(--sd-green-dark);
  border: 1px solid rgba(114, 221, 154, 0.3);
}

.sd-status-tag.status-completed {
  background: rgba(114, 221, 154, 0.15);
  color: var(--sd-green-dark);
  border: 1px solid rgba(114, 221, 154, 0.3);
}

.sd-status-tag.status-in-progress {
  background: rgba(240, 106, 106, 0.15);
  color: var(--sd-orange-dark);
  border: 1px solid rgba(240, 106, 106, 0.3);
}

.sd-status-tag.status-pending {
  background: rgba(156, 166, 175, 0.15);
  color: var(--sd-gray-600);
  border: 1px solid rgba(156, 166, 175, 0.3);
}

.sd-status-tag.status-cancelled {
  background: rgba(253, 154, 154, 0.15);
  color: var(--sd-red-dark);
  border: 1px solid rgba(253, 154, 154, 0.3);
}

.sd-due-date {
  display: flex;
  align-items: center;
  gap: var(--sd-space-1);
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-sm);
  color: var(--sd-gray-600);
}

.calendar-icon {
  font-size: 14px;
  color: var(--sd-gray-400);
}

.due-date-text {
  font-weight: 500;
}

.sd-fab-container {
  position: fixed;
  bottom: var(--sd-space-6);
  right: var(--sd-space-6);
  z-index: 999;
}

.sd-fab {
  display: flex;
  align-items: center;
  gap: var(--sd-space-2);
  background: var(--sd-orange);
  color: white;
  border: none;
  border-radius: var(--sd-radius-full);
  padding: var(--sd-space-4) var(--sd-space-5);
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: var(--sd-text-sm);
  cursor: pointer;
  box-shadow: var(--sd-shadow-lg);
  transition: all 0.2s ease-in-out;
}

.sd-fab:hover {
  background: var(--sd-orange-dark);
  transform: translateY(-2px);
  box-shadow: var(--sd-shadow-xl);
}

.fab-icon {
  font-size: 20px;
}

.fab-text {
  font-weight: 600;
}

.sd-modal {
  --background: rgba(21, 27, 38, 0.6);
  --backdrop-opacity: 0.6;
}

.sd-modal-content {
  background: var(--sd-surface-primary);
  border-radius: var(--sd-radius-xl);
  max-width: 600px;
  width: 90vw;
  max-height: 80vh;
  margin: 10vh auto;
  overflow: hidden;
  box-shadow: var(--sd-shadow-xl);
}

.sd-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sd-space-6) var(--sd-space-6) var(--sd-space-4);
  border-bottom: 1px solid var(--sd-border-light);
}

.sd-modal-title {
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-2xl);
  font-weight: 600;
  color: var(--sd-gray-900);
  margin: 0;
}

.sd-close-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--sd-gray-100);
  border-radius: var(--sd-radius-lg);
  color: var(--sd-gray-600);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
}

.sd-close-btn:hover {
  background: var(--sd-gray-200);
  color: var(--sd-gray-700);
}

.sd-form {
  padding: var(--sd-space-6);
  max-height: calc(80vh - 120px);
  overflow-y: auto;
}

.sd-form-group {
  margin-bottom: var(--sd-space-5);
}

.sd-form-label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-sm);
  font-weight: 600;
  color: var(--sd-gray-700);
  margin-bottom: var(--sd-space-2);
}

.sd-form-input,
.sd-form-textarea,
.sd-form-select {
  width: 100%;
  border: 2px solid var(--sd-border-light);
  border-radius: var(--sd-radius-md);
  padding: var(--sd-space-3) var(--sd-space-4);
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-base);
  color: var(--sd-gray-900);
  background: var(--sd-surface-primary);
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;
}

.sd-form-input:focus,
.sd-form-textarea:focus,
.sd-form-select:focus {
  outline: none;
  border-color: var(--sd-orange);
  box-shadow: 0 0 0 3px rgba(240, 106, 106, 0.1);
}

.sd-form-input::placeholder,
.sd-form-textarea::placeholder {
  color: var(--sd-gray-400);
}

.sd-form-textarea {
  resize: vertical;
  min-height: 80px;
}

.sd-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sd-space-4);
}

.sd-datetime-btn {
  --background: var(--sd-surface-primary);
  --color: var(--sd-gray-700);
  --border-color: var(--sd-border-light);
  --border-radius: var(--sd-radius-md);
  --padding-start: var(--sd-space-4);
  --padding-end: var(--sd-space-4);
  --padding-top: var(--sd-space-3);
  --padding-bottom: var(--sd-space-3);
  font-family: 'Inter', sans-serif;
  width: 100%;
}

.sd-form-actions {
  display: flex;
  gap: var(--sd-space-3);
  justify-content: flex-end;
  margin-top: var(--sd-space-8);
  padding-top: var(--sd-space-4);
  border-top: 1px solid var(--sd-border-light);
}

.sd-button-primary,
.sd-button-secondary {
  padding: var(--sd-space-3) var(--sd-space-6);
  border-radius: var(--sd-radius-md);
  font-family: 'Inter', sans-serif;
  font-size: var(--sd-text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: var(--sd-space-2);
}

.sd-button-primary {
  background: var(--sd-orange);
  color: white;
}

.sd-button-primary:hover:not(:disabled) {
  background: var(--sd-orange-dark);
  transform: translateY(-1px);
  box-shadow: var(--sd-shadow-md);
}

.sd-button-primary:disabled {
  background: var(--sd-gray-300);
  color: var(--sd-gray-500);
  cursor: not-allowed;
}

.sd-button-secondary {
  background: var(--sd-surface-primary);
  color: var(--sd-gray-700);
  border-color: var(--sd-border-medium);
}

.sd-button-secondary:hover:not(:disabled) {
  background: var(--sd-gray-50);
  border-color: var(--sd-border-strong);
}

.button-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .sd-task-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--sd-space-2);
  }
  
  .sd-task-actions {
    opacity: 1;
    justify-content: flex-end;
    margin-top: var(--sd-space-2);
  }
  
  .sd-task-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sd-space-2);
  }
  
  .sd-form-row {
    grid-template-columns: 1fr;
  }
  
  .sd-fab {
    padding: var(--sd-space-3) var(--sd-space-4);
  }
  
  .fab-text {
    display: none;
  }
  
  .sd-modal-content {
    width: 95vw;
    margin: 5vh auto;
    max-height: 90vh;
  }
  
  .sd-form-actions {
    flex-direction: column-reverse;
  }
  
  .sd-button-primary,
  .sd-button-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .sd-search-section {
    padding: var(--sd-space-3);
  }
  
  .sd-tasks-container {
    padding: var(--sd-space-3);
  }
  
  .sd-task-card {
    padding: var(--sd-space-3);
  }
  
  .sd-fab-container {
    bottom: var(--sd-space-4);
    right: var(--sd-space-4);
  }
  
  .sd-form {
    padding: var(--sd-space-4);
  }
  
  .sd-modal-header {
    padding: var(--sd-space-4);
  }
}
</style>
