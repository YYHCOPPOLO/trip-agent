<script setup lang="ts">
import type { Attraction } from '@/types'
import { ArrowDown, ArrowUp, Clock, ImageOff, MapPin, Star, Ticket, Trash2 } from '@lucide/vue'
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  /** 所属日期的主题色 */
  color?: string
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

function formatDuration(minutes: number) {
  if (!minutes)
    return '—'
  if (minutes < 60)
    return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`
}
</script>

<template>
  <article
    :class="cn(
      'group/attraction relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 sm:flex-row',
      editMode ? 'ring-1 ring-primary/20' : 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-foreground/[0.06]',
    )"
    data-export-card
  >
    <!-- 景点图片 -->
    <div class="relative h-44 shrink-0 overflow-hidden bg-muted sm:h-auto sm:min-h-44 sm:w-56 lg:w-64">
      <div
        v-if="photoLoading && !photo"
        class="size-full animate-shimmer bg-[linear-gradient(110deg,var(--muted)_30%,var(--surface)_50%,var(--muted)_70%)] bg-[length:200%_100%]"
      />
      <img
        v-else-if="photo && !imageFailed"
        :src="photo"
        :alt="attraction.name"
        loading="lazy"
        referrerpolicy="no-referrer"
        class="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover/attraction:scale-110"
        @error="imageFailed = true"
      >
      <div
        v-else
        :class="cn('absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br p-4 text-center text-white', getPlaceholderGradient(index))"
      >
        <ImageOff v-if="imageFailed" class="size-5 opacity-80" />
        <span class="line-clamp-2 font-display text-xl font-bold drop-shadow-sm">{{ attraction.name }}</span>
        <span v-if="imageFailed" class="text-xs opacity-80">图片加载失败</span>
      </div>
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <span
        v-if="attraction.ticket_price"
        class="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur"
      >
        <Ticket class="size-3" />
        ¥{{ attraction.ticket_price }}
      </span>
      <span
        v-if="attraction.rating"
        class="absolute top-3 right-3 inline-flex items-center gap-0.5 rounded-full bg-black/45 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur"
      >
        <Star class="size-3 fill-amber-400 text-amber-400" />
        {{ attraction.rating }}
      </span>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold tracking-wider text-white uppercase"
              :style="{ background: color ?? 'var(--primary)' }"
            >
              Stop {{ String(index + 1).padStart(2, '0') }}
            </span>
            <span v-if="attraction.category" class="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {{ attraction.category }}
            </span>
          </div>
          <h4 class="mt-1.5 truncate font-display text-lg font-bold" :title="attraction.name">
            {{ attraction.name }}
          </h4>
        </div>

        <!-- 编辑模式下的操作按钮 -->
        <div v-if="editMode" class="flex shrink-0 items-center gap-1" data-export-ignore>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button size="icon-sm" variant="outline" class="rounded-full" :disabled="index === 0" aria-label="上移" @click="emit('move', 'up')">
                <ArrowUp />
              </Button>
            </TooltipTrigger>
            <TooltipContent>上移</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button size="icon-sm" variant="outline" class="rounded-full" :disabled="index === total - 1" aria-label="下移" @click="emit('move', 'down')">
                <ArrowDown />
              </Button>
            </TooltipTrigger>
            <TooltipContent>下移</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button size="icon-sm" variant="destructive" class="rounded-full" aria-label="删除" @click="emit('remove')">
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <!-- 编辑模式下可编辑的字段 -->
      <div v-if="editMode" class="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground">地址</Label>
          <Input :model-value="attraction.address" class="h-9 rounded-xl" @update:model-value="emit('update', { address: String($event) })" />
        </div>
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground">游览时长(分钟)</Label>
          <Input
            type="number"
            :min="MIN_DURATION"
            :max="MAX_DURATION"
            :model-value="attraction.visit_duration"
            class="h-9 rounded-xl"
            @update:model-value="updateDuration"
            @blur="clampDuration"
          />
        </div>
        <div class="space-y-1.5 sm:col-span-2">
          <Label class="text-xs text-muted-foreground">描述</Label>
          <Textarea :model-value="attraction.description" rows="2" class="min-h-16 rounded-xl text-sm" @update:model-value="emit('update', { description: String($event) })" />
        </div>
      </div>

      <!-- 查看模式 -->
      <template v-else>
        <p class="line-clamp-3 text-sm leading-relaxed text-pretty text-foreground/80">
          {{ attraction.description }}
        </p>
        <div class="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
          <span class="inline-flex items-center gap-1.5">
            <Clock class="size-3.5" />
            {{ formatDuration(attraction.visit_duration) }}
          </span>
          <span class="inline-flex min-w-0 items-center gap-1.5">
            <MapPin class="size-3.5 shrink-0" />
            <span class="truncate" :title="attraction.address">{{ attraction.address }}</span>
          </span>
        </div>
      </template>
    </div>
  </article>
</template>
