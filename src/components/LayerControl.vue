<template>
  <aside class="layer-control-panel" v-show="panelVisible">
    <div class="layer-control-title">图层控制</div>
    <div class="layer-loading-hint" v-if="loading">图元数据加载中...</div>
    <label class="layer-control-item" v-for="item in layers" :key="item.key">
      <input type="checkbox" :checked="item.visible" @change="toggleLayer(item.key)" />
      <span class="layer-dot" :class="item.dotClass"></span>
      <span>{{ item.label }}</span>
    </label>
  </aside>
</template>

<script setup>
import { ref, inject } from 'vue'

const layerVisible = inject('layerVisible')
const loading = ref(false)
const panelVisible = ref(false)

const layers = [
  { key: 'airport', label: '机场', dotClass: 'layer-dot-airport', visible: true },
  { key: 'waypoint', label: '航路点', dotClass: 'layer-dot-waypoint', visible: true },
  { key: 'route', label: '底图航路', dotClass: 'layer-dot-route', visible: false },
  { key: 'sector', label: '扇区', dotClass: 'layer-dot-sector', visible: false }
]

function toggleLayer(key) {
  if (layerVisible) {
    layerVisible.value[key] = !layerVisible.value[key]
  }
}

function togglePanel() {
  panelVisible.value = !panelVisible.value
}

defineExpose({ togglePanel, panelVisible })
</script>

<style scoped>
.layer-control-panel {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  width: 168px;
  padding: 12px;
  background: rgba(10, 20, 40, 0.92);
  border: 1px solid rgba(80, 150, 220, 0.35);
  border-radius: 8px;
  backdrop-filter: blur(8px);
}

.layer-control-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.layer-loading-hint {
  font-size: 11px;
  color: rgba(56, 189, 248, 0.85);
  margin-bottom: 8px;
}

.layer-control-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  margin-bottom: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.layer-control-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.layer-control-item input[type="checkbox"] {
  accent-color: #3a8ada;
  cursor: pointer;
}

.layer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.layer-dot-airport { background: #ffd84d; }
.layer-dot-waypoint { background: #7dd3fc; }
.layer-dot-route {
  background: #f472b6;
  border-radius: 2px;
  height: 3px;
  width: 14px;
  margin-top: 0;
}
.layer-dot-sector {
  background: transparent;
  border: 2px solid #f0c060;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
</style>
