import http from './http'

// 获取指纹列表
export function getFingerprints(params = {}) {
  return http.get('/fingerprints/', { params })
}

// 搜索指纹 - 基于数据库的搜索
export function searchFingerprints(params = {}) {
  return http.get('/fingerprints/search/', { params })
}

// 获取单个指纹详情
export function getFingerprintDetail(id) {
  return http.get(`/fingerprints/${id}/`)
}

// 提交指纹
export function submitFingerprint(data) {
  return http.post('/fingerprints/submit/', data)
}

// 批量提交指纹
export function submitBatchFingerprints(data) {
  return http.post('/fingerprints/batch-submit/', data)
}

// 获取已审核通过的指纹列表
export function getApprovedFingerprints(params = {}) {
  return http.get('/fingerprints/approved/', { params })
}

// 管理员 - 获取待审核指纹列表
export function getPendingFingerprints(params = {}) {
  return http.get('/fingerprints/pending/', { params })
}

// 管理员 - 审核指纹
export function approveFingerprint(id, data) {
  return http.put(`/fingerprints/${id}/approve/`, data)
}

// 管理员 - 更新指纹
export function updateFingerprint(id, data) {
  return http.patch(`/fingerprints/${id}/`, data)
}

// 管理员 - 删除指纹
export function deleteFingerprint(id) {
  return http.delete(`/fingerprints/${id}/`)
} 