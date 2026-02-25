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
            <el-select v-model="searchForm.role" placeholder="请选择角色" style="width: 120px">
              <el-option label="管理员" value="admin" />
              <el-option label="审核员" value="reviewer" />
              <el-option label="普通用户" value="user" />
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
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope">
            <el-tag :type="getRoleType(scope.row.role)">
              {{ getRoleName(scope.row.role) }}
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
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="审核员" value="reviewer" />
            <el-option label="普通用户" value="user" />
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

// 用户列表数据
const users = ref([
  {
    id: 1,
    username: 'admin',
    name: '管理员',
    role: 'admin',
    email: 'admin@example.com',
    createdAt: '2026-01-01 00:00:00',
    status: true
  },
  {
    id: 2,
    username: 'reviewer',
    name: '审核员',
    role: 'reviewer',
    email: 'reviewer@example.com',
    createdAt: '2026-01-02 00:00:00',
    status: true
  },
  {
    id: 3,
    username: 'user1',
    name: '普通用户1',
    role: 'user',
    email: 'user1@example.com',
    createdAt: '2026-01-03 00:00:00',
    status: true
  }
])

// 搜索表单
const searchForm = reactive({
  username: '',
  role: ''
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
  role: '',
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
  role: [
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
  if (searchForm.role) {
    result = result.filter(user => 
      user.role === searchForm.role
    )
  }
  
  return result
})

// 页面加载时初始化
onMounted(() => {
  // 实际项目中这里应该从API获取用户列表数据
  console.log('UserList mounted')
})

// 获取角色类型，用于显示不同颜色的标签
const getRoleType = (role) => {
  switch (role) {
    case 'admin':
      return 'danger'
    case 'reviewer':
      return 'warning'
    case 'user':
      return 'success'
    default:
      return 'info'
  }
}

// 获取角色名称
const getRoleName = (role) => {
  switch (role) {
    case 'admin':
      return '管理员'
    case 'reviewer':
      return '审核员'
    case 'user':
      return '普通用户'
    default:
      return role
  }
}

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
    role: '',
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
      if (dialogType.value === 'add') {
        // 新增用户
        const newUser = {
          id: Date.now(), // 临时生成ID，实际项目中应该由后端生成
          ...userForm,
          createdAt: new Date().toLocaleString('zh-CN'),
          status: true
        }
        users.value.push(newUser)
        ElMessage.success('用户新增成功')
      } else {
        // 编辑用户
        const index = users.value.findIndex(u => u.id === userForm.id)
        if (index !== -1) {
          // 只更新修改的字段，不包括密码（如果为空）
          const updatedUser = { ...users.value[index], ...userForm }
          if (!userForm.password) {
            delete updatedUser.password
          }
          users.value[index] = updatedUser
          ElMessage.success('用户编辑成功')
        }
      }
      dialogVisible.value = false
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
  ).then(() => {
    const index = users.value.findIndex(u => u.id === userId)
    if (index !== -1) {
      users.value.splice(index, 1)
      ElMessage.success('用户删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 处理用户状态变更
const handleStatusChange = (user) => {
  ElMessage.success(`用户 ${user.username} 状态已更新为 ${user.status ? '启用' : '禁用'}`)
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    username: '',
    role: ''
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