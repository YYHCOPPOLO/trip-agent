<script setup lang="ts">
import type { DateRange } from 'reka-ui'
import type { Component } from 'vue'
import type { PlanningStep } from '@/components/trip/PlanningOverlay.vue'
import type { TripFormData } from '@/types'
import { getLocalTimeZone, today } from '@internationalized/date'
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CarFront,
  ClipboardList,
  CloudSun,
  Coffee,
  Download,
  Footprints,
  Gem,
  Hotel,
  House,
  Landmark,
  Loader2,
  MapPin,
  MapPinned,
  MessageSquareText,
  Mountain,
  Palette,
  PencilLine,
  Search,
  ShoppingBag,
  Shuffle,
  Sparkles,
  TrainFront,
  UtensilsCrossed,
  Wallet,
} from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { generateTripPlan } from '@/api/trip'
import PlanningOverlay from '@/components/trip/PlanningOverlay.vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/trip'
import { cn } from '@/lib/utils'
import { useTripPlanStore } from '@/stores/trip'

interface Option {
  value: string
  label: string
  hint?: string
  icon: Component
}

const MAX_DAYS = 30

const router = useRouter()
const tripStore = useTripPlanStore()
const loading = ref(false)
const loadingProgress = ref(0)
const loadingStatus = ref('')
const datePickerOpen = ref(false)
const isDesktop = useMediaQuery('(min-width: 768px)')

const popularCities = ['北京', '上海', '成都', '西安', '杭州', '厦门', '重庆', '桂林']

const transportOptions: Option[] = [
  { value: '公共交通', label: '公共交通', hint: '地铁 · 公交', icon: TrainFront },
  { value: '自驾', label: '自驾', hint: '自由灵活', icon: CarFront },
  { value: '步行', label: '步行', hint: 'City Walk', icon: Footprints },
  { value: '混合', label: '混合', hint: '按需组合', icon: Shuffle },
]

const accommodationOptions: Option[] = [
  { value: '经济型酒店', label: '经济型', hint: '高性价比', icon: Wallet },
  { value: '舒适型酒店', label: '舒适型', hint: '品质之选', icon: Hotel },
  { value: '豪华酒店', label: '豪华型', hint: '尊享体验', icon: Gem },
  { value: '民宿', label: '民宿', hint: '在地风情', icon: House },
]

const preferenceOptions: Option[] = [
  { value: '历史文化', label: '历史文化', icon: Landmark },
  { value: '自然风光', label: '自然风光', icon: Mountain },
  { value: '美食', label: '美食', icon: UtensilsCrossed },
  { value: '购物', label: '购物', icon: ShoppingBag },
  { value: '艺术', label: '艺术', icon: Palette },
  { value: '休闲', label: '休闲', icon: Coffee },
]

const features = [
  { icon: Search, title: '智能景点推荐', desc: '结合兴趣偏好，从海量 POI 中筛选真正值得去的地方。', tone: 'from-[oklch(0.6_0.1_200)] to-[oklch(0.45_0.08_230)]' },
  { icon: CloudSun, title: '实时天气参考', desc: '按出行日期获取天气预报，提前规划雨天备选。', tone: 'from-[oklch(0.75_0.12_230)] to-[oklch(0.55_0.12_260)]' },
  { icon: MapPinned, title: '路线地图可视化', desc: '每日路线以不同颜色绘制在地图上，一目了然。', tone: 'from-[oklch(0.7_0.13_160)] to-[oklch(0.5_0.1_190)]' },
  { icon: Wallet, title: '住宿与预算', desc: '推荐酒店并拆分门票、住宿、餐饮、交通的花费。', tone: 'from-[oklch(0.78_0.14_70)] to-[oklch(0.65_0.17_40)]' },
  { icon: PencilLine, title: '自由编辑', desc: '调整景点顺序、删除或修改信息，行程随你而变。', tone: 'from-[oklch(0.7_0.14_330)] to-[oklch(0.55_0.15_300)]' },
  { icon: Download, title: '一键导出', desc: '导出为高清图片或 PDF，离线查看、分享给同伴。', tone: 'from-[oklch(0.55_0.05_250)] to-[oklch(0.35_0.04_250)]' },
]

const howItWorks = [
  { no: '01', title: '说出你的想法', desc: '目的地、日期、偏好，再加一句特别需求。' },
  { no: '02', title: 'AI 多智能体协作', desc: '景点、天气、酒店智能体并行检索与推理。' },
  { no: '03', title: '获得专属行程', desc: '可视化地图、每日安排与预算，一键导出。' },
]

type TripFormState = Omit<TripFormData, 'start_date' | 'end_date'>

const formData = reactive<TripFormState>({
  city: '',
  travel_days: 1,
  transportation: '公共交通',
  accommodation: '经济型酒店',
  preferences: [],
  free_text_input: '',
})

const dateRange = shallowRef<DateRange>({ start: undefined, end: undefined })
const errors = reactive<{ city?: string, dates?: string }>({})
const todayDate = today(getLocalTimeZone())

function formatShort(value: { month: number, day: number }) {
  return `${value.month}月${value.day}日`
}

const dateLabel = computed(() => {
  const { start, end } = dateRange.value
  if (!start)
    return ''
  return end ? `${formatShort(start)} — ${formatShort(end)}` : `${formatShort(start)} — 选择返程`
})

const summary = computed(() => {
  const parts = [
    formData.city.trim() || '目的地待定',
    `${formData.travel_days} 天`,
    formData.transportation,
    formData.accommodation,
  ]
  if (formData.preferences.length)
    parts.push(formData.preferences.join('/'))
  return parts.join(' · ')
})

// 监听日期变化,自动计算旅行天数
watch(dateRange, (range) => {
  const { start, end } = range
  if (start && end) {
    const days = end.compare(start) + 1
    if (days > 0 && days <= MAX_DAYS) {
      formData.travel_days = days
      errors.dates = undefined
      datePickerOpen.value = false
    }
    else if (days > MAX_DAYS) {
      toast.warning(`旅行天数不能超过${MAX_DAYS}天`)
      dateRange.value = { start, end: undefined }
    }
    else {
      toast.warning('结束日期不能早于开始日期')
      dateRange.value = { start, end: undefined }
    }
  }
})

watch(() => formData.city, (city) => {
  if (city.trim())
    errors.city = undefined
})

function togglePreference(value: string) {
  const index = formData.preferences.indexOf(value)
  if (index === -1)
    formData.preferences.push(value)
  else
    formData.preferences.splice(index, 1)
}

function pickCity(city: string) {
  formData.city = city
}

function validate(): boolean {
  errors.city = formData.city.trim() ? undefined : '请输入目的地城市'
  const { start, end } = dateRange.value
  if (!start)
    errors.dates = '请选择开始日期'
  else if (!end)
    errors.dates = '请选择结束日期'
  else
    errors.dates = undefined
  return !errors.city && !errors.dates
}

function updateLoadingStatus(progress: number) {
  if (progress <= 30)
    loadingStatus.value = '正在搜索景点...'
  else if (progress <= 50)
    loadingStatus.value = '正在查询天气...'
  else if (progress <= 70)
    loadingStatus.value = '正在推荐酒店...'
  else
    loadingStatus.value = '正在生成行程计划...'
}

const loadingSteps: PlanningStep[] = [
  { at: 10, label: '搜索景点', icon: Search },
  { at: 40, label: '查询天气', icon: CloudSun },
  { at: 60, label: '推荐酒店', icon: Building2 },
  { at: 80, label: '生成行程', icon: ClipboardList },
]

function scrollToPlanner() {
  document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function handleSubmit() {
  if (!validate()) {
    if (errors.dates && !errors.city)
      toast.error('请选择日期')
    scrollToPlanner()
    return
  }
  const { start, end } = dateRange.value
  if (!start || !end)
    return

  loading.value = true
  loadingProgress.value = 0
  loadingStatus.value = '正在初始化...'

  // 模拟进度更新
  const progressInterval = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += 10
      updateLoadingStatus(loadingProgress.value)
    }
  }, 500)

  try {
    const requestData: TripFormData = {
      city: formData.city.trim(),
      start_date: start.toString(),
      end_date: end.toString(),
      travel_days: formData.travel_days,
      transportation: formData.transportation,
      accommodation: formData.accommodation,
      preferences: [...formData.preferences],
      free_text_input: formData.free_text_input,
    }

    const response = await generateTripPlan(requestData)

    clearInterval(progressInterval)
    loadingProgress.value = 100
    loadingStatus.value = '完成!'

    if (response.success && response.data) {
      tripStore.setPlan(response.data)
      toast.success('旅行计划生成成功!')

      // 短暂延迟后跳转
      setTimeout(() => {
        router.push('/result')
      }, 500)
    }
    else {
      toast.error(response.message || '生成失败')
    }
  }
  catch (error) {
    clearInterval(progressInterval)
    toast.error(getErrorMessage(error, '生成旅行计划失败,请稍后重试'))
  }
  finally {
    setTimeout(() => {
      loading.value = false
      loadingProgress.value = 0
      loadingStatus.value = ''
    }, 1000)
  }
}
</script>

<template>
  <div class="relative">
    <!-- ================= Hero ================= -->
    <section class="relative isolate flex min-h-[640px] items-start overflow-hidden bg-[oklch(0.2_0.03_240)] pt-32 pb-56 sm:min-h-[720px] sm:pt-40 lg:min-h-[86svh]">
      <img
        src="/images/hero.jpg"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 -z-20 size-full animate-ken-burns object-cover object-center"
        fetchpriority="high"
      >
      <!-- 渐变遮罩:顶部压暗以托住头部,底部融入页面背景 -->
      <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-b from-[oklch(0.15_0.03_250/0.75)] via-[oklch(0.15_0.03_250/0.25)] to-transparent" />
      <div aria-hidden="true" class="absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div aria-hidden="true" class="grain absolute inset-0 -z-10" />

      <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl">
          <span class="glass-dark inline-flex animate-fade-up items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-[oklch(0.8_0.15_60)] opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-[oklch(0.8_0.15_60)]" />
            </span>
            AI 多智能体 · 个性化行程规划
          </span>
          <h1 class="mt-6 animate-fade-up font-display text-[2.6rem] leading-[1.12] font-black tracking-tight text-white [animation-delay:80ms] sm:text-6xl lg:text-7xl">
            把下一段旅程<br>
            交给 <span class="text-gradient-sunset">AI</span> 来规划
          </h1>
          <p class="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-white/80 [animation-delay:160ms] sm:text-lg">
            告诉我们目的地与心意，几十秒内为你生成包含景点路线、天气、住宿、餐饮与预算的完整行程。
          </p>
          <div class="mt-8 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:240ms]">
            <button
              id="hero-cta"
              type="button"
              class="btn-sunset inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
              @click="scrollToPlanner"
            >
              <Sparkles class="size-4" />
              开始规划
              <ArrowRight class="size-4" />
            </button>
            <RouterLink
              v-if="tripStore.plan"
              to="/result"
              class="glass-dark inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              <MapPinned class="size-4" />
              继续查看「{{ tripStore.plan.city }}」行程
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= Planner ================= -->
    <section id="planner" class="relative z-10 mx-auto -mt-44 max-w-6xl px-4 sm:px-6 lg:px-8">
      <form
        class="surface-card animate-fade-up overflow-hidden [animation-delay:320ms]"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <!-- 顶部:目的地 / 日期 / 天数 -->
        <div class="p-4 sm:p-6">
          <div class="grid overflow-visible rounded-2xl border bg-background/60 md:grid-cols-[1.2fr_1.4fr_auto] md:divide-x">
            <!-- 目的地 -->
            <label
              for="city"
              :class="cn(
                'group relative flex cursor-text items-center gap-3 rounded-2xl px-5 py-4 transition-colors hover:bg-muted/60 focus-within:bg-muted/60',
                errors.city && 'bg-destructive/5',
              )"
            >
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin class="size-5" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">目的地</span>
                <input
                  id="city"
                  v-model="formData.city"
                  type="text"
                  placeholder="想去哪座城市？"
                  autocomplete="off"
                  :aria-invalid="!!errors.city || undefined"
                  class="mt-0.5 w-full bg-transparent font-display text-lg font-bold outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground/70"
                >
                <span v-if="errors.city" class="mt-0.5 text-xs text-destructive">{{ errors.city }}</span>
              </span>
            </label>

            <!-- 日期 -->
            <Popover v-model:open="datePickerOpen">
              <PopoverTrigger as-child>
                <button
                  id="trip-dates"
                  type="button"
                  :aria-invalid="!!errors.dates || undefined"
                  :class="cn(
                    'flex items-center gap-3 border-t px-5 py-4 text-left transition-colors hover:bg-muted/60 data-[state=open]:bg-muted/60 md:border-t-0',
                    errors.dates && 'bg-destructive/5',
                  )"
                >
                  <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sunset/12 text-sunset">
                    <CalendarDays class="size-5" />
                  </span>
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span class="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">出行日期</span>
                    <span :class="cn('mt-0.5 truncate text-lg font-bold', dateLabel ? 'font-display' : 'text-base font-normal text-muted-foreground/70')">
                      {{ dateLabel || '选择出发与返程日期' }}
                    </span>
                    <span v-if="errors.dates" class="mt-0.5 text-xs text-destructive">{{ errors.dates }}</span>
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent class="w-auto rounded-2xl p-0" align="start">
                <RangeCalendar
                  v-model="dateRange"
                  locale="zh-CN"
                  :week-starts-on="1"
                  :number-of-months="isDesktop ? 2 : 1"
                  :placeholder="dateRange.start ?? todayDate"
                  :min-value="todayDate"
                  initial-focus
                />
              </PopoverContent>
            </Popover>

            <!-- 天数 -->
            <div class="flex items-center justify-between gap-4 border-t px-5 py-4 md:flex-col md:justify-center md:border-t-0 md:px-8">
              <span class="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">天数</span>
              <span class="flex items-baseline gap-1">
                <span class="font-display text-3xl font-black text-foreground tabular-nums">{{ formData.travel_days }}</span>
                <span class="text-sm text-muted-foreground">天</span>
              </span>
            </div>
          </div>

          <!-- 热门城市 -->
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <span class="mr-1 text-xs text-muted-foreground">热门目的地</span>
            <button
              v-for="city in popularCities"
              :key="city"
              type="button"
              :class="cn(
                'h-7 rounded-full border px-3 text-xs font-medium transition-all active:scale-95',
                formData.city === city
                  ? 'border-foreground bg-foreground text-background'
                  : 'bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )"
              @click="pickCity(city)"
            >
              {{ city }}
            </button>
          </div>
        </div>

        <div class="grid gap-8 border-t bg-surface/50 p-4 sm:p-6 lg:grid-cols-2 lg:gap-10 lg:p-8">
          <!-- 交通方式 -->
          <fieldset>
            <legend class="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span class="eyebrow">01</span>
              交通方式
            </legend>
            <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label="交通方式">
              <button
                v-for="option in transportOptions"
                :id="`transport-${option.value}`"
                :key="option.value"
                type="button"
                role="radio"
                :aria-checked="formData.transportation === option.value"
                :class="cn(
                  'group relative flex flex-col items-start gap-2 rounded-2xl border bg-card p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]',
                  formData.transportation === option.value
                    ? 'border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_18%,transparent)]'
                    : 'hover:border-foreground/20 hover:shadow-md',
                )"
                @click="formData.transportation = option.value"
              >
                <span
                  :class="cn(
                    'flex size-9 items-center justify-center rounded-xl transition-colors',
                    formData.transportation === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground',
                  )"
                >
                  <component :is="option.icon" class="size-[18px]" />
                </span>
                <span>
                  <span class="block text-sm font-semibold">{{ option.label }}</span>
                  <span class="block text-[11px] text-muted-foreground">{{ option.hint }}</span>
                </span>
              </button>
            </div>
          </fieldset>

          <!-- 住宿偏好 -->
          <fieldset>
            <legend class="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span class="eyebrow">02</span>
              住宿偏好
            </legend>
            <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label="住宿偏好">
              <button
                v-for="option in accommodationOptions"
                :id="`accommodation-${option.value}`"
                :key="option.value"
                type="button"
                role="radio"
                :aria-checked="formData.accommodation === option.value"
                :class="cn(
                  'group relative flex flex-col items-start gap-2 rounded-2xl border bg-card p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]',
                  formData.accommodation === option.value
                    ? 'border-sunset shadow-[0_0_0_3px_color-mix(in_oklab,var(--sunset)_20%,transparent)]'
                    : 'hover:border-foreground/20 hover:shadow-md',
                )"
                @click="formData.accommodation = option.value"
              >
                <span
                  :class="cn(
                    'flex size-9 items-center justify-center rounded-xl transition-colors',
                    formData.accommodation === option.value ? 'bg-sunset text-sunset-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground',
                  )"
                >
                  <component :is="option.icon" class="size-[18px]" />
                </span>
                <span>
                  <span class="block text-sm font-semibold">{{ option.label }}</span>
                  <span class="block text-[11px] text-muted-foreground">{{ option.hint }}</span>
                </span>
              </button>
            </div>
          </fieldset>

          <!-- 旅行偏好 -->
          <fieldset>
            <legend class="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span class="eyebrow">03</span>
              旅行偏好
              <span class="text-xs font-normal text-muted-foreground">(可多选)</span>
            </legend>
            <div class="flex flex-wrap gap-2" role="group" aria-label="旅行偏好">
              <button
                v-for="option in preferenceOptions"
                :id="`preference-${option.value}`"
                :key="option.value"
                type="button"
                role="checkbox"
                :aria-checked="formData.preferences.includes(option.value)"
                :class="cn(
                  'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200 active:scale-95',
                  formData.preferences.includes(option.value)
                    ? 'border-transparent bg-gradient-to-r from-primary to-[oklch(0.45_0.08_230)] text-primary-foreground shadow-md shadow-primary/25 dark:to-[oklch(0.65_0.1_220)]'
                    : 'bg-card text-foreground hover:border-primary/40 hover:bg-accent',
                )"
                @click="togglePreference(option.value)"
              >
                <component :is="option.icon" class="size-4" />
                {{ option.label }}
              </button>
            </div>
          </fieldset>

          <!-- 额外要求 -->
          <fieldset>
            <legend class="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span class="eyebrow">04</span>
              额外要求
              <span class="text-xs font-normal text-muted-foreground">(可选)</span>
            </legend>
            <div class="relative">
              <MessageSquareText class="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
              <Textarea
                id="free-text"
                v-model="formData.free_text_input"
                placeholder="例如：想去看升旗、需要无障碍设施、对海鲜过敏、带老人小孩出行…"
                rows="3"
                class="min-h-[104px] resize-y rounded-2xl bg-card pl-10 text-sm leading-relaxed"
              />
            </div>
          </fieldset>
        </div>

        <!-- 提交区 -->
        <div class="flex flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:px-8">
          <div class="min-w-0">
            <p class="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              行程摘要
            </p>
            <p class="mt-1 truncate text-sm font-medium" :title="summary">
              {{ summary }}
            </p>
          </div>
          <button
            id="submit-plan"
            type="submit"
            :disabled="loading"
            class="btn-sunset inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-2xl px-8 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            <template v-if="!loading">
              <Sparkles class="size-5" />
              开始规划我的旅行
            </template>
            <template v-else>
              <Loader2 class="size-5 animate-spin" />
              正在生成中...
            </template>
          </button>
        </div>
      </form>
    </section>

    <!-- ================= How it works ================= -->
    <section class="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8" aria-labelledby="how-title">
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span class="eyebrow">How it works</span>
          <h2 id="how-title" class="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            三步，抵达理想旅程
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-relaxed text-muted-foreground">
          背后是一组分工明确的 AI 智能体：它们检索真实 POI、天气与酒店数据，再由规划智能体整合成可执行的行程。
        </p>
      </div>
      <ol class="mt-10 grid gap-4 md:grid-cols-3">
        <li
          v-for="step in howItWorks"
          :key="step.no"
          class="group relative overflow-hidden rounded-3xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5"
        >
          <span class="font-display text-6xl font-black text-foreground/[0.07] transition-colors group-hover:text-sunset/25">{{ step.no }}</span>
          <h3 class="mt-2 text-lg font-semibold">
            {{ step.title }}
          </h3>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {{ step.desc }}
          </p>
          <span class="absolute inset-x-6 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-sunset to-primary transition-transform duration-500 group-hover:scale-x-100" />
        </li>
      </ol>
    </section>

    <!-- ================= Features ================= -->
    <section class="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8" aria-labelledby="features-title">
      <div class="text-center">
        <span class="eyebrow">Features</span>
        <h2 id="features-title" class="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          一份行程，所需尽有
        </h2>
      </div>
      <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="group relative overflow-hidden rounded-3xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5"
        >
          <div :class="cn('absolute -top-16 -right-16 size-40 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25', feature.tone)" />
          <span :class="cn('relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', feature.tone)">
            <component :is="feature.icon" class="size-5" />
          </span>
          <h3 class="relative mt-5 text-base font-semibold">
            {{ feature.title }}
          </h3>
          <p class="relative mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {{ feature.desc }}
          </p>
        </article>
      </div>
    </section>

    <PlanningOverlay
      :open="loading"
      :progress="loadingProgress"
      :status="loadingStatus"
      :city="formData.city.trim()"
      :steps="loadingSteps"
    />
  </div>
</template>
