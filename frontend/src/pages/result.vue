<script setup lang="ts">
import type { NavDay, NavSection } from '@/components/trip/TripSideNav.vue'
import type { Attraction, TripPlan } from '@/types'
import { ArrowLeft, ArrowUp, CalendarDays, ClipboardList, CloudSun, Landmark, MapPinned, MapPlus, Pencil, Save, Sparkles, Wallet, X } from '@lucide/vue'
import { useEventListener, useThrottleFn, useWindowScroll } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { fetchPoiPhoto } from '@/api/trip'
import TripBudget from '@/components/trip/TripBudget.vue'
import TripDayPanel from '@/components/trip/TripDayPanel.vue'
import TripExportMenu from '@/components/trip/TripExportMenu.vue'
import TripMap from '@/components/trip/TripMap.vue'
import TripOverview from '@/components/trip/TripOverview.vue'
import TripSideNav from '@/components/trip/TripSideNav.vue'
import TripWeather from '@/components/trip/TripWeather.vue'
import { Accordion } from '@/components/ui/accordion'
import { useTripExport } from '@/composables/useTripExport'
import { formatDateShort } from '@/lib/trip'
import { useTripPlanStore } from '@/stores/trip'

const router = useRouter()
const tripStore = useTripPlanStore()
const { plan: tripPlan } = storeToRefs(tripStore)
const editMode = ref(false)
const originalPlan = ref<TripPlan | null>(null)
const attractionPhotos = ref<Record<string, string>>({})
const photosLoading = ref(false)
const activeSection = ref('overview')
const openDays = ref<string[]>(['day-0']) // 默认展开第一天
const contentRef = useTemplateRef<HTMLElement>('content')
const mapRef = useTemplateRef<InstanceType<typeof TripMap>>('map')

const hasWeather = computed(() => (tripPlan.value?.weather_info?.length ?? 0) > 0)

const attractionCount = computed(() =>
  (tripPlan.value?.days ?? []).reduce((sum, day) => sum + day.attractions.length, 0),
)

const navSections = computed<NavSection[]>(() => {
  const sections: NavSection[] = [{ key: 'overview', label: '行程概览', icon: ClipboardList }]
  if (tripPlan.value?.budget)
    sections.push({ key: 'budget', label: '预算明细', icon: Wallet })
  sections.push({ key: 'map', label: '景点地图', icon: MapPinned })
  if (hasWeather.value)
    sections.push({ key: 'weather', label: '天气信息', icon: CloudSun })
  return sections
})

const navDays = computed<NavDay[]>(() =>
  (tripPlan.value?.days ?? []).map((day, index) => ({
    key: `day-${index}`,
    label: `第${day.day_index + 1}天`,
    date: day.date,
  })),
)

// 页面顺序:概览 → 预算 → 地图 → 每日行程 → 天气
const sectionOrder = computed(() => [
  ...navSections.value.filter(s => s.key !== 'weather').map(s => s.key),
  ...navDays.value.map(d => d.key),
  ...(hasWeather.value ? ['weather'] : []),
])

onMounted(() => {
  tripStore.reload()
  if (tripPlan.value)
    loadAttractionPhotos()
})

function goBack() {
  router.push('/')
}

// 滚动到指定区域
function scrollToSection(key: string) {
  activeSection.value = key
  if (key.startsWith('day-') && !openDays.value.includes(key))
    openDays.value = [...openDays.value, key]
  nextTick(() => {
    document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// 滚动时高亮当前所在区域
const updateActiveSection = useThrottleFn(() => {
  let current = sectionOrder.value[0] ?? 'overview'
  for (const key of sectionOrder.value) {
    const element = document.getElementById(key)
    if (element && element.getBoundingClientRect().top <= 160)
      current = key
  }
  // 滚动到底部时高亮最后一个区域
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  activeSection.value = atBottom ? (sectionOrder.value.at(-1) ?? current) : current
}, 100, true)
useEventListener(window, 'scroll', updateActiveSection, { passive: true })

// 回到顶部
const { y: scrollY } = useWindowScroll()
const showBackTop = computed(() => scrollY.value > 300)
function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 切换编辑模式
function toggleEditMode() {
  editMode.value = true
  // 保存原始数据用于取消编辑
  originalPlan.value = toRawPlan(tripPlan.value)
  toast.info('进入编辑模式')
}

function toRawPlan(plan: TripPlan | null): TripPlan | null {
  return plan ? JSON.parse(JSON.stringify(plan)) as TripPlan : null
}

// 保存修改
function saveChanges() {
  editMode.value = false
  tripStore.persist()
  toast.success('修改已保存')
  // 重新初始化地图以反映更改
  mapRef.value?.refresh()
}

// 取消编辑
function cancelEdit() {
  if (originalPlan.value)
    tripPlan.value = toRawPlan(originalPlan.value)
  editMode.value = false
  toast.info('已取消编辑')
}

// 删除景点
function deleteAttraction(dayIndex: number, attrIndex: number) {
  const day = tripPlan.value?.days[dayIndex]
  if (!day)
    return
  if (day.attractions.length <= 1) {
    toast.warning('每天至少需要保留一个景点')
    return
  }
  day.attractions.splice(attrIndex, 1)
  toast.success('景点已删除')
}

// 移动景点顺序
function moveAttraction(dayIndex: number, attrIndex: number, direction: 'up' | 'down') {
  const attractions = tripPlan.value?.days[dayIndex]?.attractions
  if (!attractions)
    return
  const target = direction === 'up' ? attrIndex - 1 : attrIndex + 1
  if (target < 0 || target >= attractions.length)
    return
  const current = attractions[attrIndex]
  const other = attractions[target]
  if (!current || !other)
    return
  attractions[attrIndex] = other
  attractions[target] = current
}

// 编辑景点信息
function updateAttraction(dayIndex: number, attrIndex: number, patch: Partial<Attraction>) {
  const attraction = tripPlan.value?.days[dayIndex]?.attractions[attrIndex]
  if (attraction)
    Object.assign(attraction, patch)
}

// 加载所有景点图片
async function loadAttractionPhotos() {
  if (!tripPlan.value)
    return
  const names = new Set(tripPlan.value.days.flatMap(day => day.attractions.map(a => a.name)))
  photosLoading.value = true
  try {
    await Promise.all(Array.from(names, async (name) => {
      const photoUrl = await fetchPoiPhoto(name)
      if (photoUrl)
        attractionPhotos.value[name] = photoUrl
    }))
  }
  finally {
    photosLoading.value = false
  }
}

// 导出:截图前展开全部每日行程,结束后恢复
const { exporting, exportAsImage, exportAsPDF } = useTripExport({
  target: contentRef,
  city: () => tripPlan.value?.city,
  prepare: () => {
    const previous = openDays.value
    openDays.value = navDays.value.map(d => d.key)
    return () => {
      openDays.value = previous
    }
  },
})

function expandAll() {
  openDays.value = navDays.value.map(d => d.key)
}

function collapseAll() {
  openDays.value = []
}
</script>

<template>
  <div>
    <template v-if="tripPlan">
      <!-- ================= Hero ================= -->
      <section class="relative isolate overflow-hidden bg-[oklch(0.2_0.03_240)] pt-28 pb-28 sm:pt-32 sm:pb-32">
        <img src="/images/hero.jpg" alt="" aria-hidden="true" class="absolute inset-0 -z-20 size-full animate-ken-burns object-cover object-[center_60%]">
        <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-r from-[oklch(0.15_0.03_250/0.92)] via-[oklch(0.15_0.03_250/0.65)] to-[oklch(0.15_0.03_250/0.25)]" />
        <div aria-hidden="true" class="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />
        <div aria-hidden="true" class="grain absolute inset-0 -z-10" />

        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            id="back-home"
            type="button"
            class="inline-flex animate-fade-up items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
            @click="goBack"
          >
            <ArrowLeft class="size-4" />
            返回首页
          </button>

          <div class="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div class="min-w-0">
              <p class="animate-fade-up text-xs font-semibold tracking-[0.3em] text-[oklch(0.85_0.12_70)] uppercase [animation-delay:60ms]">
                Your Journey
              </p>
              <h1 class="mt-3 animate-fade-up font-display leading-none font-black tracking-tight text-white [animation-delay:120ms]">
                <span class="block text-5xl sm:text-7xl lg:text-8xl">{{ tripPlan.city }}</span>
                <span class="mt-3 block text-2xl font-bold text-white/85 sm:text-3xl">
                  {{ tripPlan.days.length }} 日<span class="text-gradient-sunset">旅行计划</span>
                </span>
              </h1>
              <div class="mt-6 flex animate-fade-up flex-wrap items-center gap-2 text-sm text-white/85 [animation-delay:180ms]">
                <span class="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <CalendarDays class="size-4" />
                  {{ formatDateShort(tripPlan.start_date) }} — {{ formatDateShort(tripPlan.end_date) }}
                </span>
                <span class="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <Landmark class="size-4" />
                  {{ attractionCount }} 个景点
                </span>
                <span v-if="tripPlan.budget" class="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <Wallet class="size-4" />
                  约 ¥{{ Number(tripPlan.budget.total ?? 0).toLocaleString('zh-CN') }}
                </span>
              </div>
            </div>

            <div class="flex animate-fade-up flex-wrap items-center gap-2 [animation-delay:240ms]">
              <template v-if="!editMode">
                <button
                  id="edit-trip"
                  type="button"
                  class="glass-dark inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
                  @click="toggleEditMode"
                >
                  <Pencil class="size-4" />
                  编辑行程
                </button>
                <TripExportMenu :exporting="exporting" @image="exportAsImage" @pdf="exportAsPDF" />
                <button
                  id="new-trip"
                  type="button"
                  class="btn-sunset inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                  @click="goBack"
                >
                  <Sparkles class="size-4" />
                  再规划一次
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="btn-sunset inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                  @click="saveChanges"
                >
                  <Save class="size-4" />
                  保存修改
                </button>
                <button
                  type="button"
                  class="glass-dark inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
                  @click="cancelEdit"
                >
                  <X class="size-4" />
                  取消编辑
                </button>
              </template>
            </div>
          </div>
        </div>
      </section>

      <div class="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- 移动端导航 -->
        <div class="glass sticky top-16 z-30 -mx-4 mb-4 rounded-none border-x-0 px-4 py-2 lg:hidden">
          <TripSideNav horizontal :sections="navSections" :days="navDays" :active="activeSection" @navigate="scrollToSection" />
        </div>

        <div class="flex gap-8">
          <!-- 侧边导航 -->
          <aside class="hidden w-56 shrink-0 lg:block">
            <div class="sticky top-24">
              <TripSideNav :sections="navSections" :days="navDays" :active="activeSection" @navigate="scrollToSection" />
            </div>
          </aside>

          <!-- 主内容区 -->
          <div ref="content" class="min-w-0 flex-1 space-y-6">
            <div class="grid gap-6 xl:grid-cols-5">
              <div :class="tripPlan.budget ? 'xl:col-span-3' : 'xl:col-span-5'">
                <TripOverview :plan="tripPlan" />
              </div>
              <div v-if="tripPlan.budget" class="xl:col-span-2">
                <TripBudget :budget="tripPlan.budget" />
              </div>
            </div>

            <TripMap ref="map" :plan="tripPlan" />

            <!-- 每日行程:可折叠 -->
            <section class="space-y-4 pt-2">
              <div class="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.24em] text-sunset uppercase">
                    Itinerary
                  </p>
                  <h2 class="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    每日行程
                  </h2>
                </div>
                <div class="flex items-center gap-1 rounded-full border bg-card p-1 text-xs" data-export-ignore>
                  <span class="px-2 text-muted-foreground">共 {{ tripPlan.days.length }} 天</span>
                  <button type="button" class="rounded-full px-3 py-1.5 font-medium transition-colors hover:bg-muted" @click="expandAll">
                    全部展开
                  </button>
                  <button type="button" class="rounded-full px-3 py-1.5 font-medium transition-colors hover:bg-muted" @click="collapseAll">
                    全部收起
                  </button>
                </div>
              </div>
              <Accordion v-model="openDays" type="multiple" class="space-y-4">
                <TripDayPanel
                  v-for="(day, index) in tripPlan.days"
                  :key="index"
                  :day="day"
                  :index="index"
                  :edit-mode="editMode"
                  :photos="attractionPhotos"
                  :photos-loading="photosLoading"
                  @move-attraction="(attrIndex, direction) => moveAttraction(index, attrIndex, direction)"
                  @delete-attraction="(attrIndex) => deleteAttraction(index, attrIndex)"
                  @update-attraction="(attrIndex, patch) => updateAttraction(index, attrIndex, patch)"
                />
              </Accordion>
            </section>

            <TripWeather v-if="hasWeather" :weather="tripPlan.weather_info" />
          </div>
        </div>
      </div>

      <!-- 编辑模式浮动操作条 -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-6 opacity-0"
        leave-active-class="transition duration-200 ease-in"
        leave-to-class="translate-y-6 opacity-0"
      >
        <div
          v-if="editMode"
          class="glass fixed inset-x-4 bottom-5 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-full py-2 pr-2 pl-5 shadow-2xl shadow-black/20"
          role="region"
          aria-label="编辑模式操作"
        >
          <span class="relative flex size-2.5 shrink-0">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-sunset opacity-75" />
            <span class="relative inline-flex size-2.5 rounded-full bg-sunset" />
          </span>
          <p class="min-w-0 flex-1 truncate text-sm">
            <span class="font-semibold">编辑模式</span>
            <span class="hidden text-muted-foreground sm:inline"> · 调整顺序、删除或修改景点</span>
          </p>
          <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" @click="cancelEdit">
            <X class="size-4" />
            取消
          </button>
          <button type="button" class="btn-sunset inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold" @click="saveChanges">
            <Save class="size-4" />
            保存
          </button>
        </div>
      </Transition>

      <!-- 回到顶部按钮 -->
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="translate-y-2 opacity-0"
        leave-active-class="transition duration-150"
        leave-to-class="translate-y-2 opacity-0"
      >
        <button
          v-if="showBackTop && !editMode"
          id="back-to-top"
          type="button"
          class="fixed right-5 bottom-6 z-40 flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-xl transition-transform hover:-translate-y-0.5"
          aria-label="回到顶部"
          @click="backToTop"
        >
          <ArrowUp class="size-5" />
        </button>
      </Transition>
    </template>

    <!-- ================= 空状态 ================= -->
    <section v-else class="relative isolate flex min-h-[80svh] items-center justify-center overflow-hidden bg-[oklch(0.2_0.03_240)] px-4 pt-24 pb-16">
      <img src="/images/hero.jpg" alt="" aria-hidden="true" class="absolute inset-0 -z-20 size-full object-cover opacity-60 blur-sm">
      <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-b from-[oklch(0.15_0.03_250/0.85)] to-[oklch(0.15_0.03_250/0.6)]" />
      <div class="glass-dark max-w-md animate-fade-up rounded-[2rem] p-8 text-center text-white sm:p-10">
        <span class="mx-auto flex size-16 animate-float items-center justify-center rounded-2xl bg-white/10">
          <MapPlus class="size-8" />
        </span>
        <h1 class="mt-6 font-display text-2xl font-bold sm:text-3xl">
          没有找到旅行计划数据
        </h1>
        <p class="mt-2 text-sm text-white/70">
          暂无旅行计划数据,请先创建行程
        </p>
        <button
          id="empty-create"
          type="button"
          class="btn-sunset mt-7 inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
          @click="goBack"
        >
          <Sparkles class="size-4" />
          返回首页创建行程
        </button>
      </div>
    </section>
  </div>
</template>
