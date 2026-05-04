#!/usr/bin/env node
/**
 * Map Editor CLI — Edit Maki tilemaps directly without the browser editor
 * Usage: node edit-map.js <mapName> [command] [args...]
 * 
 * Commands:
 *   info              Show map info
 *   fill-tile <id>    Fill entire map with a tile ID
 *   paint <x> <y> <id>  Paint a single tile at position
 *   paint-rect <x0> <y0> <x1> <y1> <id>  Paint a rectangular area
 */

const fs = require('fs')
const path = require('path')

const mapName = process.argv[2] || 'default_map'
const command = process.argv[3] || 'info'
const args = process.argv.slice(4)

const mapPath = path.join(__dirname, 'assets', 'maps', `${mapName}.json`)

// ─ Load map ──────────────────────────────────────────────────────────
function loadMap() {
  if (!fs.existsSync(mapPath)) {
    console.error(`❌ Map not found: ${mapPath}`)
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(mapPath, 'utf8'))
}

function saveMap(map) {
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2))
  console.log(`✅ Saved: ${mapPath}`)
}

// ─ Commands ──────────────────────────────────────────────────────────
function cmdInfo(map) {
  console.log(`\n📋 Map: ${map.name}`)
  console.log(`   Size: ${map.mapWidth}×${map.mapHeight} tiles`)
  console.log(`   Tile size: ${map.tileSize}px`)
  console.log(`   Tileset: ${map.tileset}`)
  console.log(`   Furniture objects: ${map.layers.furniture.length}`)
  console.log(`   Collision areas: ${map.collisions.length}`)
  const nonZero = map.layers.floor.flat().filter(t => t !== 0).length
  console.log(`   Painted tiles: ${nonZero}/${map.mapWidth * map.mapHeight}\n`)
}

function cmdFillTile(map) {
  const tileId = parseInt(args[0])
  if (isNaN(tileId)) {
    console.error('❌ Usage: node edit-map.js <mapName> fill-tile <tileId>')
    process.exit(1)
  }
  map.layers.floor = Array.from({ length: map.mapHeight }, () =>
    new Array(map.mapWidth).fill(tileId)
  )
  saveMap(map)
  console.log(`✅ Filled entire map with tile ${tileId}`)
}

function cmdPaint(map) {
  const x = parseInt(args[0])
  const y = parseInt(args[1])
  const tileId = parseInt(args[2])
  if (isNaN(x) || isNaN(y) || isNaN(tileId)) {
    console.error('❌ Usage: node edit-map.js <mapName> paint <x> <y> <tileId>')
    process.exit(1)
  }
  if (y < 0 || y >= map.mapHeight || x < 0 || x >= map.mapWidth) {
    console.error(`❌ Coordinates out of bounds (0-${map.mapWidth-1}, 0-${map.mapHeight-1})`)
    process.exit(1)
  }
  map.layers.floor[y][x] = tileId
  saveMap(map)
  console.log(`✅ Painted tile ${tileId} at (${x}, ${y})`)
}

function cmdPaintRect(map) {
  const x0 = parseInt(args[0])
  const y0 = parseInt(args[1])
  const x1 = parseInt(args[2])
  const y1 = parseInt(args[3])
  const tileId = parseInt(args[4])
  if (isNaN(x0) || isNaN(y0) || isNaN(x1) || isNaN(y1) || isNaN(tileId)) {
    console.error('❌ Usage: node edit-map.js <mapName> paint-rect <x0> <y0> <x1> <y1> <tileId>')
    process.exit(1)
  }
  const minX = Math.max(0, Math.min(x0, x1))
  const maxX = Math.min(map.mapWidth - 1, Math.max(x0, x1))
  const minY = Math.max(0, Math.min(y0, y1))
  const maxY = Math.min(map.mapHeight - 1, Math.max(y0, y1))
  let count = 0
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      map.layers.floor[y][x] = tileId
      count++
    }
  }
  saveMap(map)
  console.log(`✅ Painted ${count} tiles (rect from (${minX},${minY}) to (${maxX},${maxY}))`)
}

function cmdClear(map) {
  map.layers.floor = Array.from({ length: map.mapHeight }, () =>
    new Array(map.mapWidth).fill(0)
  )
  map.layers.furniture = []
  map.collisions = []
  saveMap(map)
  console.log('✅ Map cleared')
}

// ─ Main ──────────────────────────────────────────────────────────────
const map = loadMap()

switch (command.toLowerCase()) {
  case 'info':
    cmdInfo(map)
    break
  case 'fill-tile':
  case 'fill':
    cmdFillTile(map)
    break
  case 'paint':
    cmdPaint(map)
    break
  case 'paint-rect':
  case 'rect':
    cmdPaintRect(map)
    break
  case 'clear':
    cmdClear(map)
    break
  case 'help':
  case '-h':
  case '--help':
    console.log(`
Map Editor CLI
Usage: node edit-map.js <mapName> [command] [args...]

Commands:
  info                           Show map info
  fill-tile <tileId>             Fill entire map with a tile
  paint <x> <y> <tileId>         Paint a single tile
  paint-rect <x0> <y0> <x1> <y1> <tileId>  Paint a rectangle
  clear                          Clear all tiles/objects/collisions
  help                           Show this help

Examples:
  node edit-map.js default_map info
  node edit-map.js default_map fill-tile 76
  node edit-map.js default_map paint 10 10 85
  node edit-map.js default_map paint-rect 0 0 49 49 18
    `)
    break
  default:
    console.error(`❌ Unknown command: ${command}`)
    console.error('Run: node edit-map.js help')
    process.exit(1)
}
