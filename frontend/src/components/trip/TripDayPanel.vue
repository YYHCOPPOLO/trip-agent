<script setup lang="ts">
import type { Attraction, DayPlan } from '@/types'
import { BedDouble, Car, FileText, Hotel, Landmark, UtensilsCrossed } from '@lucide/vue'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import TripAttractionCard from './TripAttractionCard.vue'
import TripHotelCard from './TripHotelCard.vue'
import TripMeals from './TripMeals.vue'

defineProps<{
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
</script>

<template>
  <AccordionItem :id="`day-${index}`" :value="`day-${index}`" class="rounded-xl border bg-card px-4 transition-shadow data-[state=open]:shadow-sm sm:px-5" data-export-card>
    <AccordionTrigger class="py-4 hover:no-underline">
      <div class="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span class="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span class="text-[10px] leading-none opacity-80">DAY</span>
          <span class="text-base leading-tight font-bold">{{ day.day_index + 1 }}</span>
        </span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold">第{{ day.day_index + 1 }}天</span>
            <span class="text-sm font-normal text-muted-foreground">{{ day.date }}</span>
          </div>
          <p class="mt-0.5 line-clamp-1 text-sm font-normal text-muted-foreground">
            {{ day.description }}
          </p>
        </div>
        <Badge variant="secondary" class="ml-auto hidden shrink-0 font-normal sm:inline-flex">
          {{ day.attractions.length }} 个景点
        </Badge>
      </div>
    </AccordionTrigger>

    <AccordionContent class="space-y-6 pb-5">
      <!-- 行程基本信息 -->
      <div class="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-3">
        <div class="flex items-start gap-2 sm:col-span-3">
          <FileText class="mt-0.5 size-4 shrink-0 text-primary" />
          <span class="shrink-0 text-muted-foreground">行程描述:</span>
          <span>{{ day.description }}</span>
        </div>
        <div class="flex items-start gap-2 sm:col-span-1">
          <Car class="mt-0.5 size-4 shrink-0 text-primary" />
          <span class="shrink-0 text-muted-foreground">交通方式:</span>
          <span>{{ day.transportation }}</span>
        </div>
        <div class="flex items-start gap-2 sm:col-span-2">
          <BedDouble class="mt-0.5 size-4 shrink-0 text-primary" />
          <span class="shrink-0 text-muted-foreground">住宿:</span>
          <span>{{ day.accommodation }}</span>
        </div>
      </div>

      <!-- 景点安排 -->
      <section class="space-y-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold">
          <Landmark class="size-4 text-primary" />
          景点安排
        </h3>
        <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <TripAttractionCard
            v-for="(attraction, attrIndex) in day.attractions"
            :key="`${attraction.name}-${attrIndex}`"
            :attraction="attraction"
            :index="attrIndex"
            :total="day.attractions.length"
            :edit-mode="editMode"
            :photo="photos[attraction.name]"
            :photo-loading="photosLoading"
            @move="emit('moveAttraction', attrIndex, $event)"
            @remove="emit('deleteAttraction', attrIndex)"
            @update="emit('updateAttraction', attrIndex, $event)"
          />
        </div>
      </section>

      <!-- 酒店推荐 -->
      <section v-if="day.hotel" class="space-y-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold">
          <Hotel class="size-4 text-primary" />
          住宿推荐
        </h3>
        <TripHotelCard :hotel="day.hotel" />
      </section>

      <!-- 餐饮安排 -->
      <section v-if="day.meals.length" class="space-y-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold">
          <UtensilsCrossed class="size-4 text-primary" />
          餐饮安排
        </h3>
        <TripMeals :meals="day.meals" />
      </section>
    </AccordionContent>
  </AccordionItem>
</template>
