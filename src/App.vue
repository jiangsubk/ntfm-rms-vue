<template>
  <div class="page">
    <RouteInfoBar
      :flightNo="routeInfo.flightNo"
      :dep="routeInfo.dep"
      :arr="routeInfo.arr"
      :routePath="routeInfo.routeDisplay"
      :altitude="routeInfo.altitude"
      :etd="routeInfo.etd"
    />
    <GlobeViewer>
      <template #layer-control>
        <button type="button" class="layer-toggle" :class="{ active: panelOpen }"
          @click="togglePanel" title="图层控制">图层</button>
        <LayerControl ref="layerCtrl" />
      </template>
    </GlobeViewer>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import RouteInfoBar from './components/RouteInfoBar.vue'
import GlobeViewer from './components/GlobeViewer.vue'
import LayerControl from './components/LayerControl.vue'

const routeInfo = ref({
  flightNo: 'CCA1234', dep: 'ZBAA 北京首都', arr: 'ZSPD 上海浦东',
  routeDisplay: 'ZBAA EPGAM A593 LAMEN ZSPD',
  altitude: 'FL360', etd: '08:30 (UTC+8)'
})
provide('routeInfo', routeInfo)
const layerCtrl = ref(null)
const panelOpen = ref(false)

function togglePanel() {
  if (layerCtrl.value) {
    layerCtrl.value.togglePanel()
    panelOpen.value = layerCtrl.value.panelVisible
  }
}
</script>

<style scoped>
.page { height: 100%; display: flex; flex-direction: column; }

.layer-toggle {
  position: absolute; top: 16px; left: 16px; z-index: 10;
  padding: 6px 12px; font-size: 12px; color: rgba(255,255,255,0.85);
  background: rgba(10,20,40,0.88); border: 1px solid rgba(80,150,220,0.35);
  border-radius: 4px; cursor: pointer; transition: background 0.2s, border-color 0.2s;
  font-family: inherit;
}
.layer-toggle:hover, .layer-toggle.active {
  background: rgba(58,138,218,0.28); border-color: rgba(80,150,220,0.65); color: #fff;
}
</style>
