import { cpSync, existsSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules/cesium/Build/Cesium')
const dest = join(root, 'public/cesium')

if (!existsSync(src)) {
  console.error('[copy-cesium] 未找到 node_modules/cesium，请先 npm install')
  console.error('[copy-cesium] 内网环境也可手动将 Cesium Build/Cesium 目录复制到 public/cesium')
  process.exit(1)
}

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
cpSync(src, dest, { recursive: true })
console.log('[copy-cesium] 已复制到 public/cesium')
