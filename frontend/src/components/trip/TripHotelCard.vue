<script setup lang="ts">
import type { Hotel } from '@/types'
import { BedDouble, MapPin, Navigation, Star, Tag, Wallet } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps<{
  hotel: Hotel
}>()

const fields = computed(() => [
  { label: '地址', value: props.hotel.address, icon: MapPin, wide: true },
  { label: '类型', value: props.hotel.type, icon: Tag },
  { label: '价格范围', value: props.hotel.price_range, icon: Wallet },
  { label: '评分', value: props.hotel.rating ? `${props.hotel.rating} 分` : '', icon: Star },
  { label: '距离', value: props.hotel.distance, icon: Navigation },
])
</script>

<template>
  <div class="overflow-hidden rounded-xl border bg-sky-50/60 dark:bg-sky-950/20" data-export-card>
    <div class="flex items-center gap-3 border-b bg-background/60 px-4 py-3">
      <span class="flex size-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600">
        <BedDouble class="size-4" />
      </span>
      <div class="min-w-0">
        <div class="truncate font-semibold">
          {{ hotel.name }}
        </div>
        <div v-if="hotel.estimated_cost" class="text-xs text-muted-foreground">
          预估 ¥{{ hotel.estimated_cost }}/晚
        </div>
      </div>
    </div>
    <dl class="grid gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-2">
      <div
        v-for="field in fields"
        :key="field.label"
        class="flex items-start gap-2"
        :class="{ 'sm:col-span-2': field.wide }"
      >
        <component :is="field.icon" class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <dt class="shrink-0 text-muted-foreground">
          {{ field.label }}
        </dt>
        <dd class="min-w-0 font-medium break-words">
          {{ field.value || '—' }}
        </dd>
      </div>
    </dl>
  </div>
</template>
