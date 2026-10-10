<script setup lang="ts">
import type { Budget } from '@/types'
import { BedDouble, Bus, Ticket, UtensilsCrossed, Wallet } from '@lucide/vue'
import { computed } from 'vue'
import { formatMoney } from '@/lib/trip'
import TripSection from './TripSection.vue'

const props = defineProps<{
  budget: Budget
}>()

const items = computed(() => [
  { label: '景点门票', value: props.budget.total_attractions ?? 0, icon: Ticket, color: '#0f8a8a' },
  { label: '酒店住宿', value: props.budget.total_hotels ?? 0, icon: BedDouble, color: '#3b6fd8' },
  { label: '餐饮费用', value: props.budget.total_meals ?? 0, icon: UtensilsCrossed, color: '#e0793a' },
  { label: '交通费用', value: props.budget.total_transportation ?? 0, icon: Bus, color: '#c2417a' },
])

const sum = computed(() => items.value.reduce((acc, item) => acc + Number(item.value || 0), 0))

function percent(value: number): number {
  const base = props.budget.total || sum.value
  if (!base)
    return 0
  return Math.min(100, Math.round((value / base) * 100))
}

// 环形图:用 SVG 描边分段绘制(导出截图时也能正确渲染)
const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const segments = computed(() => {
  if (!sum.value)
    return []
  let offset = 0
  return items.value.map((item) => {
    const length = (Number(item.value || 0) / sum.value) * CIRCUMFERENCE
    const segment = { color: item.color, dash: `${length} ${CIRCUMFERENCE - length}`, offset: -offset }
    offset += length
    return segment
  })
})
</script>

<template>
  <TripSection id="budget" :icon="Wallet" eyebrow="Budget" title="预算明细">
    <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <!-- 环形图 -->
      <div class="relative size-40 shrink-0">
        <svg viewBox="0 0 120 120" class="size-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" :r="RADIUS" fill="none" stroke="var(--muted)" stroke-width="12" />
          <circle
            v-for="(segment, i) in segments"
            :key="i"
            cx="60"
            cy="60"
            :r="RADIUS"
            fill="none"
            :stroke="segment.color"
            stroke-width="12"
            :stroke-dasharray="segment.dash"
            :stroke-dashoffset="segment.offset"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-[11px] text-muted-foreground">预估总费用</span>
          <span class="font-display text-2xl font-black tracking-tight tabular-nums">{{ formatMoney(budget.total) }}</span>
        </div>
      </div>

      <!-- 明细 -->
      <ul class="w-full space-y-3">
        <li v-for="item in items" :key="item.label">
          <div class="flex items-center justify-between gap-3 text-sm">
            <span class="flex items-center gap-2 text-muted-foreground">
              <span class="flex size-7 items-center justify-center rounded-lg text-white" :style="{ background: item.color }">
                <component :is="item.icon" class="size-3.5" />
              </span>
              {{ item.label }}
            </span>
            <span class="font-semibold tabular-nums">
              {{ formatMoney(item.value) }}
              <span class="ml-1 text-xs font-normal text-muted-foreground">{{ percent(item.value) }}%</span>
            </span>
          </div>
          <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full transition-[width] duration-700" :style="{ width: `${percent(item.value)}%`, background: item.color }" />
          </div>
        </li>
      </ul>
    </div>
  </TripSection>
</template>
