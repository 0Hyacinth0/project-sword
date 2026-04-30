<!-- 登录/注册页面 -->
<template>
  <div class="login-page">
    <ThemeToggle />

    <!-- 品牌区域 -->
    <div class="login-brand">
      <div class="login-brand__icon">
        <Swords :size="40" :stroke-width="1.5" />
      </div>
      <h1 class="login-brand__title">剑之传说</h1>
      <p class="login-brand__subtitle">史诗之旅即将开始</p>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Tab 切换 -->
      <div class="login-tabs" role="tablist">
        <div
          class="login-tabs__slider"
          :class="{ 'login-tabs__slider--register': activeTab === 'register' }"
        ></div>
        <button
          id="tab-login"
          class="login-tabs__btn"
          :class="{ 'login-tabs__btn--active': activeTab === 'login' }"
          role="tab"
          :aria-selected="activeTab === 'login'"
          @click="switchTab('login')"
        >
          登录
        </button>
        <button
          id="tab-register"
          class="login-tabs__btn"
          :class="{ 'login-tabs__btn--active': activeTab === 'register' }"
          role="tab"
          :aria-selected="activeTab === 'register'"
          @click="switchTab('register')"
        >
          注册
        </button>
      </div>

      <!-- 消息提示 -->
      <div
        v-if="message.text"
        class="login-message"
        :class="`login-message--${message.type}`"
      >
        <CircleCheck v-if="message.type === 'success'" :size="16" />
        <CircleX v-else :size="16" />
        <span>{{ message.text }}</span>
      </div>

      <!-- 登录表单 -->
      <transition name="form-fade" mode="out-in">
        <form
          v-if="activeTab === 'login'"
          key="login"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <!-- 用户名 -->
          <div class="form-group">
            <label class="form-group__label" for="login-username">用户名</label>
            <div class="form-group__input-wrapper">
              <input
                id="login-username"
                v-model.trim="loginForm.username"
                class="form-group__input form-group__input--with-icon"
                type="text"
                placeholder="请输入用户名"
                autocomplete="username"
                @blur="validateField('loginUsername')"
              />
              <span class="form-group__icon"><User :size="16" /></span>
            </div>
            <span v-if="errors.loginUsername" class="form-group__error">
              {{ errors.loginUsername }}
            </span>
          </div>

          <!-- 密码 -->
          <div class="form-group">
            <label class="form-group__label" for="login-password">密码</label>
            <div class="form-group__input-wrapper">
              <input
                id="login-password"
                v-model="loginForm.password"
                class="form-group__input form-group__input--with-icon"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
                @blur="validateField('loginPassword')"
              />
              <span class="form-group__icon"><Lock :size="16" /></span>
              <button
                type="button"
                class="form-group__visibility-toggle"
                :title="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <span v-if="errors.loginPassword" class="form-group__error">
              {{ errors.loginPassword }}
            </span>
          </div>

          <!-- 提交按钮 -->
          <button
            id="login-submit"
            type="submit"
            class="login-submit"
            :class="{ 'login-submit--loading': auth.loading }"
            :disabled="auth.loading"
          >
            <span class="login-submit__content">
              <span v-if="auth.loading" class="login-submit__spinner"></span>
              <span>{{ auth.loading ? '登录中...' : '登录' }}</span>
            </span>
          </button>

          <!-- 底部提示 -->
          <div class="login-footer">
            <p class="login-footer__text">
              还没有账号？
              <button
                type="button"
                class="login-footer__link"
                @click="switchTab('register')"
              >
                立即注册
              </button>
            </p>
          </div>
        </form>

        <!-- 注册表单 -->
        <form
          v-else
          key="register"
          class="login-form"
          @submit.prevent="handleRegister"
        >
          <!-- 用户名 -->
          <div class="form-group">
            <label class="form-group__label" for="register-username">用户名</label>
            <div class="form-group__input-wrapper">
              <input
                id="register-username"
                v-model.trim="registerForm.username"
                class="form-group__input form-group__input--with-icon"
                type="text"
                placeholder="3-20 个字符"
                autocomplete="username"
                @input="onUsernameInput"
                @blur="validateField('registerUsername')"
              />
              <span class="form-group__icon"><User :size="16" /></span>
              <!-- 用户名检测状态指示器 -->
              <span v-if="usernameCheckStatus !== 'idle'" class="form-group__check-status">
                <Loader2 v-if="usernameCheckStatus === 'checking'" :size="16" class="form-group__check-spinner" />
                <CircleCheck v-else-if="usernameCheckStatus === 'available'" :size="16" class="form-group__check-ok" />
                <CircleX v-else-if="usernameCheckStatus === 'taken'" :size="16" class="form-group__check-fail" />
              </span>
            </div>
            <span v-if="errors.registerUsername" class="form-group__error">
              {{ errors.registerUsername }}
            </span>
          </div>

          <!-- 密码 -->
          <div class="form-group">
            <label class="form-group__label" for="register-password">密码</label>
            <div class="form-group__input-wrapper">
              <input
                id="register-password"
                v-model="registerForm.password"
                class="form-group__input form-group__input--with-icon"
                :type="showPassword ? 'text' : 'password'"
                placeholder="6-20 个字符"
                autocomplete="new-password"
                @blur="validateField('registerPassword')"
              />
              <span class="form-group__icon"><Lock :size="16" /></span>
              <button
                type="button"
                class="form-group__visibility-toggle"
                :title="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <span v-if="errors.registerPassword" class="form-group__error">
              {{ errors.registerPassword }}
            </span>
          </div>

          <!-- 确认密码 -->
          <div class="form-group">
            <label class="form-group__label" for="register-confirm">确认密码</label>
            <div class="form-group__input-wrapper">
              <input
                id="register-confirm"
                v-model="registerForm.confirmPassword"
                class="form-group__input form-group__input--with-icon"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="再次输入密码"
                autocomplete="new-password"
                @blur="validateField('registerConfirm')"
              />
              <span class="form-group__icon"><ShieldCheck :size="16" /></span>
              <button
                type="button"
                class="form-group__visibility-toggle"
                :title="showConfirmPassword ? '隐藏密码' : '显示密码'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <span v-if="errors.registerConfirm" class="form-group__error">
              {{ errors.registerConfirm }}
            </span>
          </div>

          <!-- 提交按钮 -->
          <button
            id="register-submit"
            type="submit"
            class="login-submit"
            :class="{ 'login-submit--loading': auth.loading }"
            :disabled="auth.loading"
          >
            <span class="login-submit__content">
              <span v-if="auth.loading" class="login-submit__spinner"></span>
              <span>{{ auth.loading ? '注册中...' : '注册' }}</span>
            </span>
          </button>

          <!-- 底部提示 -->
          <div class="login-footer">
            <p class="login-footer__text">
              已有账号？
              <button
                type="button"
                class="login-footer__link"
                @click="switchTab('login')"
              >
                立即登录
              </button>
            </p>
          </div>
        </form>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { checkUsernameApi } from '../api'
import ThemeToggle from '../components/ThemeToggle.vue'
import {
  Swords,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CircleCheck,
  CircleX,
  Loader2
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

// ── 状态 ──
const activeTab = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 用户名可用性检测状态
const usernameCheckStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
let usernameCheckTimer: ReturnType<typeof setTimeout> | null = null

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive<Record<string, string>>({
  loginUsername: '',
  loginPassword: '',
  registerUsername: '',
  registerPassword: '',
  registerConfirm: ''
})

const message = reactive({
  text: '',
  type: 'success' as 'success' | 'error'
})

// ── 用户名防抖检测 ──

/** 输入时触发防抖检测 */
function onUsernameInput() {
  // 清除之前的定时器
  if (usernameCheckTimer) {
    clearTimeout(usernameCheckTimer)
  }

  const username = registerForm.username

  // 长度不够时重置状态
  if (!username || username.length < 3) {
    usernameCheckStatus.value = 'idle'
    return
  }

  // 500ms 防抖
  usernameCheckStatus.value = 'checking'
  usernameCheckTimer = setTimeout(async () => {
    try {
      const res = await checkUsernameApi(username)
      // 检查响应时用户名是否已变更（防止竞态）
      if (registerForm.username !== username) return

      if (res.data.available) {
        usernameCheckStatus.value = 'available'
        errors.registerUsername = ''
      } else {
        usernameCheckStatus.value = 'taken'
        errors.registerUsername = '该用户名已被注册'
      }
    } catch {
      // 网络错误时不阻塞用户
      usernameCheckStatus.value = 'idle'
    }
  }, 500)
}

// 切换 Tab 时重置检测状态
watch(activeTab, () => {
  usernameCheckStatus.value = 'idle'
  if (usernameCheckTimer) {
    clearTimeout(usernameCheckTimer)
  }
})

// ── 方法 ──

/** 切换 Tab */
function switchTab(tab: 'login' | 'register') {
  activeTab.value = tab
  clearErrors()
  clearMessage()
}

/** 清除所有错误 */
function clearErrors() {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

/** 清除消息 */
function clearMessage() {
  message.text = ''
}

/** 显示消息 */
function showMessage(text: string, type: 'success' | 'error') {
  message.text = text
  message.type = type
  // 5 秒后自动清除
  setTimeout(() => clearMessage(), 5000)
}

/** 字段验证 */
function validateField(field: string): boolean {
  switch (field) {
    case 'loginUsername':
      if (!loginForm.username) {
        errors.loginUsername = '请输入用户名'
        return false
      }
      if (loginForm.username.length < 3) {
        errors.loginUsername = '用户名至少 3 个字符'
        return false
      }
      errors.loginUsername = ''
      return true

    case 'loginPassword':
      if (!loginForm.password) {
        errors.loginPassword = '请输入密码'
        return false
      }
      if (loginForm.password.length < 6) {
        errors.loginPassword = '密码至少 6 个字符'
        return false
      }
      errors.loginPassword = ''
      return true

    case 'registerUsername':
      if (!registerForm.username) {
        errors.registerUsername = '请输入用户名'
        return false
      }
      if (registerForm.username.length < 3 || registerForm.username.length > 20) {
        errors.registerUsername = '用户名需要 3-20 个字符'
        return false
      }
      // 如果检测状态为已占用，阻止提交
      if (usernameCheckStatus.value === 'taken') {
        errors.registerUsername = '该用户名已被注册'
        return false
      }
      errors.registerUsername = ''
      return true

    case 'registerPassword':
      if (!registerForm.password) {
        errors.registerPassword = '请输入密码'
        return false
      }
      if (registerForm.password.length < 6 || registerForm.password.length > 20) {
        errors.registerPassword = '密码需要 6-20 个字符'
        return false
      }
      errors.registerPassword = ''
      return true

    case 'registerConfirm':
      if (!registerForm.confirmPassword) {
        errors.registerConfirm = '请确认密码'
        return false
      }
      if (registerForm.confirmPassword !== registerForm.password) {
        errors.registerConfirm = '两次输入的密码不一致'
        return false
      }
      errors.registerConfirm = ''
      return true

    default:
      return true
  }
}

/** 验证登录表单 */
function validateLoginForm(): boolean {
  const u = validateField('loginUsername')
  const p = validateField('loginPassword')
  return u && p
}

/** 验证注册表单 */
function validateRegisterForm(): boolean {
  const u = validateField('registerUsername')
  const p = validateField('registerPassword')
  const c = validateField('registerConfirm')
  // 正在检测中也阻止提交
  if (usernameCheckStatus.value === 'checking') {
    errors.registerUsername = '正在检测用户名，请稍候'
    return false
  }
  return u && p && c
}

/** 处理登录 */
async function handleLogin() {
  clearMessage()
  if (!validateLoginForm()) return

  const result = await auth.login(loginForm.username, loginForm.password)
  if (result.success) {
    showMessage(result.message, 'success')
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      router.push({ name: 'home' })
    }, 500)
  } else {
    showMessage(result.message, 'error')
  }
}

/** 处理注册 */
async function handleRegister() {
  clearMessage()
  if (!validateRegisterForm()) return

  const result = await auth.register(registerForm.username, registerForm.password)
  if (result.success) {
    showMessage(result.message, 'success')
    // 注册成功后切换到登录 Tab
    setTimeout(() => {
      loginForm.username = registerForm.username
      loginForm.password = ''
      switchTab('login')
    }, 1500)
  } else {
    showMessage(result.message, 'error')
  }
}
</script>
