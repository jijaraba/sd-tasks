import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { isAuthenticated } from '@/utils/auth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/splash'
  },
  {
    path: '/splash',
    component: () => import('@/views/SplashScreen.vue')
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterPage.vue')
  },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/Tab1Page.vue')
      },
      {
        path: 'tab2',
        component: () => import('@/views/Tab2Page.vue')
      },
      {
        path: 'tab3',
        component: () => import('@/views/Tab3Page.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth && !isAuthenticated()) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated()) {
    next('/tabs/tab1');
  } else {
    next();
  }
});

export default router
