<template>
  <div class="permission-list-container">
    <el-card class="permission-list-card">
      <template #header>
        <div class="card-header">
          <h2>权限管理</h2>
          <el-button type="primary" @click="handleAddPermission">
            <template #icon>
              <i class="el-icon-plus"></i>
            </template>
            新增权限
          </el-button>
        </div>
      </template>
      
      <!-- 搜索 -->
      <div class="search-container">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="权限名称">
            <el-input v-model="searchForm.permissionName" placeholder="请输入权限名称" style="width: 200px" />
          </el-form-item>
          <el-form-item label="权限标识">
            <el-input v-model="searchForm.permissionKey" placeholder="请输入权限标识" style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 权限列表 -->
      <el-table :data="filteredPermissions" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="权限名称" width="180" />
        <el-table-column prop="key" label="权限标识" width="180" />
        <el-table-column prop="description" label="权限描述" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleEditPermission(scope.row)"
              style="margin-right: 5px"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDeletePermission(scope.row.id)"
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
          :total="filteredPermissions.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑权限弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="permissionForm" :rules="permissionRules" ref="permissionFormRef" label-width="80px">
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限标识" prop="key">
          <el-input v-model="permissionForm.key" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input 
            v-model="permissionForm.description" 
            type="textarea" 
            placeholder="请输入权限描述" 
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
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
const permissions = ref([])

// 搜索表单
const searchForm = reactive({
  permissionName: '',
  permissionKey: ''
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)

// 弹窗数据
const dialogVisible = ref(false)
const dialogTitle = ref('新增权限')
const permissionFormRef = ref(null)

const permissionForm = reactive({
  id: '',
  name: '',
  key: '',
  description: ''
})

// 表单验证规则
const permissionRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  key: [
    { required: true, message: '请输入权限标识', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入权限描述', trigger: 'blur' }
  ]
}

// 过滤后的权限列表
const filteredPermissions = computed(() => {
  let result = [...permissions.value]
  
  // 按权限名称搜索
  if (searchForm.permissionName) {
    result = result.filter(permission => 
      permission.name.includes(searchForm.permissionName)
    )
  }
  
  // 按权限标识搜索
  if (searchForm.permissionKey) {
    result = result.filter(permission => 
      permission.key.includes(searchForm.permissionKey)
    )
  }
  
  return result
})

const fetchPermissions = async () => {
  try {
    const res = await axios.get(`${baseUrl.value}/admin/permissions`)
    if (res.data?.code === 200) {
      permissions.value = res.data.data.list || []
    } else {
      permissions.value = []
      ElMessage.warning(res.data?.message || '获取权限失败')
    }
  } catch (err) {
    permissions.value = []
    ElMessage.error('获取权限失败，请检查后端服务')
  }
}

onMounted(() => {
  fetchPermissions()
})

// 处理新增权限
const handleAddPermission = () => {
  dialogTitle.value = '新增权限'
  // 重置表单
  Object.assign(permissionForm, {
    id: '',
    name: '',
    key: '',
    description: ''
  })
  dialogVisible.value = true
}

// 处理编辑权限
const handleEditPermission = (permission) => {
  dialogTitle.value = '编辑权限'
  // 复制权限数据到表单
  Object.assign(permissionForm, { ...permission })
  dialogVisible.value = true
}

// 处理保存权限
const handleSavePermission = async () => {
  if (!permissionFormRef.value) return
  
  await permissionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (!permissionForm.id) {
          const res = await axios.post(`${baseUrl.value}/admin/permissions`, {
            name: permissionForm.name,
            key: permissionForm.key,
            description: permissionForm.description
          })
          if (res.data?.code === 200) {
            ElMessage.success('权限新增成功')
            dialogVisible.value = false
            await fetchPermissions()
          } else {
            ElMessage.error(res.data?.message || '权限新增失败')
          }
        } else {
          const res = await axios.put(`${baseUrl.value}/admin/permissions/${permissionForm.id}`, {
            name: permissionForm.name,
            key: permissionForm.key,
            description: permissionForm.description
          })
          if (res.data?.code === 200) {
            ElMessage.success('权限编辑成功')
            dialogVisible.value = false
            await fetchPermissions()
          } else {
            ElMessage.error(res.data?.message || '权限编辑失败')
          }
        }
      } catch (err) {
        ElMessage.error('保存权限失败，请检查后端服务')
      }
    }
  })
}

// 处理删除权限
const handleDeletePermission = (permissionId) => {
  ElMessageBox.confirm(
    '确定要删除该权限吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await axios.delete(`${baseUrl.value}/admin/permissions/${permissionId}`)
      if (res.data?.code === 200) {
        ElMessage.success('权限删除成功')
        await fetchPermissions()
      } else {
        ElMessage.error(res.data?.message || '权限删除失败')
      }
    } catch (err) {
      ElMessage.error('权限删除失败，请检查后端服务')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    permissionName: '',
    permissionKey: ''
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
.permission-list-container {
  padding: 20px;
}

.permission-list-card {
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
  .permission-list-container {
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
