/**
 * 计划航路坐标解析（移植自原 globalMap 项目）
 * airwaysObj 格式：{ "A593": [{ pName: "EPGAM", coordinate: [lng, lat] }, ...] }
 */

function isAirwayName(name) {
  return /^[A-Z]\d+$/.test(name)
}

function getAirwaySegmentCoordinates(startPoint, endPoint, airwayName, airwaysObj) {
  const coordinates = []
  const points = airwaysObj[airwayName]
  if (!points || !Array.isArray(points)) {
    console.warn('[airwaySearch] 未找到计划航路数据:', airwayName)
    return coordinates
  }

  let startIndex = -1
  let endIndex = -1

  for (let j = 0; j < points.length; j++) {
    let pName = points[j].pName
    if (pName && pName.indexOf('/') !== -1) {
      pName = pName.split('/')[0]
    }
    if (pName === startPoint) startIndex = j
    if (pName === endPoint) endIndex = j
  }

  if (startIndex !== -1 && endIndex !== -1) {
    if (startIndex > endIndex) {
      for (let m = startIndex; m >= endIndex; m--) {
        if (points[m] && points[m].coordinate) {
          coordinates.push(points[m].coordinate)
        }
      }
    } else {
      for (let n = startIndex; n <= endIndex; n++) {
        if (points[n] && points[n].coordinate) {
          coordinates.push(points[n].coordinate)
        }
      }
    }
  }

  return coordinates
}

function getDirectRouteCoordinates(startPoint, endPoint, airwaysObj) {
  const coordinates = []

  for (const airwayName in airwaysObj) {
    if (!Object.prototype.hasOwnProperty.call(airwaysObj, airwayName)) continue
    const points = airwaysObj[airwayName]
    if (!Array.isArray(points)) continue

    let startIndex = -1
    let endIndex = -1

    for (let j = 0; j < points.length; j++) {
      let pName = points[j].pName
      if (pName && pName.indexOf('/') !== -1) {
        pName = pName.split('/')[0]
      }
      if (pName === startPoint) startIndex = j
      if (pName === endPoint) endIndex = j
    }

    if (startIndex !== -1 && endIndex !== -1) {
      if (startIndex > endIndex) {
        for (let m = startIndex; m >= endIndex; m--) {
          if (points[m] && points[m].coordinate) {
            coordinates.push(points[m].coordinate)
          }
        }
      } else {
        for (let n = startIndex; n <= endIndex; n++) {
          if (points[n] && points[n].coordinate) {
            coordinates.push(points[n].coordinate)
          }
        }
      }
      break
    }
  }

  return coordinates
}

function removeDuplicateCoordinates(coordinates) {
  if (coordinates.length <= 1) return coordinates
  const result = [coordinates[0]]
  for (let i = 1; i < coordinates.length; i++) {
    const current = coordinates[i]
    const previous = coordinates[i - 1]
    if (current[0] !== previous[0] || current[1] !== previous[1]) {
      result.push(current)
    }
  }
  return result
}

/**
 * 复合航路处理，如 "EPGAM A593 LAMEN"
 */
export function getCompositeAirwayCoordinates(compositeRoute, airwaysObj) {
  const coordinates = []
  const routeText = (compositeRoute && compositeRoute.route) ? compositeRoute.route : ''
  const routeParts = routeText.trim().split(/\s+/).map(part => {
    const slashIdx = part.indexOf('/')
    return slashIdx !== -1 ? part.slice(0, slashIdx) : part
  })

  if (routeParts.length < 2) {
    console.warn('[airwaySearch] 复合航路格式不正确:', routeText)
    return coordinates
  }

  for (let i = 0; i < routeParts.length - 1; i++) {
    const currentPoint = routeParts[i]
    const nextPoint = routeParts[i + 1]

    if (isAirwayName(nextPoint)) {
      const startPoint = currentPoint
      const airwayName = nextPoint
      const endPoint = routeParts[i + 2]
      if (endPoint && !isAirwayName(endPoint)) {
        coordinates.push(...getAirwaySegmentCoordinates(startPoint, endPoint, airwayName, airwaysObj))
        i++
      }
    } else {
      coordinates.push(...getDirectRouteCoordinates(currentPoint, nextPoint, airwaysObj))
    }
  }

  return removeDuplicateCoordinates(coordinates)
}
