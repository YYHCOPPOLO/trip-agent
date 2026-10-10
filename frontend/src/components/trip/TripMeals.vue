<script setup lang="ts">
import type { Meal } from '@/types'
import { UtensilsCrossed } from '@lucide/vue'
import { getMealLabel, MEAL_ICONS } from '@/lib/trip'

defineProps<{
  meals: Meal[]
}>()
</script>

<template>
  <div class="h-full overflow-hidden rounded-2xl border bg-gradient-to-br from-[oklch(0.975_0.025_70)] to-card dark:from-[oklch(0.3_0.05_60/0.4)]" data-export-card>
    <div class="flex items-center gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
      <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sunset text-sunset-foreground shadow-lg shadow-orange-500/20">
        <UtensilsCrossed class="size-5" />
      </span>
      <div>
        <p class="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Eat
        </p>
        <h4 class="font-display text-lg font-bold">
          今日餐饮
        </h4>
      </div>
    </div>
    <ul class="mt-3 divide-y">
      <li
        v-for="(meal, index) in meals"
        :key="`${meal.type}-${index}`"
        class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-card/70 sm:px-5"
      >
        <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-card text-sunset shadow-sm">
          <component :is="MEAL_ICONS[meal.type] ?? UtensilsCrossed" class="size-4" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-2">
            <span class="shrink-0 text-[11px] font-semibold text-sunset">{{ getMealLabel(meal.type) }}</span>
            <span class="truncate font-semibold" :title="meal.name">{{ meal.name }}</span>
            <span v-if="meal.estimated_cost" class="ml-auto shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">¥{{ meal.estimated_cost }}</span>
          </div>
          <p v-if="meal.description" class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {{ meal.description }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
