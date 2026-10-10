import type { TripPlan } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'tripPlan'

function readStored(): TripPlan | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw)
    return null
  return JSON.parse(raw) as TripPlan
}

export const useTripPlanStore = defineStore('trip-plan', () => {
  const plan = ref<TripPlan | null>(readStored())

  function setPlan(next: TripPlan) {
    plan.value = next
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function persist() {
    if (plan.value)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plan.value))
  }

  function reload() {
    plan.value = readStored()
  }

  return { plan, setPlan, persist, reload }
})
