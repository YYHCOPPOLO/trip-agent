<script setup lang="ts">
import type { Attraction } from '@/types'
import { ArrowDown, ArrowUp, Clock, ImageOff, MapPin, Star, Ticket, Trash2 } from '@lucide/vue'
import { ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getPlaceholderGradient } from '@/lib/trip'
import { cn } from '@/lib/utils'

const props = defineProps<{
  attraction: Attraction
  index: number
  total: number
  editMode: boolean
  photo?: string
  photoLoading?: boolean
}>()

const emit = defineEmits<{
  move: [direction: 'up' | 'down']
  remove: []
  update: [patch: Partial<Attraction>]
}>()

const MIN_DURATION = 10
const MAX_DURATION = 480

const imageFailed = ref(false)
watch(() => props.photo, () => {
  imageFailed.value = false
})

function updateDuration(value: string | number) {
  const parsed = Number(value)
  if (Number.isNaN(parsed))
    return
  emit('update', { visit_duration: parsed })
}

function clampDuration() {
  const clamped = Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(props.attraction.visit_duration || MIN_DURATION)))
  if (clamped !== props.attraction.visit_duration)
    emit('update', { visit_duration: clamped })
}
</script>

<template>
  <article
    class="group/attraction flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5"
    data-export-card
  >
    <!-- 景点图片 -->
    <div class="relative h-40 overflow-hidden bg-muted sm:h-44">
      <Skeleton v-if="photoLoading && !photo" class="size-full rounded-none" />
      <img
        v-else-if="photo && !imageFailed"
        :src="photo"
        :alt="attraction.name"
        loading="lazy"
        referrerpolicy="no-referrer"
        class="size-full object-cover transition-transform duration-500 group-hover/attraction:scale-105"
        @error="imageFailed = true"
      >
      <div
        v-else
        :class="cn('flex size-full flex-col items-center justify-center gap-1 bg-gradient-to-br p-4 text-center text-white', getPlaceholderGradient(index))"
      >
        <ImageOff v-if="imageFailed" class="size-5 opacity-80" />
        <span class="line-clamp-2 text-lg font-semibold drop-shadow-sm">{{ attraction.name }}</span>
        <span v-if="imageFailed" class="text-xs opacity-80">图片加载失败</span>
      </div>

      <span class="absolute top-3 left-3 flex size-7 items-center justify-center rounded-full bg-background/90 text-xs font-bold text-foreground shadow-sm backdrop-blur">
        {{ index + 1 }}
      </span>
      <span
        v-if="attraction.ticket_price"
        class="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background backdrop-blur"
      >
        <Ticket class="size-3" />
        ¥{{ attraction.ticket_price }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h4 class="truncate font-semibold" :title="attraction.name">
            {{ attraction.name }}
          </h4>
          <div class="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge v-if="attraction.category" variant="secondary" class="font-normal">
              {{ attraction.category }}
            </Badge>
            <span v-if="attraction.rating" class="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
              <Star class="size-3.5 fill-current" />
              {{ attraction.rating }}
            </span>
          </div>
        </div>

        <!-- 编辑模式下的操作按钮 -->
        <div v-if="editMode" class="flex shrink-0 items-center gap-1" data-export-ignore>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button size="icon-sm" variant="outline" :disabled="index === 0" aria-label="上移" @click="emit('move', 'up')">
                <ArrowUp />
              </Button>
            </TooltipTrigger>
            <TooltipContent>上移</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button size="icon-sm" variant="outline" :disabled="index === total - 1" aria-label="下移" @click="emit('move', 'down')">
                <ArrowDown />
              </Button>
            </TooltipTrigger>
            <TooltipContent>下移</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button size="icon-sm" variant="destructive" aria-label="删除" @click="emit('remove')">
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <!-- 编辑模式下可编辑的字段 -->
      <div v-if="editMode" class="space-y-3">
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground">地址</Label>
          <Input :model-value="attraction.address" class="h-8" @update:model-value="emit('update', { address: String($event) })" />
        </div>
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground">游览时长(分钟)</Label>
          <Input
            type="number"
            :min="MIN_DURATION"
            :max="MAX_DURATION"
            :model-value="attraction.visit_duration"
            class="h-8"
            @update:model-value="updateDuration"
            @blur="clampDuration"
          />
        </div>
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground">描述</Label>
          <Textarea :model-value="attraction.description" rows="2" class="min-h-16 text-sm" @update:model-value="emit('update', { description: String($event) })" />
        </div>
      </div>

      <!-- 查看模式 -->
      <div v-else class="space-y-2 text-sm">
        <p class="flex items-start gap-2 text-muted-foreground">
          <MapPin class="mt-0.5 size-4 shrink-0" />
          <span class="min-w-0 break-words">{{ attraction.address }}</span>
        </p>
        <p class="flex items-center gap-2 text-muted-foreground">
          <Clock class="size-4 shrink-0" />
          游览时长 {{ attraction.visit_duration }} 分钟
        </p>
        <p class="leading-relaxed text-pretty">
          {{ attraction.description }}
        </p>
      </div>
    </div>
  </article>
</template>
