<template>
  <div class="recognition-reports">
    <el-card class="report-card">
      <template #header>
        <div class="card-header">
          <h2>识别报告</h2>
          <div class="header-actions" v-if="!selectedTaskId">
            <el-select 
              v-model="selectedTaskId" 
              placeholder="选择任务查看报告" 
              clearable 
              filterable
              @change="loadTaskReport"
            >
              <el-option 
                v-for="task in completedTasks" 
                :key="task.id" 
                :label="task.url" 
                :value="task.id" 
              />
            </el-select>
          </div>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton animated :rows="10" />
      </div>
      
      <div v-else-if="!selectedTaskId" class="empty-container">
        <el-empty description="请选择任务查看报告" />
      </div>
      
      <div v-else-if="reportData" class="report-content">
        <div class="report-header">
          <h3>{{ reportData.url }}</h3>
          <el-button size="small" @click="selectedTaskId = null">选择其他任务</el-button>
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTasks, getTaskReport } from '../api/task'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须的组件
echarts.use([PieChart, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

const route = useRoute()
const loading = ref(false)
const completedTasks = ref([])
const selectedTaskId = ref(null)
const reportData = ref(null)
const activeTab = ref('overview')
const componentsChart = ref(null)
let chartInstance = null

// 从路由参数中获取任务ID
onMounted(async () => {
  const taskId = route.query.taskId
  if (taskId) {
    selectedTaskId.value = Number(taskId)
  }
  
  await fetchCompletedTasks()
  
  if (selectedTaskId.value) {
    loadTaskReport()
  }
})

// 监听任务ID变化，加载报告
watch(selectedTaskId, (newVal) => {
  if (newVal) {
    loadTaskReport()
  } else {
    reportData.value = null
  }
})

// 获取已完成的任务列表
async function fetchCompletedTasks() {
  loading.value = true
  try {
    const response = await getTasks()
    completedTasks.value = response.results.filter(task => task.status === 'completed')
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
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
  justify-content: center;
  align-items: center;
  min-height: 400px;
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