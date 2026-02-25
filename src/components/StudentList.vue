<template>
  <div class="student-list-container">
    <!-- 筛选栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form" label-width="80px">
      <el-form-item label="学生学号">
        <el-input 
          v-model="searchForm.studentId" 
          placeholder="请输入学号" 
          clearable
          @keyup.enter="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="学生姓名">
        <el-input 
          v-model="searchForm.studentName" 
          placeholder="请输入姓名" 
          clearable
          @keyup.enter="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="searchForm.auditStatus" placeholder="全部" clearable>
          <el-option label="未审核" :value="false"></el-option>
          <el-option label="已审核" :value="true"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 学生列表 -->
    <el-table 
      :data="studentList" 
      border 
      stripe 
      v-loading="loading"
      @row-click="handleRowClick"
    >
      <el-table-column prop="student_id" label="学号" width="120" align="center"></el-table-column>
      <el-table-column prop="name" label="姓名" width="100" align="center"></el-table-column>
      <el-table-column prop="submit_count" label="提交成果数" width="120" align="center">
        <template #default="scope">
          <el-tag type="info">{{ scope.row.submit_count || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_submit_time" label="最后提交时间" width="200" align="center"></el-table-column>
      <el-table-column prop="audit_status" label="审核状态" width="120" align="center">
        <template #default="scope">
          <el-tag 
            :type="scope.row.audit_status ? 'success' : 'warning'"
            size="small"
          >
            {{ scope.row.audit_status ? '已审核' : '未审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
            @click="viewDetail(scope.row.student_id)"
            icon="el-icon-view"
          >
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页控件 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="page"
      :page-sizes="[5, 10, 20, 50]"
      :page-size="size"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      class="pagination"
    >
    </el-pagination>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 后端基础地址（替换为你的IP）
const baseUrl = ref('http://8.166.131.238:8000')
const router = useRouter()

// 筛选表单
const searchForm = ref({
  studentId: '',
  studentName: '',
  auditStatus: ''
})

// 分页参数
const page = ref(1)
const size = ref(10)
const total = ref(0)

// 列表数据
const studentList = ref([])
const loading = ref(false)

// 初始化加载数据
onMounted(() => {
  fetchStudentList()
})

// 获取学生列表
const fetchStudentList = async () => {
  try {
    loading.value = true
    
    // 构建查询参数
    const params = {
      page: page.value,
      size: size.value
    }
    
    // 添加筛选条件
    if (searchForm.value.studentId) {
      params.student_id = searchForm.value.studentId.trim()
    }
    if (searchForm.value.studentName) {
      params.name = searchForm.value.studentName.trim()
    }
    if (searchForm.value.auditStatus !== '') {
      params.audit_status = searchForm.value.auditStatus === 'true'
    }
    
    // 调用后端接口（获取提交过成果的学生列表）
    const res = await axios.get(`${baseUrl.value}/admin/students`, { params })
    
    if (res.data && res.data.code === 200) {
      studentList.value = res.data.data.list || []
      total.value = res.data.data.total || 0
    } else {
      studentList.value = []
      total.value = 0
      ElMessage.warning(res.data?.message || '暂无学生数据')
    }
  } catch (err) {
    console.error('获取学生列表失败：', err)
    studentList.value = []
    total.value = 0
    ElMessage.error('获取数据失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

// 搜索按钮点击
const handleSearch = () => {
  page.value = 1
  fetchStudentList()
}

// 重置筛选条件
const resetSearch = () => {
  searchForm.value = {
    studentId: '',
    studentName: '',
    auditStatus: ''
  }
  page.value = 1
  fetchStudentList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  size.value = val
  page.value = 1
  fetchStudentList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  page.value = val
  fetchStudentList()
}

// 行点击事件
const handleRowClick = (row) => {
  viewDetail(row.student_id)
}

// 查看学生详情
const viewDetail = (studentId) => {
  if (!studentId) return
  // 跳转到详情页，传递学号参数
  router.push({
    name: 'StudentDetail',
    params: { studentId }
  })
}
</script>

<style scoped>
.student-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 滚动条优化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 3px;
}
</style>