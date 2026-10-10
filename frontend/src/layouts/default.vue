<script setup lang="ts">
import { Compass, MapIcon, Moon, Sparkles, Sun } from '@lucide/vue'
import { useDark, useToggle, useWindowScroll } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { cn } from '@/lib/utils'
import { useTripPlanStore } from '@/stores/trip'

const route = useRoute()
const tripStore = useTripPlanStore()
const isDark = useDark()
const toggleDark = useToggle(isDark)

// 页面顶部为深色 Hero,未滚动时头部透明、文字为浅色
const { y } = useWindowScroll()
const solid = computed(() => y.value > 24)

const navItems = computed(() => [
  { to: '/', label: '规划行程', icon: Sparkles },
  { to: '/result', label: '我的行程', icon: MapIcon, disabled: !tripStore.plan },
])
</script>

<template>
  <div class="flex min-h-svh flex-col bg-background">
    <header
      :class="cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        solid ? 'glass border-x-0 border-t-0 shadow-[0_8px_30px_-20px_rgba(0,0,0,.35)]' : 'border-b border-transparent bg-transparent',
      )"
    >
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="group flex items-center gap-2.5" aria-label="返回首页">
          <span class="relative flex size-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[oklch(0.78_0.14_70)] to-[oklch(0.66_0.18_35)] text-white shadow-lg shadow-orange-500/25">
            <Compass class="size-5 transition-transform duration-700 group-hover:rotate-[200deg]" />
          </span>
          <span class="flex flex-col leading-none">
            <span :class="cn('font-display text-[17px] font-bold tracking-wide transition-colors', solid ? 'text-foreground' : 'text-white')">智能旅行助手</span>
            <span :class="cn('mt-1 text-[10px] font-medium tracking-[0.25em] uppercase transition-colors', solid ? 'text-muted-foreground' : 'text-white/60')">AI Trip Planner</span>
          </span>
        </RouterLink>

        <div class="flex items-center gap-1.5">
          <nav class="flex items-center gap-1" aria-label="主导航">
            <template v-for="item in navItems" :key="item.to">
              <RouterLink
                v-if="!item.disabled"
                :to="item.to"
                :class="cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-all',
                  route.path === item.to
                    ? (solid ? 'bg-foreground text-background' : 'bg-white text-slate-900')
                    : (solid ? 'text-muted-foreground hover:bg-muted hover:text-foreground' : 'text-white/80 hover:bg-white/10 hover:text-white'),
                )"
              >
                <component :is="item.icon" class="size-4" />
                <span class="hidden sm:inline">{{ item.label }}</span>
              </RouterLink>
            </template>
          </nav>
          <span :class="cn('mx-1 h-5 w-px', solid ? 'bg-border' : 'bg-white/20')" />
          <button
            id="theme-toggle"
            type="button"
            :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
            :class="cn(
              'relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full transition-colors',
              solid ? 'text-muted-foreground hover:bg-muted hover:text-foreground' : 'text-white/80 hover:bg-white/10 hover:text-white',
            )"
            @click="toggleDark()"
          >
            <Transition
              mode="out-in"
              enter-active-class="transition duration-300"
              enter-from-class="rotate-90 scale-50 opacity-0"
              leave-active-class="transition duration-200"
              leave-to-class="-rotate-90 scale-50 opacity-0"
            >
              <Moon v-if="!isDark" key="moon" class="size-[18px]" />
              <Sun v-else key="sun" class="size-[18px]" />
            </Transition>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition
          mode="out-in"
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0"
          leave-active-class="transition duration-200 ease-in"
          leave-to-class="opacity-0"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="relative mt-10 overflow-hidden border-t bg-surface">
      <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div class="max-w-sm">
          <div class="flex items-center gap-2">
            <Compass class="size-5 text-sunset" />
            <span class="font-display text-lg font-bold">智能旅行助手</span>
          </div>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            让 AI 帮你读懂一座城市 —— 景点、天气、住宿、餐饮与预算，一次规划到位。
          </p>
        </div>
        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <span>© {{ new Date().getFullYear() }} 智能旅行助手</span>
          <a
            href="https://github.com/YYHCOPPOLO/trip-agent"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" class="size-4" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>
            GitHub
          </a>
        </div>
      </div>
      <div aria-hidden="true" class="pointer-events-none absolute -right-10 -bottom-16 font-display text-[9rem] leading-none font-black text-foreground/[0.03] select-none">
        旅
      </div>
    </footer>
  </div>
</template>
