<template>
  <div class="login-container" :class="{ 'dark': isDarkMode }">
    <div class="login-content">
    <div class="login-form-wrapper">
      <div class="login-header">
        <h2>FWF 指纹识别系统</h2>
        <div class="theme-switch">
          <el-switch
            v-model="isDarkMode"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            @change="toggleDarkMode"
          />
        </div>
      </div>
      
      <el-form 
        ref="loginForm" 
        :model="form" 
        :rules="rules" 
        label-width="0" 
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :prefix-icon="User"
              size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
              size="large"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="login-btn"
              size="large"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="login-footer">
          <span>没有账号？</span>
          <router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { Moon, Sunny } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loginForm = ref(null)
const loading = ref(false)
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

function toggleDarkMode(value) {
  if (value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
  }
}

function handleLogin() {
  loginForm.value.validate(async valid => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(form.value)
        ElMessage.success('登录成功')
        router.push('/dashboard/fingerprint-recognition')
      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    } else {
      return false
    }
  })
}

onMounted(() => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  height: 100vh;
  background-color: #f5f7fa;
  padding: 0;
  margin: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}

.login-container.dark {
  background-color: #1e1e1e;
  color: #fff;
}

.login-content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-form-wrapper {
  width: 90%;
  max-width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-form-wrapper:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.dark .login-form-wrapper {
  background-color: #252525;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .login-header h2 {
  color: #64b5ff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.dark .login-footer {
  color: #a0a0a0;
}

.login-footer a {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 500;
  transition: color 0.2s;
}

.login-footer a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* 移动端适配 */
@media screen and (max-width: 480px) {
  .login-form-wrapper {
    width: 100%;
    padding: 30px 20px;
    border-radius: 0;
    box-shadow: none;
  }
  
  .login-header h2 {
    font-size: 22px;
  }
  
  .login-btn {
    height: 40px;
    font-size: 14px;
  }
}
</style> 