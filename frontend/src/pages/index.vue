<script setup lang="ts">
import type { DateRange } from 'reka-ui'
import type { Component } from 'vue'
import type { TripFormData } from '@/types'
import { getLocalTimeZone, today } from '@internationalized/date'
import {
  BedDouble,
  Building2,
  CalendarDays,
  CarFront,
  ClipboardList,
  CloudSun,
  Coffee,
  Footprints,
  Gem,
  Hotel,
  House,
  Landmark,
  Loader2,
  MapPin,
  MessageSquareText,
  Mountain,
  Palette,
  Search,
  ShoppingBag,
  Shuffle,
  SlidersHorizontal,
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/trip'
import { cn } from '@/lib/utils'
import { useTripPlanStore } from '@/stores/trip'

interface Option {
  value: string
  label: string
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

const transportOptions: Option[] = [
  { value: '公共交通', label: '公共交通', icon: TrainFront },
  { value: '自驾', label: '自驾', icon: CarFront },
  { value: '步行', label: '步行', icon: Footprints },
  { value: '混合', label: '混合', icon: Shuffle },
]

const accommodationOptions: Option[] = [
  { value: '经济型酒店', label: '经济型酒店', icon: Wallet },
  { value: '舒适型酒店', label: '舒适型酒店', icon: Hotel },
  { value: '豪华酒店', label: '豪华酒店', icon: Gem },
  { value: '民宿', label: '民宿', icon: House },
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
  { icon: Search, title: '智能景点推荐', desc: '结合兴趣偏好筛选值得去的地方' },
  { icon: CloudSun, title: '实时天气参考', desc: '按出行日期提供天气预报' },
  { icon: BedDouble, title: '住宿与预算', desc: '推荐酒店并估算整体花费' },
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

const dateLabel = computed(() => {
  const { start, end } = dateRange.value
  if (!start)
    return ''
  return end ? `${start.toString()} 至 ${end.toString()}` : `${start.toString()} 至 …`
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

const loadingSteps = [
  { at: 10, label: '搜索景点', icon: Search },
  { at: 40, label: '查询天气', icon: CloudSun },
  { at: 60, label: '推荐酒店', icon: Building2 },
  { at: 80, label: '生成行程', icon: ClipboardList },
]

async function handleSubmit() {
  if (!validate()) {
    if (errors.dates && !errors.city)
      toast.error('请选择日期')
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
  <div class="relative isolate overflow-hidden">
    <!-- 背景装饰 -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent)]" />
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

    <div class="mx-auto max-w-5xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:px-8">
      <!-- 页面标题 -->
      <section class="mx-auto max-w-2xl text-center">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles class="size-3.5" />
          AI 行程规划
        </span>
        <h1 class="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          智能旅行助手
        </h1>
        <p class="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
          基于AI的个性化旅行规划,让每一次出行都完美无忧
        </p>
      </section>

      <Card class="mt-10 gap-0 py-0 shadow-lg shadow-primary/5">
        <CardContent class="p-0">
          <form class="divide-y divide-border" novalidate @submit.prevent="handleSubmit">
            <!-- 第一步:目的地和日期 -->
            <section class="space-y-5 p-5 sm:p-8">
              <div class="flex items-center gap-3">
                <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin class="size-4" />
                </span>
                <div>
                  <h2 class="text-base font-semibold">
                    目的地与日期
                  </h2>
                  <p class="text-xs text-muted-foreground">
                    告诉我们你想去哪里、什么时候出发
                  </p>
                </div>
              </div>

              <div class="grid gap-5 md:grid-cols-12">
                <div class="space-y-2 md:col-span-4">
                  <Label for="city">目的地城市</Label>
                  <div class="relative">
                    <Building2 class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="city"
                      v-model="formData.city"
                      placeholder="例如: 北京"
                      autocomplete="off"
                      class="h-11 pl-9"
                      :aria-invalid="!!errors.city || undefined"
                    />
                  </div>
                  <p v-if="errors.city" class="text-xs text-destructive">
                    {{ errors.city }}
                  </p>
                </div>

                <div class="space-y-2 md:col-span-6">
                  <Label for="trip-dates">开始日期 / 结束日期</Label>
                  <Popover v-model:open="datePickerOpen">
                    <PopoverTrigger as-child>
                      <Button
                        id="trip-dates"
                        type="button"
                        variant="outline"
                        :aria-invalid="!!errors.dates || undefined"
                        :class="cn('h-11 w-full justify-start gap-2 bg-transparent px-3 font-normal shadow-xs hover:bg-muted/50', !dateLabel && 'text-muted-foreground')"
                      >
                        <CalendarDays class="size-4 text-muted-foreground" />
                        <span class="truncate">{{ dateLabel || '选择日期' }}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <RangeCalendar
                        v-model="dateRange"
                        locale="zh-CN"
                        :week-starts-on="1"
                        :number-of-months="isDesktop ? 2 : 1"
                        :placeholder="dateRange.start ?? todayDate"
                        initial-focus
                      />
                    </PopoverContent>
                  </Popover>
                  <p v-if="errors.dates" class="text-xs text-destructive">
                    {{ errors.dates }}
                  </p>
                </div>

                <div class="space-y-2 md:col-span-2">
                  <Label>旅行天数</Label>
                  <div class="flex h-11 items-center justify-center gap-1 rounded-md bg-primary/10 text-primary">
                    <span class="text-2xl font-bold tabular-nums">{{ formData.travel_days }}</span>
                    <span class="text-sm">天</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- 第二步:偏好设置 -->
            <section class="space-y-5 p-5 sm:p-8">
              <div class="flex items-center gap-3">
                <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SlidersHorizontal class="size-4" />
                </span>
                <div>
                  <h2 class="text-base font-semibold">
                    偏好设置
                  </h2>
                  <p class="text-xs text-muted-foreground">
                    选择出行方式、住宿和感兴趣的主题
                  </p>
                </div>
              </div>

              <div class="grid gap-5 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="transportation">交通方式</Label>
                  <Select v-model="formData.transportation">
                    <SelectTrigger id="transportation" class="h-11! w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in transportOptions" :key="option.value" :value="option.value">
                        <component :is="option.icon" class="size-4 text-muted-foreground" />
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label for="accommodation">住宿偏好</Label>
                  <Select v-model="formData.accommodation">
                    <SelectTrigger id="accommodation" class="h-11! w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in accommodationOptions" :key="option.value" :value="option.value">
                        <component :is="option.icon" class="size-4 text-muted-foreground" />
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="space-y-2">
                <Label>旅行偏好</Label>
                <div class="flex flex-wrap gap-2" role="group" aria-label="旅行偏好">
                  <button
                    v-for="option in preferenceOptions"
                    :key="option.value"
                    type="button"
                    role="checkbox"
                    :aria-checked="formData.preferences.includes(option.value)"
                    :class="cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]',
                      formData.preferences.includes(option.value)
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                        : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent',
                    )"
                    @click="togglePreference(option.value)"
                  >
                    <component :is="option.icon" class="size-4" />
                    {{ option.label }}
                  </button>
                </div>
              </div>
            </section>

            <!-- 第三步:额外要求 -->
            <section class="space-y-5 p-5 sm:p-8">
              <div class="flex items-center gap-3">
                <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquareText class="size-4" />
                </span>
                <div>
                  <h2 class="text-base font-semibold">
                    额外要求
                  </h2>
                  <p class="text-xs text-muted-foreground">
                    可选,写下任何特别的需求
                  </p>
                </div>
              </div>
              <Textarea
                v-model="formData.free_text_input"
                placeholder="请输入您的额外要求,例如:想去看升旗、需要无障碍设施、对海鲜过敏等..."
                rows="3"
                class="min-h-24 resize-y"
              />
            </section>

            <!-- 提交按钮 -->
            <section class="space-y-5 bg-muted/40 p-5 sm:p-8">
              <Button
                type="submit"
                size="lg"
                :disabled="loading"
                class="h-12 w-full gap-2 rounded-xl text-base shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
              >
                <template v-if="!loading">
                  <Sparkles class="size-5" />
                  <span>开始规划我的旅行</span>
                </template>
                <template v-else>
                  <Loader2 class="size-5 animate-spin" />
                  <span>正在生成中...</span>
                </template>
              </Button>

              <!-- 加载进度条 -->
              <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="-translate-y-1 opacity-0"
                leave-active-class="transition duration-200 ease-in"
                leave-to-class="opacity-0"
              >
                <div v-if="loading" class="space-y-4 rounded-xl border border-dashed border-primary/40 bg-background p-5">
                  <div class="flex items-center justify-between gap-4 text-sm">
                    <span class="font-medium text-primary">{{ loadingStatus }}</span>
                    <span class="tabular-nums text-muted-foreground">{{ loadingProgress }}%</span>
                  </div>
                  <Progress :model-value="loadingProgress" class="h-2" />
                  <ol class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <li
                      v-for="step in loadingSteps"
                      :key="step.label"
                      :class="cn(
                        'flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors',
                        loadingProgress >= step.at ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                      )"
                    >
                      <component :is="step.icon" class="size-3.5 shrink-0" />
                      {{ step.label }}
                    </li>
                  </ol>
                </div>
              </Transition>
            </section>
          </form>
        </CardContent>
      </Card>

      <!-- 功能亮点 -->
      <section class="mt-10 grid gap-4 sm:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-4 transition-colors hover:bg-card"
        >
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <component :is="feature.icon" class="size-4" />
          </span>
          <div>
            <h3 class="text-sm font-semibold">
              {{ feature.title }}
            </h3>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {{ feature.desc }}
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
