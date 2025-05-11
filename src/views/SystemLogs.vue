<template>
  <div class="system-logs">
    <el-card class="logs-card">
      <template #header>
        <div class="card-header">
          <h2>系统日志</h2>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :shortcuts="dateShortcuts"
            />
          </div>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="用户">
            <el-select v-model="filters.user" placeholder="选择用户" clearable filterable>
              <el-option
                v-for="user in allUsers"
                :key="user.id"
                :label="user.username"
                :value="user.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="操作类型">
            <el-select v-model="filters.action" placeholder="选择操作类型" clearable style="width: 180px;">
              <el-option
                v-for="action in allActions"
                :key="action.value"
                :label="action.display"
                :value="action.value"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 120px;">
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleSearch" 
              :loading="loading" 
              :disabled="loading"
            >
              <el-icon><Search /></el-icon> 
              {{ loading ? '搜索中...' : '搜索' }}
            </el-button>
            <el-button @click="resetFilters" :disabled="loading">
              <el-icon><Refresh /></el-icon> 重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div v-if="loading && !logs.length" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      
      <div v-else-if="logs.length === 0" class="empty-container">
        <el-empty description="暂无日志数据" />
      </div>
      
      <div v-else class="logs-table">
        <el-table 
          :data="logs" 
          border 
          stripe 
          v-loading="tableLoading" 
          :default-sort="{ prop: 'created_at', order: 'descending' }"
          style="width: 100%"
        >
          <el-table-column label="ID" width="70" type="index" :index="indexMethod" align="center" />
          <el-table-column label="用户" width="120" align="center">
            <template #default="{ row }">
              <span class="user-cell">{{ row.user ? row.user.username : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作类型" width="180" align="center">
            <template #default="{ row }">
              <span class="action-cell">{{ row.action_display || row.action || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="目标ID" width="80" align="center">
            <template #default="{ row }">
              <span class="target-cell">{{ row.target_id || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                {{ row.status_display || row.status || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="消息内容" min-width="300" align="left">
            <template #default="{ row }">
              <span class="message-cell">{{ row.message || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="150" align="center">
            <template #default="{ row }">
              <span class="time-cell">{{ formatDate(row.created_at) }}</span>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-if="total > 0"
            background
            layout="total, prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="currentPage"
            :disabled="loading"
            :pager-count="5"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getLogs, searchLogs, getLogActionTypes } from '../api/log'
import { getUsers } from '../api/user'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const tableLoading = ref(false)
const logs = ref([])
const total = ref(0)
const currentPage = ref(parseInt(route.query.page) || 1)
const pageSize = ref(10)
const hasNextPage = ref(false)
const hasPreviousPage = ref(false)

const dateRange = ref([])
const filters = ref({
  user: '',
  action: '',
  status: ''
})

// 用户和操作类型选项列表（不依赖于当前表格数据）
const allUsers = ref([])
const allActions = ref([])

// 获取所有用户列表
async function fetchAllUsers() {
  try {
    const response = await getUsers();
    if (response && response.results) {
      allUsers.value = response.results;
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
}

// 获取所有操作类型
async function fetchAllActionTypes() {
  try {
    const response = await getLogActionTypes();
    if (response && response.results) {
      allActions.value = response.results;
    }
  } catch (error) {
    console.error('获取操作类型列表失败:', error);
    // 不再需要提供备用操作类型，因为API已经返回本地数据
  }
}

// 是否有搜索参数
const hasSearchParams = computed(() => {
  return filters.value.user || 
         filters.value.action || 
         filters.value.status || 
         (dateRange.value && dateRange.value.length === 2);
})

// 今天、昨天、最近一周、最近一个月的快捷选项
const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date()
      const start = new Date()
      return [start, end]
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      end.setTime(end.getTime() - 3600 * 1000 * 24)
      return [start, end]
    }
  },
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  }
]

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  
  try {
  const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
  } catch (error) {
    console.error('日期格式化失败:', error)
    return dateString
  }
}

// 更新URL参数
function updateUrlParams() {
  const query = {
    page: currentPage.value
  }
  
  if (filters.value.user) {
    query.user = filters.value.user
  }
  
  if (filters.value.action) {
    query.action = filters.value.action
  }
  
  if (filters.value.status) {
    query.status = filters.value.status
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    query.start_date = dateRange.value[0]
    query.end_date = dateRange.value[1]
  }
  
  router.push({ query })
}

// 重置筛选条件
function resetFilters() {
  dateRange.value = []
  filters.value = {
    user: '',
    action: '',
    status: ''
  }
  currentPage.value = 1
  hasNextPage.value = false
  hasPreviousPage.value = false
  updateUrlParams()
  fetchLogs()
}

// 计算ID显示方法
function indexMethod(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

// 获取日志列表
async function fetchLogs() {
  loading.value = true
  tableLoading.value = true
  try {
    // 构建查询参数
    const params = buildQueryParams()
    
    let response
    if (hasSearchParams.value) {
      // 有搜索参数时使用搜索API
      response = await searchLogs(params)
    } else {
      // 无搜索参数时获取普通列表
      response = await getLogs(params)
    }
    
    // 直接更新数据，确保表格内容可见
    logs.value = response.results || []
    total.value = response.count || 0
    
    // 检查是否有下一页或上一页链接
    if (response.next) {
      try {
        const nextUrl = new URL(response.next);
        const nextPage = nextUrl.searchParams.get('page');
        if (nextPage) {
          hasNextPage.value = true;
        }
      } catch (error) {
        console.error('解析next URL失败:', error)
        hasNextPage.value = false;
      }
    } else {
      hasNextPage.value = false;
    }
    
    if (response.previous) {
      try {
        const prevUrl = new URL(response.previous);
        const prevPage = prevUrl.searchParams.get('page');
        if (prevPage) {
          hasPreviousPage.value = true;
        }
      } catch (error) {
        console.error('解析previous URL失败:', error)
        hasPreviousPage.value = false;
      }
    } else {
      hasPreviousPage.value = false;
    }
    
    // 更新完数据后才移除加载状态
    loading.value = false
    tableLoading.value = false
    
    console.log('日志数据加载完成:', logs.value.length, '条记录')
  } catch (error) {
    console.error('获取日志列表失败:', error)
    ElMessage.error('获取日志列表失败')
    loading.value = false
    tableLoading.value = false
  }
}

// 处理页面变化
function handlePageChange(page) {
  if (loading.value) return;
  
  currentPage.value = page
  updateUrlParams()
  fetchLogs()
}

// 构建查询参数
function buildQueryParams() {
  const params = {
    page: currentPage.value,
    page_size: pageSize.value
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }
  
  if (filters.value.user) {
    params.user_id = filters.value.user
  }
  
  if (filters.value.action) {
    params.action = filters.value.action
  }
  
  if (filters.value.status) {
    params.status = filters.value.status
  }
  
  return params
}

// 处理搜索按钮点击
function handleSearch() {
  // 搜索时重置页码为第一页
  currentPage.value = 1
  updateUrlParams()
  fetchLogs()
}

onMounted(() => {
  // 从URL恢复筛选条件
  if (route.query.user) {
    filters.value.user = route.query.user
  }
  
  if (route.query.action) {
    filters.value.action = route.query.action
  }
  
  if (route.query.status) {
    filters.value.status = route.query.status
  }
  
  if (route.query.start_date && route.query.end_date) {
    dateRange.value = [route.query.start_date, route.query.end_date]
  }
  
  console.log('SystemLogs组件已挂载，准备获取日志数据')
  // 获取所有用户列表
  fetchAllUsers()
  // 获取所有操作类型
  fetchAllActionTypes()
  // 获取日志数据
  fetchLogs()
})
</script>

<style scoped>
.system-logs {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

.logs-card {
  min-height: 600px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.logs-table {
  margin-top: 20px;
  border-radius: 4px;
  overflow: visible;
  min-height: 400px;
}

.logs-table :deep(.el-table) {
  width: 100%;
  min-height: 300px;
  overflow: visible;
}

.logs-table :deep(.el-table__body-wrapper) {
  overflow: visible;
}

.logs-table :deep(.el-table__inner-wrapper) {
  overflow: visible;
}

.logs-table :deep(.el-table__row) {
  height: auto !important;
  min-height: 48px;
}

.logs-table :deep(.el-table__cell) {
  padding: 12px 8px;
  line-height: 1.5;
}

.user-cell, .action-cell, .target-cell, .message-cell, .time-cell {
  display: inline-block;
  width: 100%;
  overflow: visible;
  white-space: normal;
  word-break: break-word;
}

.logs-table :deep(.el-table__body tr:hover > td) {
  background-color: #f0f8ff;
}

.dark-mode .logs-table :deep(.el-table__body tr:hover > td) {
  background-color: #263445;
}

.pagination-container {
  margin-top: 24px;
  text-align: center;
}

/* 修改滚动条样式 */
:deep(::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.2);
}

@media screen and (max-width: 768px) {
  .system-logs {
    padding: 10px;
  }
  
  .filter-form {
    flex-direction: column;
  }
  
  .filter-form .el-form-item {
    margin-right: 0;
    width: 100%;
  }
}
</style> 