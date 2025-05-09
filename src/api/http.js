import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const http = axios.create({
  baseURL: '/api',
  timeout: 10000, // 降低超时时间，避免长时间等待
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 设置最大重试次数和重试延迟
const MAX_RETRIES = 2
const RETRY_DELAY = 1000
let isRetrying = false

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 只在开发模式打印日志
    if (process.env.NODE_ENV === 'development') {
      console.log("发送请求：", config.url);
    }
    
    // 添加重试配置
    if (!config.metadata) {
      config.metadata = {}
    }
    config.metadata.retryCount = config.metadata.retryCount || 0
    
    return config;
  },
  error => {
    console.error('请求发送失败', error);
    return Promise.reject(error);
  }
)

// 响应拦截器
http.interceptors.response.use(
  response => {
    // 只在开发模式打印日志
    if (process.env.NODE_ENV === 'development') {
      console.log("接收响应：", response.config.url, response.status);
    }
    return response.data;
  },
  async error => {
    const { response, config } = error;
    
    // 如果请求配置不存在，直接拒绝
    if (!config) {
      return Promise.reject(error);
    }
    
    // 获取当前重试次数
    const retryCount = config.metadata?.retryCount || 0;
    
    // 当网络错误或超时且未达到最大重试次数时，进行重试
    if ((error.code === 'ECONNABORTED' || error.message.includes('timeout') || !response) && 
        retryCount < MAX_RETRIES && 
        !isRetrying) {
      
      isRetrying = true
      config.metadata.retryCount = retryCount + 1;
      
      // 延迟一段时间后重试
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      isRetrying = false
      console.log(`重试请求 (${config.metadata.retryCount}/${MAX_RETRIES}): ${config.url}`);
      return http(config);
    }
    
    // 请求失败后的错误处理
    if (process.env.NODE_ENV === 'development') {
      console.error("请求错误：", config?.url, error.message);
    }
    
    if (response) {
      switch (response.status) {
        case 400:
          ElMessage.error(formatErrorMessage(response.data) || '请求参数错误');
          break;
        case 401:
          ElMessage.error('未登录或登录已过期');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          ElMessage.error(formatErrorMessage(response.data) || '没有权限执行此操作');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器内部错误');
          break;
        default:
          ElMessage.error(`请求失败: ${response.status}`);
      }
    } else if (!isRetrying) {
      ElMessage.error('网络错误，请检查您的网络连接');
    }
    
    return Promise.reject(error);
  }
)

// 格式化错误信息
function formatErrorMessage(data) {
  // 处理指纹重复错误情况，不暴露原始错误信息
  if (typeof data === 'object' && data !== null) {
    // 检查是否包含non_field_errors字段，这通常表示唯一性冲突
    if (data.non_field_errors) {
      let errorMessage = data.non_field_errors[0] || '';
      
      // 检查是否是唯一性约束错误
      if (errorMessage.includes('unique set') || 
          errorMessage.includes('已存在') || 
          errorMessage.toLowerCase().includes('already exists')) {
        return '该记录已存在，请检查输入';
      }
      
      // 返回通用错误而不是原始错误
      return '请求验证失败';
    }
    
    // 检查其他常见的唯一性错误字段
    if (data.keyword && 
        (JSON.stringify(data.keyword).includes('unique') || 
         JSON.stringify(data.keyword).includes('已存在'))) {
      return '该记录已存在，请检查输入';
    }
  }
  
  // 原有的错误处理逻辑
  if (data.detail) {
    // 过滤掉可能包含敏感信息的详细错误
    const detail = data.detail;
    if (typeof detail === 'string' && 
        (detail.includes('unique') || detail.includes('已存在'))) {
      return '该记录已存在，请检查输入';
    }
    return data.detail;
  }
  
  if (typeof data === 'object' && data !== null) {
    const messages = [];
    for (const key in data) {
      // 跳过可能包含敏感信息的字段
      if (key === 'non_field_errors') continue;
      
      if (Array.isArray(data[key])) {
        // 过滤掉包含敏感信息的错误消息
        const safeMessages = data[key].filter(msg => 
          !msg.includes('unique set') && 
          !msg.includes('已存在') && 
          !msg.toLowerCase().includes('already exists')
        );
        
        if (safeMessages.length > 0) {
          messages.push(`${key}: ${safeMessages.join(', ')}`);
        } else if (data[key].length > 0) {
          // 如果所有消息都被过滤掉了，使用通用错误
          messages.push(`${key}: 验证失败`);
        }
      } else {
        messages.push(`${key}: ${data[key]}`);
      }
    }
    
    // 如果没有任何消息但存在错误，返回通用错误
    if (messages.length === 0 && Object.keys(data).length > 0) {
      return '请求处理失败，请检查输入';
    }
    
    return messages.join('; ');
  }
  
  return String(data);
}

export default http 