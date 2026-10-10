<script setup lang="ts">
import type { Attraction, TripPlan } from '@/types'
import type { AMapMap, AMapMarker, AMapNamespace, LngLatTuple } from '@/types/amap'
import AMapLoader from '@amap/amap-jsapi-loader'
import { MapPinned, MapPinOff } from '@lucide/vue'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { escapeHtml } from '@/lib/trip'

const props = defineProps<{
  plan: TripPlan
}>()

interface MappedAttraction extends Attraction {
  dayIndex: number
  attrIndex: number
}

// 每天路线使用的颜色(与主题色协调)
const DAY_COLORS = ['#0d9488', '#2563eb', '#d97706', '#db2777', '#7c3aed', '#059669', '#dc2626']

const status = ref<'loading' | 'ready' | 'error'>('loading')
let map: AMapMap | null = null

function dayColor(dayIndex: number): string {
  return DAY_COLORS[dayIndex % DAY_COLORS.length] ?? '#0d9488'
}

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
      content: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${color};color:#fff;font-size:12px;font-weight:600;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);">${index + 1}</div>`,
    })

    // 创建信息窗口
    const infoWindow = new AMap.InfoWindow({
      content: `
        <div style="padding:4px 2px;max-width:260px;font-size:13px;line-height:1.6;color:#18181b;">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${escapeHtml(attraction.name)}</div>
          <div><strong>地址:</strong> ${escapeHtml(attraction.address)}</div>
          <div><strong>游览时长:</strong> ${escapeHtml(attraction.visit_duration)}分钟</div>
          <div style="color:#52525b;"><strong>描述:</strong> ${escapeHtml(attraction.description)}</div>
          <div style="margin-top:6px;color:${color};font-weight:600;">第${attraction.dayIndex + 1}天 景点${attraction.attrIndex + 1}</div>
        </div>
      `,
      offset: new AMap.Pixel(0, -30),
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
  <Card id="map" class="h-full gap-4" data-export-card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base">
        <MapPinned class="size-4 text-primary" />
        景点地图
      </CardTitle>
      <CardDescription>点击标记查看景点详情,不同颜色代表不同日期的路线</CardDescription>
    </CardHeader>
    <CardContent class="flex-1">
      <div class="relative h-[340px] overflow-hidden rounded-lg border bg-muted sm:h-[420px] lg:h-full lg:min-h-[420px]">
        <div id="amap-container" class="absolute inset-0" />
        <div v-if="status === 'loading'" class="absolute inset-0" data-export-ignore>
          <Skeleton class="size-full rounded-none" />
        </div>
        <div
          v-else-if="status === 'error'"
          class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground"
        >
          <MapPinOff class="size-8" />
          <span>地图加载失败</span>
          <span class="text-xs">请检查 VITE_AMAP_WEB_JS_KEY 配置</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
