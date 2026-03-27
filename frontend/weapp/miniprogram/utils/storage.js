// 数据层：优先后端 API；失败时本地回退（开发用）
const KEYS = { rooms: 'rooms', rules: 'rules', selectedRule: 'selected_rule' }
let cfg = {}
try { cfg = require('../config') } catch (e) { try { cfg = require('../config.sample') } catch (_) {} }

function request(method, path, data){
  return new Promise((resolve, reject)=>{
    if (!(cfg && cfg.baseUrl)) { reject(new Error('no_backend')); return }
    wx.request({ url: (cfg.baseUrl + path), method, header: { 'content-type': 'application/json', ...(cfg.headers || {}) }, data, success:(res)=>{ const code = res.statusCode || 200; if (code>=200 && code<300) resolve(res.data); else reject(new Error(res.data?.message || ('HTTP '+code))) }, fail:(err)=>reject(new Error(err.errMsg || 'network')) })
  })
}

function get(key){ try { return wx.getStorageSync(key) || [] } catch(e){ return [] } }
function set(key, value){ try { wx.setStorageSync(key, value) } catch(e){} }
function uuid(){ return 'r-' + Math.random().toString(36).slice(2) + Date.now() }

function listRooms(){ return request('GET', '/api/rooms').catch(()=> get(KEYS.rooms)) }
function createRoom(name, owner){ const payload = { name, ownerUid: owner?.uid || '', ownerName: owner?.nickName || '未命名', ownerAvatar: owner?.avatarUrl || '' }; return request('POST', '/api/rooms', payload).catch(()=>{ const rooms = get(KEYS.rooms); const room = { id: uuid(), name, createdAt: Date.now(), ownerUid: payload.ownerUid, players: [], ruleId: null, rounds: [] }; if(owner){ room.players.push({ uid: owner.uid, name: owner.nickName || '未命名', avatar: owner.avatarUrl || '' }) } rooms.unshift(room); set(KEYS.rooms, rooms); return room }) }
function getRoom(id){ if(!id){ return Promise.resolve(null) } return request('GET', `/api/rooms/${id}`).catch(()=> (get(KEYS.rooms).find(r=>r.id===id))) }
function saveRoom(room){ return request('PUT', `/api/rooms/${room.id}`, room).catch(()=>{ const rooms = get(KEYS.rooms).map(r=> (r.id===room.id ? room : r)); set(KEYS.rooms, rooms) }) }
function addPlayerToRoom(id, player){ const payload = { uid: player.uid, name: player.nickName || player.name || '未命名', avatar: player.avatarUrl || player.avatar || '' }; return request('POST', `/api/rooms/${id}/join`, payload).catch(()=>{ const room = get(KEYS.rooms).find(r=>r.id===id); if(!room) return null; room.players = room.players || []; const exists = room.players.some(p=>p.uid===payload.uid); if(!exists){ room.players.push(payload); const rooms = get(KEYS.rooms).map(r=> (r.id===id ? room : r)); set(KEYS.rooms, rooms) } return room }) }

function listRules(){ return request('GET', '/api/rules').catch(()=> get(KEYS.rules)) }
function createRule(rule){ return request('POST', '/api/rules', rule).catch(()=>{ const rules = get(KEYS.rules); rules.unshift(rule); set(KEYS.rules, rules); return rule }) }
function setSelectedRule(id){ set(KEYS.selectedRule, id) }
function getSelectedRule(){ try { return wx.getStorageSync(KEYS.selectedRule) || null } catch(e){ return null } }
function updateRule(rule){ return request('PUT', `/api/rules/${rule.id}`, rule).catch(()=>{ const rules = get(KEYS.rules).map(r=> (r.id===rule.id ? { ...r, ...rule } : r)); set(KEYS.rules, rules); return rule }) }
function deleteRule(id){ const rules = get(KEYS.rules); const target = rules.find(r=>r.id===id); if(target && target.preset) return; return request('DELETE', `/api/rules/${id}`).catch(()=>{ const next = rules.filter(r=> r.id!==id); set(KEYS.rules, next) }) }
function ensurePresetRules(presetList){ if (cfg && cfg.baseUrl) { return listRules() } const rules = get(KEYS.rules); if (rules.length===0 && Array.isArray(presetList) && presetList.length){ set(KEYS.rules, presetList); return presetList } return rules }

function clearAll(){ try { wx.clearStorageSync() } catch(e){} }

module.exports = { KEYS, listRooms, createRoom, getRoom, saveRoom, addPlayerToRoom, listRules, createRule, updateRule, deleteRule, setSelectedRule, getSelectedRule, ensurePresetRules, clearAll }
