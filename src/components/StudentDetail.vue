<template>
  <div class="student-detail-container">
    <!-- 返回按钮 -->
    <el-button 
      type="text" 
      icon="el-icon-back" 
      @click="goBack"
      class="back-btn"
    >
      返回学生列表
    </el-button>

    <!-- 学生基础信息 -->
    <div class="student-base-info" v-loading="loading">
      <el-descriptions :column="4" border size="large">
        <el-descriptions-item label="学生学号" :span="1">{{ studentInfo.student_id }}</el-descriptions-item>
        <el-descriptions-item label="学生姓名" :span="1">{{ studentInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="提交成果总数" :span="1">
          <el-tag type="primary">{{ studentInfo.total_achievements || 0 }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="整体审核状态" :span="1">
          <el-tag 
            :type="studentInfo.audit_status ? 'success' : 'warning'"
            size="large"
          >
            {{ studentInfo.audit_status ? '已全部审核' : '存在未审核成果' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 成果列表（按提交时间分组） -->
    <div class="achievements-list" v-if="achievements.length">
      <h3 class="list-title">成果提交记录（共 {{ achievements.length }} 条）</h3>
      
      <div v-for="(item, index) in achievements" :key="item.id" class="achievement-card">
        <div class="card-header">
          <span class="submit-time">提交时间：{{ item.create_time }}</span>
          <span class="audit-status">
            审核状态：
            <el-tag 
              :type="item.audit_status ? 'success' : 'warning'"
            >
              {{ item.audit_status ? '已审核' : '未审核' }}
            </el-tag>
          </span>
          <el-button 
            v-if="!item.audit_status"
            type="success" 
            size="small" 
            @click="openAuditDialog(item.id)"
            class="audit-btn"
          >
            审核该成果
          </el-button>
        </div>

        <!-- 论文成果 -->
        <div class="achievement-section" v-if="item.papers && item.papers.length">
          <h4 class="section-title">📄 论文成果</h4>
          <div v-for="paper in item.papers" :key="paper.id" class="item-detail">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="标题">{{ paper.title }}</el-descriptions-item>
              <el-descriptions-item label="发表期刊">{{ paper.journal || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="发表日期">{{ paper.publish_date || '暂无' }}</el-descriptions-item>
            </el-descriptions>
            <!-- 论文图片 -->
            <div class="image-group" v-if="paper.images && paper.images.length">
              <span class="image-label">相关图片：</span>
              <el-image 
                v-for="(img, imgIndex) in paper.images" 
                :key="imgIndex"
                :src="img" 
                fit="cover"
                class="preview-image"
                preview-src-list="paper.images"
                :preview-index="imgIndex"
              ></el-image>
            </div>
          </div>
        </div>

        <!-- 资政报告 -->
        <div class="achievement-section" v-if="item.policies && item.policies.length">
          <h4 class="section-title">📋 资政报告</h4>
          <div v-for="policy in item.policies" :key="policy.id" class="item-detail">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="标题">{{ policy.title }}</el-descriptions-item>
              <el-descriptions-item label="采纳单位">{{ policy.adopt_unit || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="提交日期">{{ policy.submit_date || '暂无' }}</el-descriptions-item>
            </el-descriptions>
            <!-- 资政报告图片 -->
            <div class="image-group" v-if="policy.images && policy.images.length">
              <span class="image-label">相关图片：</span>
              <el-image 
                v-for="(img, imgIndex) in policy.images" 
                :key="imgIndex"
                :src="img" 
                fit="cover"
                class="preview-image"
                preview-src-list="policy.images"
                :preview-index="imgIndex"
              ></el-image>
            </div>
          </div>
        </div>

        <!-- 学术交流 -->
        <div class="achievement-section" v-if="item.academics && item.academics.length">
          <h4 class="section-title">📚 学术交流</h4>
          <div v-for="academic in item.academics" :key="academic.id" class="item-detail">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="名称">{{ academic.name }}</el-descriptions-item>
              <el-descriptions-item label="参与类型">{{ academic.participate_type || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="交流日期">{{ academic.exchange_date || '暂无' }}</el-descriptions-item>
            </el-descriptions>
            <!-- 学术交流图片 -->
            <div class="image-group" v-if="academic.images && academic.images.length">
              <span class="image-label">相关图片：</span>
              <el-image 
                v-for="(img, imgIndex) in academic.images" 
                :key="imgIndex"
                :src="img" 
                fit="cover"
                class="preview-image"
                preview-src-list="academic.images"
                :preview-index="imgIndex"
              ></el-image>
            </div>
          </div>
        </div>

        <!-- 志愿服务 -->
        <div class="achievement-section" v-if="item.volunteers && item.volunteers.length">
          <h4 class="section-title">🤝 志愿服务</h4>
          <div v-for="volunteer in item.volunteers" :key="volunteer.id" class="item-detail">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="项目名称">{{ volunteer.project_name }}</el-descriptions-item>
              <el-descriptions-item label="服务时长">{{ volunteer.hours }} 小时</el-descriptions-item>
              <el-descriptions-item label="服务日期">{{ volunteer.service_date || '暂无' }}</el-descriptions-item>
            </el-descriptions>
            <!-- 志愿服务图片 -->
            <div class="image-group" v-if="volunteer.images && volunteer.images.length">
              <span class="image-label">相关图片：</span>
              <el-image 
                v-for="(img, imgIndex) in volunteer.images" 
                :key="imgIndex"
                :src="img" 
                fit="cover"
                class="preview-image"
                preview-src-list="volunteer.images"
                :preview-index="imgIndex"
              ></el-image>
            </div>
          </div>
        </div>

        <!-- 获奖情况 -->
        <div class="achievement-section" v-if="item.awards && item.awards.length">
          <h4 class="section-title">🏆 获奖情况</h4>
          <div v-for="award in item.awards" :key="award.id" class="item-detail">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="奖项名称">{{ award.name }}</el-descriptions-item>
              <el-descriptions-item label="奖项级别">{{ award.level || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="获奖日期">{{ award.award_date || '暂无' }}</el-descriptions-item>
            </el-descriptions>
            <!-- 获奖图片 -->
            <div class="image-group" v-if="award.images && award.images.length">
              <span class="image-label">相关图片：</span>
              <el-image 
                v-for="(img, imgIndex) in award.images" 
                :key="imgIndex"
                :src="img" 
                fit="cover"
                class="preview-image"
                preview-src-list="award.images"
                :preview-index="imgIndex"
              ></el-image>
            </div>
          </div>
        </div>

        <!-- 审核备注 -->
        <div class="audit-note" v-if="item.audit_note">
          <el-alert 
            title="审核备注" 
            :description="item.audit_note" 
            type="info"
            show-icon
            :closable="false"
          ></el-alert>
        </div>
      </div>
    </div>

    <!-- 无成果提示 -->
    <div class="empty-tip" v-else>
      <el-empty description="该学生暂无提交任何成果"></el-empty>
    </div>

    <!-- 审核弹窗 -->
    <el-dialog 
      title="成果审核" 
      v-model="auditDialogVisible" 
      width="500px"
      append-to-body
    >
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input 
            v-model="auditForm.auditNote" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入审核备注（选填）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitAudit"
          :loading="auditLoading"
        >
          提交审核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// 接收路由参数（学生学号）
const props = defineProps({
  studentId: {
    type: String,
    required: true
  }
})

// 后端基础地址（替换为你的IP）
const baseUrl = ref('http://47.98.59.106:8000')
const router = useRouter()
const route = useRoute()

// 加载状态
const loading = ref(false)

// 学生基础信息
const studentInfo = ref({
  student_id: '',
  name: '',
  total_achievements: 0,
  audit_status: false
})

// 成果列表
const achievements = ref([])

// 审核弹窗相关
const auditDialogVisible = ref(false)
const currentAuditId = ref(null)
const auditLoading = ref(false)
const auditForm = ref({
  auditStatus: true,
  auditNote: ''
})

// 初始化加载数据
onMounted(() => {
  fetchStudentDetail()
})

// 获取学生详情和成果
const fetchStudentDetail = async () => {
  try {
    loading.value = true
    
    // 1. 获取学生基础信息
    const studentRes = await axios.get(`${baseUrl.value}/admin/students/${props.studentId}`)
    if (studentRes.data && studentRes.data.code === 200) {
      studentInfo.value = studentRes.data.data
    }
    
    // 2. 获取该学生的所有成果
    const achievementRes = await axios.get(`${baseUrl.value}/admin/achievements`, {
      params: {
        student_id: props.studentId,
        page: 1,
        size: 100 // 一次性加载该学生所有成果
      }
    })
    if (achievementRes.data && achievementRes.data.code === 200) {
      // 补充成果详情
      const achievementList = achievementRes.data.data.list || []
      for (const item of achievementList) {
        // 获取每条成果的详细数据
        const detailRes = await axios.get(`${baseUrl.value}/admin/achievements/${item.id}`)
        if (detailRes.data && detailRes.data.code === 200) {
          achievements.value.push(detailRes.data.data)
        }
      }
    }
  } catch (err) {
    console.error('获取学生详情失败：', err)
    ElMessage.error('获取详情失败，请重试')
  } finally {
    loading.value = false
  }
}

// 返回学生列表页
const goBack = () => {
  router.push('/students')
}

// 打开审核弹窗
const openAuditDialog = (achievementId) => {
  if (!achievementId) return
  
  currentAuditId.value = achievementId
  auditForm.value = {
    auditStatus: true,
    auditNote: ''
  }
  auditDialogVisible.value = true
}

// 提交审核结果
const submitAudit = async () => {
  try {
    if (!currentAuditId.value) {
      ElMessage.warning('请选择要审核的成果')
      return
    }
    
    auditLoading.value = true
    
    // 调用审核接口
    const res = await axios.post(
      `${baseUrl.value}/admin/achievements/${currentAuditId.value}/audit`,
      {
        audit_status: auditForm.value.auditStatus,
        audit_note: auditForm.value.auditNote
      }
    )
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('审核成功')
      auditDialogVisible.value = false
      // 刷新当前页面数据
      achievements.value = []
      fetchStudentDetail()
    } else {
      ElMessage.error(res.data?.message || '审核失败')
    }
  } catch (err) {
    console.error('提交审核失败：', err)
    ElMessage.error('审核失败，请重试')
  } finally {
    auditLoading.value = false
  }
}
</script>

<style scoped>
.student-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.student-base-info {
  margin-bottom: 30px;
}

.list-title {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.achievement-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #eee;
}

.submit-time {
  font-weight: 600;
  color: #666;
}

.audit-status {
  margin-right: 10px;
}

.audit-btn {
  margin-left: auto;
}

.section-title {
  font-size: 16px;
  color: #409eff;
  margin: 15px 0 10px 0;
}

.item-detail {
  margin-bottom: 15px;
}

.image-group {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.image-label {
  color: #666;
  margin-right: 10px;
  white-space: nowrap;
}

.preview-image {
  width: 100px;
  height: 100px;
  margin: 0 10px 10px 0;
  border-radius: 4px;
  cursor: pointer;
}

.audit-note {
  margin-top: 15px;
}

.empty-tip {
  padding: 50px 0;
  text-align: center;
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