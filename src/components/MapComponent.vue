<template>
  <div class="map-container">
    <div ref="mapContainer" class="map" :style="{ height: height }"></div>
    <div v-if="loading" class="map-loading" v-loading="loading" element-loading-text="地图加载中...">
    </div>
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

  // 清除现有标记
  markerInstances.forEach(marker => {
    map.remove(marker)
  })
  markerInstances = []

  // 添加新标记
  props.markers.forEach((markerData, index) => {
    const marker = new AMap.Marker({
      position: markerData.position,
      title: markerData.title || '',
      content: markerData.content || `<div class="custom-marker">${index + 1}</div>`
    })

    marker.on('click', () => {
      emit('markerClick', markerData, index)
    })

    map.add(marker)
    markerInstances.push(marker)
  })

  // 如果有标记点，调整地图视野
  if (props.markers.length > 0) {
    const bounds = new AMap.Bounds()
    props.markers.forEach(marker => {
      bounds.extend(marker.position)
    })
    map.setBounds(bounds, false, [20, 20, 20, 20])
  }
}

// 监听标记点变化
watch(() => props.markers, updateMarkers, { deep: true })

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (map) {
    map.setCenter(newCenter)
  }
})

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

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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