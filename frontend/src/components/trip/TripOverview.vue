<script setup lang="ts">
import type { TripPlan } from '@/types'
import { CalendarDays, ClipboardList, Landmark, Lightbulb, Route, Wallet } from '@lucide/vue'
import { computed } from 'vue'
import { formatDateShort, formatMoney } from '@/lib/trip'
import TripSection from './TripSection.vue'

const props = defineProps<{
  plan: TripPlan
}>()

const attractionCount = computed(() =>
  props.plan.days.reduce((sum, day) => sum + day.attractions.length, 0),
)

const stats = computed(() => [
  { label: '行程天数', value: `${props.plan.days.length}`, unit: '天', icon: CalendarDays },
  { label: '打卡景点', value: `${attractionCount.value}`, unit: '个', icon: Landmark },
  { label: '出行日期', value: `${formatDateShort(props.plan.start_date)}`, unit: `至 ${formatDateShort(props.plan.end_date)}`, icon: Route },
  ...(props.plan.budget ? [{ label: '预估花费', value: formatMoney(props.plan.budget.total), unit: '', icon: Wallet }] : []),
])
</script>

<template>
  <TripSection id="overview" :icon="ClipboardList" eyebrow="Overview" title="行程概览">
    <dl class="grid grid-cols-2 gap-3">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="group rounded-2xl border bg-surface/60 p-4 transition-colors hover:bg-surface"
      >
        <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <component :is="stat.icon" class="size-3.5" />
          {{ stat.label }}
        </dt>
        <dd class="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
          <span class="font-display text-2xl font-bold tracking-tight tabular-nums">{{ stat.value }}</span>
          <span v-if="stat.unit" class="text-xs text-muted-foreground">{{ stat.unit }}</span>
        </dd>
      </div>
    </dl>

    <figure v-if="plan.overall_suggestions" class="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.97_0.03_75)] to-[oklch(0.95_0.04_55)] p-5 dark:from-[oklch(0.3_0.05_60/0.35)] dark:to-[oklch(0.25_0.04_40/0.35)]">
      <span aria-hidden="true" class="pointer-events-none absolute -top-6 right-3 font-display text-[7rem] leading-none font-black text-sunset/15">”</span>
      <figcaption class="flex items-center gap-2 text-xs font-semibold text-sunset">
        <Lightbulb class="size-4" />
        AI 旅行建议
      </figcaption>
      <blockquote class="relative mt-2 text-sm leading-7 text-pretty text-foreground/85">
        {{ plan.overall_suggestions }}
      </blockquote>
    </figure>
  </TripSection>
</template>
