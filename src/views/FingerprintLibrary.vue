<template>
  <div class="fingerprint-library">
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <h2>指纹库管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showAddForm">
              <el-icon><Plus /></el-icon> 新增指纹
            </el-button>
            <el-button type="success" @click="showBatchAddForm">
              <el-icon><Upload /></el-icon> 批量添加
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="关键词">
            <el-input v-model="filters.keyword" placeholder="搜索关键词" clearable />
          </el-form-item>
          
          <el-form-item label="组件名称">
            <el-input v-model="filters.component" placeholder="搜索组件名称" clearable />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 120px;">
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
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
              {{ loading && hasSearchParams ? '搜索中...' : '搜索' }}
            </el-button>
            <el-button @click="resetFilters" :disabled="loading">
              <el-icon><Refresh /></el-icon> 重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    
    <div class="fingerprint-list">
      <el-row :gutter="20">
        <template v-if="loading">
          <el-col v-for="i in 6" :key="i" :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-skeleton style="width: 100%;" :rows="3" animated />
          </el-col>
        </template>
        
        <template v-else-if="fingerprints.length === 0">
          <el-col :span="24">
            <el-empty description="暂无指纹数据" />
          </el-col>
        </template>
        
        <template v-else>
          <el-col v-for="fingerprint in fingerprints" :key="fingerprint.id" :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-card 
              class="fingerprint-card" 
              shadow="hover"
              :style="{
                backgroundColor: fingerprint.bgColor,
                borderColor: fingerprint.borderColor
              }"
            >
              <div class="fingerprint-header">
                <div class="fingerprint-component">
                  <h3>{{ fingerprint.component }}</h3>
                </div>
                <div class="fingerprint-status">
                  <el-tag :type="getStatusType(fingerprint.status)">{{ fingerprint.status_display }}</el-tag>
                </div>
              </div>
              
              <div class="fingerprint-keyword">
                <el-tag size="small" effect="plain">{{ fingerprint.keyword }}</el-tag>
              </div>
              
              <div class="fingerprint-info-actions" :style="{ borderColor: fingerprint.borderColor }">
                <div class="fingerprint-info">
                  <div class="info-item">
                    <el-icon><User /></el-icon>
                    {{ fingerprint.submitter?.username || '未知' }}
                  </div>
                  <div class="info-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(fingerprint.created_at) }}
                  </div>
                </div>
                
                <div class="fingerprint-actions">
                  <el-button-group>
                    <template v-if="isAdmin && fingerprint.status === 'pending'">
                      <el-button 
                        type="success" 
                        size="small" 
                        @click="approveFingerprint(fingerprint.id, 'approved')"
                      >
                        审核通过
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="approveFingerprint(fingerprint.id, 'rejected')"
                      >
                        拒绝
                      </el-button>
                    </template>
                    <template v-if="isAdmin || fingerprint.submitter?.id === currentUser?.id">
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="editFingerprint(fingerprint)"
                      >
                        编辑
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="deleteFingerprint(fingerprint.id)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-button-group>
                </div>
              </div>
            </el-card>
          </el-col>
        </template>
      </el-row>
      
      <div class="pagination-container">
        <el-pagination
          v-if="total > 0"
          background
          layout="total, prev, pager, next, jumper"
          :total="total"
          :page-size="10"
          :current-page="currentPage"
          :disabled="loading"
          :pager-count="5"
          :prev-disabled="!hasPreviousPage"
          :next-disabled="!hasNextPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    
    <!-- 新增/编辑指纹对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingFingerprint ? '编辑指纹' : '新增指纹'"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="fingerprintFormRef" 
        :model="fingerprintForm" 
        :rules="fingerprintRules" 
        label-position="top"
      >
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model.trim="fingerprintForm.keyword" placeholder="请输入关键词" clearable />
        </el-form-item>
        
        <el-form-item label="组件名称" prop="component">
          <el-input v-model.trim="fingerprintForm.component" placeholder="请输入组件名称" clearable />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saveLoading" @click="saveFingerprint">确定</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 批量添加指纹对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量添加指纹"
      width="40%"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="batchFormRef" 
        :model="batchForm" 
        :rules="batchRules" 
        label-position="top"
      >
        <el-form-item label="批量指纹数据" prop="data">
          <el-input
            v-model="batchForm.data"
            type="textarea"
            :rows="12"
            placeholder='请输入JSON格式的指纹数据数组，例如：
[
  {
    "keyword": "example.com",
    "component": "Example Website"
  },
  {
    "keyword": "api.test",
    "component": "API测试组件"
  }
]'
          />
        </el-form-item>
      </el-form>
      
      <div class="batch-tips">
        <h4>格式说明：</h4>
        <p>1. 数据必须是有效的JSON数组格式</p>
        <p>2. 每个对象必须包含keyword和component两个字段</p>
        <p>3. 如果包含特殊字符，请使用\"进行转义</p>
        <p>4. 示例：</p>
        <pre>[
  {
    "keyword": "example.com",
    "component": "Example Website"
  },
  {
    "keyword": "api.test",
    "component": "API测试组件"
  }
]</pre>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="batchSaveLoading" @click="saveBatchFingerprints">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../store/user'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, User, Calendar, Upload } from '@element-plus/icons-vue'
import { 
  getFingerprints, 
  searchFingerprints,
  submitFingerprint, 
  approveFingerprint as approveFingerprintApi, 
  updateFingerprint, 
  deleteFingerprint as deleteFingerprintApi,
  getPendingFingerprints,
  submitBatchFingerprints
} from '../api/fingerprint'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const isAdmin = computed(() => userStore.isAdmin)
const currentUser = computed(() => userStore.user)
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')

const loading = ref(false)
const fingerprints = ref([])
const total = ref(0)
const currentPage = ref(parseInt(route.query.page) || 1)
const fingerprintForm = ref({
  keyword: '',
  component: ''
})
const dialogVisible = ref(false)
const saveLoading = ref(false)
const editingFingerprint = ref(null)
const fingerprintFormRef = ref(null)

const filters = ref({
  keyword: route.query.keyword || '',
  component: route.query.component || '',
  status: route.query.status || ''
})

const fingerprintRules = {
  keyword: [
    { required: true, message: '请输入关键词', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  component: [
    { required: true, message: '请输入组件名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const hasNextPage = ref(false)
const hasPreviousPage = ref(false)

const hasSearchParams = computed(() => {
  return filters.value.keyword || filters.value.component || filters.value.status;
})

// 监听路由变化更新页码和筛选条件
watch(route, (newRoute) => {
  if (newRoute.query.page) {
    currentPage.value = parseInt(newRoute.query.page)
  }
  if (newRoute.query.keyword !== undefined) {
    filters.value.keyword = newRoute.query.keyword
  }
  if (newRoute.query.component !== undefined) {
    filters.value.component = newRoute.query.component
  }
  if (newRoute.query.status !== undefined) {
    filters.value.status = newRoute.query.status
  }
  
  fetchFingerprints()
}, { immediate: false })

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

// 获取状态类型
function getStatusType(status) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'info'
  }
}

// 更新URL参数
function updateUrlParams() {
  const query = {
    page: currentPage.value
  }
  
  if (filters.value.keyword) {
    query.keyword = filters.value.keyword
  }
  if (filters.value.component) {
    query.component = filters.value.component
  }
  if (filters.value.status) {
    query.status = filters.value.status
  }
  
  router.push({ query })
}

// 重置筛选条件
function resetFilters() {
  filters.value = {
    keyword: '',
    component: '',
    status: ''
  }
  currentPage.value = 1
  updateUrlParams()
  fetchFingerprints()
}

// 显示添加表单
function showAddForm() {
  editingFingerprint.value = null
  fingerprintForm.value = {
    keyword: '',
    component: ''
  }
  dialogVisible.value = true
}

// 编辑指纹
function editFingerprint(fingerprint) {
  editingFingerprint.value = fingerprint
  fingerprintForm.value = {
    keyword: fingerprint.keyword,
    component: fingerprint.component
  }
  dialogVisible.value = true
}

// 保存指纹
function saveFingerprint() {
  if (!fingerprintFormRef.value) return
  
  fingerprintFormRef.value.validate(async valid => {
    if (!valid) return false
    
    saveLoading.value = true
    try {
      if (editingFingerprint.value) {
        // 更新指纹
        await updateFingerprint(editingFingerprint.value.id, fingerprintForm.value)
        ElMessage.success('指纹已更新')
      } else {
        // 提交新指纹
        await submitFingerprint(fingerprintForm.value)
        ElMessage.success('指纹已提交，等待管理员审核')
      }
      dialogVisible.value = false
      fetchFingerprints()
    } catch (error) {
      console.error('保存指纹失败:', error)
      ElMessage.error('保存指纹失败')
    } finally {
      saveLoading.value = false
    }
  })
}

// 审核指纹
async function approveFingerprint(id, status) {
  try {
    await approveFingerprintApi(id, { status })
    ElMessage.success(status === 'approved' ? '指纹已审核通过' : '指纹已拒绝')
    fetchFingerprints()
  } catch (error) {
    console.error('审核指纹失败:', error)
  }
}

// 删除指纹
function deleteFingerprint(id) {
  ElMessageBox.confirm('确定要删除该指纹吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteFingerprintApi(id)
      ElMessage.success('指纹已删除')
      fetchFingerprints()
    } catch (error) {
      console.error('删除指纹失败:', error)
    }
  }).catch(() => {})
}

// 背景色库 - 柔和的颜色配置
const bgColorPalette = [
  { bg: '#f0f8ff', border: '#d0e6ff' }, // 爱丽丝蓝
  { bg: '#f0fff0', border: '#d0efd0' }, // 薄荷绿
  { bg: '#fff0f5', border: '#ffd0e0' }, // 薰衣草粉
  { bg: '#fffaf0', border: '#ffe9c0' }, // 亚麻黄
  { bg: '#f0f0ff', border: '#d0d0ff' }, // 薰衣草蓝
  { bg: '#f8f8ff', border: '#e0e0ff' }, // 幽灵白
  { bg: '#f5fffa', border: '#d9f2e6' }, // 薄荷奶油
  { bg: '#fffafa', border: '#ffe5e5' }, // 雪白
  { bg: '#f0fff4', border: '#c6ebd9' }, // 蜜瓜绿
  { bg: '#fff5e6', border: '#ffe0b3' }  // 桃子色
];

// 深色模式下的背景色库
const darkBgColorPalette = [
  { bg: '#1a2233', border: '#263349' }, // 深蓝
  { bg: '#1a2923', border: '#263b33' }, // 深绿
  { bg: '#231a23', border: '#372a37' }, // 深紫
  { bg: '#23201a', border: '#38332a' }, // 棕色
  { bg: '#1a1a23', border: '#2a2a37' }, // 深蓝紫
  { bg: '#191919', border: '#2a2a2a' }, // 深灰
  { bg: '#1a231f', border: '#2a3731' }, // 深青
  { bg: '#231a1a', border: '#372a2a' }, // 深红
  { bg: '#1a2321', border: '#2a3731' }, // 深青绿
  { bg: '#231f1a', border: '#37322a' }  // 深棕黄
];

// 为指纹分配背景色
function assignBgColors(fingerprintList) {
  return fingerprintList.map(fingerprint => {
    // 使用ID作为种子确保相同指纹始终获得相同颜色
    const colorIndex = fingerprint.id % bgColorPalette.length;
    const color = isDarkMode.value ? darkBgColorPalette[colorIndex] : bgColorPalette[colorIndex];
    return {
      ...fingerprint,
      bgColor: color.bg,
      borderColor: color.border
    };
  });
}

// 监听深色模式变化
watch(() => isDarkMode.value, (newValue) => {
  // 重新分配颜色
  if (fingerprints.value.length > 0) {
    fingerprints.value = assignBgColors([...fingerprints.value]);
  }
});

// 获取指纹列表
async function fetchFingerprints() {
  loading.value = true
  try {
    let response
    
    // 根据用户角色和筛选条件获取不同的指纹列表
    if (isAdmin.value && filters.value.status === 'pending' && !filters.value.keyword && !filters.value.component) {
      // 管理员查看待审核列表，无需搜索
      response = await getPendingFingerprints({
        page: currentPage.value,
        page_size: 10
      })
    } else if (hasSearchParams.value) {
      // 有搜索参数时使用搜索API
      response = await searchFingerprints({
        page: currentPage.value,
        page_size: 10,
        keyword: filters.value.keyword,
        component: filters.value.component,
        status: filters.value.status
      })
    } else {
      // 无搜索参数时获取普通列表
      response = await getFingerprints({
        page: currentPage.value,
        page_size: 10
      })
    }
    
    // 为每个指纹分配背景色
    fingerprints.value = assignBgColors(response.results || []);
    total.value = response.count || 0
    
    // 检查是否有下一页或上一页链接
    if (response.next) {
      const nextUrl = new URL(response.next);
      const nextPage = nextUrl.searchParams.get('page');
      if (nextPage) {
        hasNextPage.value = true;
      }
    } else {
      hasNextPage.value = false;
    }
    
    if (response.previous) {
      const prevUrl = new URL(response.previous);
      const prevPage = prevUrl.searchParams.get('page');
      if (prevPage) {
        hasPreviousPage.value = true;
      }
    } else {
      hasPreviousPage.value = false;
    }
  } catch (error) {
    console.error('获取指纹列表失败:', error)
    ElMessage.error('获取指纹列表失败')
  } finally {
    loading.value = false
  }
}

// 处理页面变化
function handlePageChange(page) {
  if (page > currentPage.value && !hasNextPage.value) {
    return;
  }
  if (page < currentPage.value && !hasPreviousPage.value) {
    return;
  }
  currentPage.value = page
  updateUrlParams()
  fetchFingerprints()
}

const batchDialogVisible = ref(false)
const batchSaveLoading = ref(false)
const batchForm = ref({
  data: ''
})
const batchFormRef = ref(null)

const batchRules = {
  data: [
    { required: true, message: '请输入批量指纹数据', trigger: 'blur' }
  ]
}

// 显示批量添加表单
function showBatchAddForm() {
  batchForm.value = {
    data: ''
  }
  batchDialogVisible.value = true
}

// 保存批量指纹
function saveBatchFingerprints() {
  if (!batchFormRef.value) return
  
  batchFormRef.value.validate(async valid => {
    if (!valid) return false
    
    batchSaveLoading.value = true
    try {
      // 解析JSON数据
      let fingerprintData;
      try {
        fingerprintData = JSON.parse(batchForm.value.data)
      } catch (error) {
        ElMessage.error('JSON格式错误，请检查输入')
        batchSaveLoading.value = false
        return
      }
      
      // 验证数据格式
      if (!Array.isArray(fingerprintData)) {
        ElMessage.error('数据格式错误，必须是数组格式')
        batchSaveLoading.value = false
        return
      }
      
      // 验证数组中的每个项
      for (const item of fingerprintData) {
        if (!item.keyword || !item.component) {
          ElMessage.error('数据格式错误，每个对象必须包含keyword和component字段')
          batchSaveLoading.value = false
          return
        }
        
        if (typeof item.keyword !== 'string' || typeof item.component !== 'string') {
          ElMessage.error('数据格式错误，keyword和component必须为字符串')
          batchSaveLoading.value = false
          return
        }
      }
      
      // 构建请求数据
      const data = {
        fingerprints: fingerprintData
      }
      
      // 发送批量提交请求
      const response = await submitBatchFingerprints(data)
      
      // 处理优化后的返回信息
      if (response.success) {
        let message = response.message || `批量指纹已提交，成功添加${response.results?.successful || 0}条记录`;
        
        // 如果有跳过的记录，添加到消息中
        if (response.results?.skipped > 0) {
          message = `批量指纹已提交，成功添加${response.results.successful}条记录，跳过${response.results.skipped}条已存在的指纹`;
        }
        
        ElMessage.success(message);
      } else {
        // 处理失败情况
        ElMessage.warning(response.message || '部分指纹数据添加失败');
      }
      
      batchDialogVisible.value = false
      fetchFingerprints()
    } catch (error) {
      console.error('批量添加指纹失败:', error)
      ElMessage.error('批量添加指纹失败')
    } finally {
      batchSaveLoading.value = false
    }
  })
}

// 处理搜索按钮点击
function handleSearch() {
  // 搜索时重置页码为第一页
  currentPage.value = 1
  updateUrlParams()
  fetchFingerprints()
}

onMounted(() => {
  // 添加深色模式变化监听
  window.addEventListener('storage', (event) => {
    if (event.key === 'darkMode') {
      isDarkMode.value = event.newValue === 'true';
    }
  });
  
  fetchFingerprints()
})
</script>

<style scoped>
.fingerprint-library {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

.filter-card {
  margin-bottom: 24px;
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
  margin-bottom: 10px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.filter-form .el-form-item {
  margin-right: 16px;
  margin-bottom: 12px;
}

.fingerprint-list {
  margin-top: 20px;
}

.fingerprint-card {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  height: auto;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
  border-width: 1px;
  border-style: solid;
}

.fingerprint-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.fingerprint-card :deep(.el-card__body) {
  padding: 10px;
}

.fingerprint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 8px;
}

.fingerprint-component {
  flex: 1;
  min-width: 0;
}

.fingerprint-component h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .fingerprint-component h3 {
  color: #e0e0e0;
}

.fingerprint-keyword {
  margin-bottom: 8px;
}

.fingerprint-info-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 6px;
}

.fingerprint-info {
  display: flex;
  color: #606266;
  font-size: 12px;
  gap: 10px;
  margin-left: 2px;
}

.dark .fingerprint-info {
  color: #a0a0a0;
}

.info-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.info-item .el-icon {
  margin-right: 3px;
  font-size: 12px;
}

.fingerprint-actions {
  text-align: right;
}

.fingerprint-actions :deep(.el-button) {
  padding: 5px 8px;
  font-size: 12px;
  height: 24px;
  line-height: 1;
}

.fingerprint-actions :deep(.el-button-group .el-button) {
  margin-left: -1px !important;
}

.fingerprint-status :deep(.el-tag) {
  font-size: 12px;
  height: 24px;
  line-height: 24px;
  border-radius: 4px;
  padding: 0 8px;
}

.pagination-container {
  margin-top: 24px;
  text-align: center;
}

@media screen and (max-width: 768px) {
  .fingerprint-library {
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

.batch-tips {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 16px;
  font-size: 14px;
  border-left: 4px solid #409eff;
}

.batch-tips h4 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #409eff;
}

.batch-tips p {
  margin: 6px 0;
}

.batch-tips pre {
  background-color: #f1f1f1;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
}
</style>