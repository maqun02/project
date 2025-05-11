<template>
  <div class="user-management">
    <el-card class="user-card">
      <template #header>
        <div class="card-header">
          <h2>用户管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showAddUserForm">
              <el-icon><Plus /></el-icon> 新增用户
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名或邮箱"
          prefix-icon="Search"
          clearable
          @input="filterUsers"
        />
      </div>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      
      <div v-else-if="filteredUsers.length === 0" class="empty-container">
        <el-empty description="暂无用户数据" />
      </div>
      
      <div v-else class="users-table">
        <el-table :data="filteredUsers" border stripe>
          <el-table-column label="ID" width="80">
            <template #default="{ $index }">
              {{ $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="row.profile.role === 'admin' ? 'danger' : 'success'">
                {{ row.profile.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="注册时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.date_joined) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button-group class="action-group">
                <el-button 
                  size="small" 
                  type="primary"
                  @click="editUser(row)"
                >
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  type="danger"
                  :disabled="row.id === currentUser.id"
                  @click="deleteUser(row)"
                >
                  删除
                </el-button>
              </el-button-group>
                <el-button 
                  size="small" 
                  type="warning"
                  class="reset-button"
                  @click="resetPassword(row)"
                >
                  重置密码
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    
    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="30%"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form 
        ref="userFormRef" 
        :model="userForm" 
        :rules="userRules" 
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model.trim="userForm.username" 
            placeholder="请输入用户名" 
            clearable
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model.trim="userForm.email" 
            placeholder="请输入邮箱" 
            clearable
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input 
            v-model.trim="userForm.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
          />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select 
            v-model="userForm.role" 
            placeholder="请选择角色" 
            style="width: 100%"
          >
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saveLoading" @click="saveUser">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getUsers, createUser, updateUser, deleteUser as deleteUserApi, resetUserPassword, changeUserRole } from '../api/user'

const userStore = useUserStore()
const currentUser = computed(() => userStore.user)

const loading = ref(false)
const users = ref([])
const filteredUsers = ref([])
const searchQuery = ref('')
const dialogVisible = ref(false)
const saveLoading = ref(false)
const isEdit = ref(false)
const editingUserId = ref(null)

const userForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'user'
})

const userFormRef = ref(null)

const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 显示添加用户表单
function showAddUserForm() {
  isEdit.value = false
  editingUserId.value = null
  userForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'user'
  }
  dialogVisible.value = true
}

// 编辑用户
function editUser(user) {
  isEdit.value = true
  editingUserId.value = user.id
  userForm.value = {
    username: user.username,
    email: user.email,
    role: user.profile.role
  }
  dialogVisible.value = true
}

// 删除用户
function deleteUser(user) {
  if (user.id === currentUser.value.id) {
    ElMessage.warning('不能删除当前登录的用户')
    return
  }
  
  ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUserApi(user.id)
      ElMessage.success('用户已删除')
      fetchUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  }).catch(() => {})
}

// 重置用户密码
function resetPassword(user) {
  ElMessageBox.confirm(`确定要重置用户 "${user.username}" 的密码吗？新密码将设为: 123456`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resetUserPassword(user.id)
      ElMessage.success(`用户 ${user.username} 的密码已重置为: 123456`)
    } catch (error) {
      console.error('重置密码失败:', error)
      ElMessage.error('重置密码失败')
    }
  }).catch(() => {})
}

// 保存用户
function saveUser() {
  if (!userFormRef.value) return
  
  userFormRef.value.validate(async valid => {
    if (!valid) return false
    
    saveLoading.value = true
    try {
      const formData = { ...userForm.value }
      
      if (isEdit.value) {
        // 编辑时不传密码
        delete formData.password
        
        // 存储当前角色，完全从formData中移除
        const currentRole = formData.role
        delete formData.role
        delete formData.is_active // 确保不传递is_active字段
        
        // 先更新用户基本信息（用户名和邮箱）
        await updateUser(editingUserId.value, formData)
        
        // 单独处理角色更新
        const userInfo = users.value.find(u => u.id === editingUserId.value)
        if (userInfo && userInfo.profile.role !== currentRole) {
          try {
            // 单独调用角色更新API
            await changeUserRole(editingUserId.value, currentRole)
            ElMessage.success(`用户 ${userInfo.username} 的角色已更新为 ${currentRole === 'admin' ? '管理员' : '普通用户'}`)
          } catch (error) {
            console.error('更新用户角色失败:', error)
            ElMessage.error('更新用户角色失败')
            // 如果角色更新失败，不影响基本信息的更新结果
          }
        } else {
          ElMessage.success('用户信息已更新')
        }
      } else {
        // 处理新增用户时的角色字段
        formData.profile = {
          role: formData.role
        }
        delete formData.role
        delete formData.is_active // 确保不传递is_active字段
        
        await createUser(formData)
        ElMessage.success('用户已创建')
      }
      
      dialogVisible.value = false
      fetchUsers() // 刷新用户列表
    } catch (error) {
      console.error('保存用户失败:', error)
      ElMessage.error('保存用户失败')
    } finally {
      saveLoading.value = false
    }
  })
}

// 获取用户列表
async function fetchUsers() {
  loading.value = true
  try {
    const response = await getUsers()
    users.value = response.results || []
    filterUsers()
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 筛选用户
function filterUsers() {
  if (!searchQuery.value) {
    filteredUsers.value = users.value
    return
  }
  
  const query = searchQuery.value.toLowerCase()
  filteredUsers.value = users.value.filter(user => 
    user.username.toLowerCase().includes(query) || 
    user.email.toLowerCase().includes(query)
  )
}

// 重置表单
function resetForm() {
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
  userForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'user'
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-card {
  min-height: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.search-container {
  margin-bottom: 20px;
  max-width: 400px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.users-table {
  margin-top: 20px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: stretch;
}

.action-group {
  display: flex;
  width: 100%;
}

.action-group :deep(.el-button) {
  flex: 1;
}

.reset-button {
  width: 100%;
}

/* 添加表单样式 */
:deep(.el-form-item__label) {
  padding-bottom: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}
</style> 