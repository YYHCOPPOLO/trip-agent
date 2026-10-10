<script setup lang="ts">
import type { TripPlan } from '@/types'
import { CalendarDays, Lightbulb, MapPin, Route } from '@lucide/vue'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  plan: TripPlan
}>()

const attractionCount = computed(() =>
  props.plan.days.reduce((sum, day) => sum + day.attractions.length, 0),
)
</script>

<template>
  <Card id="overview" class="gap-5" data-export-card>
    <CardHeader>
      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" class="gap-1">
          <MapPin class="size-3" />
          {{ plan.city }}
        </Badge>
        <Badge variant="outline" class="gap-1">
          <Route class="size-3" />
          {{ plan.days.length }} 天 · {{ attractionCount }} 个景点
        </Badge>
      </div>
      <CardTitle class="mt-2 text-2xl font-bold tracking-tight">
        {{ plan.city }}旅行计划
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays class="size-4" />
        </span>
        <div>
          <div class="text-xs text-muted-foreground">
            日期
          </div>
          <div class="font-medium">
            {{ plan.start_date }} 至 {{ plan.end_date }}
          </div>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
          <Lightbulb class="size-4" />
        </span>
        <div>
          <div class="text-xs text-muted-foreground">
            建议
          </div>
          <p class="leading-relaxed text-pretty">
            {{ plan.overall_suggestions }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
