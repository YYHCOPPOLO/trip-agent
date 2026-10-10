<script setup lang="ts">
import type { Budget } from '@/types'
import { BedDouble, Bus, Ticket, UtensilsCrossed, Wallet } from '@lucide/vue'
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  budget: Budget
}>()

const items = computed(() => [
  { label: '景点门票', value: props.budget.total_attractions, icon: Ticket, color: 'bg-teal-500' },
  { label: '酒店住宿', value: props.budget.total_hotels, icon: BedDouble, color: 'bg-sky-500' },
  { label: '餐饮费用', value: props.budget.total_meals, icon: UtensilsCrossed, color: 'bg-amber-500' },
  { label: '交通费用', value: props.budget.total_transportation, icon: Bus, color: 'bg-rose-500' },
])

function percent(value: number): number {
  if (!props.budget.total)
    return 0
  return Math.min(100, Math.round((value / props.budget.total) * 100))
}

function formatMoney(value: number): string {
  return `¥${Number(value ?? 0).toLocaleString('zh-CN')}`
}
</script>

<template>
  <Card id="budget" class="gap-5" data-export-card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base">
        <Wallet class="size-4 text-primary" />
        预算明细
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in items"
          :key="item.label"
          class="rounded-lg border bg-muted/40 p-3 transition-colors hover:bg-muted/70"
        >
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <component :is="item.icon" class="size-3.5" />
            {{ item.label }}
          </div>
          <div class="mt-1 text-lg font-semibold tabular-nums">
            {{ formatMoney(item.value) }}
          </div>
          <div class="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div :class="item.color" class="h-full rounded-full" :style="{ width: `${percent(item.value)}%` }" />
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground">
        <span class="text-sm font-medium">预估总费用</span>
        <span class="text-2xl font-bold tabular-nums">{{ formatMoney(budget.total) }}</span>
      </div>
    </CardContent>
  </Card>
</template>
