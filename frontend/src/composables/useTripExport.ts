import type { MaybeRefOrGetter } from 'vue'
import { nextTick, ref, toValue } from 'vue'
import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/lib/trip'

interface UseTripExportOptions {
  /** 需要导出的内容根节点 */
  target: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** 文件名中的城市名 */
  city: MaybeRefOrGetter<string | undefined>
  /**
   * 截图前的准备工作(例如展开全部每日行程),
   * 返回一个在截图结束后执行的恢复函数
   */
  prepare?: () => (() => void) | void | Promise<(() => void) | void>
}

const TOAST_ID = 'trip-export'
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
// 等待折叠面板展开动画结束
const SETTLE_DELAY_MS = 350

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 截取高德地图当前画面(跨域瓦片可能导致画布被污染,此时跳过) */
function snapshotMap(root: HTMLElement): string | null {
  const canvas = root.querySelector<HTMLCanvasElement>('#amap-container canvas')
  if (!canvas)
    return null
  try {
    return canvas.toDataURL('image/png')
  }
  catch (error) {
    console.warn('地图截图失败,导出内容将不包含地图画面:', error)
    return null
  }
}

function buildFileName(city: string | undefined, ext: 'png' | 'pdf') {
  return `旅行计划_${city ?? ''}_${Date.now()}.${ext}`
}

/**
 * 行程导出(图片 / PDF)
 *
 * 直接对页面中的内容节点截图,不再依赖任何组件库的类名;
 * 在克隆出的文档里移除标记了 data-export-ignore 的元素,并把地图替换为静态截图。
 */
export function useTripExport(options: UseTripExportOptions) {
  const exporting = ref(false)

  async function captureCanvas(): Promise<HTMLCanvasElement> {
    const restore = await options.prepare?.()
    try {
      await nextTick()
      await wait(SETTLE_DELAY_MS)

      const element = toValue(options.target)
      if (!element)
        throw new Error('未找到内容元素')

      const mapSnapshot = snapshotMap(element)
      const backgroundColor = getComputedStyle(document.body).backgroundColor || '#ffffff'

      // 按需加载截图库,减小首屏体积
      const { default: html2canvas } = await import('html2canvas-pro')
      return await html2canvas(element, {
        backgroundColor,
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: document.documentElement.clientWidth,
        onclone: (_doc, cloned) => {
          cloned.style.padding = '24px'
          cloned.querySelectorAll('[data-export-ignore]').forEach(node => node.remove())
          const mapContainer = cloned.querySelector<HTMLElement>('#amap-container')
          if (mapContainer) {
            mapContainer.innerHTML = mapSnapshot
              ? `<img src="${mapSnapshot}" style="width:100%;height:100%;object-fit:cover;" />`
              : ''
          }
        },
      })
    }
    finally {
      restore?.()
    }
  }

  async function exportAsImage() {
    if (exporting.value)
      return
    exporting.value = true
    toast.loading('正在生成图片...', { id: TOAST_ID })
    try {
      const canvas = await captureCanvas()
      const link = document.createElement('a')
      link.download = buildFileName(toValue(options.city), 'png')
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('图片导出成功!', { id: TOAST_ID })
    }
    catch (error) {
      console.error('导出图片失败:', error)
      toast.error(`导出图片失败: ${getErrorMessage(error, '未知错误')}`, { id: TOAST_ID })
    }
    finally {
      exporting.value = false
    }
  }

  async function exportAsPDF() {
    if (exporting.value)
      return
    exporting.value = true
    toast.loading('正在生成PDF...', { id: TOAST_ID })
    try {
      const canvas = await captureCanvas()
      const imgData = canvas.toDataURL('image/png')
      const { jsPDF: JsPDF } = await import('jspdf')
      const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const imgWidth = A4_WIDTH_MM
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // 内容高度超过一页时分页
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= A4_HEIGHT_MM

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= A4_HEIGHT_MM
      }

      pdf.save(buildFileName(toValue(options.city), 'pdf'))
      toast.success('PDF导出成功!', { id: TOAST_ID })
    }
    catch (error) {
      console.error('导出PDF失败:', error)
      toast.error(`导出PDF失败: ${getErrorMessage(error, '未知错误')}`, { id: TOAST_ID })
    }
    finally {
      exporting.value = false
    }
  }

  return { exporting, exportAsImage, exportAsPDF }
}
