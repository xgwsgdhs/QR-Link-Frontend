<template>
  <div id="app" :class="{ 'with-mobile-padding': showBottomPadding }">
    <Navbar />
    <main class="main-body">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const showBottomPadding = computed(() => {
  return authStore.isLoggedIn && route.path !== '/dashboard'
})

onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchProfile()
  }
})
</script>

<style>
.main-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .with-mobile-padding .main-body {
    padding-bottom: 70px;
  }
}
</style>
