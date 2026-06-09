# ntfm-rms-vue - 全球航路图

基于 **Vue 3 + Cesium** 的 3D 全球航路图系统，移植自原有 `globalMap` (globe.gl) 项目。

## 功能

- 🌍 **3D 地球** — Cesium 渲染，OpenStreetMap 影像
- ✈️ **计划航路** — 解析并渲染航路（ZBAA→ZSPD 示例）
- 🟡 **机场图层** — 黄色圆点，缩放时自动显示文字标签
- 🔵 **航路点图层** — 青色圆点
- 🔴 **底图航路** — 粉色折线
- 🟠 **扇区图层** — 半透明多边形轮廓
- 🎮 **图层控制面板** — 可折叠，切换各图层显隐
- 📊 **航路信息栏** — 航班号、起降机场、航路字符串、高度

## 技术栈

- **Vue 3** — `<script setup>` + Composition API
- **Cesium** — 3D 地理空间引擎（`Entity` API）
- **Vite 5** — 构建工具
- **vite-plugin-cesium** — Cesium 资源管理

## 快速开始

```bash
npm install --include=dev
npm run dev
```

浏览器打开 `http://localhost:5173`

## 构建

```bash
npm run build
npm run preview
```

## 结构

```
src/
├── App.vue                 # 根组件
├── components/
│   ├── RouteInfoBar.vue    # 顶部航路信息栏
│   ├── GlobeViewer.vue     # Cesium 3D 地球核心
│   └── LayerControl.vue    # 图层控制面板
└── utils/
    └── airwaySearch.js     # 航路解析（原版移植）
```

## 数据

GIS 数据位于 `public/gisData/lowAltitude/`，包含机场、航路点、航路、扇区四个 GeoJSON 图层。
