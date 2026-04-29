import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      // 未匹配路由重定向到首页
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

/** 导航守卫：未登录用户重定向到登录页 */
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }

  // 已登录用户访问登录页时重定向到首页
  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'home' }
  }
})

export default router
