<template>
  <div class="student-detail-container">
    <el-button type="text" icon="el-icon-back" @click="goBack" class="back-btn">返回学生列表</el-button>
    <div class="student-base-info" v-loading="loading">
      <el-descriptions :column="4" border size="large">
        <el-descriptions-item label="学生学号">{{ studentInfo.student_id }}</el-descriptions-item>
        <el-descriptions-item label="学生姓名">{{ studentInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="提交成果总数">
          <el-tag type="primary">{{ studentInfo.total_achievements || 0 }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最新总分">
          <el-tag :type="studentInfo.latest_overall_score !== null ? 'success' : 'info'">
            {{ studentInfo.latest_overall_score ?? '待计算' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <el-alert type="info" :closable="false" style="margin-bottom: 14px">
      <template #title>
        审核状态说明：已提交、已审核、待复核（红色）、已复核（黄色）
      </template>
    </el-alert>

    <div class="achievements-list" v-if="achievements.length">
      <h3 class="list-title">成果提交记录（共 {{ achievements.length }} 条）</h3>
      <div v-for="record in achievements" :key="record.id" class="achievement-card">
        <div class="record-header">
          <div>提交时间：{{ record.create_time }}</div>
          <div>
            <el-tag :type="record.review_completed ? 'success' : 'warning'">
              {{ record.review_completed ? '已完成逐项审核' : '未完成逐项审核' }}
            </el-tag>
            <el-tag type="primary" style="margin-left: 8px">总分：{{ record.overall_score ?? '待计算' }}</el-tag>
          </div>
        </div>

        <div class="section" v-if="record.papers?.length">
          <div class="section-title">
            <h4>论文成果</h4>
            <el-button size="small" type="primary" @click="openReviewByType(record, 'paper')">评分/复核</el-button>
          </div>
          <el-table :data="record.papers" border size="small">
            <el-table-column prop="title" label="标题" min-width="160" />
            <el-table-column prop="journal" label="期刊" min-width="140" />
            <el-table-column prop="publish_date" label="日期" width="120" />
            <el-table-column label="项目审核状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(itemStatusLabel(row))">{{ itemStatusLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="材料" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="openDocumentsDialog(row.documents)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="section" v-if="record.policies?.length">
          <div class="section-title">
            <h4>资政报告</h4>
            <el-button size="small" type="primary" @click="openReviewByType(record, 'policy')">评分/复核</el-button>
          </div>
          <el-table :data="record.policies" border size="small">
            <el-table-column prop="title" label="标题" min-width="160" />
            <el-table-column prop="adopt_unit" label="采纳单位" min-width="140" />
            <el-table-column prop="submit_date" label="日期" width="120" />
            <el-table-column label="项目审核状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(itemStatusLabel(row))">{{ itemStatusLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="材料" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="openDocumentsDialog(row.documents)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="section" v-if="record.academics?.length">
          <div class="section-title">
            <h4>学术交流</h4>
            <el-button size="small" type="primary" @click="openReviewByType(record, 'academic')">评分/复核</el-button>
          </div>
          <el-table :data="record.academics" border size="small">
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column prop="participate_type" label="参与类型" min-width="120" />
            <el-table-column prop="exchange_date" label="日期" width="120" />
            <el-table-column label="项目审核状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(itemStatusLabel(row))">{{ itemStatusLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="材料" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="openDocumentsDialog(row.documents)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="section" v-if="record.volunteers?.length">
          <div class="section-title">
            <h4>志愿服务</h4>
            <el-button size="small" type="primary" @click="openReviewByType(record, 'volunteer')">评分/复核</el-button>
          </div>
          <el-table :data="record.volunteers" border size="small">
            <el-table-column prop="project_name" label="项目名称" min-width="160" />
            <el-table-column prop="hours" label="服务时长" width="120" />
            <el-table-column prop="service_date" label="日期" width="120" />
            <el-table-column label="项目审核状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(itemStatusLabel(row))">{{ itemStatusLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="材料" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="openDocumentsDialog(row.documents)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="section" v-if="record.awards?.length">
          <div class="section-title">
            <h4>获奖荣誉</h4>
            <el-button size="small" type="primary" @click="openReviewByType(record, 'award')">评分/复核</el-button>
          </div>
          <el-table :data="record.awards" border size="small">
            <el-table-column prop="name" label="奖项" min-width="160" />
            <el-table-column prop="level" label="级别" width="120" />
            <el-table-column prop="award_date" label="日期" width="120" />
            <el-table-column label="项目审核状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(itemStatusLabel(row))">{{ itemStatusLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="材料" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="openDocumentsDialog(row.documents)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="section" v-if="record.customs?.length">
          <div class="section-title">
            <h4>自定义成果</h4>
            <el-button size="small" type="primary" @click="openReviewByType(record, 'custom')">评分/复核</el-button>
          </div>
          <el-table :data="record.customs" border size="small">
            <el-table-column prop="type_name" label="类型" min-width="140" />
            <el-table-column label="内容" min-width="220">
              <template #default="{ row }">
                {{ formatContent(row.content) }}
              </template>
            </el-table-column>
            <el-table-column label="项目审核状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(itemStatusLabel(row))">{{ itemStatusLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="材料" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="openDocumentsDialog(row.documents)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <div class="empty-tip" v-else>
      <el-empty description="该学生暂无提交任何成果" />
    </div>

    <el-dialog v-model="reviewDialogVisible" title="成果项审核评分" width="520px">
      <el-form label-width="92px">
        <el-form-item label="审核评分">
          <el-input-number v-model="reviewForm.score" :min="0" :max="100" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="复核评分">
          <el-input-number v-model="reviewForm.rescore_score" :min="0" :max="100" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="reviewForm.review_comment" type="textarea" :rows="3" placeholder="请输入审核意见" />
        </el-form-item>
        <el-form-item label="复核说明">
          <el-input v-model="reviewForm.rescore_comment" type="textarea" :rows="3" placeholder="若学生不同意，请填写复核说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewLoading" @click="submitSingleReview">提交评分</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="documentDialogVisible" title="佐证材料" width="700px">
      <el-table :data="currentDocuments" border>
        <el-table-column prop="file_name" label="文件名" min-width="240" />
        <el-table-column prop="file_ext" label="类型" width="120" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-link type="primary" :href="toFileUrl(row.download_url)" target="_blank">打开</el-link>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!currentDocuments.length" class="empty-docs">暂无材料</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const props = defineProps({
  studentId: {
    type: String,
    required: true
  }
})

const baseUrl = ref('https://api.aipro.ren')
const router = useRouter()
const loading = ref(false)
const studentInfo = ref({
  student_id: '',
  name: '',
  total_achievements: 0,
  latest_overall_score: null
})
const achievements = ref([])
const reviewDialogVisible = ref(false)
const reviewLoading = ref(false)
const reviewForm = ref({
  item_type: '',
  achievement_id: null,
  score: null,
  rescore_score: null,
  review_comment: '',
  rescore_comment: ''
})
const documentDialogVisible = ref(false)
const currentDocuments = ref([])

const toFileUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${baseUrl.value}${path.startsWith('/') ? path : `/${path}`}`
}

const goBack = () => {
  router.push('/students')
}

const openDocumentsDialog = (docs) => {
  currentDocuments.value = docs || []
  documentDialogVisible.value = true
}

const openReviewDialog = (itemType, row, achievementId) => {
  reviewForm.value = {
    item_type: itemType,
    achievement_id: achievementId,
    score: row.review_score,
    rescore_score: row.rescore_score,
    review_comment: row.review_comment || '',
    rescore_comment: row.rescore_comment || ''
  }
  reviewDialogVisible.value = true
}

const getSummaryByType = (record, itemType) => {
  return (record.type_summaries || []).find((item) => item.type === itemType) || {}
}

const openReviewByType = (record, itemType) => {
  const summary = getSummaryByType(record, itemType)
  openReviewDialog(itemType, summary, record.id)
}

const fetchStudentDetail = async () => {
  loading.value = true
  try {
    const studentRes = await axios.get(`${baseUrl.value}/admin/students/${props.studentId}`)
    if (studentRes.data?.code === 200) {
      studentInfo.value = studentRes.data.data
    }
    achievements.value = []
    const achievementRes = await axios.get(`${baseUrl.value}/admin/achievements`, {
      params: { student_id: props.studentId, page: 1, size: 200 }
    })
    if (achievementRes.data?.code === 200) {
      for (const item of achievementRes.data.data.list || []) {
        const detailRes = await axios.get(`${baseUrl.value}/admin/achievements/${item.id}`)
        if (detailRes.data?.code === 200) {
          achievements.value.push(detailRes.data.data)
        }
      }
    }
  } catch (error) {
    ElMessage.error('获取详情失败，请重试')
  } finally {
    loading.value = false
  }
}

const submitSingleReview = async () => {
  if (reviewForm.value.score === null || reviewForm.value.score === undefined) {
    ElMessage.warning('请填写评分')
    return
  }
  reviewLoading.value = true
  try {
    const res = await axios.post(
      `${baseUrl.value}/admin/review-type/${reviewForm.value.achievement_id}/${reviewForm.value.item_type}`,
      {
        score: reviewForm.value.score,
        rescore_score: reviewForm.value.rescore_score,
        review_comment: reviewForm.value.review_comment,
        rescore_comment: reviewForm.value.rescore_comment
      }
    )
    if (res.data?.code === 200) {
      ElMessage.success('评分成功')
      reviewDialogVisible.value = false
      await fetchStudentDetail()
      return
    }
    ElMessage.error(res.data?.message || '评分失败')
  } catch (error) {
    ElMessage.error('评分失败，请稍后重试')
  } finally {
    reviewLoading.value = false
  }
}

const statusTagType = (auditStatus) => {
  if (auditStatus === '已审核') return 'success'
  if (auditStatus === '待复核') return 'danger'
  if (auditStatus === '已复核') return 'warning'
  return 'info'
}

const itemStatusLabel = (item) => {
  if (!item) return '已提交'
  if (item.student_agree === false) {
    return ((item.review_status || '') === 'rescored' && (item.rescore_comment || '').trim()) ? '已复核' : '待复核'
  }
  if (item.review_score !== null && item.review_score !== undefined) return '已审核'
  if (['reviewed', 'agreed', 'rescored'].includes(item.review_status || '')) return '已审核'
  return '已提交'
}

const formatContent = (obj) => {
  if (!obj || typeof obj !== 'object') return ''
  const entries = Object.entries(obj).filter(([k, v]) => v !== null && v !== undefined && String(v).trim() !== '')
  return entries.map(([k, v]) => `${k}: ${v}`).join('；')
}

onMounted(() => {
  fetchStudentDetail()
})
</script>

<style scoped>
.student-detail-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 16px;
}

.back-btn {
  margin-bottom: 20px;
}

.student-base-info {
  margin-bottom: 30px;
}

.list-title {
  margin-bottom: 16px;
}

.achievement-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.section {
  margin-bottom: 16px;
}

.section h4 {
  margin: 0 0 8px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.empty-tip {
  padding: 40px 0;
}

.empty-docs {
  margin-top: 12px;
  color: #909399;
}

.student-detail-container :deep(.el-table .cell) {
  white-space: normal;
  word-break: break-word;
}

</style>
