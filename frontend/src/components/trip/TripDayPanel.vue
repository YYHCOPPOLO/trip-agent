<script setup lang="ts">
import type { Attraction, DayPlan } from '@/types'
import { BedDouble, Car, ChevronDown, Landmark } from '@lucide/vue'
import { computed } from 'vue'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { dayColor, parseDate } from '@/lib/trip'
import TripAttractionCard from './TripAttractionCard.vue'
import TripHotelCard from './TripHotelCard.vue'
import TripMeals from './TripMeals.vue'

const props = defineProps<{
  day: DayPlan
  index: number
  editMode: boolean
  photos: Record<string, string>
  photosLoading: boolean
}>()

const emit = defineEmits<{
  moveAttraction: [attrIndex: number, direction: 'up' | 'down']
  deleteAttraction: [attrIndex: number]
  updateAttraction: [attrIndex: number, patch: Partial<Attraction>]
}>()

const color = computed(() => dayColor(props.index))
const date = computed(() => parseDate(props.day.date))
const dayNo = computed(() => String(props.day.day_index + 1).padStart(2, '0'))
</script>

<template>
  <AccordionItem
    :id="`day-${index}`"
    :value="`day-${index}`"
    class="surface-card relative overflow-hidden border transition-shadow"
    :style="{ '--day': color }"
    data-export-card
  >
    <!-- 左侧色条 -->
    <span aria-hidden="true" class="absolute inset-y-0 left-0 w-1.5 bg-[var(--day)]" />

    <AccordionTrigger class="items-center rounded-none px-5 py-5 hover:no-underline sm:px-7">
      <div class="flex min-w-0 flex-1 items-center gap-4 text-left sm:gap-6">
        <!-- 日期块 -->
        <div class="flex shrink-0 flex-col items-center">
          <span class="text-[10px] font-bold tracking-[0.25em] text-[var(--day)] uppercase">Day</span>
          <span class="font-display text-4xl leading-none font-black text-[var(--day)] tabular-nums sm:text-5xl">{{ dayNo }}</span>
        </div>
        <span class="hidden h-12 w-px bg-border sm:block" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span class="font-display text-lg font-bold">
              {{ date ? `${date.month}月${date.day}日` : day.date }}
            </span>
            <span v-if="date" class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{{ date.weekday }}</span>
            <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-[var(--day)] [background:color-mix(in_oklab,var(--day)_12%,transparent)]">
              <Landmark class="size-3" />
              {{ day.attractions.length }} 个景点
            </span>
          </div>
          <p class="mt-1 line-clamp-1 text-sm font-normal text-muted-foreground sm:line-clamp-2">
            {{ day.description }}
          </p>
        </div>
      </div>
      <template #icon>
        <span class="ml-3 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-all duration-300 group-hover/accordion-trigger:text-foreground group-aria-expanded/accordion-trigger:rotate-180 group-aria-expanded/accordion-trigger:border-transparent group-aria-expanded/accordion-trigger:bg-[var(--day)] group-aria-expanded/accordion-trigger:text-white">
          <ChevronDown class="size-4" />
        </span>
      </template>
    </AccordionTrigger>

    <AccordionContent class="space-y-6 px-5 pb-6 sm:px-7">
      <!-- 行程基本信息 -->
      <div class="flex flex-wrap gap-2 text-sm">
        <span class="inline-flex items-center gap-2 rounded-full border bg-surface/60 px-3 py-1.5">
          <Car class="size-4 text-[var(--day)]" />
          <span class="text-muted-foreground">交通</span>
          <span class="font-medium">{{ day.transportation }}</span>
        </span>
        <span class="inline-flex items-center gap-2 rounded-full border bg-surface/60 px-3 py-1.5">
          <BedDouble class="size-4 text-[var(--day)]" />
          <span class="text-muted-foreground">住宿</span>
          <span class="font-medium">{{ day.accommodation }}</span>
        </span>
      </div>

      <p class="rounded-2xl bg-surface/60 p-4 text-sm leading-7 text-foreground/80">
        {{ day.description }}
      </p>

      <!-- 景点时间线 -->
      <ol class="relative space-y-4 pl-9 sm:pl-12">
        <span aria-hidden="true" class="absolute top-4 bottom-4 left-[13px] w-0.5 rounded-full bg-[linear-gradient(to_bottom,var(--day),color-mix(in_oklab,var(--day)_15%,transparent))] sm:left-[17px]" />
        <li
          v-for="(attraction, attrIndex) in day.attractions"
          :key="`${attraction.name}-${attrIndex}`"
          class="relative"
        >
          <span
            aria-hidden="true"
            class="absolute top-5 -left-9 flex size-7 items-center justify-center rounded-full border-[3px] border-card bg-[var(--day)] text-[11px] font-bold text-white shadow-md sm:-left-12 sm:size-9 sm:text-xs"
          >
            {{ attrIndex + 1 }}
          </span>
          <TripAttractionCard
            :attraction="attraction"
            :index="attrIndex"
            :total="day.attractions.length"
            :edit-mode="editMode"
            :photo="photos[attraction.name]"
            :photo-loading="photosLoading"
            :color="color"
            @move="emit('moveAttraction', attrIndex, $event)"
            @remove="emit('deleteAttraction', attrIndex)"
            @update="emit('updateAttraction', attrIndex, $event)"
          />
        </li>
      </ol>

      <!-- 住宿 + 餐饮 -->
      <div v-if="day.hotel || day.meals.length" class="grid gap-4 lg:grid-cols-2">
        <TripHotelCard v-if="day.hotel" :hotel="day.hotel" />
        <TripMeals v-if="day.meals.length" :meals="day.meals" />
      </div>
    </AccordionContent>
  </AccordionItem>
</template>
