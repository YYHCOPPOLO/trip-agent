<script setup lang="ts">
import type { Component } from 'vue'
import { Check, Plane } from '@lucide/vue'
import { cn } from '@/lib/utils'

export interface PlanningStep {
  at: number
  label: string
  icon: Component
}

defineProps<{
  open: boolean
  progress: number
  status: string
  city: string
  steps: PlanningStep[]
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-300 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-[oklch(0.16_0.03_250/0.72)] p-4 backdrop-blur-md"
        role="alertdialog"
        aria-live="polite"
        aria-label="正在生成旅行计划"
      >
        <div class="relative w-full max-w-lg animate-fade-up overflow-hidden rounded-[2rem] border border-white/10 bg-[oklch(0.2_0.03_250)] p-7 text-white shadow-2xl sm:p-9">
          <!-- 背景光晕 -->
          <div aria-hidden="true" class="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-[oklch(0.72_0.16_50/0.35)] blur-3xl" />
          <div aria-hidden="true" class="pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full bg-[oklch(0.6_0.11_200/0.35)] blur-3xl" />

          <!-- 航线动画:固定 400×110 画布,保证 offset-path 与 SVG 坐标一致 -->
          <div class="relative flex h-28 justify-center">
            <div class="relative h-[110px] w-[400px] shrink-0 origin-top max-sm:scale-75">
              <svg viewBox="0 0 400 110" class="absolute inset-0 size-full" fill="none" aria-hidden="true">
                <path d="M20 90 C 120 -10, 280 -10, 380 90" stroke="white" stroke-opacity=".25" stroke-width="2" stroke-dasharray="4 8" />
                <circle cx="20" cy="90" r="12" fill="oklch(0.76 0.115 195)" fill-opacity=".25" class="origin-center animate-ping [transform-box:fill-box]" />
                <circle cx="20" cy="90" r="6" fill="oklch(0.76 0.115 195)" />
                <circle cx="380" cy="90" r="6" fill="oklch(0.79 0.145 58)" />
              </svg>
              <div
                class="absolute top-0 left-0 size-8 animate-fly"
                style="offset-path: path('M20 90 C 120 -10, 280 -10, 380 90'); offset-rotate: auto 45deg;"
              >
                <span class="flex size-full items-center justify-center rounded-full bg-white text-[oklch(0.3_0.05_240)] shadow-lg shadow-black/30">
                  <Plane class="size-4" />
                </span>
              </div>
            </div>
          </div>

          <div class="relative mt-2 text-center">
            <p class="text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">
              Planning your journey
            </p>
            <h2 class="mt-2 font-display text-2xl font-bold sm:text-3xl">
              正在规划 <span class="text-gradient-sunset">{{ city || '你的旅程' }}</span>
            </h2>
            <p class="mt-2 text-sm text-white/70">
              {{ status }}
            </p>
          </div>

          <!-- 进度条 -->
          <div class="relative mt-6">
            <div class="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                class="relative h-full rounded-full bg-gradient-to-r from-[oklch(0.76_0.115_195)] via-[oklch(0.82_0.12_90)] to-[oklch(0.74_0.16_50)] transition-[width] duration-500 ease-out"
                :style="{ width: `${progress}%` }"
              >
                <div class="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)] bg-[length:200%_100%]" />
              </div>
            </div>
            <div class="mt-2 flex justify-between text-xs text-white/50 tabular-nums">
              <span>AI 多智能体协作中</span>
              <span>{{ progress }}%</span>
            </div>
          </div>

          <!-- 步骤 -->
          <ol class="relative mt-6 grid grid-cols-2 gap-2.5">
            <li
              v-for="step in steps"
              :key="step.label"
              :class="cn(
                'flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm transition-all duration-500',
                progress >= step.at ? 'border-white/15 bg-white/10 text-white' : 'border-white/5 text-white/40',
              )"
            >
              <span
                :class="cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-500',
                  progress >= step.at ? 'bg-[oklch(0.76_0.115_195)] text-[oklch(0.2_0.03_220)]' : 'bg-white/5',
                )"
              >
                <Check v-if="progress >= step.at + 20 || progress >= 100" class="size-3.5" />
                <component :is="step.icon" v-else class="size-3.5" />
              </span>
              {{ step.label }}
            </li>
          </ol>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
