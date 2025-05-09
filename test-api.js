import axios from 'axios';

// 创建一个axios实例
const api = axios.create({
  baseURL: 'http://fwf.ns-6k0uv9r0.svc.cluster.local:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// 测试注册
async function testRegister() {
  // 生成固定的用户信息
  const username = 'testuser' + Math.floor(Math.random() * 1000);
  const password = 'testpassword123';
  const userData = {
    username,
    email: `${username}@example.com`,
    password,
    password_confirm: password
  };
  
  try {
    console.log('测试注册...', userData.username);
    const response = await api.post('/api/users/register/', userData);
    
    console.log('注册成功:', response.status, response.data);
    return { ...userData, response: response.data };
  } catch (error) {
    console.error('注册失败:', error.response ? error.response.status : error.message);
    console.error(error.response ? error.response.data : '无响应数据');
    throw error;
  }
}

// 测试登录
async function testLogin(userData) {
  try {
    console.log('测试登录...', userData.username);
    const response = await api.post('/api/users/login/', {
      username: userData.username,
      password: userData.password
    });
    
    console.log('登录成功:', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('登录失败:', error.response ? error.response.status : error.message);
    console.error(error.response ? error.response.data : '无响应数据');
    throw error;
  }
}

// 运行测试
async function runTests() {
  try {
    const userData = await testRegister();
    console.log('使用刚注册的用户信息进行登录');
    await testLogin(userData);
  } catch (error) {
    console.error('测试失败', error.message);
  }
}

runTests(); 