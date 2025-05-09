import http from './http'

// 获取任务列表
export function getTasks() {
  return http.get('/tasks/')
}

// 获取单个任务详情
export function getTaskDetail(id) {
  return http.get(`/tasks/${id}/`)
}

// 创建指纹识别任务
export function createTask(data) {
  return http.post('/tasks/', data)
}

// 获取任务状态
export function getTaskStatus(id) {
  return http.get(`/tasks/${id}/status/`)
}

// 重启任务
export function restartTask(id) {
  return http.post(`/tasks/${id}/restart/`)
}

// 删除任务
export function deleteTask(id) {
  return http.delete(`/tasks/${id}/`)
}

// 获取任务结果
export function getTaskResults(taskId) {
  return http.get(`/results/by_task/?task_id=${taskId}`)
}

// 获取任务分析报告
export function getTaskReport(taskId) {
  return http.get(`/results/report/?task_id=${taskId}`)
} 