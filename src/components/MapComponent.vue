<template>
  <div class="map-container">
    <div ref="mapContainer" class="map" :style="{ height: height }"></div>
    <!-- 移除 v-loading 灰色遮罩，避免高倍率下挡住地图 -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { config } from '@/config'

const props = defineProps({
  height: {
    type: String,
    default: '400px'
  },
  center: {
    type: Array,
    default: () => [116.397428, 39.90923] // 北京天安门
  },
  zoom: {
    type: Number,
    default: 10
  },
  markers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['mapReady', 'markerClick'])

const mapContainer = ref(null)
const loading = ref(true)
let map = null
let markerInstances = []
let textInstances = []

// 初始化地图
const initMap = async () => {
  try {
    loading.value = true
    
    const AMap = await AMapLoader.load({
      key: config.gaode.key,
      version: config.gaode.version,
      plugins: config.gaode.plugins
    })

    map = new AMap.Map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      mapStyle: 'amap://styles/normal',
      viewMode: '3D',
      pitch: 0
    })
    console.log('[Map] initMap center:', props.center, 'zoom:', props.zoom, 'markers:', Array.isArray(props.markers) ? props.markers.length : 0)

    // 添加工具栏
    const toolbar = new AMap.ToolBar({
      position: {
        top: '10px',
        right: '10px'
      }
    })
    map.addControl(toolbar)

    // 添加比例尺
    const scale = new AMap.Scale({
      position: {
        bottom: '10px',
        left: '10px'
      }
    })
    map.addControl(scale)

    // 地图加载完成
    map.on('complete', () => {
      loading.value = false
      emit('mapReady', map)
    })

    // 更新标记点
    updateMarkers()

  } catch (error) {
    console.error('地图初始化失败:', error)
    ElMessage.error('地图加载失败，请检查网络连接')
    loading.value = false
  }
}

// 更新标记点
const updateMarkers = () => {
  if (!map) return

  console.log('[Map] updateMarkers count:', Array.isArray(props.markers) ? props.markers.length : 0)

  // 清除现有标记
  markerInstances.forEach(marker => {
    map.remove(marker)
  })
  markerInstances = []

  // 清除文本标签
  if (textInstances.length) {
    map.remove(textInstances)
    textInstances = []
  }

  const validPositions = []

  // 添加新标记（带坐标校验与规范化）
  props.markers.forEach((markerData, index) => {
    let pos = markerData.position
    let lng, lat

    console.log('[Map] marker raw position:', pos)

    if (Array.isArray(pos) && pos.length >= 2) {
      lng = parseFloat(pos[0])
      lat = parseFloat(pos[1])
    } else if (pos && typeof pos === 'object') {
      const rawLng = pos.lng ?? pos.longitude
      const rawLat = pos.lat ?? pos.latitude
      if (rawLng !== undefined && rawLat !== undefined) {
        lng = parseFloat(rawLng)
        lat = parseFloat(rawLat)
      }
    } else if (typeof pos === 'string') {
      const parts = pos.split(',')
      if (parts.length >= 2) {
        lng = parseFloat(parts[0].trim())
        lat = parseFloat(parts[1].trim())
      }
    }

    console.log('[Map] marker parsed:', { lng, lat })

    if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
      const normalized = [lng, lat]
      const marker = new AMap.Marker({
        position: normalized,
        title: markerData.title || '',
        content: markerData.content || `<div class="custom-marker">${index + 1}</div>`
      })

      marker.on('click', () => {
        emit('markerClick', markerData, index)
      })

      map.add(marker)
      markerInstances.push(marker)
      validPositions.push(normalized)
      console.log('[Map] marker added at:', normalized)

      // 添加文本标签显示景点名称
      const labelText = markerData.title || markerData.label || ''
      if (labelText) {
        const text = new AMap.Text({
          text: labelText,
          position: normalized,
          anchor: 'bottom-center',
          style: {
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #dcdcdc',
            borderRadius: '4px',
            padding: '2px 6px',
            color: '#333',
            fontSize: '12px',
            lineHeight: '16px'
          },
          offset: new AMap.Pixel(0, -26)
        })
        map.add(text)
        textInstances.push(text)
      }
    } else {
      console.warn('[Map] invalid marker position:', markerData.position, { lng, lat })
      console.warn('跳过无效标记点位置:', markerData.position)
    }
  })

  // 如果有有效标记点，调整地图视野
  if (validPositions.length > 0) {
    try {
      console.log('[Map] setFitView with markers:', markerInstances.length)
      map.setFitView(markerInstances, false, [20, 20, 20, 20])
    } catch (e) {
      console.warn('[Map] setFitView failed, fallback to setBounds:', e)
      const minLng = Math.min(...validPositions.map(p => p[0]))
      const maxLng = Math.max(...validPositions.map(p => p[0]))
      const minLat = Math.min(...validPositions.map(p => p[1]))
      const maxLat = Math.max(...validPositions.map(p => p[1]))
      console.log('[Map] computed bounds:', { minLng, minLat, maxLng, maxLat })
      const sw = new AMap.LngLat(minLng, minLat)
      const ne = new AMap.LngLat(maxLng, maxLat)
      const bounds = new AMap.Bounds(sw, ne)
      map.setBounds(bounds, false, [20, 20, 20, 20])
    }
  }
}

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (!map) return
  try {
    let lng, lat
    console.log('[Map] center watch raw:', newCenter)
    if (Array.isArray(newCenter) && newCenter.length >= 2) {
      lng = parseFloat(newCenter[0])
      lat = parseFloat(newCenter[1])
    } else if (newCenter && typeof newCenter === 'object' && (newCenter.lng ?? newCenter.longitude) !== undefined && (newCenter.lat ?? newCenter.latitude) !== undefined) {
      lng = parseFloat(newCenter.lng ?? newCenter.longitude)
      lat = parseFloat(newCenter.lat ?? newCenter.latitude)
    } else if (typeof newCenter === 'string') {
      const parts = newCenter.split(',')
      if (parts.length >= 2) {
        lng = parseFloat(parts[0].trim())
        lat = parseFloat(parts[1].trim())
      }
    }
    if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
      console.log('[Map] setCenter parsed:', [lng, lat])
      map.setCenter([lng, lat])
    } else {
      console.warn('忽略无效中心点:', newCenter)
    }
  } catch (e) {
    console.warn('设置中心点时出错:', e, newCenter)
  }
})

// 监听标记点变化
watch(() => props.markers, updateMarkers, { deep: true })

// 监听缩放级别变化
watch(() => props.zoom, (newZoom) => {
  if (map) {
    map.setZoom(newZoom)
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.destroy()
  }
})

// 暴露地图实例给父组件
defineExpose({
  getMap: () => map,
  setCenter: (center) => {
    if (map) map.setCenter(center)
  },
  setZoom: (zoom) => {
    if (map) map.setZoom(zoom)
  },
  addMarker: (markerData) => {
    const newMarkers = [...props.markers, markerData]
    emit('update:markers', newMarkers)
  }
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.map {
  width: 100%;
}

/* 删除遮罩：若仍保留 DOM，确保不拦截操作与显示 */
.map-loading {
  display: none !important;
  pointer-events: none;
}
</style>

<style>
/* 自定义标记点样式 */
.custom-marker {
  width: 30px;
  height: 30px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.custom-marker:hover {
  background: #66b1ff;
  transform: scale(1.1);
  transition: all 0.2s ease;
}
</style>