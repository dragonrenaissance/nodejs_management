import { createRouter, createWebHistory } from 'vue-router'
import StudentList from '../components/StudentList.vue'
import StudentDetail from '../components/StudentDetail.vue'
import Login from '../components/Login.vue'

const routes = [
  {
    path: '/',
    redirect: '/students' // 默认跳转到学生列表页
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', requireAuth: false }
  },
  {
    path: '/students',
    name: 'StudentList',
    component: StudentList,
    meta: { title: '学生列表', requireAuth: true }
  },
  {
    path: '/students/:studentId', // 动态路由，传递学号
    name: 'StudentDetail',
    component: StudentDetail,
    meta: { title: '学生成果审核', requireAuth: true },
    props: true // 开启props传参，方便接收studentId
  },
  {
    path: '/users',
    name: 'UserList',
    component: () => import('../components/UserList.vue'),
    meta: { title: '用户管理', requireAuth: true, permissions: ['user:manage'] }
  },
  {
    path: '/roles',
    name: 'RoleList',
    component: () => import('../components/RoleList.vue'),
    meta: { title: '角色管理', requireAuth: true, permissions: ['role:manage'] }
  },
  {
    path: '/permissions',
    name: 'PermissionList',
    component: () => import('../components/PermissionList.vue'),
    meta: { title: '权限管理', requireAuth: true, permissions: ['permission:manage'] }
  },
  {
    path: '/whitelist-students',
    name: 'WhitelistStudents',
    component: () => import('../components/WhitelistStudents.vue'),
    meta: { title: '白名单学生', requireAuth: true, permissions: ['student:manage'] }
  },
  {
    path: '/score-formula',
    name: 'ScoreFormula',
    component: () => import('../components/ScoreFormula.vue'),
    meta: { title: '评分公式', requireAuth: true, permissions: ['student:manage'] }
  },
  {
    path: '/achievement-types',
    name: 'AchievementTypeConfig',
    component: () => import('../components/AchievementTypeConfig.vue'),
    meta: { title: '成果类型管理', requireAuth: true, permissions: ['student:manage'] }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫：设置页面标题和权限验证
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '学生成果审核系统'
  
  // 检查是否需要登录
  if (to.meta.requireAuth !== false) {
    const token = localStorage.getItem('token')
    if (!token) {
      // 未登录，跳转到登录页
      next({ path: '/login' })
      return
    }
    
    // 检查是否需要特定权限
    if (to.meta.permissions) {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const userPermissions = userInfo.permissions || []
      const hasPermission = to.meta.permissions.some(permission => 
        userPermissions.includes(permission)
      )
      if (!hasPermission) {
        // 无权限，跳转到学生列表页
        next({ path: '/students' })
        return
      }
    }
  }
  
  next()
})

export default router
