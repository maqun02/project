import { defineStore } from 'pinia'
import { login, register, logout, getMe } from '../api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('user')
  }),
  
  getters: {
    isAdmin: (state) => state.user?.profile?.role === 'admin',
    username: (state) => state.user?.username
  },
  
  actions: {
    async login(credentials) {
      try {
        console.log('正在尝试登录...', credentials.username);
        
        // 登录前先清除现有缓存
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('user');
        
        const loginResult = await login(credentials);
        console.log('登录API返回:', loginResult);
        
        console.log('获取用户信息...');
        const userData = await getMe();
        console.log('用户信息API返回:', userData);
        
        this.user = userData;
        this.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } catch (error) {
        console.error('登录过程发生错误:', error);
        ElMessage.error(error.response?.data?.detail || '登录失败，请重试');
        throw error;
      }
    },
    
    async register(userData) {
      try {
        console.log('正在尝试注册...', userData.username);
        const result = await register(userData);
        console.log('注册API返回:', result);
        ElMessage.success('注册成功，请登录');
        return result;
      } catch (error) {
        console.error('注册过程发生错误:', error);
        ElMessage.error(error.response?.data?.detail || '注册失败，请重试');
        throw error;
      }
    },
    
    async logout() {
      try {
        console.log('正在退出登录...');
        await logout();
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('user');
        ElMessage.success('已退出登录');
      } catch (error) {
        console.error('退出登录失败', error);
        ElMessage.error('退出登录失败，请重试');
        throw error;
      }
    },
    
    async fetchUserInfo() {
      try {
        console.log('获取用户信息...');
        const userData = await getMe();
        console.log('用户信息API返回:', userData);
        
        this.user = userData;
        this.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } catch (error) {
        console.error('获取用户信息失败', error);
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('user');
        throw error;
      }
    }
  }
}) 