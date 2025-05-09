<template>
  <div class="register-container" :class="{ 'dark': isDarkMode }">
    <div class="register-content">
    <div class="register-form-wrapper">
      <div class="register-header">
        <h2>用户注册</h2>
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
        ref="registerForm" 
        :model="form" 
        :rules="rules" 
        label-width="0" 
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :prefix-icon="User"
              size="large"
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="邮箱"
            :prefix-icon="Message"
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
        
        <el-form-item prop="password_confirm">
          <el-input
            v-model="form.password_confirm"
            type="password"
            placeholder="确认密码"
            :prefix-icon="Lock"
            show-password
              size="large"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="register-btn"
              size="large"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
        
        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login">立即登录</router-link>
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
import { User, Lock, Message } from '@element-plus/icons-vue'
import { Moon, Sunny } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const registerForm = ref(null)
const loading = ref(false)
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')

const form = ref({
  username: '',
  email: '',
  password: '',
  password_confirm: ''
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (form.value.password_confirm !== '') {
      registerForm.value.validateField('password_confirm')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.value.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePass, trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  password_confirm: [
    { required: true, validator: validatePass2, trigger: 'blur' }
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

function handleRegister() {
  registerForm.value.validate(async valid => {
    if (valid) {
      loading.value = true
      try {
        await userStore.register(form.value)
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error) {
        console.error('注册失败:', error)
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
.register-container {
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

.register-container.dark {
  background-color: #1e1e1e;
  color: #fff;
}

.register-content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.register-form-wrapper {
  width: 90%;
  max-width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.register-form-wrapper:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.dark .register-form-wrapper {
  background-color: #252525;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.register-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.register-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .register-header h2 {
  color: #64b5ff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.register-form {
  margin-top: 20px;
}

.register-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.register-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.dark .register-footer {
  color: #a0a0a0;
}

.register-footer a {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 500;
  transition: color 0.2s;
}

.register-footer a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* 移动端适配 */
@media screen and (max-width: 480px) {
  .register-form-wrapper {
    width: 100%;
    padding: 30px 20px;
    border-radius: 0;
    box-shadow: none;
  }
  
  .register-header h2 {
    font-size: 22px;
  }
  
  .register-btn {
    height: 40px;
    font-size: 14px;
  }
}
</style> 