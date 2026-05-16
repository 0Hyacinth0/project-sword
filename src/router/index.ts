import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/characters',
      name: 'characters',
      component: () => import('../views/CharacterSelectView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/characters/create',
      name: 'character-create',
      component: () => import('../views/CharacterCreateView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/battle',
      name: 'battle',
      component: () => import('../views/BattleView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue'),
      meta: { requiresAuth: false }
    },
    {
      // 未匹配路由重定向到角色选择
      path: '/:pathMatch(.*)*',
      redirect: '/characters'
    }
  ]
})

/** 导航守卫：未登录用户重定向到登录页 */
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }

  // 已登录用户访问登录页时重定向到角色选择
  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'characters' }
  }
})

export default router
