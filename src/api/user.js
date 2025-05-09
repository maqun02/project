import http from './http'

// 用户登录
export function login(data) {
  return http.post('/users/login/', data)
}

// 用户注册
export function register(data) {
  return http.post('/users/register/', data)
}

// 用户登出
export function logout() {
  return http.post('/users/logout/')
}

// 获取当前用户信息
export function getMe() {
  return http.get('/users/me/')
}

// 管理员获取用户列表
export function getUsers() {
  return http.get('/users/')
}

// 管理员创建用户
export function createUser(data) {
  return http.post('/users/', data)
}

// 管理员更新用户
export function updateUser(id, data) {
  return http.patch(`/users/${id}/`, data)
}

// 管理员删除用户
export function deleteUser(id) {
  return http.delete(`/users/${id}/`)
}

// 管理员重置用户密码
export function resetUserPassword(targetId) {
  return http.post('/users/reset_password/', { target_id: targetId })
} 