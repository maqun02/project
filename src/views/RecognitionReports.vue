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
                :type="getStatusType(task.status)" 
                size="small"
              >
                {{ task.status_display }}
              </el-tag>
            </div>
            
            <div class="task-content">
              <div class="task-info">
                <div class="info-item">
                  <span class="label">模式：</span>
                  <span>{{ task.mode_display }}</span>
                </div>
                <div class="info-item">
                  <span class="label">深度：</span>
                  <span>{{ task.depth }}</span>
                </div>
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
                <div class="info-item">
                  <span class="label">用户：</span>
                  <span>{{ task.user.username }}</span>
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
            <el-tab-pane label="总览" name="overview">
              <div class="overview-container">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-card class="overview-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <h3>检测到的组件</h3>
                        </div>
                      </template>
                      <div class="chart-container">
                        <div id="componentsChart" ref="componentsChart" style="height: 300px;"></div>
                      </div>
                      <div class="components-list">
                        <el-table :data="getComponentsData()" stripe>
                          <el-table-column label="组件名称" prop="name" />
                          <el-table-column label="出现页面数" prop="count" />
                        </el-table>
                      </div>
                    </el-card>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-card class="overview-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <h3>页面爬取信息</h3>
                        </div>
                      </template>
                      <el-descriptions :column="1" border>
                        <el-descriptions-item label="爬取URL">{{ reportData.url }}</el-descriptions-item>
                        <el-descriptions-item label="爬取页面总数">{{ reportData.pages.length }}</el-descriptions-item>
                        <el-descriptions-item label="检测到组件总数">{{ Object.keys(reportData.components).length }}</el-descriptions-item>
                      </el-descriptions>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="页面详情" name="pages">
              <div class="pages-container">
                <el-collapse>
                  <el-collapse-item 
                    v-for="(page, index) in reportData.pages" 
                    :key="index" 
                    :title="page.url" 
                    :name="index"
                  >
                    <div class="page-detail">
                      <div class="page-components">
                        <h4>检测到的组件</h4>
                        <el-space wrap>
                          <el-tag v-for="comp in page.components" :key="comp" type="success">
                            {{ comp }}
                          </el-tag>
                        </el-space>
                      </div>
                      
                      <div class="page-resources">
                        <h4>资源列表</h4>
                        <el-table :data="getResourcesData(page.resources)" height="250" stripe>
                          <el-table-column label="资源URL" prop="url" />
                          <el-table-column label="资源类型" prop="type" width="120" />
                        </el-table>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="组件分布" name="components">
              <div class="components-container">
                <el-collapse>
                  <el-collapse-item 
                    v-for="(pages, comp) in reportData.components" 
                    :key="comp" 
                    :title="comp" 
                    :name="comp"
                  >
                    <div class="component-pages">
                      <h4>出现在以下页面</h4>
                      <el-table :data="pages.map(url => ({ url }))" height="250" stripe>
                        <el-table-column label="页面URL" prop="url" />
                      </el-table>
                    </div>
                  </el-collapse-item>
                </el-collapse>
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
    taskList.value = response.results || []
    total.value = response.count || 0
    
    // 获取所有已完成的任务（用于选择框）
    completedTasks.value = taskList.value.filter(task => task.status === 'completed')
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
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

// 获取状态类型
function getStatusType(status) {
  const statusMap = {
    'pending': 'info',
    'running': 'warning',
    'completed': 'success',
    'failed': 'danger'
  }
  return statusMap[status] || 'info'
}

// 加载任务报告
async function loadTaskReport() {
  if (!selectedTaskId.value) return
  
  loading.value = true
  try {
    const response = await getTaskReport(selectedTaskId.value)
    reportData.value = response
    
    // 等待DOM更新后初始化图表
    nextTick(() => {
      initComponentsChart()
    })
  } catch (error) {
    console.error('加载任务报告失败:', error)
    ElMessage.error('加载任务报告失败')
    reportData.value = null
  } finally {
    loading.value = false
  }
}

// 初始化组件图表
function initComponentsChart() {
  if (!reportData.value) return
  
  // 如果已存在图表实例，先销毁
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  // 获取组件数据
  const componentsData = Object.entries(reportData.value.components).map(([name, pages]) => ({
    name,
    value: pages.length
  }))
  
  // 初始化图表
  chartInstance = echarts.init(componentsChart.value)
  
  // 配置图表选项
  const option = {
    title: {
      text: '组件分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: componentsData.map(item => item.name)
    },
    series: [
      {
        name: '组件使用情况',
        type: 'pie',
        radius: '50%',
        data: componentsData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  // 渲染图表
  chartInstance.setOption(option)
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
}

// 获取组件数据（用于表格展示）
function getComponentsData() {
  if (!reportData.value || !reportData.value.components) return []
  
  return Object.entries(reportData.value.components).map(([name, pages]) => ({
    name,
    count: pages.length
  }))
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

// 转换资源数组为表格数据
function getResourcesData(resources) {
  if (!resources || !Array.isArray(resources)) return []
  return resources.map(url => ({
    url,
    type: getResourceType(url)
  }))
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
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-url {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.task-info {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.info-item {
  font-size: 14px;
  display: flex;
  align-items: center;
}

.label {
  color: #909399;
  margin-right: 5px;
}

.task-actions {
  margin-left: 16px;
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.report-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.report-tabs {
  margin-top: 20px;
}

.overview-card {
  margin-bottom: 20px;
}

.chart-container {
  margin-bottom: 20px;
}

.page-detail, 
.component-pages {
  padding: 10px;
}

.page-components, 
.page-resources {
  margin-bottom: 20px;
}

.page-components h4,
.page-resources h4,
.component-pages h4 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}
</style> 