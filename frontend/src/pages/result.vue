<script setup lang="ts">
import type { NavDay, NavSection } from '@/components/trip/TripSideNav.vue'
import type { Attraction, TripPlan } from '@/types'
import { ArrowLeft, ArrowUp, ClipboardList, CloudSun, MapPinned, MapPlus, Pencil, Save, Wallet, X } from '@lucide/vue'
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
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useTripExport } from '@/composables/useTripExport'
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
    if (element && element.getBoundingClientRect().top <= 140)
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
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <template v-if="tripPlan">
      <!-- 页面头部 -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" class="-ml-2.5 w-fit text-muted-foreground" @click="goBack">
          <ArrowLeft />
          返回首页
        </Button>
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="!editMode">
            <Button variant="outline" @click="toggleEditMode">
              <Pencil />
              编辑行程
            </Button>
            <TripExportMenu :exporting="exporting" @image="exportAsImage" @pdf="exportAsPDF" />
          </template>
          <template v-else>
            <Button @click="saveChanges">
              <Save />
              保存修改
            </Button>
            <Button variant="outline" @click="cancelEdit">
              <X />
              取消编辑
            </Button>
          </template>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="-translate-y-1 opacity-0"
        leave-active-class="transition duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="editMode" class="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Pencil class="size-4 shrink-0" />
          编辑模式:可调整景点顺序、删除景点或修改景点信息,完成后点击“保存修改”。
        </div>
      </Transition>

      <!-- 移动端导航 -->
      <div class="sticky top-16 z-30 -mx-4 mb-4 border-b bg-background/85 px-4 py-2 backdrop-blur lg:hidden">
        <TripSideNav horizontal :sections="navSections" :days="navDays" :active="activeSection" @navigate="scrollToSection" />
      </div>

      <div class="flex gap-8">
        <!-- 侧边导航 -->
        <aside class="hidden w-52 shrink-0 lg:block">
          <div class="sticky top-24">
            <TripSideNav :sections="navSections" :days="navDays" :active="activeSection" @navigate="scrollToSection" />
          </div>
        </aside>

        <!-- 主内容区 -->
        <div ref="content" class="min-w-0 flex-1 space-y-6">
          <!-- 顶部信息区:左侧概览+预算,右侧地图 -->
          <div class="grid gap-6 xl:grid-cols-5">
            <div class="space-y-6 xl:col-span-2">
              <TripOverview :plan="tripPlan" />
              <TripBudget v-if="tripPlan.budget" :budget="tripPlan.budget" />
            </div>
            <div class="xl:col-span-3">
              <TripMap ref="map" :plan="tripPlan" />
            </div>
          </div>

          <!-- 每日行程:可折叠 -->
          <section class="space-y-3">
            <div class="flex items-end justify-between gap-4">
              <h2 class="text-lg font-semibold tracking-tight">
                每日行程
              </h2>
              <span class="text-sm text-muted-foreground">共 {{ tripPlan.days.length }} 天</span>
            </div>
            <Accordion v-model="openDays" type="multiple" class="space-y-3">
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

      <!-- 回到顶部按钮 -->
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="translate-y-2 opacity-0"
        leave-active-class="transition duration-150"
        leave-to-class="translate-y-2 opacity-0"
      >
        <Button
          v-if="showBackTop"
          size="icon-lg"
          class="fixed right-5 bottom-6 z-40 rounded-full shadow-lg shadow-primary/30"
          aria-label="回到顶部"
          @click="backToTop"
        >
          <ArrowUp />
        </Button>
      </Transition>
    </template>

    <Empty v-else class="my-12 border border-dashed bg-card/50 py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPlus />
        </EmptyMedia>
        <EmptyTitle>没有找到旅行计划数据</EmptyTitle>
        <EmptyDescription>暂无旅行计划数据,请先创建行程</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button @click="goBack">
          返回首页创建行程
        </Button>
      </EmptyContent>
    </Empty>
  </div>
</template>
