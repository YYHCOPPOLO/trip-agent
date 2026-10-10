<script setup lang="ts">
import type { Component } from 'vue'
import { CalendarDays } from '@lucide/vue'
import { dayColor } from '@/lib/trip'
import { cn } from '@/lib/utils'

export interface NavSection {
  key: string
  label: string
  icon: Component
}

export interface NavDay {
  key: string
  label: string
  date: string
}

defineProps<{
  sections: NavSection[]
  days: NavDay[]
  active: string
  /** 横向(移动端)样式 */
  horizontal?: boolean
}>()

const emit = defineEmits<{
  navigate: [key: string]
}>()
</script>

<template>
  <!-- 移动端:横向滚动的标签 -->
  <nav v-if="horizontal" aria-label="行程导航" class="no-scrollbar -mx-4 overflow-x-auto px-4">
    <div class="flex w-max gap-2 py-1">
      <button
        v-for="item in [...sections.map(s => ({ key: s.key, label: s.label })), ...days]"
        :key="item.key"
        type="button"
        :class="cn(
          'h-8 shrink-0 rounded-full border px-3.5 text-xs font-medium transition-all',
          active === item.key
            ? 'border-foreground bg-foreground text-background'
            : 'bg-card text-muted-foreground hover:text-foreground',
        )"
        @click="emit('navigate', item.key)"
      >
        {{ item.label }}
      </button>
    </div>
  </nav>

  <!-- 桌面端:侧边导航 -->
  <nav v-else aria-label="行程导航" class="surface-card space-y-1 p-3 text-sm">
    <p class="px-3 pt-1 pb-2 text-[10px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
      Contents
    </p>
    <template v-for="section in sections" :key="section.key">
      <button
        type="button"
        :class="cn(
          'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium transition-all',
          active === section.key
            ? 'bg-foreground text-background shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )"
        @click="emit('navigate', section.key)"
      >
        <component :is="section.icon" class="size-4" />
        {{ section.label }}
      </button>

      <!-- 每日行程子菜单紧跟在“景点地图”之后 -->
      <div v-if="section.key === 'map' && days.length" class="pt-1">
        <div class="flex items-center gap-2.5 px-3 py-2 font-medium text-muted-foreground">
          <CalendarDays class="size-4" />
          每日行程
        </div>
        <div class="relative ml-[1.15rem] space-y-0.5 border-l border-dashed pl-3">
          <button
            v-for="(day, i) in days"
            :key="day.key"
            type="button"
            :class="cn(
              'relative flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors',
              active === day.key
                ? 'bg-muted font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )"
            @click="emit('navigate', day.key)"
          >
            <span
              aria-hidden="true"
              :class="cn('absolute top-1/2 -left-[1.05rem] size-2 -translate-y-1/2 rounded-full ring-4 ring-card transition-transform', active === day.key && 'scale-150')"
              :style="{ background: dayColor(i) }"
            />
            <span>{{ day.label }}</span>
            <span class="text-xs tabular-nums opacity-70">{{ day.date?.slice(5) }}</span>
          </button>
        </div>
      </div>
    </template>
  </nav>
</template>
