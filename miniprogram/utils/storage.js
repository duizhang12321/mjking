// 简易本地存储封装（房间、规则）

const KEYS = {
  rooms: 'rooms',
  rules: 'rules'
}

function get(key) {
  try {
    return wx.getStorageSync(key) || []
  } catch (e) {
    return []
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (e) {}
}

function uuid() {
  return 'r-' + Math.random().toString(36).slice(2) + Date.now()
}

// Rooms
function listRooms() {
  return get(KEYS.rooms)
}

function createRoom(name) {
  const rooms = listRooms()
  const room = { id: uuid(), name, createdAt: Date.now(), players: [], ruleId: null, rounds: [] }
  rooms.unshift(room)
  set(KEYS.rooms, rooms)
  return room
}

function getRoom(id) {
  return listRooms().find(r => r.id === id)
}

function saveRoom(room) {
  const rooms = listRooms().map(r => (r.id === room.id ? room : r))
  set(KEYS.rooms, rooms)
}

// Rules
function listRules() { return get(KEYS.rules) }
function createRule(rule) { const rules = listRules(); rules.unshift(rule); set(KEYS.rules, rules); return rule }

module.exports = { KEYS, listRooms, createRoom, getRoom, saveRoom, listRules, createRule }

