<script setup>
import { ref, onMounted } from 'vue'

// 全局加载状态
const isAppLoading = ref(true)

onMounted(() => {
  // 检查是否有暗黑模式设置
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark')
  }
  
  // 延迟关闭全局加载状态，给予API请求时间完成
  setTimeout(() => {
    isAppLoading.value = false
  }, 500)
})
</script>

<template>
  <!-- 全局加载状态 -->
  <div v-if="isAppLoading" class="global-loading">
    <div class="loading-spinner"></div>
  </div>
  
  <router-view v-else v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  z-index: 9999;
}

html.dark .global-loading {
  background-color: #1e1e1e;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(64, 158, 255, 0.1);
  border-radius: 50%;
  border-top-color: #409eff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
