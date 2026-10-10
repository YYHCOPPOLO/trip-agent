// 高德地图 JS API 2.0 最小类型声明(仅覆盖本项目用到的部分)

export type LngLatTuple = [number, number]

export interface AMapPixel {}

export interface AMapLngLat {
  getLng: () => number
  getLat: () => number
}

export interface AMapOverlay {
  on: (event: string, handler: () => void) => void
}

export interface AMapMarker extends AMapOverlay {
  getPosition: () => AMapLngLat
}

export interface AMapPolyline extends AMapOverlay {}

export interface AMapInfoWindow {
  open: (map: AMapMap, position: AMapLngLat | LngLatTuple) => void
  close: () => void
}

export interface AMapMap {
  add: (overlays: AMapOverlay | AMapOverlay[]) => void
  setFitView: (overlays?: AMapOverlay[], immediately?: boolean, avoid?: number[]) => void
  destroy: () => void
}

export interface AMapNamespace {
  Map: new (container: string | HTMLElement, options: {
    zoom?: number
    center?: LngLatTuple
    viewMode?: '2D' | '3D'
    WebGLParams?: { preserveDrawingBuffer?: boolean }
  }) => AMapMap
  Marker: new (options: {
    position: LngLatTuple
    title?: string
    content?: string
    offset?: AMapPixel
    anchor?: string
    label?: { content: string, offset?: AMapPixel, direction?: string }
  }) => AMapMarker
  InfoWindow: new (options: { content: string, offset?: AMapPixel }) => AMapInfoWindow
  Polyline: new (options: {
    path: LngLatTuple[]
    strokeColor?: string
    strokeWeight?: number
    strokeOpacity?: number
    strokeStyle?: 'solid' | 'dashed'
    showDir?: boolean
  }) => AMapPolyline
  Pixel: new (x: number, y: number) => AMapPixel
}
