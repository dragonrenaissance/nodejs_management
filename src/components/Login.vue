<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2 class="login-title">学生成果审核系统</h2>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="login-btn">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loginFormRef = ref(null)
const baseUrl = ref('https://api.aipro.ren')

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await axios.post(`${baseUrl.value}/admin/login`, {
          username: loginForm.username,
          password: loginForm.password
        })
        if (res.data?.success) {
          const userInfo = { ...(res.data.user || {}) }
          try {
            const permissionRes = await axios.get(`${baseUrl.value}/auth/user-info`, {
              headers: {
                Authorization: `Bearer ${res.data.token || ''}`
              }
            })
            if (permissionRes.data?.code === 200 && permissionRes.data?.data) {
              userInfo.permissions = permissionRes.data.data.permissions || []
            }
          } catch (error) {
            userInfo.permissions = userInfo.permissions || []
          }
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
          localStorage.setItem('token', res.data.token || '')
          ElMessage.success('登录成功')
          router.replace('/students')
        } else {
          ElMessage.error(res.data?.message || '登录失败')
        }
      } catch (err) {
        ElMessage.error('登录失败，请检查后端服务')
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form-wrapper {
  width: 400px;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.login-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style>
