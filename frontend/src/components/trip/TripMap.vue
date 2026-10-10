<script setup lang="ts">
import type { Attraction, TripPlan } from '@/types'
import type { AMapMap, AMapMarker, AMapNamespace, LngLatTuple } from '@/types/amap'
import AMapLoader from '@amap/amap-jsapi-loader'
import { Loader2, MapPinned, MapPinOff } from '@lucide/vue'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { dayColor, escapeHtml } from '@/lib/trip'
import TripSection from './TripSection.vue'

const props = defineProps<{
  plan: TripPlan
}>()

interface MappedAttraction extends Attraction {
  dayIndex: number
  attrIndex: number
}

const status = ref<'loading' | 'ready' | 'error'>('loading')
let map: AMapMap | null = null

function collectAttractions(): MappedAttraction[] {
  const result: MappedAttraction[] = []
  props.plan.days.forEach((day, dayIndex) => {
    day.attractions.forEach((attraction, attrIndex) => {
      if (attraction.location?.longitude && attraction.location?.latitude)
        result.push({ ...attraction, dayIndex, attrIndex })
    })
  })
  return result
}

function toLngLat(attraction: MappedAttraction): LngLatTuple {
  return [attraction.location.longitude, attraction.location.latitude]
}

// 绘制路线:按天分组,每天一条折线
function drawRoutes(AMap: AMapNamespace, attractions: MappedAttraction[]) {
  if (!map || attractions.length < 2)
    return

  const dayGroups = new Map<number, MappedAttraction[]>()
  attractions.forEach((attraction) => {
    const group = dayGroups.get(attraction.dayIndex) ?? []
    group.push(attraction)
    dayGroups.set(attraction.dayIndex, group)
  })

  dayGroups.forEach((dayAttractions, dayIndex) => {
    if (dayAttractions.length < 2)
      return
    const polyline = new AMap.Polyline({
      path: dayAttractions.map(toLngLat),
      strokeColor: dayColor(dayIndex),
      strokeWeight: 5,
      strokeOpacity: 0.85,
      strokeStyle: 'solid',
      showDir: true, // 显示方向箭头
    })
    map?.add(polyline)
  })
}

// 添加景点标记
function addAttractionMarkers(AMap: AMapNamespace) {
  if (!map)
    return

  const attractions = collectAttractions()
  const markers: AMapMarker[] = attractions.map((attraction, index) => {
    const color = dayColor(attraction.dayIndex)
    const marker = new AMap.Marker({
      position: toLngLat(attraction),
      title: attraction.name,
      anchor: 'bottom-center',
      content: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px 9999px 9999px 4px;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 6px 14px -4px rgba(0,0,0,.45);"><span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;">${index + 1}</span></div>`,
    })

    // 创建信息窗口
    const infoWindow = new AMap.InfoWindow({
      content: `
        <div style="padding:6px 4px;max-width:270px;font-size:13px;line-height:1.65;color:#1f2937;font-family:'Plus Jakarta Sans','PingFang SC','Microsoft YaHei',sans-serif;">
          <div style="display:inline-block;padding:2px 8px;border-radius:999px;background:${color}1a;color:${color};font-size:11px;font-weight:700;">第${attraction.dayIndex + 1}天 · 景点${attraction.attrIndex + 1}</div>
          <div style="font-weight:700;font-size:15px;margin:6px 0 4px;">${escapeHtml(attraction.name)}</div>
          <div style="color:#6b7280;">📍 ${escapeHtml(attraction.address)}</div>
          <div style="color:#6b7280;">⏱ 游览约 ${escapeHtml(attraction.visit_duration)} 分钟</div>
          <div style="margin-top:4px;color:#374151;">${escapeHtml(attraction.description)}</div>
        </div>
      `,
      offset: new AMap.Pixel(0, -34),
    })

    // 点击标记显示信息窗口
    marker.on('click', () => {
      if (map)
        infoWindow.open(map, marker.getPosition())
    })
    return marker
  })

  map.add(markers)

  // 自动调整视野以包含所有标记
  if (markers.length > 0)
    map.setFitView(markers)

  drawRoutes(AMap, attractions)
}

// 初始化地图
async function initMap() {
  status.value = 'loading'
  try {
    const AMap = await AMapLoader.load({
      key: import.meta.env.VITE_AMAP_WEB_JS_KEY, // 高德地图Web端(JS API) Key
      version: '2.0',
      plugins: ['AMap.Marker', 'AMap.Polyline', 'AMap.InfoWindow'],
    }) as AMapNamespace

    // 创建地图实例
    map = new AMap.Map('amap-container', {
      zoom: 12,
      center: [116.397128, 39.916527], // 默认中心点(北京)
      viewMode: '3D',
      // 保留绘制缓冲区,导出图片时才能截取地图画面
      WebGLParams: { preserveDrawingBuffer: true },
    })

    addAttractionMarkers(AMap)
    status.value = 'ready'
    toast.success('地图加载成功')
  }
  catch (error) {
    console.error('地图加载失败:', error)
    status.value = 'error'
    toast.error('地图加载失败')
  }
}

function destroyMap() {
  map?.destroy()
  map = null
}

/** 行程修改后重新绘制地图 */
async function refresh() {
  destroyMap()
  await nextTick()
  await initMap()
}

onMounted(initMap)
onBeforeUnmount(destroyMap)

defineExpose({ refresh })
</script>

<template>
  <TripSection id="map" :icon="MapPinned" eyebrow="Route Map" title="景点地图" description="点击标记查看景点详情,不同颜色代表不同日期的路线">
    <template #actions>
      <ul class="flex flex-wrap items-center gap-1.5">
        <li
          v-for="(day, index) in plan.days"
          :key="index"
          class="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium"
        >
          <span class="size-2.5 rounded-full" :style="{ background: dayColor(index) }" />
          第{{ day.day_index + 1 }}天
        </li>
      </ul>
    </template>
    <div class="relative h-[360px] overflow-hidden rounded-2xl border bg-muted sm:h-[460px] lg:h-[520px]">
      <div id="amap-container" class="absolute inset-0" />
      <div
        v-if="status === 'loading'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[linear-gradient(110deg,var(--muted)_30%,var(--surface)_50%,var(--muted)_70%)] bg-[length:200%_100%] animate-shimmer text-sm text-muted-foreground"
        data-export-ignore
      >
        <Loader2 class="size-6 animate-spin text-primary" />
        正在加载地图…
      </div>
      <div
        v-else-if="status === 'error'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground"
      >
        <span class="flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
          <MapPinOff class="size-6" />
        </span>
        <span class="mt-1 font-medium text-foreground">地图加载失败</span>
        <span class="text-xs">请检查 VITE_AMAP_WEB_JS_KEY 配置</span>
      </div>
    </div>
  </TripSection>
</template>
