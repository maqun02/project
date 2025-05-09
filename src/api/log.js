import http from './http'

// 获取系统日志（管理员）
export function getLogs(params = {}) {
  return http.get('/logs/', { params })
}

// 搜索系统日志（管理员）- 直接在数据库中搜索
export function searchLogs(params = {}) {
  return http.get('/logs/search/', { params })
}

// 获取系统日志操作类型列表 - 本地数据版本
export function getLogActionTypes() {
  // 返回本地定义的操作类型，避免调用不存在的API
  const actionTypes = [
    { value: 'login', display: '登录' },
    { value: 'logout', display: '登出' },
    { value: 'create_user', display: '创建用户' },
    { value: 'update_user', display: '更新用户' },
    { value: 'delete_user', display: '删除用户' },
    { value: 'reset_password', display: '重置密码' },
    { value: 'create_task', display: '创建任务' },
    { value: 'update_task', display: '更新任务' },
    { value: 'delete_task', display: '删除任务' },
    { value: 'submit_fingerprint', display: '提交指纹' },
    { value: 'update_fingerprint', display: '更新指纹' },
    { value: 'delete_fingerprint', display: '删除指纹' },
    { value: 'approve_fingerprint', display: '审核指纹' }
  ];
  
  return Promise.resolve({
    results: actionTypes
  });
} 