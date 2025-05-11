<template>
  <div class="main-layout" :class="{ 'dark': isDarkMode }">
    <el-header class="main-header" v-if="!loading">
      <div class="header-content">
      <div class="logo">FWF</div>
      <el-menu 
        :default-active="activeMenu" 
        mode="horizontal" 
        class="main-menu"
        :ellipsis="false"
          @select="handleMenuSelect"
      >
          <el-menu-item index="/dashboard/fingerprint-recognition">
          <el-icon><el-icon-search /></el-icon>
          <span>识别指纹</span>
        </el-menu-item>
          <el-menu-item index="/dashboard/fingerprint-library">
          <el-icon><el-icon-files /></el-icon>
          <span>指纹库</span>
        </el-menu-item>
          <el-menu-item index="/dashboard/recognition-reports">
          <el-icon><el-icon-document /></el-icon>
          <span>识别报告</span>
        </el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/dashboard/user-management">
          <el-icon><el-icon-user /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/dashboard/system-logs">
          <el-icon><el-icon-list /></el-icon>
          <span>系统日志</span>
        </el-menu-item>
      </el-menu>
      <div class="user-actions">
        <el-switch
          v-model="isDarkMode"
          inline-prompt
          :active-icon="Moon"
          :inactive-icon="Sunny"
          @change="toggleDarkMode"
            class="theme-switch"
        />
          <el-dropdown @command="handleCommand" class="user-dropdown">
          <span class="el-dropdown-link">
            {{ userStore.username }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        </div>
      </div>
    </el-header>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon" :size="40"><loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <el-main v-else class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { Moon, Sunny, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')
const loading = ref(true)

const activeMenu = computed(() => {
  return route.path
})

function toggleDarkMode(value) {
  if (value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout()
      .then(() => {
        ElMessage.success('退出登录成功')
        router.push('/login')
      })
      .catch(() => {
        ElMessage.error('退出登录失败')
      })
  }
}

function handleMenuSelect(index) {
  console.log('菜单选择:', index, '当前路径:', route.path)
  if (route.path !== index) {
    console.log('正在跳转到:', index)
    
    // 直接使用router.push进行导航
    router.push(index).then(() => {
      console.log('导航完成，已跳转到:', index)
    }).catch(err => {
      // 只有当不是NavigationDuplicated错误时才提示
      if (err.name !== 'NavigationDuplicated') {
        console.error('导航错误:', err)
      }
    })
  }
}

// 验证当前用户信息
async function validateUserSession() {
  loading.value = true
  
  try {
    // 检查用户信息
    if (userStore.isAuthenticated) {
      await userStore.fetchUserInfo()
    }
  } catch (error) {
    console.error('验证用户会话失败:', error)
    ElMessage.error('验证用户会话失败，请重新登录')
    router.push('/login')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  }
  
  // 验证用户会话
  await validateUserSession()
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: #f5f7fa;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.main-layout.dark {
  background-color: #1e1e1e;
  color: #fff;
}

.main-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: fixed;
  width: 100%;
  z-index: 100;
  height: 64px;
  padding: 0;
  left: 0;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

.dark .main-header {
  background-color: #252525;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.logo {
  font-size: 24px;
  font-weight: bold;
  margin-right: 40px;
  margin-left: 10px;
  color: #409eff;
  flex-shrink: 0;
  min-width: 60px;
}

.main-menu {
  flex: 1;
  border-bottom: none;
  overflow: hidden;
  display: flex;
}

.main-menu :deep(.el-menu-item) {
  flex-shrink: 0;
  padding: 0 20px;
  font-size: 15px;
  height: 64px;
  line-height: 64px;
}

.main-menu :deep(.el-menu--horizontal > .el-menu-item.is-active) {
  border-bottom-color: #409eff;
  font-weight: 600;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
  margin-left: 20px;
  min-width: 150px;
}

.theme-switch {
  flex-shrink: 0;
  transform: scale(1.1);
}

.user-dropdown {
  flex-shrink: 0;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
  display: flex;
  align-items: center;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.main-content {
  padding-top: 84px;
  padding-bottom: 20px;
  margin: 0 auto;
  width: 100%;
  max-width: 1400px;
  padding-left: 16px;
  padding-right: 16px;
  overflow-x: hidden;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
}

.loading-icon {
  animation: rotate 1.5s linear infinite;
  color: #409eff;
  margin-bottom: 16px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media screen and (max-width: 992px) {
  .main-menu {
    padding: 0 5px;
  }
  
  .main-menu :deep(.el-menu-item) {
    padding: 0 12px;
  }
  
  .logo {
    margin-right: 20px;
  }
  
  .user-actions {
    gap: 12px;
  }
}

@media screen and (max-width: 768px) {
  .main-menu {
    padding: 0 2px;
  }
  
  .main-menu :deep(.el-menu-item) {
    padding: 0 8px;
    font-size: 14px;
  }
  
  .logo {
    margin-right: 10px;
    font-size: 20px;
  }
  
  .user-actions {
    gap: 8px;
    min-width: 120px;
  }
  
  .el-dropdown-link {
    max-width: 80px;
  }
}
</style> 