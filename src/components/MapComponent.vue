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

        // 获取活动类型对应的CSS类名
        const getActivityTypeClass = (type) => {
          const typeMap = {
            '景点': 'type-attraction',
            '餐厅': 'type-restaurant', 
            '酒店': 'type-hotel',
            '交通': 'type-transport',
            '购物': 'type-shopping',
            '娱乐': 'type-entertainment',
            '文化': 'type-culture',
            '自然': 'type-nature',
            '运动': 'type-sports',
            '其他': 'type-other'
          }
          return typeMap[type] || 'type-default'
        }

        // 添加鼠标悬浮事件显示活动详情
        if (markerData.activity) {
          const activity = markerData.activity
          
          // 构建更详细的弹窗内容
          const popupContent = `
            <div class="activity-popup">
              <div class="popup-header">
                <h4 class="activity-title">${activity.name || '未知活动'}</h4>
                <div class="activity-type-badge">
                  <span class="type-tag ${getActivityTypeClass(activity.type)}">${activity.type || '未知类型'}</span>
                </div>
              </div>
              
              <div class="popup-content">
                <div class="info-row">
                  <div class="info-item">
                    <i class="icon-time">🕐</i>
                    <span class="label">时间:</span>
                    <span class="value">${activity.time || '未知时间'}</span>
                  </div>
                  ${activity.duration ? `
                    <div class="info-item">
                      <i class="icon-duration">⏱️</i>
                      <span class="label">时长:</span>
                      <span class="value">${activity.duration}</span>
                    </div>
                  ` : ''}
                </div>
                
                ${activity.location ? `
                  <div class="info-row">
                    <div class="info-item full-width">
                      <i class="icon-location">📍</i>
                      <span class="label">地点:</span>
                      <span class="value location-text">${activity.location}</span>
                    </div>
                  </div>
                ` : ''}
                
                ${activity.description ? `
                  <div class="info-row">
                    <div class="info-item full-width">
                      <i class="icon-desc">📝</i>
                      <span class="label">描述:</span>
                      <div class="description-text">${activity.description}</div>
                    </div>
                  </div>
                ` : ''}
                
                ${activity.coordinates ? `
                  <div class="info-row coordinates-row">
                    <div class="info-item full-width">
                      <i class="icon-coordinates">🗺️</i>
                      <span class="label">坐标:</span>
                      <span class="value coordinates-text">${Array.isArray(activity.coordinates) ? activity.coordinates.join(', ') : activity.coordinates}</span>
                    </div>
                  </div>
                ` : ''}
              </div>
              
              <div class="popup-footer">
                <small class="tip-text">💡 点击标记点查看更多操作</small>
              </div>
            </div>
          `
          
          markerInstance.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'custom-popup'
          })
          
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

// 跳转到指定活动位置
const jumpToActivity = (activity) => {
  if (!map || !activity || !activity.coordinates) {
    console.warn('[Map] 无法跳转：地图未初始化或活动坐标无效', { map: !!map, activity })
    return
  }

  try {
    let lng, lat
    const coords = activity.coordinates

    // 解析坐标格式
    if (Array.isArray(coords) && coords.length >= 2) {
      lng = parseFloat(coords[0])
      lat = parseFloat(coords[1])
    } else if (coords && typeof coords === 'object') {
      lng = parseFloat(coords.lng ?? coords.longitude)
      lat = parseFloat(coords.lat ?? coords.latitude)
    } else if (typeof coords === 'string') {
      const parts = coords.split(',')
      if (parts.length >= 2) {
        lng = parseFloat(parts[0].trim())
        lat = parseFloat(parts[1].trim())
      }
    }

    // 验证坐标有效性
    if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
      // 跳转到指定位置，使用适当的缩放级别
      map.setView([lat, lng], 15, {
        animate: true,
        duration: 1.0
      })
      
      console.log('[Map] 跳转到活动位置:', activity.name, [lng, lat])
      
      // 找到对应的标记点并高亮显示
      highlightActivityMarker(activity)
    } else {
      console.warn('[Map] 无效的活动坐标:', coords, { lng, lat })
    }
  } catch (error) {
    console.error('[Map] 跳转到活动位置失败:', error)
  }
}

// 高亮显示指定活动的标记点
const highlightActivityMarker = (activity) => {
  if (!map || !activity) return

  // 找到对应的标记点
  const markerIndex = props.markers.findIndex(marker => 
    marker.activity && marker.activity.name === activity.name
  )

  if (markerIndex >= 0 && markerInstances[markerIndex]) {
    const marker = markerInstances[markerIndex]
    
    // 打开弹窗显示活动详情
    marker.openPopup()
    
    // 添加临时高亮效果
    const markerElement = marker.getElement()
    if (markerElement) {
      const customMarker = markerElement.querySelector('.custom-marker')
      if (customMarker) {
        // 添加高亮样式
        customMarker.style.background = '#F56C6C'
        customMarker.style.transform = 'scale(1.3)'
        customMarker.style.boxShadow = '0 8px 20px rgba(245, 108, 108, 0.6)'
        
        // 2秒后恢复原样
        setTimeout(() => {
          customMarker.style.background = '#409eff'
          customMarker.style.transform = 'scale(1)'
          customMarker.style.boxShadow = '0 4px 12px rgba(64, 158, 255, 0.4)'
        }, 2000)
      }
    }
  }
}

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
  },
  jumpToActivity: jumpToActivity
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
/* 全局样式，用于Leaflet弹窗 */
.custom-popup .leaflet-popup-content-wrapper {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: none;
  padding: 0;
  overflow: hidden;
}

.custom-popup .leaflet-popup-content {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.activity-popup {
  min-width: 280px;
  max-width: 320px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  overflow: hidden;
}

.popup-header {
  padding: 16px 20px 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.activity-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.activity-type-badge {
  display: flex;
  justify-content: flex-start;
}

.type-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 不同活动类型的颜色 */
.type-attraction { background: rgba(255, 107, 107, 0.8); }
.type-restaurant { background: rgba(255, 193, 7, 0.8); }
.type-hotel { background: rgba(76, 175, 80, 0.8); }
.type-transport { background: rgba(33, 150, 243, 0.8); }
.type-shopping { background: rgba(156, 39, 176, 0.8); }
.type-entertainment { background: rgba(255, 152, 0, 0.8); }
.type-culture { background: rgba(121, 85, 72, 0.8); }
.type-nature { background: rgba(76, 175, 80, 0.8); }
.type-sports { background: rgba(244, 67, 54, 0.8); }
.type-default { background: rgba(158, 158, 158, 0.8); }

.popup-content {
  padding: 16px 20px;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.info-item.full-width {
  flex: 1 1 100%;
}

.info-item i {
  font-size: 14px;
  margin-top: 1px;
  flex-shrink: 0;
}

.info-item .label {
  font-weight: 500;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.info-item .value {
  font-size: 13px;
  color: white;
  word-break: break-word;
}

.location-text {
  font-weight: 500;
}

.description-text {
  font-size: 13px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.95);
  margin-top: 4px;
}

.coordinates-row {
  background: rgba(0, 0, 0, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  margin: 8px -8px 0;
}

.coordinates-text {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.popup-footer {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.tip-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

/* 弹窗箭头样式 */
.custom-popup .leaflet-popup-tip {
  background: #764ba2;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 关闭按钮样式 */
.custom-popup .leaflet-popup-close-button {
  color: white;
  font-size: 18px;
  font-weight: bold;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 8px;
  right: 8px;
  transition: all 0.2s ease;
}

.custom-popup .leaflet-popup-close-button:hover {
  background: rgba(0, 0, 0, 0.4);
  transform: scale(1.1);
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