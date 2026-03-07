<template>
  <div class="role-list-container">
    <el-card class="role-list-card">
      <template #header>
        <div class="card-header">
          <h2>角色管理</h2>
          <el-button type="primary" @click="handleAddRole">
            <template #icon>
              <i class="el-icon-plus"></i>
            </template>
            新增角色
          </el-button>
        </div>
      </template>
      
      <!-- 搜索 -->
      <div class="search-container">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="角色名称">
            <el-input v-model="searchForm.roleName" placeholder="请输入角色名称" style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 角色列表 -->
      <el-table :data="filteredRoles" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="180" />
        <el-table-column prop="description" label="角色描述" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleEditRole(scope.row)"
              style="margin-right: 5px"
            >
              编辑
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click="handleAssignPermission(scope.row)"
              style="margin-right: 5px"
            >
              分配权限
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDeleteRole(scope.row.id)"
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
          :total="filteredRoles.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑角色弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="roleForm.description" 
            type="textarea" 
            placeholder="请输入角色描述" 
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 分配权限弹窗 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="分配权限"
      width="600px"
    >
      <el-form :model="currentRole" label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="currentRole.name" disabled />
        </el-form-item>
        <el-form-item label="权限列表">
          <el-checkbox-group v-model="currentRole.permissions">
            <el-checkbox 
              v-for="permission in allPermissions" 
              :key="permission.value" 
              :label="permission.value"
            >
              {{ permission.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermission">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const baseUrl = ref('https://api.aipro.ren')
const roles = ref([])
const allPermissions = ref([])

// 搜索表单
const searchForm = reactive({
  roleName: ''
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)

// 弹窗数据
const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const roleFormRef = ref(null)

const roleForm = reactive({
  id: '',
  name: '',
  description: ''
})

// 表单验证规则
const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' }
  ]
}

// 分配权限弹窗数据
const permissionDialogVisible = ref(false)
const currentRole = ref({
  id: '',
  name: '',
  permissions: []
})

// 过滤后的角色列表
const filteredRoles = computed(() => {
  let result = [...roles.value]
  
  // 按角色名称搜索
  if (searchForm.roleName) {
    result = result.filter(role => 
      role.name.includes(searchForm.roleName)
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

const fetchPermissions = async () => {
  try {
    const res = await axios.get(`${baseUrl.value}/admin/permissions`)
    if (res.data?.code === 200) {
      allPermissions.value = (res.data.data.list || []).map(item => ({
        label: item.name,
        value: item.key
      }))
    } else {
      allPermissions.value = []
      ElMessage.warning(res.data?.message || '获取权限失败')
    }
  } catch (err) {
    allPermissions.value = []
    ElMessage.error('获取权限失败，请检查后端服务')
  }
}

onMounted(() => {
  fetchRoles()
  fetchPermissions()
})

// 处理新增角色
const handleAddRole = () => {
  dialogTitle.value = '新增角色'
  // 重置表单
  Object.assign(roleForm, {
    id: '',
    name: '',
    description: ''
  })
  dialogVisible.value = true
}

// 处理编辑角色
const handleEditRole = (role) => {
  dialogTitle.value = '编辑角色'
  // 复制角色数据到表单
  Object.assign(roleForm, { ...role })
  dialogVisible.value = true
}

// 处理保存角色
const handleSaveRole = async () => {
  if (!roleFormRef.value) return
  
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (!roleForm.id) {
          const res = await axios.post(`${baseUrl.value}/admin/roles`, {
            name: roleForm.name,
            description: roleForm.description,
            permissions: []
          })
          if (res.data?.code === 200) {
            ElMessage.success('角色新增成功')
            dialogVisible.value = false
            await fetchRoles()
          } else {
            ElMessage.error(res.data?.message || '角色新增失败')
          }
        } else {
          const res = await axios.put(`${baseUrl.value}/admin/roles/${roleForm.id}`, {
            name: roleForm.name,
            description: roleForm.description
          })
          if (res.data?.code === 200) {
            ElMessage.success('角色编辑成功')
            dialogVisible.value = false
            await fetchRoles()
          } else {
            ElMessage.error(res.data?.message || '角色编辑失败')
          }
        }
      } catch (err) {
        ElMessage.error('保存角色失败，请检查后端服务')
      }
    }
  })
}

// 处理删除角色
const handleDeleteRole = (roleId) => {
  ElMessageBox.confirm(
    '确定要删除该角色吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await axios.delete(`${baseUrl.value}/admin/roles/${roleId}`)
      if (res.data?.code === 200) {
        ElMessage.success('角色删除成功')
        await fetchRoles()
      } else {
        ElMessage.error(res.data?.message || '角色删除失败')
      }
    } catch (err) {
      ElMessage.error('角色删除失败，请检查后端服务')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 处理分配权限
const handleAssignPermission = (role) => {
  // 复制角色数据到当前角色
  currentRole.value = { ...role }
  // 确保 permissions 是数组
  if (!currentRole.value.permissions) {
    currentRole.value.permissions = []
  }
  permissionDialogVisible.value = true
}

// 处理保存权限
const handleSavePermission = async () => {
  try {
    const res = await axios.put(`${baseUrl.value}/admin/roles/${currentRole.value.id}`, {
      name: currentRole.value.name,
      description: currentRole.value.description || '',
      permissions: currentRole.value.permissions || []
    })
    if (res.data?.code === 200) {
      ElMessage.success('权限分配成功')
      permissionDialogVisible.value = false
      await fetchRoles()
    } else {
      ElMessage.error(res.data?.message || '权限分配失败')
    }
  } catch (err) {
    ElMessage.error('权限分配失败，请检查后端服务')
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
}

// 重置搜索
const resetSearch = () => {
  searchForm.roleName = ''
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
.role-list-container {
  padding: 20px;
}

.role-list-card {
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
  .role-list-container {
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
