<script setup lang="ts">
import type { WeatherInfo } from '@/types'
import { CloudSun, Moon, Sun, Wind } from '@lucide/vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWeatherIcon } from '@/lib/trip'

defineProps<{
  weather: WeatherInfo[]
}>()
</script>

<template>
  <Card id="weather" class="gap-5" data-export-card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base">
        <CloudSun class="size-4 text-primary" />
        天气信息
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="item in weather"
          :key="item.date"
          class="rounded-xl border bg-gradient-to-br from-sky-50 to-background p-4 transition-shadow hover:shadow-md dark:from-sky-950/30"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">{{ item.date }}</span>
            <component :is="getWeatherIcon(item.day_weather)" class="size-7 text-sky-500" />
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div class="flex items-center gap-2">
              <Sun class="size-4 text-amber-500" />
              <div>
                <div class="text-xs text-muted-foreground">
                  白天
                </div>
                <div class="text-sm font-medium">
                  {{ item.day_weather }} {{ item.day_temp }}°C
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Moon class="size-4 text-indigo-400" />
              <div>
                <div class="text-xs text-muted-foreground">
                  夜间
                </div>
                <div class="text-sm font-medium">
                  {{ item.night_weather }} {{ item.night_temp }}°C
                </div>
              </div>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
            <Wind class="size-3.5" />
            {{ item.wind_direction }} {{ item.wind_power }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
