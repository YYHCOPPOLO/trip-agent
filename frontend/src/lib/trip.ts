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
  'from-teal-500 to-cyan-800',
  'from-sky-500 to-indigo-700',
  'from-amber-400 to-orange-600',
  'from-emerald-500 to-teal-700',
  'from-rose-400 to-fuchsia-700',
] as const

export function getPlaceholderGradient(index: number): string {
  return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length] ?? PLACEHOLDER_GRADIENTS[0]
}

/** 每天路线使用的颜色(地图折线与行程时间线共用,保证一致) */
export const DAY_COLORS = ['#0f8a8a', '#e0793a', '#3b6fd8', '#c2417a', '#7a55d6', '#2f9e5b', '#c9a227'] as const

export function dayColor(dayIndex: number): string {
  return DAY_COLORS[dayIndex % DAY_COLORS.length] ?? DAY_COLORS[0]
}

export function formatMoney(value: number | undefined | null): string {
  return `¥${Number(value ?? 0).toLocaleString('zh-CN')}`
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** "2025-06-01" → { month: 6, day: 1, weekday: '周日' } */
export function parseDate(value: string | undefined | null) {
  const [y, m, d] = String(value ?? '').split('-').map(Number)
  if (!y || !m || !d)
    return null
  const date = new Date(y, m - 1, d)
  return { year: y, month: m, day: d, weekday: WEEKDAYS[date.getDay()] ?? '' }
}

/** "2025-06-01" → "6月1日" */
export function formatDateShort(value: string): string {
  const parsed = parseDate(value)
  return parsed ? `${parsed.month}月${parsed.day}日` : value
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
