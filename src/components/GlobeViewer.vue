<template>
  <div class="globe-area">
    <div ref="cesiumContainer" class="cesium-container"></div>
    <slot name="layer-control"></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, inject, provide } from 'vue'
import * as Cesium from 'cesium'
import { getCompositeAirwayCoordinates } from '../utils/airwaySearch.js'

const GIS_BASE = '/gisData/lowAltitude/'
const PLAN_ROUTE_ALT = 3500
const BASE_ALT = 500
const GROUND_ALT = 10
const LABEL_SHOW_ALT = 3000000

const cesiumContainer = ref(null)
let viewer = null
let layerEntities = { airport: [], waypoint: [], route: [], sector: [] }
let planRouteEntities = null
let gisDataLoaded = false
let gisDataLoading = false
let airportLabelsVisible = false

// GIS data caches
let sectorFeatures = []
let airportFeatures = []
let airwayFeatures = []
let fixFeatures = []
let fixCoordMap = {}
let airwaysObj = {}

let activePlanRouteData = null
let planRouteCoords = []

const layerVisible = ref({ airport: true, waypoint: true, route: false, sector: false })
const routeInfo = inject('routeInfo')

const MOCK = { flightNo: 'CCA1234', dep: 'ZBAA 北京首都', arr: 'ZSPD 上海浦东',
  route: 'EPGAM A593 LAMEN', routeDisplay: 'ZBAA EPGAM A593 LAMEN ZSPD',
  departAirport: 'ZBAA', arriveAirport: 'ZSPD', altitude: 'FL360', etd: '08:30 (UTC+8)' }

provide('layerVisible', layerVisible)

function icao(v) {
  if (!v) return ''
  const t = String(v).trim().toUpperCase()
  if (/^[A-Z]{4}$/.test(t)) return t
  const f = t.split(/\s+/)[0]
  return /^[A-Z]{4}$/.test(f) ? f : ''
}

async function loadGis() {
  if (gisDataLoaded || gisDataLoading) return
  gisDataLoading = true
  try {
    const [sectorR, airportR, airwayR, fixR] = await Promise.all([
      fetch(GIS_BASE + 'sector.json').then(r => r.json()),
      fetch(GIS_BASE + 'airport.json').then(r => r.json()),
      fetch(GIS_BASE + 'airway.json').then(r => r.json()),
      fetch(GIS_BASE + 'fix.json').then(r => r.json())
    ])
    sectorFeatures = (sectorR.data?.features) || []
    airportFeatures = (airportR.data?.features) || []
    airwayFeatures = (airwayR.data?.features) || []
    fixFeatures = (fixR.data?.features) || []
    buildIndex()
    gisDataLoaded = true
    renderGis()
    loadPlanRoute(MOCK)
  } catch (e) {
    console.error('[GlobeViewer] GIS:', e)
  } finally {
    gisDataLoading = false
  }
}

function buildIndex() {
  const map = {}
  fixFeatures.forEach(f => {
    if (!f.geometry || f.geometry.type !== 'Point') return
    const n = (f.properties?.name || f.properties?.cname || f.id)
    if (n) map[String(n).toUpperCase()] = f.geometry.coordinates
  })
  airportFeatures.forEach(f => {
    if (!f.geometry || f.geometry.type !== 'Point') return
    const c = (f.id || f.properties?.airportname || '').toString().toUpperCase()
    if (c) map[c] = f.geometry.coordinates
  })
  fixCoordMap = map

  const obj = {}
  airwayFeatures.forEach(f => {
    const pr = f.properties || {}
    const code = pr.code || f.id
    const pn = pr.pointsName
    if (!code || !pn || !f.geometry) return
    const names = String(pn).split(',')
    let lc = []
    if (f.geometry.type === 'LineString') lc = f.geometry.coordinates
    else if (f.geometry.type === 'MultiLineString' && f.geometry.coordinates.length) lc = f.geometry.coordinates[0]
    obj[code] = names.map((n, i) => {
      const k = String(n).trim().toUpperCase().split('/')[0]
      const c = fixCoordMap[k] || (lc[i] || null)
      return c ? { pName: n.trim(), coordinate: c } : null
    }).filter(Boolean)
  })
  airwaysObj = obj
}

function addAirportCoords(coords, data) {
  if (!coords?.length) return coords
  const dep = icao(data.departAirport) || icao(data.dep)
  const arr = icao(data.arriveAirport) || icao(data.arr)
  if (!dep && !arr) return coords
  const dp = dep ? fixCoordMap[dep] : null
  const ap = arr ? fixCoordMap[arr] : null
  const out = coords.slice()
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]
  if (dp && !same(out[0], dp)) out.unshift(dp)
  if (ap && !same(out[out.length-1], ap)) out.push(ap)
  return out
}

function loadPlanRoute(data) {
  if (!data?.route || !airwaysObj) return
  let coords = getCompositeAirwayCoordinates(data, airwaysObj)
  if (!coords?.length) { clearPlanRoute(); return }
  coords = addAirportCoords(coords, data)
  // 过滤掉无效坐标，确保每个点都是 [lng, lat] 格式
  coords = coords.filter(c => Array.isArray(c) && c.length >= 2 && c[0] != null && c[1] != null)
  if (!coords.length) { clearPlanRoute(); return }
  planRouteCoords = coords
  activePlanRouteData = data
  renderPlanRoute()
  if (coords.length >= 2 && viewer) {
    const mid = coords[Math.floor(coords.length / 2)]
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(mid[0], mid[1], 8000000) })
  }
  routeInfo.value = {
    flightNo: data.flightNo || '--', dep: data.dep || '--', arr: data.arr || '--',
    routeDisplay: data.routeDisplay || data.route || '--',
    altitude: data.altitude || '--', etd: data.etd || '--'
  }
}

function clearPlanRoute() {
  if (planRouteEntities) { planRouteEntities.forEach(e => viewer.entities.remove(e)); planRouteEntities = null }
  planRouteCoords = []; activePlanRouteData = null
}

function endpointDisplay(role) {
  if (!activePlanRouteData) return { icao: '', name: '' }
  const code = role === 'dep'
    ? (icao(activePlanRouteData.departAirport) || icao(activePlanRouteData.dep))
    : (icao(activePlanRouteData.arriveAirport) || icao(activePlanRouteData.arr))
  let name = ''
  for (const f of airportFeatures) {
    const c = String(f.id || f.properties?.airportname || '').toUpperCase()
    if (c === code && f.properties?.cname) { name = f.properties.cname; break }
  }
  if (!name) {
    const raw = role === 'dep' ? activePlanRouteData.dep : activePlanRouteData.arr
    const parts = String(raw || '').trim().split(/\s+/)
    if (parts.length >= 2) name = parts.slice(1).join(' ')
  }
  return { icao: code, name }
}

function renderPlanRoute() {
  if (!viewer || planRouteCoords.length < 2) return
  const routeCoords = planRouteCoords
  clearPlanRoute()
  const ents = []
  const pos = routeCoords.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1], PLAN_ROUTE_ALT))
  const s = routeCoords[0], e = routeCoords[routeCoords.length - 1]

  // Main route polyline
  ents.push(viewer.entities.add({
    polyline: {
      positions: pos, width: 3,
      material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.2, color: Cesium.Color.fromCssColorString('rgba(68,196,238,0.95)') }),
      clampToGround: false
    }
  }))

  // Vertical dash connectors
  const dashMat = (c) => new Cesium.PolylineDashMaterialProperty({ color: c, dashLength: 16 })
  ents.push(viewer.entities.add({ polyline: { positions: Cesium.Cartesian3.fromDegreesArrayHeights([s[0],s[1],GROUND_ALT,s[0],s[1],PLAN_ROUTE_ALT]), width: 1.5, material: dashMat(Cesium.Color.fromCssColorString('rgba(34,197,94,0.65)')) } }))
  ents.push(viewer.entities.add({ polyline: { positions: Cesium.Cartesian3.fromDegreesArrayHeights([e[0],e[1],GROUND_ALT,e[0],e[1],PLAN_ROUTE_ALT]), width: 1.5, material: dashMat(Cesium.Color.fromCssColorString('rgba(239,68,68,0.65)')) } }))

  // Start marker
  const dep = endpointDisplay('dep')
  ents.push(viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(s[0], s[1], PLAN_ROUTE_ALT),
    point: { pixelSize: 14, color: Cesium.Color.fromCssColorString('#22c55e'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
    label: { text: `起 ${dep.icao} ${dep.name}`.trim(), font: '12px Microsoft YaHei, sans-serif', fillColor: Cesium.Color.fromCssColorString('#86efac'), style: Cesium.LabelStyle.FILL_AND_OUTLINE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -18) }
  }))

  // End marker
  const arr = endpointDisplay('arr')
  ents.push(viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(e[0], e[1], PLAN_ROUTE_ALT),
    point: { pixelSize: 14, color: Cesium.Color.fromCssColorString('#ef4444'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
    label: { text: `终 ${arr.icao} ${arr.name}`.trim(), font: '12px Microsoft YaHei, sans-serif', fillColor: Cesium.Color.fromCssColorString('#fca5a5'), style: Cesium.LabelStyle.FILL_AND_OUTLINE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -18) }
  }))

  planRouteEntities = ents
}

function renderGis() {
  if (!viewer || !gisDataLoaded) return
  clearGis()

  const ents = { airport: [], waypoint: [], route: [], sector: [] }

  // Airports
  if (layerVisible.value.airport) {
    airportFeatures.forEach(f => {
      if (!f.geometry || f.geometry.type !== 'Point') return
      const c = f.geometry.coordinates
      const code = String(f.id || f.properties?.airportname || '').toUpperCase()
      const name = f.properties?.cname || ''
      ents.airport.push(viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c[0], c[1], 100),
        point: { pixelSize: 8, color: Cesium.Color.fromCssColorString('#ffd84d'), outlineColor: Cesium.Color.WHITE, outlineWidth: 1 },
        label: {
          text: code + (name ? ` ${name}` : ''), font: '11px Microsoft YaHei, sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#e8f0fe'), style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -12),
          show: false
        }
      }))
    })
  }

  // Waypoints
  if (layerVisible.value.waypoint) {
    fixFeatures.forEach(f => {
      if (!f.geometry || f.geometry.type !== 'Point') return
      const c = f.geometry.coordinates
      ents.waypoint.push(viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c[0], c[1], 50),
        point: { pixelSize: 4, color: Cesium.Color.fromCssColorString('#7dd3fc') }
      }))
    })
  }

  // Airways
  if (layerVisible.value.route) {
    airwayFeatures.forEach(f => {
      if (!f.geometry) return
      let sets = []
      if (f.geometry.type === 'LineString') sets = [f.geometry.coordinates]
      else if (f.geometry.type === 'MultiLineString') sets = f.geometry.coordinates
      else return
      sets.forEach(coords => {
        const pts = coords.filter(c => c.length >= 2)
        if (pts.length >= 2) {
          ents.route.push(viewer.entities.add({
            polyline: {
              positions: pts.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1], BASE_ALT)),
              width: 1.5, material: Cesium.Color.fromCssColorString('rgba(244,114,182,0.65)'),
              clampToGround: false
            }
          }))
        }
      })
    })
  }

  // Sectors
  if (layerVisible.value.sector) {
    sectorFeatures.forEach(f => {
      if (!f.geometry || f.geometry.type !== 'Polygon') return
      const ring = f.geometry.coordinates[0]
      if (!ring || ring.length < 2) return
      const pos = ring.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1], GROUND_ALT))
      ents.sector.push(viewer.entities.add({
        polygon: {
          hierarchy: pos, material: Cesium.Color.fromCssColorString('rgba(240,192,96,0.08)'),
          outline: true, outlineColor: Cesium.Color.fromCssColorString('rgba(240,192,96,0.75)'),
          outlineWidth: 1, perPositionHeight: true
        }
      }))
    })
  }

  layerEntities = ents
  updateLabels()
}

function clearGis() {
  Object.values(layerEntities).forEach(list => list.forEach(e => viewer.entities.remove(e)))
  layerEntities = { airport: [], waypoint: [], route: [], sector: [] }
}

function updateLabels() {
  if (!viewer) return
  const alt = viewer.camera.positionCartographic.height
  const show = alt < LABEL_SHOW_ALT
  if (show !== airportLabelsVisible) {
    airportLabelsVisible = show
    layerEntities.airport.forEach(e => { if (e.label) e.label.show = show })
  }
}

function onCameraChange() { updateLabels() }

watch(() => layerVisible.value, () => {
  if (!gisDataLoaded) loadGis(); else renderGis()
}, { deep: true })

onMounted(async () => {
  viewer = new Cesium.Viewer(cesiumContainer.value, {
    animation: false, timeline: false, baseLayerPicker: false,
    fullscreenButton: false, vrButton: false, homeButton: false,
    infoBox: false, sceneModePicker: false, selectionIndicator: false,
    navigationHelpButton: false, geocoder: false,
    creditContainer: document.createElement('div')
  })
  // 移除默认底图图层，添加本地纹理
  viewer.imageryLayers.removeAll()
  try {
    const provider = await Cesium.SingleTileImageryProvider.fromUrl('/textures/earth-blue-marble.jpg')
    viewer.imageryLayers.addImageryProvider(provider)
  } catch (e) {
    console.error('[GlobeViewer] 加载纹理失败:', e)
  }
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#000')
  viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(104.0, 36.02, 12000000) })
  viewer.camera.changed.addEventListener(onCameraChange)
  loadGis()
})

onUnmounted(() => {
  if (viewer) { viewer.camera.changed.removeEventListener(onCameraChange); viewer.destroy(); viewer = null }
})
</script>

<style scoped>
.globe-area { flex: 1; min-height: 0; position: relative; }
.cesium-container { width: 100%; height: 100%; position: relative; overflow: hidden; background: #000; }
</style>
