<script setup lang="ts">
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-header class="app-header">
      <div class="app-title">
        🌍 智能旅行助手
      </div>
    </a-layout-header>
    <a-layout-content class="app-content">
      <RouterView />
    </a-layout-content>
    <a-layout-footer class="app-footer">
      智能旅行助手 ©2025
    </a-layout-footer>
  </a-layout>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-header {
  background: #001529;
  padding: 0 50px;
}

.app-title {
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.app-content {
  padding: 24px;
}

.app-footer {
  text-align: center;
}
</style>
