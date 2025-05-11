<template>
  <div class="fingerprint-recognition" :class="{ 'dark-mode': isDarkMode }">
    <div class="page-content">
      <div class="page-header">
        <h1>指纹识别</h1>
        <p class="sub-title">输入目标网站URL，系统将识别其使用的前端组件</p>
      </div>

      <div class="main-content">
        <div class="content-section">
          <el-card class="recognition-card" shadow="hover">
      <template #header>
        <div class="card-header">
                <h2>
                  <el-icon class="header-icon"><Search /></el-icon>
                  开始识别
                </h2>
        </div>
      </template>
      
      <el-form 
        ref="searchForm" 
        :model="form" 
        :rules="rules" 
              label-position="top"
        class="search-form"
      >
        <el-form-item label="目标URL" prop="url">
          <el-input 
            v-model="form.url" 
            placeholder="请输入网站URL，例如：https://example.com"
            clearable
                  size="large"
                >
                  <template #prefix>
                    <el-icon><Link /></el-icon>
                  </template>
                </el-input>
        </el-form-item>
        
        <el-form-item label="爬取模式" prop="mode">
                <div class="mode-selection-wrapper">
                  <el-radio-group v-model="form.mode" size="large">
                    <el-radio-button label="simple">简单模式</el-radio-button>
                    <el-radio-button label="deep">深度模式</el-radio-button>
          </el-radio-group>
                  <el-tooltip 
                    :content="form.mode === 'simple' ? '简单模式：仅分析主页，速度快' : '深度模式：分析多个页面，结果更全面'" 
                    placement="top"
                  >
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>
        </el-form-item>
        
        <el-form-item v-if="form.mode === 'deep'" label="爬取深度" prop="depth">
                <el-radio-group v-model="form.depth" size="large" class="depth-selector">
                  <el-radio-button :label="1">1</el-radio-button>
                  <el-radio-button :label="2">2</el-radio-button>
                  <el-radio-button :label="3">3</el-radio-button>
                </el-radio-group>
                <div class="depth-tips">
                  <span v-if="form.depth === 1">浅层爬取</span>
                  <span v-else-if="form.depth === 2">中度爬取</span>
                  <span v-else>深度爬取</span>
                </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
                  size="large"
                  class="submit-btn"
            @click="submitTask"
                  :disabled="loading"
          >
                  <el-icon v-if="!loading"><Operation /></el-icon>
                  <span v-if="!loading">开始识别</span>
                  <span v-else>正在识别中...</span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
          <el-card v-if="!loading && (taskResults.length > 0 || loadingResults)" class="results-card" shadow="hover">
      <template #header>
        <div class="card-header">
                <h2>
                  <el-icon class="header-icon"><DataAnalysis /></el-icon>
                  识别结果
                </h2>
                <template v-if="currentTask">
                  <div class="status-wrapper">
                    <el-progress 
                      v-if="currentTask.status === 'running' || currentTask.status === 'queued'"
                      type="circle" 
                      :percentage="getTaskCompletionPercent()" 
                      :status="currentTask.status === 'running' ? 'exception' : 'warning'"
                      :width="36"
                      :stroke-width="6"
                    />
                    <el-tag v-else :type="getTaskStatusType(currentTask.status)" effect="dark" round>
                      {{ currentTask.status_display }}
                    </el-tag>
                  </div>
                </template>
        </div>
      </template>
      
      <div v-if="loadingResults" class="loading-results">
              <div class="loading-animation">
                <el-icon class="loading-icon" :size="64"><Loading /></el-icon>
                <p>正在加载结果，请稍候...</p>
              </div>
      </div>
      
      <div v-else-if="taskResults.length === 0" class="no-results">
              <el-empty description="暂无识别结果，请等待识别完成。" />
      </div>
      
      <div v-else class="results-container">
        <template v-for="(result, index) in taskResults" :key="index">
          <el-card class="result-item" shadow="hover">
            <template #header>
              <div class="result-header">
                      <h3>
                        <el-icon><Link /></el-icon>
                        {{ result.url }}
                      </h3>
              </div>
            </template>
            
            <div v-if="result.components.length > 0" class="result-components">
                    <h4>
                      <el-icon><Cpu /></el-icon>
                      检测到的组件：
                    </h4>
              <el-space wrap>
                      <el-tag 
                        v-for="component in result.components" 
                        :key="component.id" 
                        type="success"
                        effect="light"
                        round
                      >
                  {{ component.component }}
                </el-tag>
              </el-space>
            </div>
            
            <div class="result-resources">
                    <h4>
                      <el-icon><Document /></el-icon>
                      检测到的资源：
                    </h4>
              <el-collapse>
                <el-collapse-item title="查看资源列表" name="1">
                        <el-table :data="getResourcesData(result.resources)" stripe style="width: 100%">
                          <el-table-column label="资源URL" prop="url" show-overflow-tooltip />
                    <el-table-column label="资源类型" prop="type" width="120" />
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </div>
            
            <div class="result-headers">
                    <h4>
                      <el-icon><Connection /></el-icon>
                      HTTP 头信息：
                    </h4>
              <el-collapse>
                <el-collapse-item title="查看头信息" name="1">
                  <el-descriptions :column="1" border>
                    <el-descriptions-item 
                      v-for="(value, key) in result.headers" 
                      :key="key" 
                      :label="key"
                    >{{ value }}</el-descriptions-item>
                  </el-descriptions>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-card>
        </template>
        
        <div class="view-report">
          <el-button 
            type="primary" 
            @click="viewDetailedReport"
            :disabled="!currentTask || currentTask.status !== 'completed'"
                  size="large"
                  round
          >
                  <el-icon><DocumentCopy /></el-icon>
            查看详细报告
          </el-button>
        </div>
      </div>
    </el-card>
    
          <el-card class="recent-tasks-card" shadow="hover">
      <template #header>
        <div class="card-header">
                <h2>
                  <el-icon class="header-icon"><Calendar /></el-icon>
                  近期任务
                </h2>
                <el-button @click="fetchRecentTasks" :loading="taskListLoading" type="primary" text>
                  <el-icon><Refresh /></el-icon>
                </el-button>
        </div>
      </template>
      
            <div v-if="taskListLoading && recentTasks.length === 0" class="loading-tasks">
              <el-skeleton :rows="3" animated />
            </div>
            
            <div v-else-if="recentTasks.length === 0" class="empty-tasks">
              <el-empty description="暂无任务记录" />
            </div>
            
            <div v-else class="tasks-container">
              <el-table 
                :data="displayedTasks" 
                stripe 
                style="width: 100%" 
                :highlight-current-row="true"
                @row-click="(row) => loadTaskResults(row.id)"
                v-loading="taskListLoading"
                :show-header="false"
                size="small"
                :max-height="180"
              >
                <el-table-column label="URL" prop="url" show-overflow-tooltip min-width="160" />
                <el-table-column label="状态" width="80">
          <template #default="{ row }">
                    <el-tooltip 
                      :content="row.status === 'completed' ? '识别完成' : 
                               row.status === 'running' ? '识别中' : 
                               row.status === 'queued' ? '排队中' : '识别失败'" 
                      placement="top"
                    >
                      <el-tag 
                        :type="getTaskStatusType(row.status)" 
                        effect="light" 
                        size="small" 
                        round
                      >
                        {{ row.status_display }}
                      </el-tag>
                    </el-tooltip>
          </template>
        </el-table-column>
                <el-table-column label="操作" width="60">
          <template #default="{ row }">
                    <el-popconfirm
                      title="确定要删除该任务吗？此操作将同时删除相关的结果和报告。"
                      confirm-button-text="确定"
                      cancel-button-text="取消"
                      @confirm="deleteTaskHandler(row.id)"
                    >
                      <template #reference>
                        <el-button type="danger" size="small" circle @click.stop>
                          <el-icon><Delete /></el-icon>
              </el-button>
                      </template>
                    </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
              
              <div class="tasks-footer" v-if="recentTasks.length > 3">
                <p class="tasks-tip">
                  <el-icon><InfoFilled /></el-icon> 
                  点击任务行可查看详细结果
                </p>
                <el-link type="primary" @click="viewAllTasks" class="view-all-link">查看全部任务</el-link>
              </div>
            </div>
    </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createTask, getTasks, getTaskStatus, restartTask, deleteTask, getTaskResults } from '../api/task'
import { Search, Operation, DataAnalysis, Link, Cpu, Document, Connection, Calendar, More, View, Delete, RefreshRight, DocumentCopy, Refresh, InfoFilled, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const searchForm = ref(null)
const loading = ref(false)
const loadingResults = ref(false)
const currentTask = ref(null)
const taskResults = ref([])
const recentTasks = ref([])
const statusCheckInterval = ref(null)
const activeTaskId = ref(null)
const taskListLoading = ref(false)

// 计算仅显示前3个任务
const displayedTasks = computed(() => {
  return recentTasks.value.slice(0, 3);
})

const form = ref({
  url: '',
  mode: 'simple',
  depth: 3
})

const rules = {
  url: [
    { required: true, message: '请输入目标网站URL', trigger: 'blur' },
    { 
      pattern: /^(http|https):\/\/[^ "]+\.[a-zA-Z]{2,}/, 
      message: '请输入有效的URL地址，应以http://或https://开头并包含有效域名', 
      trigger: 'blur' 
    }
  ],
  mode: [
    { required: true, message: '请选择爬取模式', trigger: 'change' }
  ],
  depth: [
    { required: true, message: '请选择爬取深度', trigger: 'change' }
  ]
}

// 在script setup中添加暗色模式检测
const isDarkMode = ref(document.documentElement.classList.contains('dark'))

// 监听主题变化
function listenForThemeChanges() {
  const observer = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('dark')
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  return observer
}

// 增强结果组件的加载体验
function getTaskCompletionPercent() {
  if (!currentTask.value) return 0
  
  switch (currentTask.value.status) {
    case 'queued': return 10
    case 'running': return 60
    case 'completed': return 100
    case 'failed': return 100
    default: return 0
  }
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
    minute: '2-digit',
  }).format(date)
}

// 获取任务状态类型
function getTaskStatusType(status) {
  switch (status) {
    case 'queued':
      return 'info'
    case 'running':
      return 'warning'
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

// 从资源URL猜测资源类型
function getResourceType(url) {
  const extension = url.split('.').pop().toLowerCase()
  const queryParamIndex = extension.indexOf('?')
  const ext = queryParamIndex > -1 ? extension.substring(0, queryParamIndex) : extension
  
  const typeMap = {
    'js': '脚本',
    'css': '样式表',
    'jpg': '图片',
    'jpeg': '图片',
    'png': '图片',
    'gif': '图片',
    'svg': '图片',
    'ico': '图标',
    'woff': '字体',
    'woff2': '字体',
    'ttf': '字体',
    'eot': '字体',
    'html': 'HTML',
    'htm': 'HTML',
    'json': 'JSON',
    'xml': 'XML'
  }
  
  return typeMap[ext] || '其他'
}

// 转换资源数组为表格数据
function getResourcesData(resources) {
  if (!resources || !Array.isArray(resources)) return []
  return resources.map(url => ({
    url,
    type: getResourceType(url)
  }))
}

// 提交任务
async function submitTask() {
  searchForm.value.validate(async valid => {
    if (!valid) {
      ElMessage.warning('请正确填写表单后再提交')
      return false
    }
    
    loading.value = true
    try {
      const response = await createTask(form.value)
      ElMessage.success({
        message: '任务已提交，正在处理中',
        duration: 3000,
        showClose: true
      })
      currentTask.value = response
      activeTaskId.value = response.id
      await fetchRecentTasks()
      startStatusCheck(response.id)
      
      // 滚动到结果区域
      if (taskResults.value.length === 0) {
        // 稍微延迟以等待DOM更新
        setTimeout(() => {
          document.querySelector('.results-card')?.scrollIntoView({ behavior: 'smooth' })
        }, 300)
      }
    } catch (error) {
      console.error('提交任务失败:', error)
      ElMessage.error('提交任务失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}

// 获取近期任务
async function fetchRecentTasks() {
  taskListLoading.value = true
  try {
    const response = await getTasks()
    recentTasks.value = response.results.slice(0, 10) // 只显示最近10个
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.warning('获取近期任务失败')
  } finally {
    taskListLoading.value = false
  }
}

// 加载任务结果
async function loadTaskResults(taskId) {
  if (activeTaskId.value === taskId) return
  
  loadingResults.value = true
  taskResults.value = []
  activeTaskId.value = taskId
  
  try {
    // 先获取任务详情
    const tasks = await getTasks()
    const task = tasks.results.find(t => t.id === taskId)
    if (task) {
      currentTask.value = task
      startStatusCheck(taskId)
      
      // 如果是移动设备，滚动到结果区域
      if (window.innerWidth < 992) {
        setTimeout(() => {
          document.querySelector('.results-card')?.scrollIntoView({ behavior: 'smooth' })
        }, 300)
      }
    }
    
    // 获取任务结果
    const results = await getTaskResults(taskId)
    if (results && results.results) {
      taskResults.value = results.results
    }
  } catch (error) {
    console.error('获取任务结果失败:', error)
    ElMessage.error('获取任务结果失败')
  } finally {
    loadingResults.value = false
  }
}

// 查看详细报告
function viewDetailedReport() {
  if (currentTask.value) {
    router.push({
      path: '/dashboard/recognition-reports',
      query: { taskId: currentTask.value.id }
    })
  }
}

// 重启任务
async function restartTaskHandler(taskId) {
  try {
    await restartTask(taskId)
    ElMessage.success({
      message: '任务已重新启动',
      type: 'success',
      duration: 2000
    })
    await fetchRecentTasks()
    
    // 如果是当前任务，更新状态
    if (currentTask.value && currentTask.value.id === taskId) {
      startStatusCheck(taskId)
    }
  } catch (error) {
    console.error('重启任务失败:', error)
    ElMessage.error('重启任务失败')
  }
}

// 删除任务
async function deleteTaskHandler(taskId) {
  ElMessageBox.confirm('确定要删除该任务吗？此操作将同时删除相关的结果和报告。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteTask(taskId)
      ElMessage.success('任务已删除')
      await fetchRecentTasks()
      
      // 如果删除的是当前任务，清空结果
      if (currentTask.value && currentTask.value.id === taskId) {
        currentTask.value = null
        taskResults.value = []
        activeTaskId.value = null
        stopStatusCheck()
      }
    } catch (error) {
      console.error('删除任务失败:', error)
      ElMessage.error('删除任务失败')
    }
  }).catch(() => {})
}

// 开始状态检查
function startStatusCheck(taskId) {
  // 先清除之前的检查
  stopStatusCheck()
  
  // 立即检查一次
  checkTaskStatus(taskId)
  
  // 定时检查
  statusCheckInterval.value = setInterval(() => {
    checkTaskStatus(taskId)
  }, 3000) // 每3秒检查一次
}

// 停止状态检查
function stopStatusCheck() {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value)
    statusCheckInterval.value = null
  }
}

// 检查任务状态
async function checkTaskStatus(taskId) {
  try {
    const status = await getTaskStatus(taskId)
    
    // 更新当前任务状态
    if (currentTask.value && currentTask.value.id === taskId) {
      currentTask.value.status = status.status
      currentTask.value.status_display = status.status_display
      
      // 如果任务已完成或失败，停止检查并获取结果
      if (status.status === 'completed') {
        stopStatusCheck()
        loadTaskResults(taskId)
      } else if (status.status === 'failed') {
        stopStatusCheck()
        ElMessage.error('任务执行失败')
      }
    }
    
    // 同时更新任务列表中的状态
    const taskIndex = recentTasks.value.findIndex(t => t.id === taskId)
    if (taskIndex > -1) {
      recentTasks.value[taskIndex].status = status.status
      recentTasks.value[taskIndex].status_display = status.status_display
    }
  } catch (error) {
    console.error('检查任务状态失败:', error)
    stopStatusCheck()
  }
}

// 监听窗口大小变化，实现响应式调整
const handleResize = () => {
  // 这里可以添加响应式相关的逻辑
  // 例如：调整表格列宽或布局等
}

let themeObserver = null

onMounted(async () => {
  await fetchRecentTasks()
  window.addEventListener('resize', handleResize)
  themeObserver = listenForThemeChanges()
})

onUnmounted(() => {
  stopStatusCheck()
  window.removeEventListener('resize', handleResize)
  if (themeObserver) themeObserver.disconnect()
})

// 添加查看全部任务的方法
function viewAllTasks() {
  router.push('/dashboard/recognition-reports');
}
</script>

<style scoped>
.fingerprint-recognition {
  width: 100%;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  background-color: #f5f7fa;
  overflow-x: hidden;
}

.dark-mode {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.page-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
  padding-top: 16px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #409eff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark-mode .page-header h1 {
  color: #64b5ff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.sub-title {
  color: #909399;
  font-size: 16px;
}

.dark-mode .sub-title {
  color: #a0a0a0;
}

.main-content {
  width: 100%;
}

.content-section {
  width: 100%;
  margin: 0 auto;
}

.recognition-card,
.recent-tasks-card,
.results-card {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.tasks-footer {
  padding: 10px 0;
  margin-top: 10px;
  text-align: center;
  border-top: 1px dashed #eeeeee;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.view-all-link {
  font-size: 14px;
  font-weight: 500;
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

.dark-mode :deep(::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.1);
}

.dark-mode :deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.2);
}

/* 其他样式保持不变 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.header-icon {
  margin-right: 8px;
  font-size: 18px;
}

.search-form {
  width: 100%;
}

.mode-selection-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.info-icon:hover {
  color: #409eff;
  transform: scale(1.1);
}

.dark-mode .info-icon {
  color: #a0a0a0;
}

.dark-mode .info-icon:hover {
  color: #64b5ff;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.result-item {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.25s;
}

.result-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dark-mode .result-header h3 {
  color: #64b5ff;
}

.result-components,
.result-resources,
.result-headers {
  margin-bottom: 20px;
}

.result-components h4,
.result-resources h4,
.result-headers h4 {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.dark-mode .result-components h4,
.dark-mode .result-resources h4,
.dark-mode .result-headers h4 {
  color: #c0c0c0;
}

.view-report {
  margin-top: 24px;
  text-align: center;
}

.loading-results,
.no-results,
.loading-tasks,
.empty-tasks {
  padding: 30px;
  text-align: center;
  color: #909399;
}

.tasks-container {
  display: flex;
  flex-direction: column;
}

.tasks-tip {
  color: #909399;
  font-size: 14px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.more-btn {
  transition: transform 0.2s;
}

.more-btn:hover {
  transform: scale(1.15);
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  background-color: #f8f9fa;
}

.dark-mode :deep(.el-card__header) {
  background-color: #2c2c2c;
  border-bottom-color: #3e3e3e;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table .el-table__row) {
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.el-table .el-table__row:hover) {
  background-color: #ecf5ff;
}

.dark-mode :deep(.el-table .el-table__row:hover) {
  background-color: #263445;
}

:deep(.el-tag) {
  transition: all 0.2s;
}

:deep(.el-radio-button__inner) {
  padding: 10px 20px;
}

:deep(.el-input-number__decrease) {
  margin-left: 10px;
}

:deep(.el-input-number__increase) {
  margin-right: 10px;
}

/* 加载状态优化 */
.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.loading-icon {
  animation: rotate 1.5s linear infinite;
  color: #409eff;
  margin-bottom: 16px;
}

.status-wrapper {
  display: flex;
  align-items: center;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .content-section {
    flex-basis: 100%;
    padding: 0 16px;
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 24px;
  }
  
  .sub-title {
    font-size: 14px;
  }
  
  .submit-btn {
    height: 40px;
    font-size: 14px;
  }
}

:deep(.el-collapse-item__header) {
  padding: 0 10px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.depth-selector {
  width: 100%;
  display: flex;
}

.depth-selector :deep(.el-radio-button) {
  flex: 1;
}

.depth-selector :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 10px 0;
}

.depth-tips {
  margin-top: 8px;
  color: #909399;
  font-size: 14px;
  text-align: center;
}

.dark-mode .depth-tips {
  color: #a0a0a0;
}
</style> 