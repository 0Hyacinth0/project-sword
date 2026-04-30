import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 样式导入顺序：变量 -> 基础 -> 页面样式
import './assets/styles/variables.css'
import './assets/styles/base.css'
import './assets/styles/login.css'
import './assets/styles/character-select.css'
import './assets/styles/character-create.css'
import './assets/styles/character-panel.css'
import './assets/styles/home.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
