// 简易本地存储封装（房间、规则）

const KEYS = {
  rooms: 'rooms',
  rules: 'rules',
  selectedRule: 'selected_rule'
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

function createRoom(name, owner) {
  const rooms = listRooms()
  const room = { id: uuid(), name, createdAt: Date.now(), ownerUid: owner?.uid || '', players: [], ruleId: null, rounds: [] }
  if (owner) {
    room.players.push({ uid: owner.uid, name: owner.nickName || '未命名', avatar: owner.avatarUrl || '' })
  }
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

function addPlayerToRoom(id, player) {
  const room = getRoom(id)
  if (!room) return null
  if (!room.players) room.players = []
  const exists = room.players.some(p => p.uid === player.uid)
  if (!exists) {
    room.players.push({ uid: player.uid, name: player.nickName || player.name || '未命名', avatar: player.avatarUrl || player.avatar || '' })
    saveRoom(room)
  }
  return room
}

// Rules
function listRules() { return get(KEYS.rules) }
function createRule(rule) { const rules = listRules(); rules.unshift(rule); set(KEYS.rules, rules); return rule }
function setSelectedRule(id) { set(KEYS.selectedRule, id) }
function getSelectedRule() { try { return wx.getStorageSync(KEYS.selectedRule) || null } catch (e) { return null } }

module.exports = { KEYS, listRooms, createRoom, getRoom, saveRoom, addPlayerToRoom, listRules, createRule, setSelectedRule, getSelectedRule }

// 清空所有本地存储（开发测试用）
function clearAll() {
  try { wx.clearStorageSync() } catch (e) {}
}

module.exports.clearAll = clearAll
