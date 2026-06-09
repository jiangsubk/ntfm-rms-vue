<template>
  <section class="route-info-bar">
    <div class="route-info-title">计划航路信息</div>
    <div class="route-info-content">
      <div class="route-info-item">
        <span class="route-info-label">航班号</span>
        <span class="route-info-value">{{ flightNo }}</span>
      </div>
      <div class="route-info-item">
        <span class="route-info-label">起飞机场</span>
        <span class="route-info-value">{{ dep }}</span>
      </div>
      <div class="route-info-item">
        <span class="route-info-label">目的地</span>
        <span class="route-info-value">{{ arr }}</span>
      </div>
      <div class="route-info-item route-info-item-wide">
        <span class="route-info-label">计划航路</span>
        <span class="route-info-value">{{ routePath }}</span>
      </div>
      <div class="route-info-item">
        <span class="route-info-label">巡航高度</span>
        <span class="route-info-value">{{ altitude }}</span>
      </div>
      <div class="route-info-item">
        <span class="route-info-label">计划起飞</span>
        <span class="route-info-value">{{ etd }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  flightNo: { type: String, default: '--' },
  dep: { type: String, default: '--' },
  arr: { type: String, default: '--' },
  routePath: { type: String, default: '--' },
  altitude: { type: String, default: '--' },
  etd: { type: String, default: '--' }
})
</script>

<style scoped>
.route-info-bar {
  flex-shrink: 0;
  padding: 12px 16px;
  background: rgba(15, 40, 70, 0.85);
  border-bottom: 1px solid rgba(80, 150, 220, 0.25);
}

.route-info-title {
  font-size: 14px;
  color: #8ab4d4;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #3a8ada;
}

.route-info-content {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
}

.route-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
}

.route-info-item-wide {
  flex: 1;
  min-width: 280px;
}

.route-info-label {
  font-size: 12px;
  color: #7a9ab8;
  white-space: nowrap;
}

.route-info-value {
  font-size: 13px;
  color: #c8d8e8;
  font-variant-numeric: tabular-nums;
}
</style>
