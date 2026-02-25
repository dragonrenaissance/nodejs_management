// src/main.js (Vue 3 + Vite 环境)
import { createApp } from 'vue'
import App from './App.vue'

// 1. 导入路由配置（核心）
import router from './router/index.js'

// 2. 导入 Element Plus 组件库（UI框架）
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 导入 Element Plus 图标（可选，增强体验）
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 3. 导入 axios（网络请求）
import axios from 'axios'

// 4. 创建 Vue 应用实例
const app = createApp(App)

// 5. 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 6. 配置 axios 全局默认值
axios.defaults.baseURL = 'http://8.166.131.238:8000' // 替换为你的后端IP
axios.defaults.timeout = 10000 // 请求超时时间
axios.defaults.headers.post['Content-Type'] = 'application/json'

// 7. 全局挂载 axios（可选，方便组件内直接使用 this.$axios）
app.config.globalProperties.$axios = axios

// 8. 挂载路由和 Element Plus
app.use(router)
app.use(ElementPlus)

// 9. 挂载应用到 DOM 节点
app.mount('#app')

// 10. 全局错误捕获（可选，增强稳定性）
app.config.errorHandler = (err, instance, info) => {
  console.error('全局错误捕获：', err, info)
  // 可在这里统一处理前端错误，比如弹提示
  if (instance) {
    ElMessage.error('系统出错，请稍后重试')
  }
}

// 11. axios 全局响应拦截器（统一处理接口错误）
axios.interceptors.response.use(
  response => {
    // 正常响应直接返回
    return response
  },
  error => {
    // 统一处理接口错误
    const errMsg = error.response?.data?.message || error.message || '请求失败'
    // 按错误码分类提示
    switch (error.response?.status) {
      case 401:
        ElMessage.error('登录状态失效，请重新登录')
        // 跳转到登录页（如果有）
        router.push('/login')
        break
      case 403:
        ElMessage.error('暂无权限访问该资源')
        break
      case 404:
        ElMessage.error('请求的接口不存在')
        break
      case 500:
        ElMessage.error('服务器内部错误，请联系管理员')
        break
      default:
        ElMessage.error(errMsg)
    }
    return Promise.reject(error)
  }
)