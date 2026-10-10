import type { Component } from 'vue'
import type { Meal } from '@/types'
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Coffee,
  Cookie,
  Soup,
  Sun,
  UtensilsCrossed,
} from '@lucide/vue'

export const MEAL_LABELS: Record<Meal['type'], string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '小吃',
}

export function getMealLabel(type: string): string {
  return MEAL_LABELS[type as Meal['type']] ?? type
}

export const MEAL_ICONS: Record<Meal['type'], Component> = {
  breakfast: Coffee,
  lunch: Soup,
  dinner: UtensilsCrossed,
  snack: Cookie,
}

const WEATHER_ICON_RULES: [RegExp, Component][] = [
  [/雷/, CloudLightning],
  [/[雪冰雹]/, CloudSnow],
  [/暴雨|大雨|中雨|阵雨/, CloudRain],
  [/雨/, CloudDrizzle],
  [/[雾霾沙尘]/, CloudFog],
  [/阴/, Cloud],
  [/云/, CloudSun],
  [/晴/, Sun],
]

/** 根据天气描述(如“晴”“多云”“小雨”)挑选图标 */
export function getWeatherIcon(text: string): Component {
  return WEATHER_ICON_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? CloudSun
}

/** 景点无图片时使用的渐变占位色 */
export const PLACEHOLDER_GRADIENTS = [
  'from-teal-400 to-cyan-600',
  'from-sky-400 to-indigo-500',
  'from-amber-300 to-orange-500',
  'from-emerald-400 to-teal-600',
  'from-rose-300 to-pink-500',
] as const

export function getPlaceholderGradient(index: number): string {
  return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length] ?? PLACEHOLDER_GRADIENTS[0]
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
}
const HTML_ESCAPE_RE = /[&<>"']/g

/** 转义插入到高德信息窗口 HTML 中的文本 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(HTML_ESCAPE_RE, ch => HTML_ESCAPES[ch] ?? ch)
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message)
    return error.message
  return fallback
}
