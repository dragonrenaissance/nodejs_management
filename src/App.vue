<template>
  <div id="app">
    <!-- 全局导航栏 -->
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-left">
          <h1 class="system-title">学生成果提交与审核管理系统</h1>
        </div>
        <div class="header-right">
          <el-button 
            type="text" 
            icon="el-icon-setting" 
            @click="showSetting = true"
          >
            系统设置
          </el-button>
          <el-dropdown>
            <span class="user-info">
              <i class="el-icon-user"></i> 管理员
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item icon="el-icon-user">个人中心</el-dropdown-item>
                <el-dropdown-item icon="el-icon-s-tools">修改密码</el-dropdown-item>
                <el-dropdown-item 
                  icon="el-icon-switch-button" 
                  @click="handleLogout"
                >
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container>
        <!-- 侧边导航栏 -->
        <el-aside width="200px" class="app-aside">
          <el-menu
            default-active="1"
            class="el-menu-vertical-demo"
            background-color="#2e3b4e"
            text-color="#fff"
            active-text-color="#ffd04b"
            :collapse="isCollapse"
            @select="handleMenuSelect"
          >
            <el-menu-item index="1">
              <template #icon>
                <i class="el-icon-menu"></i>
              </template>
              <span slot="title">成果列表管理</span>
            </el-menu-item>
            <el-menu-item index="2">
              <template #icon>
                <i class="el-icon-user-solid"></i>
              </template>
              <span slot="title">学生账号管理</span>
            </el-menu-item>
            <el-menu-item index="3">
              <template #icon>
                <i class="el-icon-pie-chart"></i>
              </template>
              <span slot="title">数据统计分析</span>
            </el-menu-item>
            <el-menu-item index="4">
              <template #icon>
                <i class="el-icon-s-tools"></i>
              </template>
              <span slot="title">系统参数配置</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- 主内容区域（路由出口） -->
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>

      <!-- 页脚 -->
      <el-footer class="app-footer">
        <div class="footer-content">
          © 2026 学生成果提交与审核管理系统 - 技术支持：xxx
        </div>
      </el-footer>
    </el-container>

    <!-- 系统设置弹窗 -->
    <el-dialog 
      title="系统设置" 
      v-model="showSetting" 
      width="600px"
      append-to-body
    >
      <el-form :model="systemForm" label-width="100px">
        <el-form-item label="后端接口地址">
          <el-input 
            v-model="systemForm.baseUrl" 
            placeholder="请输入后端接口地址"
          ></el-input>
        </el-form-item>
        <el-form-item label="图片预览域名">
          <el-input 
            v-model="systemForm.imageDomain" 
            placeholder="请输入图片预览域名/IP"
          ></el-input>
        </el-form-item>
        <el-form-item label="每页默认条数">
          <el-input-number 
            v-model="systemForm.pageSize" 
            :min="5" 
            :max="50" 
            :step="5"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="自动刷新时间">
          <el-input-number 
            v-model="systemForm.refreshTime" 
            :min="0" 
            :max="60" 
            :step="5"
            suffix="分钟"
          ></el-input-number>
          <div class="form-tip">0表示不自动刷新</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSetting = false">取消</el-button>
        <el-button type="primary" @click="saveSystemSetting">保存设置</el-button>
      </template>
    </el-dialog>

    <!-- 全局加载遮罩 -->
    <div class="global-loading" v-if="globalLoading">
      <el-spinner size="large" />
      <p>数据加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// 路由实例
const router = useRouter()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 系统设置弹窗
const showSetting = ref(false)

// 全局加载状态
const globalLoading = ref(false)

// 系统设置表单
const systemForm = ref({
  baseUrl: 'http://localhost:8000', // 后端接口地址
  imageDomain: 'http://localhost:8000', // 图片预览域名
  pageSize: 10, // 每页默认条数
  refreshTime: 0 // 自动刷新时间（分钟）
})

// 页面初始化
onMounted(() => {
  // 从本地存储加载系统设置
  const savedSetting = localStorage.getItem('systemSetting')
  if (savedSetting) {
    try {
      systemForm.value = { ...systemForm.value, ...JSON.parse(savedSetting) }
      // 更新axios默认基础地址
      axios.defaults.baseURL = systemForm.value.baseUrl
    } catch (err) {
      console.error('加载系统设置失败：', err)
    }
  }

  // 设置自动刷新（如果配置了）
  setupAutoRefresh()

  // 监听路由变化，显示加载状态
  router.beforeEach((to, from, next) => {
    globalLoading.value = true
    next()
  })

  router.afterEach(() => {
    // 延迟隐藏加载，避免闪屏
    setTimeout(() => {
      globalLoading.value = false
    }, 300)
  })
})

// 监听刷新时间变化，重新设置自动刷新
watch(
  () => systemForm.value.refreshTime,
  () => {
    setupAutoRefresh()
  }
)

// 菜单选择事件
const handleMenuSelect = (index) => {
  // 根据菜单索引跳转对应路由
  switch (index) {
    case '1':
      router.push('/achievements')
      break
    case '2':
      router.push('/students')
      break
    case '3':
      router.push('/statistics')
      break
    case '4':
      router.push('/settings')
      break
    default:
      router.push('/achievements')
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 清除本地存储
    localStorage.removeItem('systemSetting')
    localStorage.removeItem('token')
    
    // 跳转到登录页（如果有）
    router.push('/login')
    ElMessage.success('退出登录成功')
  }).catch(() => {
    ElMessage.info('已取消退出')
  })
}

// 保存系统设置
const saveSystemSetting = () => {
  try {
    // 保存到本地存储
    localStorage.setItem('systemSetting', JSON.stringify(systemForm.value))
    
    // 更新axios默认基础地址
    axios.defaults.baseURL = systemForm.value.baseUrl
    
    showSetting.value = false
    ElMessage.success('系统设置保存成功')
    
    // 如果开启了自动刷新，重新设置
    setupAutoRefresh()
  } catch (err) {
    console.error('保存系统设置失败：', err)
    ElMessage.error('保存设置失败，请重试')
  }
}

// 设置自动刷新
let refreshTimer = null
const setupAutoRefresh = () => {
  // 清除原有定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  // 如果设置了自动刷新时间（大于0）
  const refreshMinutes = systemForm.value.refreshTime
  if (refreshMinutes > 0) {
    const refreshMs = refreshMinutes * 60 * 1000
    refreshTimer = setInterval(() => {
      // 刷新当前页面数据（通过路由重新加载）
      if (router.currentRoute.name === 'AchievementList') {
        // 触发成果列表页面的刷新
        window.dispatchEvent(new CustomEvent('autoRefresh'))
        ElMessage.info(`自动刷新数据（每${refreshMinutes}分钟）`)
      }
    }, refreshMs)
    
    console.log(`已设置自动刷新：每${refreshMinutes}分钟`)
  }
}

// 全局错误处理
axios.interceptors.response.use(
  response => response,
  error => {
    globalLoading.value = false
    // 统一处理接口错误
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          ElMessage.error('登录状态失效，请重新登录')
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
          ElMessage.error(`请求失败：${error.response.data?.message || error.message}`)
      }
    } else {
      ElMessage.error('网络错误，请检查后端服务是否正常运行')
    }
    return Promise.reject(error)
  }
)
</script>

<style scoped>
/* 全局容器样式 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.app-header {
  background-color: #2e3b4e;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.system-title {
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 侧边栏样式 */
.app-aside {
  background-color: #2e3b4e;
  color: white;
  transition: width 0.3s;
}

.el-menu-vertical-demo {
  border-right: none;
  height: 100%;
}

/* 主内容区域 */
.app-main {
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

/* 页脚样式 */
.app-footer {
  text-align: center;
  font-size: 14px;
  color: #666;
  background-color: #fff;
  padding: 10px 0;
  border-top: 1px solid #eee;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* 系统设置表单提示 */
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

/* 全局加载遮罩 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.global-loading p {
  margin-top: 20px;
  color: #666;
  font-size: 16px;
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .app-aside {
    width: 64px !important;
  }
  
  .system-title {
    font-size: 16px;
  }
  
  .app-main {
    padding: 10px;
  }
}
</style>

<style>
/* 全局样式（非scoped） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

/* 修复Element Plus样式 */
.el-header, .el-footer {
  text-align: center;
  color: #333;
  line-height: 60px;
}

.el-aside {
  color: #333;
}
</style>