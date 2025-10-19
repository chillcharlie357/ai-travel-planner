<template>
  <div class="map-container">
    <div ref="mapContainer" class="map" :style="{ height: height }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

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
  },
  // 新增：行程数据，用于绘制有向线段
  itinerary: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['mapReady', 'markerClick'])

const mapContainer = ref(null)
const loading = ref(true)
let map = null
let markerInstances = []
let polylineInstances = [] // 存储有向线段实例

// 初始化地图（统一使用Leaflet + OpenStreetMap）
const initMap = async () => {
  try {
    loading.value = true
    await initLeafletMap()
  } catch (error) {
    console.error('地图初始化失败:', error)
    ElMessage.error('地图加载失败，请检查网络连接')
    loading.value = false
  }
}

// 初始化Leaflet地图
const initLeafletMap = async () => {
  try {
    // 动态导入Leaflet
    const L = await import('leaflet')
    
    // 添加Leaflet样式
    addLeafletStyles()
    
    // 导入Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // 等待容器准备就绪
    await new Promise(resolve => setTimeout(resolve, 100))

    const center = props.center || [0, 0]
    const leafletCenter = Array.isArray(center) ? [center[1], center[0]] : [0, 0] // Leaflet使用[lat, lng]

    // 创建Leaflet地图
    map = L.map(mapContainer.value, {
      center: leafletCenter,
      zoom: props.zoom || 10,
      zoomControl: true
    })

    // 添加OpenStreetMap图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // 强制重新计算地图尺寸
    setTimeout(() => {
      if (map) {
        map.invalidateSize()
      }
    }, 200)

    console.log('[Map] Leaflet地图初始化成功')
    loading.value = false
    
    // 触发地图就绪事件
    emit('mapReady', map)
    
    // 初始化标记点
    updateMarkers()
    
  } catch (error) {
    console.error('Leaflet地图初始化失败:', error)
    ElMessage.error('地图加载失败，请检查网络连接')
    loading.value = false
  }
}

// 更新标记点
const updateMarkers = () => {
  if (!map) return

  console.log('[Map] updateMarkers count:', Array.isArray(props.markers) ? props.markers.length : 0)

  // 清除现有标记点
  clearMarkers()

  if (!Array.isArray(props.markers) || props.markers.length === 0) {
    return
  }

  // 统一使用Leaflet标记点
  updateLeafletMarkers()
}

// 清除标记点
const clearMarkers = () => {
  // 清除现有标记
  markerInstances.forEach(marker => {
    map.removeLayer(marker)
  })
  markerInstances = []
  
  // 清除现有线段
  polylineInstances.forEach(polyline => {
    map.removeLayer(polyline)
  })
  polylineInstances = []
}

// 更新Leaflet标记点
const updateLeafletMarkers = async () => {
  const L = await import('leaflet')
  const validPositions = []
  
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
      try {
        // 创建自定义图标
        const customIcon = L.divIcon({
          html: `<div class="custom-marker">${index + 1}</div>`,
          className: 'custom-leaflet-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })

        // 创建标记点 (Leaflet使用[lat, lng]格式)
        const markerInstance = L.marker([lat, lng], {
          icon: customIcon,
          title: markerData.title || `标记点 ${index + 1}`
        }).addTo(map)

        markerInstances.push(markerInstance)
        validPositions.push([lng, lat])
        console.log('[Map] leaflet marker added at:', [lng, lat])

        // 添加点击事件
        markerInstance.on('click', () => {
          emit('markerClick', markerData, index)
        })

        // 添加鼠标悬浮事件显示活动详情
        if (markerData.activity) {
          const activity = markerData.activity
          const popupContent = `
            <div class="activity-popup">
              <h4>${activity.name || '未知活动'}</h4>
              <p><strong>时间:</strong> ${activity.time || '未知时间'}</p>
              <p><strong>类型:</strong> ${activity.type || '未知类型'}</p>
              ${activity.description ? `<p><strong>描述:</strong> ${activity.description}</p>` : ''}
              ${activity.location ? `<p><strong>地点:</strong> ${activity.location}</p>` : ''}
              ${activity.estimatedCost ? `<p><strong>预估费用:</strong> ¥${activity.estimatedCost}</p>` : ''}
              ${activity.duration ? `<p><strong>建议游玩时长:</strong> ${activity.duration}</p>` : ''}
            </div>
          `
          
          markerInstance.bindPopup(popupContent)
          
          // 鼠标悬浮显示弹窗
          markerInstance.on('mouseover', function() {
            this.openPopup()
          })
          
          markerInstance.on('mouseout', function() {
            this.closePopup()
          })
        } else {
          // 如果没有活动详情，显示基本信息
          const labelText = markerData.title || markerData.label || ''
          if (labelText) {
            markerInstance.bindPopup(labelText)
          }
        }
      } catch (error) {
        console.error('创建Leaflet标记点失败:', error, markerData)
      }
    } else {
      console.warn('[Map] invalid marker position:', markerData.position, { lng, lat })
      console.warn('跳过无效标记点位置:', markerData.position)
    }
  })

  // 绘制有向线段连接同一天的活动
  drawActivityLines()

  // 如果有有效标记点，调整地图视野
  if (validPositions.length > 0 && markerInstances.length > 0) {
    try {
      const group = new L.featureGroup(markerInstances)
      map.fitBounds(group.getBounds(), { padding: [20, 20] })
      console.log('[Map] leaflet fitBounds with markers:', markerInstances.length)
    } catch (e) {
      console.warn('[Map] leaflet fitBounds failed:', e)
    }
  }
}

// 绘制有向线段连接同一天的活动
const drawActivityLines = async () => {
  if (!map || !Array.isArray(props.itinerary) || props.itinerary.length === 0) {
    return
  }

  const L = await import('leaflet')
  
  // 为每一天的活动绘制连接线
  props.itinerary.forEach((day, dayIndex) => {
    if (!day.activities || !Array.isArray(day.activities) || day.activities.length < 2) {
      return // 少于2个活动无需连线
    }

    const dayColors = [
      '#409EFF', // 蓝色 - 第1天
      '#67C23A', // 绿色 - 第2天  
      '#E6A23C', // 橙色 - 第3天
      '#F56C6C', // 红色 - 第4天
      '#909399', // 灰色 - 第5天
      '#9C27B0', // 紫色 - 第6天
      '#FF9800', // 深橙 - 第7天
      '#795548'  // 棕色 - 第8天及以上
    ]
    
    const lineColor = dayColors[dayIndex % dayColors.length]
    
    // 获取当天所有有效的活动坐标
    const dayCoordinates = []
    
    day.activities.forEach((activity, actIndex) => {
      let lng, lat
      
      if (activity.coordinates && Array.isArray(activity.coordinates) && activity.coordinates.length >= 2) {
        lng = parseFloat(activity.coordinates[0])
        lat = parseFloat(activity.coordinates[1])
        
        if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          dayCoordinates.push([lat, lng]) // Leaflet使用[lat, lng]格式
        }
      }
    })
    
    // 如果有足够的坐标点，绘制连接线
    if (dayCoordinates.length >= 2) {
      try {
        // 创建折线
        const polyline = L.polyline(dayCoordinates, {
          color: lineColor,
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 10' // 虚线样式
        }).addTo(map)
        
        polylineInstances.push(polyline)
        
        // 添加箭头标记表示方向
        for (let i = 0; i < dayCoordinates.length - 1; i++) {
          const start = dayCoordinates[i]
          const end = dayCoordinates[i + 1]
          
          // 计算箭头位置（线段中点）
          const midLat = (start[0] + end[0]) / 2
          const midLng = (start[1] + end[1]) / 2
          
          // 计算箭头角度
          const angle = Math.atan2(end[0] - start[0], end[1] - start[1]) * 180 / Math.PI
          
          // 创建箭头标记
          const arrowIcon = L.divIcon({
            html: `<div class="arrow-marker" style="transform: rotate(${angle}deg); color: ${lineColor};">➤</div>`,
            className: 'arrow-leaflet-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
          
          const arrowMarker = L.marker([midLat, midLng], {
            icon: arrowIcon,
            interactive: false // 箭头不可交互
          }).addTo(map)
          
          polylineInstances.push(arrowMarker)
        }
        
        console.log(`[Map] 第${dayIndex + 1}天活动连线已绘制，共${dayCoordinates.length}个点`)
        
      } catch (error) {
        console.error(`绘制第${dayIndex + 1}天活动连线失败:`, error)
      }
    }
  })
}

// 添加Leaflet CSS样式
const addLeafletStyles = () => {
  if (document.getElementById('leaflet-styles')) return

  const style = document.createElement('style')
  style.id = 'leaflet-styles'
  style.textContent = `
    .custom-leaflet-marker {
      background: transparent !important;
      border: none !important;
    }
    
    .custom-leaflet-marker .custom-marker {
      width: 32px;
      height: 32px;
      background: #409EFF;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .arrow-leaflet-marker {
      background: transparent !important;
      border: none !important;
    }
    
    .arrow-marker {
      font-size: 16px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }
    
    .activity-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 250px;
    }
    
    .activity-popup h4 {
      margin: 0 0 8px 0;
      color: #409EFF;
      font-size: 16px;
    }
    
    .activity-popup p {
      margin: 4px 0;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .activity-popup strong {
      color: #303133;
    }
   `
   document.head.appendChild(style)
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

// 监听行程数据变化
watch(() => props.itinerary, () => {
  if (map) {
    updateMarkers()
  }
}, { deep: true })

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
    map.remove()
  }
})

// 暴露地图实例给父组件
defineExpose({
  getMap: () => map,
  setCenter: (center) => {
    if (map && Array.isArray(center) && center.length >= 2) {
      // Leaflet使用setView方法，参数顺序是[lat, lng]
      const [lng, lat] = center
      map.setView([lat, lng], map.getZoom())
    }
  },
  setZoom: (zoom) => {
    if (map) map.setZoom(zoom)
  },
  updateMarkers: () => {
    updateMarkers()
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
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.map {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* 删除遮罩：若仍保留 DOM，确保不拦截操作与显示 */
.map-loading {
  display: none !important;
  pointer-events: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}
</style>

<style>
/* 自定义标记点样式 */
.custom-marker {
  width: 32px !important;
  height: 32px !important;
  background: #409eff !important;
  color: white !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-weight: bold !important;
  font-size: 14px !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4) !important;
  border: 3px solid white !important;
  position: relative !important;
  z-index: 9999 !important;
  cursor: pointer !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

.custom-marker:hover {
  background: #66b1ff !important;
  transform: scale(1.15) !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 6px 16px rgba(102, 177, 255, 0.5) !important;
}
</style>