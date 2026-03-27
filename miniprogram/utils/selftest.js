// 自测脚本：在开发阶段自动生成示例数据并跑通核心流程
const store = require('./storage')
const user = require('./user')
const ai = require('./ai')

function log(msg){ try{ console.log('[AutoTest]', msg) }catch(_){} }

async function runAutoTest(){
  log('start')
  // 1) 准备用户（如未登录则写入一个本地测试用户）
  let me = user.getCurrentUser()
  if (!me) {
    me = { uid: 'u-autotest', nickName: '测试用户', avatarUrl: '' }
    user.setCurrentUser(me)
    log('set mock user')
  }
  // 2) 创建房间并加入第二个玩家
  const room = store.createRoom('测试房间', me)
  store.addPlayerToRoom(room.id, { uid: 'u-guest', nickName: '玩家B', avatarUrl: '' })
  log('room created: ' + room.id)
  // 3) 手动记分一局
  const r = store.getRoom(room.id)
  r.rounds = r.rounds || []
  r.rounds.unshift({ id: Date.now()+Math.random(), ts: Date.now(), score: 12, desc: '手动', userUid: me.uid })
  store.saveRoom(r)
  log('manual round added')
  // 4) AI 记分一局（使用不存在路径触发模拟评分回退）
  try {
    const score = await ai.scoreMahjongImage('/tmp/nonexistent', r.ruleId)
    const r2 = store.getRoom(room.id)
    r2.rounds.unshift({ id: Date.now()+Math.random(), ts: Date.now(), score, desc: 'AI', userUid: me.uid })
    store.saveRoom(r2)
    log('ai round added: ' + score)
  } catch (e) {
    log('ai round failed: ' + (e && e.message))
  }
  log('done')
}

module.exports = { runAutoTest }

