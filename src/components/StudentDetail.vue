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

    <div class="achievements-list" v-if="achievements.length">
      <h3 class="list-title">成果提交记录（共 {{ achievements.length }} 条）</h3>
      <div v-for="record in achievements" :key="record.id" class="achievement-card">
        <div class="record-header">
          <div>提交时间：{{ record.create_time }}</div>
          <div>
            <el-tag :type="record.review_completed ? 'success' : 'warning'">
              {{ record.review_completed ? '已完成逐项审核' : '未完成逐项审核' }}
            </el-tag>
            <el-tag type="primary" style="margin-left: 8px">公式总分：{{ getFormulaTotalScore(record) }}</el-tag>
          </div>
        </div>

        <template v-for="typeKey in ['paper', 'policy', 'academic', 'volunteer', 'award', 'custom']" :key="typeKey">
            <div class="section" v-if="record[typeKey + 's'] && record[typeKey + 's'].length">
                <div class="section-title">
                    <h4>{{ getTypeName(typeKey) }} <el-tag size="small" effect="plain">小计: {{ getSummaryScore(record, typeKey) }}</el-tag></h4>
                </div>
                <el-table :data="record[typeKey + 's']" border size="small">
                    <template v-if="typeKey === 'paper'">
                        <el-table-column prop="title" label="标题" min-width="160" />
                        <el-table-column prop="journal" label="期刊" min-width="140" />
                        <el-table-column prop="publish_date" label="日期" width="120" />
                    </template>
                    <template v-else-if="typeKey === 'policy'">
                        <el-table-column prop="title" label="标题" min-width="160" />
                        <el-table-column prop="adopt_unit" label="采纳单位" min-width="140" />
                        <el-table-column prop="submit_date" label="日期" width="120" />
                    </template>
                    <template v-else-if="typeKey === 'academic'">
                        <el-table-column prop="name" label="名称" min-width="160" />
                        <el-table-column prop="participate_type" label="参与类型" min-width="120" />
                        <el-table-column prop="exchange_date" label="日期" width="120" />
                    </template>
                    <template v-else-if="typeKey === 'volunteer'">
                        <el-table-column prop="project_name" label="项目名称" min-width="160" />
                        <el-table-column prop="hours" label="服务时长" width="120" />
                        <el-table-column prop="service_date" label="日期" width="120" />
                    </template>
                    <template v-else-if="typeKey === 'award'">
                        <el-table-column prop="name" label="奖项" min-width="160" />
                        <el-table-column prop="level" label="级别" width="120" />
                        <el-table-column prop="award_date" label="日期" width="120" />
                    </template>
                    <template v-else-if="typeKey === 'custom'">
                        <el-table-column prop="type_name" label="类型" min-width="140" />
                        <el-table-column label="内容" min-width="220">
                            <template #default="{ row }">{{ formatContent(row.content, row.type_name) }}</template>
                        </el-table-column>
                    </template>

                    <el-table-column prop="self_score" label="自评分" width="80" align="center">
                         <template #default="{ row }">{{ row.self_score ?? '-' }}</template>
                    </el-table-column>
                    
                    <el-table-column label="审核" width="220" align="center">
                        <template #default="{ row }">
                            <el-button 
                                size="small" 
                                :type="row.review_score !== null ? 'success' : 'danger'" 
                                plain
                                @click="openReviewDialog(typeKey, row, record.id, false)"
                            >
                                {{ row.review_score !== null ? `评分: ${row.review_score}` : '评分' }}
                            </el-button>
                            
                            <el-button 
                                v-if="row.student_agree === false"
                                size="small" 
                                :type="row.rescore_score !== null ? 'success' : 'danger'"
                                plain
                                @click="openReviewDialog(typeKey, row, record.id, true)"
                            >
                                {{ row.rescore_score !== null ? `复核: ${row.rescore_score}` : '复核' }}
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
      </div>
    </div>

    <div class="empty-tip" v-else>
      <el-empty description="该学生暂无提交任何成果" />
    </div>

    <!-- Unified Review Dialog -->
    <el-dialog v-model="reviewDialogVisible" :title="isRescoreMode ? '成果复核' : '成果评分'" width="1200px" top="3vh" append-to-body>
        <div class="review-modal-content">
            <div class="left-panel">
                <h4>佐证材料与详情</h4>
                <div class="base-info-box">
                    <p><strong>自评分：</strong>{{ currentReviewItem.self_score ?? '未填写' }}</p>
                    <div v-for="(val, key) in getItemDisplayInfo(currentReviewItem, currentItemType)" :key="key">
                        <p><strong>{{ key }}：</strong>{{ val }}</p>
                    </div>
                </div>
                <el-divider content-position="left">材料列表</el-divider>
                <div class="docs-list">
                    <div v-for="(doc, idx) in getSortedDocuments(currentReviewItem.documents)" :key="idx" class="doc-item">
                         <el-link type="primary" :href="toFileUrl(getDocPath(doc))" target="_blank">
                            <i class="el-icon-document"></i> {{ doc.file_name || '文件' + (idx+1) }}
                         </el-link>
                         <div v-if="isImage(getDocPath(doc))" class="img-preview">
                             <el-image 
                                :src="toFileUrl(getDocPath(doc))" 
                                :preview-src-list="[toFileUrl(getDocPath(doc))]"
                                fit="contain"
                                class="doc-image"
                             />
                         </div>
                         <iframe
                            v-else-if="isPdf(getDocPath(doc))"
                            :src="getPdfPreviewUrl(getDocPath(doc))"
                            class="pdf-preview"
                         />
                    </div>
                    <div v-if="!currentReviewItem.documents?.length" class="text-gray">无佐证材料</div>
                </div>
            </div>
            <div class="right-panel">
                <h4>审核操作</h4>
                <el-form label-position="top">
                    <div class="score-block">
                        <el-form-item label="初审评分">
                            <el-input-number v-model="reviewForm.score" :min="0" :max="100" :precision="1" style="width: 100%" />
                        </el-form-item>
                        <el-form-item label="审核意见">
                            <el-input v-model="reviewForm.review_comment" type="textarea" :rows="3" placeholder="请输入审核意见" />
                        </el-form-item>
                    </div>
                    
                    <div class="score-block" v-if="isRescoreMode || currentReviewItem.rescore_score !== null">
                        <el-divider>复核 (学生有异议)</el-divider>
                         <el-alert v-if="currentReviewItem.student_feedback_comment" :title="'学生反馈: ' + currentReviewItem.student_feedback_comment" type="warning" :closable="false" style="margin-bottom:10px"/>
                        <el-form-item label="复核评分">
                            <el-input-number v-model="reviewForm.rescore_score" :min="0" :max="100" :precision="1" style="width: 100%" />
                        </el-form-item>
                        <el-form-item label="复核说明">
                            <el-input v-model="reviewForm.rescore_comment" type="textarea" :rows="3" placeholder="若学生不同意，请填写复核说明" />
                        </el-form-item>
                    </div>
                </el-form>
            </div>
        </div>
        <template #footer>
            <el-button @click="reviewDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="reviewLoading" @click="submitSingleReview">提交结果</el-button>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { excelAchievementTemplate } from '../config/excelAchievementTemplate'

const props = defineProps({
  studentId: {
    type: String,
    required: true
  }
})

const baseUrl = ref('https://api.aipro.ren')
const router = useRouter()
const loading = ref(false)
const studentInfo = ref({})
const achievements = ref([])
const scoreWeights = ref({
  paper: 0,
  policy: 0,
  academic: 0,
  volunteer: 0,
  award: 0,
  custom: 0
})

// Review Dialog State
const reviewDialogVisible = ref(false)
const reviewLoading = ref(false)
const isRescoreMode = ref(false)
const currentReviewItem = ref({})
const currentItemType = ref('')
const reviewForm = ref({
  item_type: '',
  item_id: null,
  achievement_id: null,
  score: null,
  rescore_score: null,
  review_comment: '',
  rescore_comment: ''
})

const toFileUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    let normalized = path.replace(/^http:\/\//i, 'https://')
    normalized = normalized.replace(/^https:\/\/aipro\.ren\/uploads\//i, 'https://api.aipro.ren/uploads/')
    return normalized
  }
  if (!path.startsWith('/') && !path.startsWith('uploads/')) {
    return `${baseUrl.value}/uploads/${path}`
  }
  if (path.startsWith('uploads/')) {
    return `${baseUrl.value}/${path}`
  }
  return `${baseUrl.value}${path.startsWith('/') ? path : `/${path}`}`
}

const getDocPath = (doc) => {
  if (!doc) return ''
  return doc.download_url || doc.file_path || ''
}

const getPdfPreviewUrl = (path) => {
  const url = toFileUrl(path)
  if (!url) return ''
  return `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
}

const getSortedDocuments = (docs) => {
  const list = Array.isArray(docs) ? [...docs] : []
  const rank = (doc) => {
    const path = getDocPath(doc)
    if (isImage(path)) return 0
    if (isPdf(path)) return 1
    return 2
  }
  list.sort((a, b) => rank(a) - rank(b))
  return list
}

const isImage = (path) => {
  if (!path) return false
  const purePath = String(path).split('?')[0].split('#')[0]
  const ext = purePath.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
}

const isPdf = (path) => {
  if (!path) return false
  const purePath = String(path).split('?')[0].split('#')[0]
  return purePath.toLowerCase().endsWith('.pdf')
}

const goBack = () => router.push('/students')

const getTypeName = (key) => {
  const map = {
    paper: '论文成果',
    policy: '资政报告',
    academic: '学术交流',
    volunteer: '志愿服务',
    award: '获奖荣誉',
    custom: '自定义成果'
  }
  return map[key] || key
}

const fieldLabelMap = (() => {
  const map = {}
  excelAchievementTemplate.forEach(category => {
    category.sections.forEach(section => {
      section.fields.forEach(field => {
        map[field.key] = field.label
      })
    })
  })
  map.section_name = '成果小类'
  map.section_key = '成果小类标识'
  map.journal_type = '刊物类别'
  map.is_first_org_ccnu_or_econ = '是否为华师/经管院'
  map.is_first_author_student = '第一作者是否本院学生'
  map.is_second_author_student = '第二作者是否本院学生'
  map.is_third_author_student = '第三作者是否本院学生'
  map.start_date = '立项/开始时间'
  map.team_count = '团队总人数'
  map.author_identity = '作者身份'
  map.contribution = '贡献情况'
  map.post_description = '岗位说明'
  map.competition_group = '获奖时间组别'
  map.extra_contribution = '其他加分说明'
  map.extra_times = '次数'
  return map
})()

const toChineseKey = (key) => fieldLabelMap[key] || key

const getSummaryScore = (record, typeKey) => {
    const list = record[typeKey + 's'] || []
    let sum = 0
    list.forEach(item => {
        // Use rescore if available, else score
        const s = item.rescore_score !== null ? item.rescore_score : item.review_score
        sum += Number(s || 0)
    })
    return sum.toFixed(2)
}

const getFormulaTotalScore = (record) => {
  const keys = ['paper', 'policy', 'academic', 'volunteer', 'award', 'custom']
  let total = 0
  keys.forEach((key) => {
    const typeScore = Number(getSummaryScore(record, key) || 0)
    const weight = Number(scoreWeights.value[key] || 0)
    total += typeScore * weight
  })
  return total.toFixed(2)
}

const fetchScoreFormula = async () => {
  try {
    const res = await axios.get(`${baseUrl.value}/admin/score-formula`)
    if (res.data?.code === 200 && res.data?.data?.weights) {
      scoreWeights.value = {
        paper: Number(res.data.data.weights.paper || 0),
        policy: Number(res.data.data.weights.policy || 0),
        academic: Number(res.data.data.weights.academic || 0),
        volunteer: Number(res.data.data.weights.volunteer || 0),
        award: Number(res.data.data.weights.award || 0),
        custom: Number(res.data.data.weights.custom || 0)
      }
    }
  } catch (error) {
    scoreWeights.value = {
      paper: 0,
      policy: 0,
      academic: 0,
      volunteer: 0,
      award: 0,
      custom: 0
    }
  }
}

const getItemDisplayInfo = (item, type) => {
    const info = {}
    if (type === 'paper') {
        info['标题'] = item.title
        info['期刊'] = item.journal
        info['日期'] = item.publish_date
    } else if (type === 'policy') {
        info['标题'] = item.title
        info['采纳单位'] = item.adopt_unit
        info['日期'] = item.submit_date
    } else if (type === 'academic') {
        info['名称'] = item.name
        info['类型'] = item.participate_type
        info['日期'] = item.exchange_date
    } else if (type === 'volunteer') {
        info['项目'] = item.project_name
        info['时长'] = item.hours
        info['日期'] = item.service_date
    } else if (type === 'award') {
        info['奖项'] = item.name
        info['级别'] = item.level
        info['日期'] = item.award_date
    } else if (type === 'custom') {
        info['类型'] = item.type_name
        if (item.content) {
            // Use excelAchievementTemplate to map keys to labels
            let foundSection = null
            for (const category of excelAchievementTemplate) {
                for (const section of category.sections) {
                    // Match by section name or key if possible. 
                    // The item.content usually has section_key or we can match type_name
                    if (section.typeName === item.type_name || section.key === item.content.section_key) {
                        foundSection = section
                        break
                    }
                }
                if (foundSection) break
            }

            if (foundSection) {
                // Map fields
                foundSection.fields.forEach(field => {
                    const val = item.content[field.key]
                    if (val !== null && val !== undefined && String(val).trim() !== '') {
                        info[field.label] = val
                    }
                })
                if (item.content.section_name) {
                    info['成果小类'] = item.content.section_name
                }
            } else {
                Object.entries(item.content).forEach(([k, v]) => {
                    if (k !== 'section_key' && v !== null && v !== undefined && String(v).trim() !== '') {
                         info[toChineseKey(k)] = v
                    }
                })
            }
        }
    }
    return info
}

const formatContent = (obj, typeName) => {
  if (!obj || typeof obj !== 'object') return ''
  
  // Try to find the template section
  let foundSection = null
  if (typeName || obj.section_key) {
      for (const category of excelAchievementTemplate) {
        for (const section of category.sections) {
            if ((typeName && section.typeName === typeName) || (obj.section_key && section.key === obj.section_key)) {
                foundSection = section
                break
            }
        }
        if (foundSection) break
      }
  }

  if (foundSection) {
      return foundSection.fields
        .map(field => {
            const val = obj[field.key]
            if (val !== null && val !== undefined && String(val).trim() !== '') {
                return `${field.label}: ${val}`
            }
            return null
        })
        .filter(s => s)
        .join('；')
  }

  // Fallback
  const entries = Object.entries(obj).filter(([k, v]) => v !== null && v !== undefined && String(v).trim() !== '' && k !== 'section_key')
  return entries.map(([k, v]) => `${toChineseKey(k)}: ${v}`).join('；')
}

const openReviewDialog = (itemType, row, achievementId, rescoreMode = false) => {
  currentReviewItem.value = row
  currentItemType.value = itemType
  isRescoreMode.value = rescoreMode
  
  reviewForm.value = {
    item_type: itemType,
    item_id: row.id,
    achievement_id: achievementId,
    score: row.review_score,
    rescore_score: row.rescore_score,
    review_comment: row.review_comment || '',
    rescore_comment: row.rescore_comment || ''
  }
  reviewDialogVisible.value = true
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
      const list = achievementRes.data.data.list || []
      if (list.length > 0) {
        // Sort by ID descending to ensure we get the latest submission
        list.sort((a, b) => b.id - a.id)
        const latestItem = list[0]
        const detailRes = await axios.get(`${baseUrl.value}/admin/achievements/${latestItem.id}`)
        if (detailRes.data?.code === 200) {
          achievements.value = [detailRes.data.data]
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
  reviewLoading.value = true
  try {
    const res = await axios.post(
      `${baseUrl.value}/admin/review/${reviewForm.value.item_type}/${reviewForm.value.item_id}`,
      {
        score: reviewForm.value.score,
        rescore_score: reviewForm.value.rescore_score,
        review_comment: reviewForm.value.review_comment,
        rescore_comment: reviewForm.value.rescore_comment
      }
    )
    if (res.data?.code === 200) {
      ElMessage.success('评分提交成功')
      reviewDialogVisible.value = false
      await fetchStudentDetail()
    } else {
        ElMessage.error(res.data?.message || '评分失败')
    }
  } catch (error) {
    ElMessage.error('评分失败，请稍后重试')
  } finally {
    reviewLoading.value = false
  }
}

onMounted(async () => {
  await fetchScoreFormula()
  await fetchStudentDetail()
})
</script>

<style scoped>
.student-detail-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 16px;
}
.student-base-info { margin-bottom: 20px; }
.achievement-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}
.section { margin-top: 16px; }
.section-title { margin-bottom: 8px; font-weight: bold; border-left: 4px solid #409EFF; padding-left: 8px; }
.review-modal-content {
    display: flex;
    gap: 20px;
    height: 75vh;
}
.left-panel {
    flex: 2;
    overflow-y: auto;
    border-right: 1px solid #eee;
    padding-right: 16px;
}
.right-panel {
    width: 360px;
    overflow-y: auto;
}
.base-info-box {
    background: #f8f9fa;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
}
.base-info-box p { margin: 5px 0; font-size: 14px; }
.doc-item {
    margin-bottom: 10px;
    padding: 8px;
    border: 1px dashed #ddd;
    border-radius: 4px;
}
.doc-image {
    width: 100%;
    height: 360px;
    margin-top: 8px;
    border: 1px solid #eee;
    border-radius: 4px;
    background: #fff;
}
.pdf-preview {
    width: 100%;
    height: 500px;
    border: 1px solid #eee;
    margin-top: 8px;
    border-radius: 4px;
    background: #fff;
}
.text-gray { color: #999; }
</style>
