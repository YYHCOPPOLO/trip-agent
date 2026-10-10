<script setup lang="ts">
import type { Meal } from '@/types'
import { UtensilsCrossed } from '@lucide/vue'
import { getMealLabel, MEAL_ICONS } from '@/lib/trip'

defineProps<{
  meals: Meal[]
}>()
</script>

<template>
  <ul class="divide-y overflow-hidden rounded-xl border" data-export-card>
    <li
      v-for="(meal, index) in meals"
      :key="`${meal.type}-${index}`"
      class="flex items-start gap-3 bg-background px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
        <component :is="MEAL_ICONS[meal.type] ?? UtensilsCrossed" class="size-4" />
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-baseline gap-x-2">
          <span class="text-xs font-medium text-muted-foreground">{{ getMealLabel(meal.type) }}</span>
          <span class="font-medium">{{ meal.name }}</span>
          <span v-if="meal.estimated_cost" class="ml-auto text-xs text-muted-foreground tabular-nums">¥{{ meal.estimated_cost }}</span>
        </div>
        <p v-if="meal.description" class="mt-0.5 text-sm text-muted-foreground">
          {{ meal.description }}
        </p>
      </div>
    </li>
  </ul>
</template>
