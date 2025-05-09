import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    // 始终滚动到顶部
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      component: () => import('../layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'Dashboard',
          redirect: '/dashboard/fingerprint-recognition'
        },
        {
          path: '/dashboard/fingerprint-recognition',
          name: 'FingerprintRecognition',
          component: () => import('../views/FingerprintRecognition.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: '/dashboard/fingerprint-library',
          name: 'FingerprintLibrary',
          component: () => import('../views/FingerprintLibrary.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: '/dashboard/recognition-reports',
          name: 'RecognitionReports',
          component: () => import('../views/RecognitionReports.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: '/dashboard/user-management',
          name: 'UserManagement',
          component: () => import('../views/UserManagement.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: '/dashboard/system-logs',
          name: 'SystemLogs',
          component: () => import('../views/SystemLogs.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        }
      ]
    }
  ]
})

// 避免重复导航错误
const originalPush = router.push
router.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      throw err
    }
  })
}

// 添加全局加载状态
let isFirstLoad = true

// 路由守卫
router.beforeEach((to, from, next) => {
  console.log('路由导航:', from.path, '->', to.path)
  
  // 用户认证状态检查 - 优化检查逻辑，减少重复解析
  let userObj = null
  let isAuthenticated = false
  let isAdmin = false
  
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      userObj = JSON.parse(userStr)
      isAuthenticated = true
      isAdmin = userObj.profile?.role === 'admin'
    } catch (e) {
      console.error('解析用户信息失败', e)
      localStorage.removeItem('user')
      isAuthenticated = false
    }
  }

  // 在第一次加载时，如果用户已认证，不进行附加的认证检查
  if (isFirstLoad && isAuthenticated) {
    isFirstLoad = false
    
    if (to.meta.requiresAdmin && !isAdmin) {
      console.log('权限不足，重定向到:', '/dashboard/fingerprint-recognition')
      next('/dashboard/fingerprint-recognition')
    } else {
      next()
    }
    return
  }
  
  isFirstLoad = false
  
  // 处理登录状态不一致的情况
  if (to.path === '/login' && isAuthenticated) {
    // 已登录用户访问登录页，重定向到首页
    console.log('已登录用户访问登录页，重定向到首页')
    next('/dashboard/fingerprint-recognition')
    return
  }
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('未登录，重定向到:', '/login')
    next('/login')
  } else if (to.meta.requiresAdmin && !isAdmin) {
    console.log('权限不足，重定向到:', '/dashboard/fingerprint-recognition')
    next('/dashboard/fingerprint-recognition')
  } else {
    next()
  }
})

export default router 