<script setup lang="ts">
import type { Hotel } from '@/types'
import { BedDouble, MapPin, Navigation, Star, Tag, Wallet } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps<{
  hotel: Hotel
}>()

const fields = computed(() => [
  { label: '类型', value: props.hotel.type, icon: Tag },
  { label: '价格', value: props.hotel.price_range, icon: Wallet },
  { label: '评分', value: props.hotel.rating ? `${props.hotel.rating} 分` : '', icon: Star },
  { label: '距离', value: props.hotel.distance, icon: Navigation },
])
</script>

<template>
  <div class="relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br from-[oklch(0.97_0.02_230)] to-card dark:from-[oklch(0.28_0.05_250/0.6)]" data-export-card>
    <div class="flex items-start gap-3 p-4 sm:p-5">
      <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[oklch(0.55_0.12_250)] text-white shadow-lg shadow-[oklch(0.55_0.12_250/0.3)]">
        <BedDouble class="size-5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Stay
        </p>
        <h4 class="truncate font-display text-lg font-bold" :title="hotel.name">
          {{ hotel.name }}
        </h4>
        <p class="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin class="mt-0.5 size-3.5 shrink-0" />
          <span class="break-words">{{ hotel.address || '—' }}</span>
        </p>
      </div>
      <div v-if="hotel.estimated_cost" class="shrink-0 text-right">
        <div class="font-display text-xl font-black tabular-nums">
          ¥{{ hotel.estimated_cost }}
        </div>
        <div class="text-[11px] text-muted-foreground">
          预估/晚
        </div>
      </div>
    </div>
    <dl class="grid grid-cols-2 gap-px border-t bg-border sm:grid-cols-4">
      <div v-for="field in fields" :key="field.label" class="bg-card/90 px-4 py-3">
        <dt class="flex items-center gap-1 text-[11px] text-muted-foreground">
          <component :is="field.icon" class="size-3" />
          {{ field.label }}
        </dt>
        <dd class="mt-0.5 truncate text-sm font-semibold" :title="field.value">
          {{ field.value || '—' }}
        </dd>
      </div>
    </dl>
  </div>
</template>
