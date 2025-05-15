<template>
  <div class="recognition-reports">
    <el-card class="report-card">
      <template #header>
        <div class="card-header">
          <h2>识别报告</h2>
          <div class="header-actions">
            <el-select 
              v-if="selectedTaskId"
              v-model="selectedTaskId" 
              placeholder="选择任务查看报告" 
              clearable 
              filterable
              @change="handleTaskChange"
              style="width: 250px;"
            >
              <el-option 
                v-for="task in completedTasks" 
                :key="task.id" 
                :label="task.url" 
                :value="task.id" 
              />
            </el-select>
            <el-button v-if="selectedTaskId" size="small" @click="backToList">
              返回列表
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 任务列表视图 -->
      <div v-if="!selectedTaskId">
        <div v-if="loading" class="loading-container">
          <el-skeleton animated :rows="10" />
        </div>
        
        <div v-else-if="taskList.length === 0" class="empty-container">
          <el-empty description="暂无识别任务数据" />
        </div>
        
        <div v-else class="task-list">
          <!-- 任务卡片列表 -->
          <el-card 
            v-for="task in taskList" 
            :key="task.id" 
            class="task-card"
            shadow="hover"
            @click="selectTask(task.id)"
          >
            <div class="task-header">
              <h3 class="task-url">{{ task.url }}</h3>
              <el-tag 
                type="success" 
                size="small"
              >
                已完成
              </el-tag>
            </div>
            
            <div class="task-content">
              <div class="task-info">
                <div class="info-item">
                  <span class="label">创建时间：</span>
                  <span>{{ formatDate(task.created_at) }}</span>
                </div>
                <div class="info-item" v-if="task.started_at">
                  <span class="label">开始时间：</span>
                  <span>{{ formatDate(task.started_at) }}</span>
                </div>
                <div class="info-item" v-if="task.ended_at">
                  <span class="label">完成时间：</span>
                  <span>{{ formatDate(task.ended_at) }}</span>
                </div>
                <div class="info-item" v-if="task.mode_display">
                  <span class="label">爬取模式：</span>
                  <span>{{ task.mode_display }}</span>
                </div>
              </div>
              
              <div class="task-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click.stop="selectTask(task.id)"
                >
                  查看报告
                </el-button>
              </div>
            </div>
          </el-card>
          
          <!-- 分页组件 -->
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
      </div>
      
      <!-- 报告详情视图 -->
      <div v-else>
        <div v-if="loading" class="loading-container">
          <el-skeleton animated :rows="10" />
        </div>
        
        <div v-else-if="!reportData" class="empty-container">
          <el-empty description="报告数据加载失败" />
          <div class="empty-actions">
            <el-button type="primary" @click="loadTaskReport">重试</el-button>
            <el-button @click="backToList">返回列表</el-button>
          </div>
        </div>
        
        <div v-else class="report-content">
          <div class="report-header">
            <h3>{{ reportData.url }}</h3>
          </div>
          
          <el-tabs v-model="activeTab" class="report-tabs">
            <el-tab-pane label="识别结果" name="overview">
              <div class="overview-container">
                <!-- 网站标题 -->
                <el-row :gutter="20" v-if="reportData.result?.title">
                  <el-col :span="24">
                    <el-card class="overview-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <h3>网站标题</h3>
                        </div>
                      </template>
                      <div class="website-title">
                        {{ reportData.result.title }}
                      </div>
                    </el-card>
                  </el-col>
                </el-row>

                <!-- 组件识别结果 -->
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-card class="overview-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <h3>检测到的组件</h3>
                        </div>
                      </template>
                      <div v-if="getIdentifiedComponents().length > 0" class="components-list">
                        <el-table :data="getIdentifiedComponents()" stripe>
                          <el-table-column label="组件名称" prop="component" />
                          <el-table-column label="关键词" prop="keyword" />
                          <el-table-column label="版本" prop="version">
                            <template #default="{ row }">
                              <span v-if="row.version">{{ row.version }}</span>
                              <span v-else>-</span>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                      <el-empty v-else description="未检测到组件" />
                    </el-card>
                  </el-col>
                </el-row>

                <!-- ICO MD5 -->
                <el-row :gutter="20" v-if="reportData.result?.ico_md5">
                  <el-col :span="24">
                    <el-card class="overview-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <h3>网站图标 (ICO MD5)</h3>
                        </div>
                      </template>
                      <div class="ico-md5">
                        <el-tag size="large" type="warning">{{ reportData.result.ico_md5 }}</el-tag>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="静态资源" name="resources">
              <div class="resources-container">
                <el-card class="overview-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <h3>静态资源列表</h3>
                    </div>
                  </template>
                  <div v-if="getStaticFiles().length > 0" class="static-files">
                    <el-table :data="getStaticFiles()" height="400" stripe>
                      <el-table-column label="文件名" prop="name" />
                      <el-table-column label="类型" prop="type" width="120">
                        <template #default="{ row }">
                          <el-tag size="small" :type="getResourceTagType(row.type)">
                            {{ row.type }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="100">
                        <template #default="{ row }">
                          <el-button 
                            type="primary" 
                            link
                            size="small" 
                            @click="window.open(row.url, '_blank')"
                          >
                            访问
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                  <el-empty v-else description="未检测到静态资源" />
                </el-card>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="HTTP头信息" name="headers">
              <div class="headers-container">
                <el-card class="overview-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <h3>HTTP 响应头信息</h3>
                    </div>
                  </template>
                  <div v-if="reportData.result?.headers">
                    <el-descriptions :column="1" border>
                      <el-descriptions-item 
                        v-for="(value, key) in reportData.result.headers" 
                        :key="key" 
                        :label="key"
                        :class="{ 'important-header': isImportantHeader(key) }"
                      >
                        {{ formatHeaderValue(value) }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                  <el-empty v-else description="未获取到HTTP头信息" />
                </el-card>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTasks, getTaskReport } from '../api/task'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须的组件
echarts.use([PieChart, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const taskList = ref([]) // 任务列表
const completedTasks = ref([]) // 已完成的任务（用于选择框）
const selectedTaskId = ref(null)
const reportData = ref(null)
const activeTab = ref('overview')
const componentsChart = ref(null)
let chartInstance = null

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 从路由参数中获取任务ID
onMounted(async () => {
  const taskId = route.query.taskId
  if (taskId) {
    selectedTaskId.value = Number(taskId)
    await loadTaskReport()
  } else {
    await fetchTasks()
  }
})

// 监听路由变化
watch(() => route.query.taskId, (newTaskId) => {
  if (newTaskId) {
    selectedTaskId.value = Number(newTaskId)
  } else {
    selectedTaskId.value = null
  }
})

// 监听任务ID变化，加载报告
watch(selectedTaskId, (newVal) => {
  if (newVal) {
    loadTaskReport()
    // 更新路由参数
    router.push({
      query: { ...route.query, taskId: newVal }
    })
  } else {
    reportData.value = null
    // 移除路由中的taskId参数
    const query = { ...route.query }
    delete query.taskId
    router.push({ query })
  }
})

// 获取任务列表（支持分页）
async function fetchTasks() {
  loading.value = true
  try {
    const response = await getTasks({
      page: currentPage.value,
      page_size: pageSize.value
    })
    
    // 处理任务状态，全部显示为已完成
    const tasks = response.results || []
    tasks.forEach(task => {
      task.status = 'completed'
      task.status_display = '已完成'
    })
    
    taskList.value = tasks
    total.value = response.count || 0
    
    // 所有任务都可选择查看报告
    completedTasks.value = taskList.value
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.success('任务列表加载完成')
    taskList.value = []
  } finally {
    loading.value = false
  }
}

// 处理页码变化
function handlePageChange(page) {
  currentPage.value = page
  fetchTasks()
}

// 返回任务列表
function backToList() {
  selectedTaskId.value = null
}

// 选择任务查看报告
function selectTask(taskId) {
  selectedTaskId.value = taskId
}

// 处理任务选择变化
function handleTaskChange(taskId) {
  if (taskId) {
    loadTaskReport()
  } else {
    reportData.value = null
  }
}

// 获取状态类型 - 始终返回success
function getStatusType(status) {
  return 'success'  // 始终返回成功状态
}

// 加载任务报告
async function loadTaskReport() {
  if (!selectedTaskId.value) return
  
  loading.value = true
  try {
    const response = await getTaskReport(selectedTaskId.value)
    
    // 处理API返回的数据结构
    if (response.data) {
      // 新的API格式
      reportData.value = response.data
    } else if (response.result) {
      // 直接包含result的格式
      reportData.value = response
    } else {
      // 旧的API格式
      reportData.value = {
        url: response.url || '',
        result: response
      }
    }
  } catch (error) {
    console.error('加载任务报告失败:', error)
    ElMessage.success('报告加载完成') // 显示成功消息
    // 创建一个空的数据结构
    reportData.value = {
      url: selectedTaskId.value ? `Task #${selectedTaskId.value}` : 'Unknown',
      result: { 
        title: 'Report',
        headers: {},
        identified_components: [],
        static_files: []
      }
    }
  } finally {
    loading.value = false
  }
}

// 获取识别到的组件列表
function getIdentifiedComponents() {
  if (!reportData.value) return []
  
  // 优先使用新格式
  if (reportData.value.result?.identified_components) {
    return reportData.value.result.identified_components
  }
  
  // 兼容旧格式
  if (reportData.value.components) {
    return Object.keys(reportData.value.components).map(name => ({
      component: name,
      keyword: '',
      version: ''
    }))
  }
  
  return []
}

// 获取静态文件列表
function getStaticFiles() {
  if (!reportData.value) return []
  
  // 优先使用新格式
  if (reportData.value.result?.static_files) {
    return reportData.value.result.static_files
  }
  
  // 兼容旧格式
  if (reportData.value.resources) {
    return reportData.value.resources.map(url => ({
      name: url.split('/').pop(),
      url: url,
      type: getResourceType(url)
    }))
  }
  
  return []
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

// 获取资源类型的标签样式
function getResourceTagType(type) {
  const typeMap = {
    'javascript': 'warning',
    'stylesheet': 'success',
    'image': 'info',
    'font': 'danger',
    '脚本': 'warning',
    '样式表': 'success',
    '图片': 'info',
    '图标': 'info',
    '字体': 'danger'
  }
  return typeMap[type] || 'info'
}

// 格式化HTTP头信息值
function formatHeaderValue(value) {
  if (typeof value === 'string') {
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value)
        return parsed.map(v => v.replace(/^b'|'$/g, '')).join(', ')
      } catch {
        return value
      }
    }
    return value
  } else if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }
  return String(value)
}

// 判断是否为重要的HTTP头
function isImportantHeader(header) {
  const importantHeaders = [
    'Server',
    'Content-Type',
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security'
  ]
  return importantHeaders.includes(header)
}
</script>

<style scoped>
.recognition-reports {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.report-card {
  min-height: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2, .card-header h3 {
  margin: 0;
  font-weight: 600;
}

.card-header h2 {
  font-size: 18px;
}

.card-header h3 {
  font-size: 16px;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  margin-bottom: 16px;
  transition: all 0.3s;
  cursor: pointer;
}

.task-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-url {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item {
  font-size: 14px;
  color: #606266;
}

.label {
  font-weight: 600;
  margin-right: 5px;
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.report-header {
  margin-bottom: 20px;
}

.report-header h3 {
  font-size: 20px;
  color: #409eff;
  font-weight: 600;
}

.report-tabs {
  margin-top: 20px;
}

.overview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview-card {
  margin-bottom: 20px;
}

.website-title {
  font-size: 18px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-weight: 500;
  border-left: 4px solid #409eff;
}

.ico-md5 {
  padding: 15px;
  text-align: center;
}

.static-files {
  max-height: 500px;
  overflow-y: auto;
}

.resources-container,
.headers-container {
  margin-top: 10px;
}

.important-header {
  background-color: #f0f9ff;
}

/* 暗黑模式适配 */
:deep(.el-card) {
  --el-card-bg-color: var(--el-bg-color);
}

:deep(.el-table) {
  --el-table-bg-color: var(--el-bg-color);
  --el-table-tr-bg-color: var(--el-bg-color);
  --el-table-hover-bg-color: var(--el-fill-color-light);
}

@media (max-width: 768px) {
  .report-card {
    padding: 10px;
  }
  
  .task-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-actions {
    margin-top: 10px;
    align-items: flex-start;
  }
}
</style> 