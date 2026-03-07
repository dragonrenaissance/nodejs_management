<template>
  <div class="user-list-container">
    <el-card class="user-list-card">
      <template #header>
        <div class="card-header">
          <h2>用户管理</h2>
          <el-button type="primary" @click="handleAddUser">
            <template #icon>
              <i class="el-icon-plus"></i>
            </template>
            新增用户
          </el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-container">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="用户名">
            <el-input v-model="searchForm.username" placeholder="请输入用户名" style="width: 180px" />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="searchForm.role_id" placeholder="请选择角色" style="width: 120px">
              <el-option
                v-for="role in roles"
                :key="role.id"
                :label="role.name"
                :value="role.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 用户列表 -->
      <el-table :data="filteredUsers" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="role_name" label="角色" width="120">
          <template #default="scope">
            <el-tag :type="getRoleType(scope.row.role_name)">
              {{ getRoleName(scope.row.role_name) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.status" 
              active-text="启用" 
              inactive-text="禁用"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleEditUser(scope.row)"
              style="margin-right: 5px"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDeleteUser(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredUsers.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="密码" :prop="dialogType === 'add' ? 'password' : ''">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select v-model="userForm.role_id" placeholder="请选择角色">
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const baseUrl = ref('https://api.aipro.ren')
const users = ref([])
const roles = ref([])

// 搜索表单
const searchForm = reactive({
  username: '',
  role_id: ''
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)

// 弹窗数据
const dialogVisible = ref(false)
const dialogType = ref('add') // add 或 edit
const dialogTitle = ref('新增用户')
const userFormRef = ref(null)

const userForm = reactive({
  id: '',
  username: '',
  name: '',
  password: '',
  role_id: '',
  email: ''
})

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  role_id: [
    { required: true, message: '请选择角色', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let result = [...users.value]
  
  // 按用户名搜索
  if (searchForm.username) {
    result = result.filter(user => 
      user.username.includes(searchForm.username)
    )
  }
  
  // 按角色筛选
  if (searchForm.role_id) {
    result = result.filter(user => 
      user.role_id === searchForm.role_id
    )
  }
  
  return result
})

const fetchRoles = async () => {
  try {
    const res = await axios.get(`${baseUrl.value}/admin/roles`)
    if (res.data?.code === 200) {
      roles.value = res.data.data.list || []
    } else {
      roles.value = []
      ElMessage.warning(res.data?.message || '获取角色失败')
    }
  } catch (err) {
    roles.value = []
    ElMessage.error('获取角色失败，请检查后端服务')
  }
}

const fetchUsers = async () => {
  try {
    const res = await axios.get(`${baseUrl.value}/admin/users`)
    if (res.data?.code === 200) {
      users.value = res.data.data.list || []
    } else {
      users.value = []
      ElMessage.warning(res.data?.message || '获取用户失败')
    }
  } catch (err) {
    users.value = []
    ElMessage.error('获取用户失败，请检查后端服务')
  }
}

onMounted(() => {
  fetchRoles()
  fetchUsers()
})

// 获取角色类型，用于显示不同颜色的标签
const getRoleType = (roleName) => {
  switch (roleName) {
    case '管理员':
      return 'danger'
    case '审核员':
      return 'warning'
    case '普通用户':
      return 'success'
    default:
      return 'info'
  }
}

// 获取角色名称
const getRoleName = (roleName) => roleName || ''

// 处理新增用户
const handleAddUser = () => {
  dialogType.value = 'add'
  dialogTitle.value = '新增用户'
  // 重置表单
  Object.assign(userForm, {
    id: '',
    username: '',
    name: '',
    password: '',
    role_id: '',
    email: ''
  })
  dialogVisible.value = true
}

// 处理编辑用户
const handleEditUser = (user) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑用户'
  // 复制用户数据到表单
  Object.assign(userForm, { ...user })
  // 编辑时清空密码，让用户选择性输入
  userForm.password = ''
  dialogVisible.value = true
}

// 处理保存用户
const handleSaveUser = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          const res = await axios.post(`${baseUrl.value}/admin/users`, {
            username: userForm.username,
            name: userForm.name,
            password: userForm.password,
            role_id: userForm.role_id,
            email: userForm.email
          })
          if (res.data?.code === 200) {
            ElMessage.success('用户新增成功')
            dialogVisible.value = false
            await fetchUsers()
          } else {
            ElMessage.error(res.data?.message || '用户新增失败')
          }
        } else {
          const payload = {
            username: userForm.username,
            name: userForm.name,
            role_id: userForm.role_id,
            email: userForm.email
          }
          if (userForm.password) {
            payload.password = userForm.password
          }
          const res = await axios.put(`${baseUrl.value}/admin/users/${userForm.id}`, payload)
          if (res.data?.code === 200) {
            ElMessage.success('用户编辑成功')
            dialogVisible.value = false
            await fetchUsers()
          } else {
            ElMessage.error(res.data?.message || '用户编辑失败')
          }
        }
      } catch (err) {
        ElMessage.error('保存用户失败，请检查后端服务')
      }
    }
  })
}

// 处理删除用户
const handleDeleteUser = (userId) => {
  ElMessageBox.confirm(
    '确定要删除该用户吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await axios.delete(`${baseUrl.value}/admin/users/${userId}`)
      if (res.data?.code === 200) {
        ElMessage.success('用户删除成功')
        await fetchUsers()
      } else {
        ElMessage.error(res.data?.message || '用户删除失败')
      }
    } catch (err) {
      ElMessage.error('用户删除失败，请检查后端服务')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 处理用户状态变更
const handleStatusChange = async (user) => {
  try {
    const res = await axios.put(`${baseUrl.value}/admin/users/${user.id}`, {
      username: user.username,
      name: user.name,
      role_id: user.role_id,
      email: user.email,
      is_active: user.status
    })
    if (res.data?.code === 200) {
      ElMessage.success(`用户 ${user.username} 状态已更新为 ${user.status ? '启用' : '禁用'}`)
    } else {
      ElMessage.error(res.data?.message || '更新状态失败')
    }
  } catch (err) {
    ElMessage.error('更新状态失败，请检查后端服务')
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    username: '',
    role_id: ''
  })
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}
</script>

<style scoped>
.user-list-container {
  padding: 20px;
}

.user-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.search-container {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .user-list-container {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .search-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>
