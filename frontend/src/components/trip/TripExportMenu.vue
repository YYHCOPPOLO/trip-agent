<script setup lang="ts">
import { ChevronDown, Download, FileImage, FileText, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
      <Button variant="outline" :disabled="exporting">
        <Loader2 v-if="exporting" class="animate-spin" />
        <Download v-else />
        导出行程
        <ChevronDown class="opacity-60" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuItem @select="emit('image')">
        <FileImage />
        导出为图片
      </DropdownMenuItem>
      <DropdownMenuItem @select="emit('pdf')">
        <FileText />
        导出为PDF
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
