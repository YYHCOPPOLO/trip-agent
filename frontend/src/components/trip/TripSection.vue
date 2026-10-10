<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  id: string
  icon: Component
  title: string
  eyebrow?: string
  description?: string
}>()
</script>

<template>
  <section :id="id" class="surface-card p-5 sm:p-7" data-export-card>
    <header class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <component :is="icon" class="size-5" />
        </span>
        <div>
          <p v-if="eyebrow" class="text-[10px] font-semibold tracking-[0.24em] text-sunset uppercase">
            {{ eyebrow }}
          </p>
          <h2 class="font-display text-xl leading-tight font-bold tracking-tight">
            {{ title }}
          </h2>
          <p v-if="description" class="mt-0.5 text-xs text-muted-foreground">
            {{ description }}
          </p>
        </div>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>
