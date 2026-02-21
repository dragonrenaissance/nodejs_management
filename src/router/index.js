import { createRouter, createWebHistory } from 'vue-router'
import StudentList from '../components/StudentList.vue'
import StudentDetail from '../components/StudentDetail.vue'

const routes = [
  {
    path: '/',
    redirect: '/students' // 默认跳转到学生列表页
  },
  {
    path: '/students',
    name: 'StudentList',
    component: StudentList,
    meta: { title: '学生列表' }
  },
  {
    path: '/students/:studentId', // 动态路由，传递学号
    name: 'StudentDetail',
    component: StudentDetail,
    meta: { title: '学生成果审核' },
    props: true // 开启props传参，方便接收studentId
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '学生成果审核系统'
  next()
})

export default router