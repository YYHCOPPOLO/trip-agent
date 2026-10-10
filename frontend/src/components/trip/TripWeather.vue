<script setup lang="ts">
import type { WeatherInfo } from '@/types'
import { CloudSun, Moon, Sun, Wind } from '@lucide/vue'
import { computed } from 'vue'
import { getWeatherIcon, parseDate } from '@/lib/trip'
import TripSection from './TripSection.vue'

const props = defineProps<{
  weather: WeatherInfo[]
}>()

// 用全程最高/最低温度定位每天的温度条
const range = computed(() => {
  const temps = props.weather.flatMap(w => [Number(w.day_temp), Number(w.night_temp)]).filter(t => !Number.isNaN(t))
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  return { min, max, span: Math.max(1, max - min) }
})

function barStyle(item: WeatherInfo) {
  const low = Math.min(Number(item.night_temp), Number(item.day_temp))
  const high = Math.max(Number(item.night_temp), Number(item.day_temp))
  const left = ((low - range.value.min) / range.value.span) * 100
  const width = Math.max(6, ((high - low) / range.value.span) * 100)
  return { left: `${left}%`, width: `${width}%` }
}

function dateParts(value: string) {
  const parsed = parseDate(value)
  return parsed ? { main: `${parsed.month}/${parsed.day}`, sub: parsed.weekday } : { main: value, sub: '' }
}
</script>

<template>
  <TripSection id="weather" :icon="CloudSun" eyebrow="Weather" title="天气信息" description="出行期间的天气预报,合理安排室内外活动">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      <article
        v-for="item in weather"
        :key="item.date"
        class="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[oklch(0.97_0.025_225)] to-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:from-[oklch(0.3_0.05_240/0.5)]"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="font-display text-xl font-bold tabular-nums">
              {{ dateParts(item.date).main }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ dateParts(item.date).sub }} · {{ item.day_weather }}
            </div>
          </div>
          <span class="flex size-12 items-center justify-center rounded-2xl bg-card/80 text-[oklch(0.62_0.13_235)] shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 dark:text-[oklch(0.8_0.1_220)]">
            <component :is="getWeatherIcon(item.day_weather)" class="size-6" />
          </span>
        </div>

        <!-- 温度条 -->
        <div class="mt-4 flex items-center gap-2 text-sm font-semibold tabular-nums">
          <span class="w-9 text-muted-foreground">{{ item.night_temp }}°</span>
          <div class="relative h-1.5 flex-1 rounded-full bg-muted">
            <div class="absolute inset-y-0 rounded-full bg-gradient-to-r from-[oklch(0.7_0.12_230)] to-[oklch(0.75_0.16_55)]" :style="barStyle(item)" />
          </div>
          <span class="w-9 text-right">{{ item.day_temp }}°</span>
        </div>

        <div class="mt-4 flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Sun class="size-3.5 text-amber-500" />
            {{ item.day_weather }}
          </span>
          <span class="flex items-center gap-1">
            <Moon class="size-3.5 text-indigo-400" />
            {{ item.night_weather }}
          </span>
          <span class="flex items-center gap-1 truncate">
            <Wind class="size-3.5" />
            {{ item.wind_direction }} {{ item.wind_power }}
          </span>
        </div>
      </article>
    </div>
  </TripSection>
</template>
