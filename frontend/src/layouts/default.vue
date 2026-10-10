<script setup lang="ts">
import { MapIcon, PlaneTakeoff, Sparkles } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTripPlanStore } from '@/stores/trip'

const route = useRoute()
const tripStore = useTripPlanStore()

const navItems = computed(() => [
  { to: '/', label: '规划行程', icon: Sparkles },
  { to: '/result', label: '我的行程', icon: MapIcon, disabled: !tripStore.plan },
])
</script>

<template>
  <div class="flex min-h-svh flex-col bg-background">
    <header class="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="group flex items-center gap-2.5">
          <span class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-6">
            <PlaneTakeoff class="size-5" />
          </span>
          <span class="text-base font-semibold tracking-tight sm:text-lg">智能旅行助手</span>
        </RouterLink>

        <nav class="flex items-center gap-1">
          <template v-for="item in navItems" :key="item.to">
            <RouterLink
              v-if="!item.disabled"
              :to="item.to"
              class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              :class="{ 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground': route.path === item.to }"
            >
              <component :is="item.icon" class="size-4" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t border-border/60">
      <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <span>智能旅行助手 ©2025</span>
        <span class="flex items-center gap-1.5">
          <Sparkles class="size-3.5" />
          基于AI的个性化旅行规划
        </span>
      </div>
    </footer>
  </div>
</template>
