<script setup lang="ts">
import { ChevronDown, Download, FileImage, FileText, Loader2 } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

defineProps<{
  exporting?: boolean
}>()

const emit = defineEmits<{
  image: []
  pdf: []
}>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        id="export-trip"
        type="button"
        :disabled="exporting"
        class="glass-dark inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-60"
      >
        <Loader2 v-if="exporting" class="size-4 animate-spin" />
        <Download v-else class="size-4" />
        导出行程
        <ChevronDown class="size-4 opacity-60" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-52 rounded-2xl p-1.5">
      <DropdownMenuLabel class="text-xs text-muted-foreground">
        保存或分享你的行程
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="gap-3 rounded-xl py-2" @select="emit('image')">
        <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileImage class="size-4" />
        </span>
        <span class="flex flex-col">
          <span class="font-medium">导出为图片</span>
          <span class="text-[11px] text-muted-foreground">高清 PNG 长图</span>
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem class="gap-3 rounded-xl py-2" @select="emit('pdf')">
        <span class="flex size-8 items-center justify-center rounded-lg bg-sunset/15 text-sunset">
          <FileText class="size-4" />
        </span>
        <span class="flex flex-col">
          <span class="font-medium">导出为PDF</span>
          <span class="text-[11px] text-muted-foreground">A4 分页,便于打印</span>
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
