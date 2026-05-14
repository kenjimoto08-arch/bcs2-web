import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ── 상수

// ── 주차별 미션
const WEEKLY_MISSIONS = [
  { week: 1, title: '🏃 한강 마포런 러닝 미션', date: '5/16(토)~5/17(일)', desc: '오전 10시 · 한강 마포 구간', color: '#2979FF' },
  { week: 2, title: '💪 스쿼트 & 푸쉬 챌린지', date: '5/23(토) 오후 2~4시', desc: '남: 스쿼트100 푸쉬업100 러닝2.5km / 여: 스쿼트80 푸쉬업80 러닝2km', color: '#E8524A' },
  { week: 3, title: '🔥 데드리프트 챌린지', date: '5/30(토) 오후 2~4시', desc: '남: 데드리프트100 러닝2.5km / 여: 데드리프트80 러닝2km', color: '#FF6D00' },
  { week: 4, title: '🦾 지옥의 복근 챌린지', date: '6/6(토) 오후 2~4시', desc: '복근 서킷 미션 · 제한 시간 내 미션 수행', color: '#AA00FF' },
  { week: 5, title: '🏅 10K 러닝 챌린지', date: '6/13(토)', desc: '장거리 러닝 · 상세 코스 추후 공지', color: '#00C853' },
  { week: 6, title: '🎉 깜짝 이벤트', date: '6주차', desc: '마지막 주 특별 미션 · 추가 점수 및 특별 보상 예정', color: '#FFD700' },
]

const DEFAULT_CHALLENGES = [
  { id: 'squat',    name: '스쿼트',    icon: '🏋️', unit: '회', clear: 80,  tip: '남 100개 / 여 80개' },
  { id: 'pushup',   name: '푸쉬업',    icon: '💪',  unit: '회', clear: 80,  tip: '남 100개 / 여 80개' },
  { id: 'deadlift', name: '데드리프트', icon: '🔥',  unit: '회', clear: 80,  tip: '남 100개 / 여 80개' },
  { id: 'running',  name: '러닝',       icon: '🏃',  unit: 'km', clear: 2,   tip: '남 2.5km / 여 2km' },
]
const TOTAL_WEEKS = 6
const DAYS = ['월','화','수','목','금','토','일']
const MEMBER_COLORS = ['#111','#E8524A','#2979FF','#00C853','#FF6D00','#AA00FF','#00B8D4','#FF1744','#6D4C41','#546E7A']
const ICONS = ['⏱','🏋️','🚶','💪','🔥','🧘','🚴','🏊','🤸','🥊','⚽','🏃','🎯','🧗','🏌️']
const UNITS = ['초','회','분','km','세트','개']

const PT = { fontFamily: "'Noto Sans KR', sans-serif" }
const BN = { fontFamily: "'Bebas Neue', sans-serif" }
const BH = { fontFamily: "'Black Han Sans', sans-serif" }

// ── 점수 계산
function calcWeekPts(visits, challenges) {
  const visitCount = visits.size
  const attendPt = visitCount >= 5 ? 2 : visitCount >= 3 ? 1 : 0
  let clearPt = 0
  challenges.forEach(ch => { if (ch.cleared) clearPt += 0.5 })
  return { attendPt, clearPt, total: attendPt + clearPt, visitCount }
}
function calcTotal(weekData) {
  return weekData.reduce((acc, w) => acc + (w ? (w.attendPt||0)+(w.clearPt||0) : 0), 0)
}
function getCurrentWeek(startDate) {
  const diff = Math.floor((new Date() - new Date(startDate)) / (7*24*60*60*1000))
  return Math.max(0, Math.min(diff, TOTAL_WEEKS - 1))
}

// ══════════════════════════════════════════
//  ⚙️ 종목 설정
// ══════════════════════════════════════════
function ChallengeSettings({ challenges, onSave, saving }) {
  const [editing, setEditing] = useState(challenges.map(ch => ({ ...ch })))
  const [saved, setSaved] = useState(false)

  useEffect(() => { setEditing(challenges.map(ch => ({ ...ch }))) }, [challenges])

  const update = (idx, field, val) => setEditing(p => p.map((ch, i) => i === idx ? { ...ch, [field]: val } : ch))
  const addChallenge = () => {
    if (editing.length >= 5) return
    setEditing(p => [...p, { id: `ch_${Date.now()}`, name: '새 종목', icon: '🎯', unit: '회', clear: 10, tip: '10회 이상' }])
  }
  const removeChallenge = (idx) => { if (editing.length > 1) setEditing(p => p.filter((_, i) => i !== idx)) }

  const handleSave = async () => {
    const valid = editing.filter(ch => ch.name.trim())
    await onSave(valid)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div style={{ background: '#111', borderRadius: 12, padding: '18px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 28 }}>⚙️</span>
        <div>
          <div style={{ ...BH, fontSize: 15, color: '#fff', marginBottom: 4 }}>챌린지 종목 설정</div>
          <div style={{ ...PT, fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>종목명, 아이콘, 단위, 클리어 기준을 자유롭게 수정하세요.<br />저장 시 모든 참가자에게 즉시 반영됩니다.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {editing.map((ch, idx) => (
          <div key={ch.id} style={{ background: '#fff', border: '2px solid #e8e8e8', borderLeft: '6px solid #111', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ ...BH, fontSize: 14, color: '#555' }}>종목 {idx + 1}</div>
              <button onClick={() => removeChallenge(idx)} disabled={editing.length <= 1}
                style={{ background: '#fff', border: '2px solid #e0e0e0', color: editing.length <= 1 ? '#ccc' : '#E8524A', padding: '5px 12px', borderRadius: 8, cursor: editing.length <= 1 ? 'default' : 'pointer', ...BH, fontSize: 12 }}>삭제</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ ...PT, fontSize: 12, color: '#888', marginBottom: 5 }}>종목명</div>
                <input value={ch.name} onChange={e => update(idx, 'name', e.target.value)}
                  style={{ width: '100%', background: '#f5f5f5', border: '2px solid #e0e0e0', color: '#111', padding: '10px 14px', ...PT, fontSize: 15, borderRadius: 8 }} />
              </div>
              <div>
                <div style={{ ...PT, fontSize: 12, color: '#888', marginBottom: 5 }}>아이콘</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => update(idx, 'icon', icon)}
                      style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${ch.icon === icon ? '#111' : '#e0e0e0'}`, background: ch.icon === icon ? '#111' : '#fff', fontSize: 18, cursor: 'pointer' }}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ ...PT, fontSize: 12, color: '#888', marginBottom: 5 }}>클리어 기준 (+0.5P)</div>
                <input type="number" min="1" value={ch.clear} onChange={e => update(idx, 'clear', parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', background: '#f5f5f5', border: '2px solid #e0e0e0', color: '#111', padding: '10px 14px', ...PT, fontSize: 15, fontWeight: 700, borderRadius: 8, textAlign: 'center' }} />
              </div>
              <div>
                <div style={{ ...PT, fontSize: 12, color: '#888', marginBottom: 5 }}>단위</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {UNITS.map(u => (
                    <button key={u} onClick={() => update(idx, 'unit', u)}
                      style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${ch.unit === u ? '#111' : '#e0e0e0'}`, background: ch.unit === u ? '#111' : '#fff', color: ch.unit === u ? '#fff' : '#666', ...BH, fontSize: 13, cursor: 'pointer' }}>{u}</button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ ...PT, fontSize: 12, color: '#888', marginBottom: 5 }}>설명 문구</div>
                <input value={ch.tip} onChange={e => update(idx, 'tip', e.target.value)}
                  style={{ width: '100%', background: '#f5f5f5', border: '2px solid #e0e0e0', color: '#111', padding: '10px 14px', ...PT, fontSize: 14, borderRadius: 8 }} />
              </div>
            </div>
            <div style={{ marginTop: 14, background: '#f8f8f8', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{ch.icon}</span>
              <span style={{ ...BH, fontSize: 14, color: '#111' }}>{ch.name}</span>
              <span style={{ ...PT, fontSize: 12, color: '#888', marginLeft: 4 }}>{ch.clear}{ch.unit} 이상 → +0.5P</span>
            </div>
          </div>
        ))}
      </div>

      {editing.length < 5 && (
        <button onClick={addChallenge}
          style={{ width: '100%', padding: 14, background: '#fff', border: '2px dashed #ccc', color: '#888', borderRadius: 12, ...BH, fontSize: 14, cursor: 'pointer', marginBottom: 20 }}>
          + 종목 추가 ({editing.length}/5)
        </button>
      )}
      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', background: saved ? '#00C853' : '#111', color: '#fff', border: 'none', padding: '14px 0', borderRadius: 10, ...BH, fontSize: 16, cursor: 'pointer', transition: 'background 0.3s' }}>
        {saving ? '저장 중...' : saved ? '✓ 저장 완료!' : '저장하기 (전체 공유됨)'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════
//  출석+챌린지 입력
// ══════════════════════════════════════════
function SelfRecord({ member, weekData, onUpdate, weekIdx, challenges, saving }) {
  const wd = weekData[weekIdx] || { visits: [], clears: {} }
  const visitSet = new Set(wd.visits || [])
  const clears = wd.clears || {}

  const toggleDay = (di) => {
    const next = new Set(visitSet)
    next.has(di) ? next.delete(di) : next.add(di)
    onUpdate(weekIdx, { ...wd, visits: [...next] })
  }
  const setClear = (cid, val) => onUpdate(weekIdx, { ...wd, clears: { ...clears, [cid]: val } })

  const enriched = challenges.map(ch => ({ ...ch, value: clears[ch.id] ?? '', cleared: parseFloat(clears[ch.id] || 0) >= ch.clear }))
  const { attendPt, clearPt, total, visitCount } = calcWeekPts(visitSet, enriched)
  const attendLabel = visitCount >= 5 ? '🔥 5회 달성 +2P' : visitCount >= 3 ? '✅ 3회 달성 +1P' : `${visitCount}회 방문 (3회↑ = +1P)`

  return (
    <div style={{ background: '#f8f8f8', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: 20 }}>
      <div style={{ ...BH, fontSize: 13, color: '#555', letterSpacing: 2, marginBottom: 12 }}>출석 체크 — 카톡 인증샷 올린 날</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {DAYS.map((d, di) => {
          const on = visitSet.has(di)
          return (
            <button key={di} onClick={() => toggleDay(di)} style={{
              flex: 1, padding: '14px 0', borderRadius: 8,
              background: on ? '#111' : '#fff', border: `2px solid ${on ? '#111' : '#ddd'}`,
              color: on ? '#fff' : '#aaa', ...BH, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
            }}>{d}</button>
          )
        })}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ ...PT, fontSize: 15, color: '#111', fontWeight: 700 }}>{attendLabel}</span>
          <span style={{ ...BN, fontSize: 22, color: '#111' }}>+{attendPt}P</span>
        </div>
        <div style={{ height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(visitCount/7)*100}%`, background: '#111', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ ...PT, fontSize: 12, color: '#bbb' }}>0</span>
          <span style={{ ...PT, fontSize: 12, color: visitCount >= 3 ? '#111' : '#bbb' }}>3회 +1P</span>
          <span style={{ ...PT, fontSize: 12, color: visitCount >= 5 ? '#111' : '#bbb' }}>5회 +2P</span>
        </div>
      </div>

      <div style={{ ...BH, fontSize: 13, color: '#555', letterSpacing: 2, marginBottom: 12 }}>챌린지 기록 — 클리어시 +0.5P</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {enriched.map(ch => (
          <div key={ch.id} style={{ flex: 1, minWidth: 90, background: ch.cleared ? '#111' : '#fff', border: `2px solid ${ch.cleared ? '#111' : '#ddd'}`, borderRadius: 10, padding: '14px 12px', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{ch.icon}</span>
              {ch.cleared && <span style={{ ...BH, fontSize: 12, color: '#fff' }}>+0.5P ✓</span>}
            </div>
            <div style={{ ...BH, fontSize: 13, color: ch.cleared ? '#fff' : '#333', marginBottom: 8 }}>{ch.name}</div>
            <input type="number" min="0" placeholder={`${ch.clear}${ch.unit}↑`}
              value={ch.value} onChange={e => setClear(ch.id, e.target.value)}
              style={{ width: '100%', background: ch.cleared ? 'rgba(255,255,255,0.15)' : '#f5f5f5', border: `1.5px solid ${ch.cleared ? 'rgba(255,255,255,0.3)' : '#ddd'}`, color: ch.cleared ? '#fff' : '#111', padding: '8px 8px', ...PT, fontSize: 14, fontWeight: 700, borderRadius: 6, textAlign: 'center' }} />
            <div style={{ ...PT, fontSize: 11, color: ch.cleared ? 'rgba(255,255,255,0.6)' : '#aaa', marginTop: 5, textAlign: 'center' }}>{ch.tip}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#111', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ ...BH, fontSize: 13, color: '#aaa', marginBottom: 6 }}>{weekIdx + 1}주차 소계 {saving && <span style={{ fontSize: 11 }}>저장중...</span>}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ ...PT, fontSize: 14, color: '#fff' }}>출석 <strong>{attendPt}P</strong></span>
            <span style={{ ...PT, fontSize: 14, color: '#fff' }}>클리어 <strong>+{clearPt.toFixed(1)}P</strong></span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ ...BN, fontSize: 48, color: '#fff', lineHeight: 1 }}>{total.toFixed(1)}</div>
          <div style={{ ...PT, fontSize: 12, color: '#aaa' }}>이번 주 점수</div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
//  참가자 카드
// ══════════════════════════════════════════
function MemberCard({ member, weekData, onUpdate, onRemove, currentWeek, challenges, saving }) {
  const [open, setOpen] = useState(false)
  const [viewWeek, setViewWeek] = useState(currentWeek)

  // 항상 8주치 배열 보장 (빈 슬롯 채우기)
  const safeWeekData = Array.from({ length: TOTAL_WEEKS }, (_, i) => weekData[i] || { visits: [], clears: {} })

  const weekSummary = safeWeekData.map(wd => {
    const vs = new Set(wd.visits || [])
    const chs = challenges.map(ch => ({ ...ch, cleared: parseFloat(wd.clears?.[ch.id] || 0) >= ch.clear }))
    return calcWeekPts(vs, chs)
  })
  const totalPts = calcTotal(weekSummary)
  const curWd = safeWeekData[currentWeek] || {}
  const curVisits = new Set(curWd.visits || [])
  const curChs = challenges.map(ch => ({ ...ch, cleared: parseFloat(curWd.clears?.[ch.id] || 0) >= ch.clear }))
  const { visitCount } = calcWeekPts(curVisits, curChs)

  return (
    <div style={{ background: '#fff', border: '2px solid #e8e8e8', borderRadius: 14, marginBottom: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', cursor: 'pointer', gap: 14, borderLeft: `6px solid ${member.color}` }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', ...BN, fontSize: 22, color: '#fff', flexShrink: 0 }}>
          {member.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...BH, fontSize: 18, color: '#111' }}>{member.name}</span>
            <span style={{ ...BH, fontSize: 13, color: '#bbb' }}>{member.division === 'male' ? '♂' : '♀'}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ ...PT, fontSize: 14, color: '#555' }}>이번 주 <strong style={{ color: '#111' }}>{visitCount}회</strong></span>
            <span style={{ ...PT, fontSize: 14, color: '#555' }}>누적 <strong style={{ color: '#111' }}>{totalPts.toFixed(1)}P</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
          {weekSummary.map((ws, wi) => (
            <div key={wi} title={`${wi+1}주: ${ws.total.toFixed(1)}P`} style={{ width: 10, height: Math.max(6, ws.total * 10), borderRadius: 3, background: ws.total > 0 ? '#111' : '#e8e8e8', transition: 'height 0.3s' }} />
          ))}
        </div>
        <div style={{ background: '#111', borderRadius: 10, padding: '8px 16px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ ...BN, fontSize: 28, color: '#fff', lineHeight: 1 }}>{totalPts.toFixed(1)}</div>
          <div style={{ ...PT, fontSize: 11, color: '#aaa' }}>총점</div>
        </div>
        <span style={{ color: '#ccc', fontSize: 16, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
        <button onClick={e => { e.stopPropagation(); onRemove(member.id) }}
          style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18, padding: '0 0 0 4px', flexShrink: 0 }}>✕</button>
      </div>

      {open && (
        <div style={{ borderTop: '2px solid #f0f0f0', padding: 20 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {Array.from({ length: TOTAL_WEEKS }, (_, wi) => {
              const ws = weekSummary[wi]
              const isActive = viewWeek === wi
              const isCurrent = wi === currentWeek
              return (
                <button key={wi} onClick={() => setViewWeek(wi)} style={{
                  padding: '8px 14px', borderRadius: 8,
                  background: isActive ? '#111' : '#fff',
                  border: `2px solid ${isActive ? '#111' : isCurrent ? '#111' : '#e0e0e0'}`,
                  color: isActive ? '#fff' : isCurrent ? '#111' : '#999',
                  ...BH, fontSize: 13, cursor: 'pointer',
                }}>
                  {wi + 1}주
                  {ws.total > 0 && <span style={{ ...PT, fontSize: 11, marginLeft: 4, fontWeight: 400 }}>{ws.total.toFixed(1)}</span>}
                </button>
              )
            })}
          </div>
          <SelfRecord member={member} weekData={safeWeekData} weekIdx={viewWeek} onUpdate={onUpdate} challenges={challenges} saving={saving} />
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
//  순위표
// ══════════════════════════════════════════
function LiveRank({ members, allWeekData, currentWeek, challenges }) {
  const [selWeek, setSelWeek] = useState('all')

  const getStats = (m) => {
    const wd = Array.from({ length: TOTAL_WEEKS }, (_, i) => (allWeekData[m.id] || [])[i] || { visits: [], clears: {} })
    if (selWeek === 'all') {
      const weeks = wd.map(w => {
        if (!w) return null
        const vs = new Set(w.visits || [])
        const chs = challenges.map(ch => ({ ...ch, cleared: parseFloat(w.clears?.[ch.id] || 0) >= ch.clear }))
        return calcWeekPts(vs, chs)
      })
      return { pts: calcTotal(weeks), visits: wd.reduce((a, w) => a + (new Set(w?.visits||[]).size), 0) }
    } else {
      const w = wd[selWeek]
      if (!w) return { pts: 0, visits: 0 }
      const vs = new Set(w.visits || [])
      const chs = challenges.map(ch => ({ ...ch, cleared: parseFloat(w.clears?.[ch.id] || 0) >= ch.clear }))
      const { total, visitCount } = calcWeekPts(vs, chs)
      return { pts: total, visits: visitCount }
    }
  }

  const scored = [...members].map(m => ({ ...m, ...getStats(m) })).sort((a, b) => b.pts - a.pts || b.visits - a.visits)
  const medal = i => ['🥇','🥈','🥉'][i] ?? `${i+1}위`

  const renderDiv = (div) => {
    const divMs = scored.filter(m => m.division === div)
    if (!divMs.length) return null
    return (
      <div key={div} style={{ marginBottom: 28 }}>
        <div style={{ ...BH, fontSize: 16, color: '#111', letterSpacing: 2, marginBottom: 12 }}>{div === 'male' ? '♂ 남자부' : '♀ 여자부'}</div>
        <div style={{ background: '#fff', border: '2px solid #e8e8e8', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 20px', background: '#f5f5f5', borderBottom: '2px solid #e8e8e8', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[['🔥 주 5회↑','+2P'],['✅ 주 3~4회','+1P'],['💪 미션 클리어','+0.5P']].map(([l,p]) => (
              <span key={l} style={{ ...PT, fontSize: 14, color: '#555' }}>{l} <strong style={{ color: '#111' }}>{p}</strong></span>
            ))}
          </div>
          {divMs.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', borderBottom: '1.5px solid #f0f0f0', background: i===0?'#fffde7':i===1?'#f9f9f9':'#fff', borderLeft: `6px solid ${m.color}`, gap: 14 }}>
              <span style={{ fontSize: 28, width: 36, flexShrink: 0 }}>{medal(i)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...BH, fontSize: 18, color: '#111' }}>{m.name}</div>
                <div style={{ ...PT, fontSize: 13, color: '#888', marginTop: 2 }}>{selWeek === 'all' ? `총 ${m.visits}회 방문` : `${m.visits}회 방문`}</div>
              </div>
              <div style={{ ...BN, fontSize: 42, color: '#111', lineHeight: 1, flexShrink: 0 }}>
                {m.pts.toFixed(1)}<span style={{ fontSize: 20, color: '#999' }}>P</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button onClick={() => setSelWeek('all')} style={{ padding: '10px 18px', background: selWeek==='all'?'#111':'#fff', border:`2px solid ${selWeek==='all'?'#111':'#ddd'}`, color: selWeek==='all'?'#fff':'#666', ...BH, fontSize: 14, cursor: 'pointer', borderRadius: 8 }}>전체 누적</button>
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
          <button key={i} onClick={() => setSelWeek(i)} style={{ padding: '10px 16px', background: selWeek===i?'#111':'#fff', border:`2px solid ${selWeek===i?'#111':i===currentWeek?'#555':'#ddd'}`, color: selWeek===i?'#fff':i===currentWeek?'#111':'#888', ...BH, fontSize: 14, cursor: 'pointer', borderRadius: 8 }}>
            {i+1}주{i===currentWeek?' 🔴':''}
          </button>
        ))}
      </div>
      {renderDiv('male')}
      {renderDiv('female')}
      {members.length === 0 && <div style={{ ...PT, fontSize: 16, color: '#bbb', textAlign: 'center', padding: '80px 0' }}>기록 입력 탭에서 참가자를 추가하세요</div>}
    </div>
  )
}

// ══════════════════════════════════════════
//  🔐 운영자 비밀번호 모달
// ══════════════════════════════════════════
const ADMIN_PASSWORD = '1004'

function AdminLoginModal({ onSuccess, onClose }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      onSuccess()
    } else {
      setError(true)
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', width: 320, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ ...BH, fontSize: 20, color: '#111', marginBottom: 8 }}>🔐 운영자 로그인</div>
        <div style={{ ...PT, fontSize: 13, color: '#888', marginBottom: 24 }}>기록 입력은 운영자만 가능해요</div>
        <input
          type="password"
          placeholder="비밀번호 입력"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', background: '#f5f5f5', border: `2px solid ${error ? '#E8524A' : '#e0e0e0'}`, color: '#111', padding: '12px 14px', ...PT, fontSize: 15, borderRadius: 8, marginBottom: 8, outline: 'none' }}
          autoFocus
        />
        {error && <div style={{ ...PT, fontSize: 12, color: '#E8524A', marginBottom: 8 }}>비밀번호가 틀렸어요!</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#f5f5f5', border: '2px solid #e0e0e0', color: '#888', padding: '11px 0', ...BH, fontSize: 13, cursor: 'pointer', borderRadius: 8 }}>취소</button>
          <button onClick={handleLogin} style={{ flex: 2, background: '#111', border: 'none', color: '#fff', padding: '11px 0', ...BH, fontSize: 13, cursor: 'pointer', borderRadius: 8 }}>확인</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
//  메인 앱
// ══════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState('rank')
  const [division, setDivision] = useState('all')
  const [members, setMembers] = useState([])
  const [allWeekData, setAllWeekData] = useState({})
  const [challenges, setChallenges] = useState(DEFAULT_CHALLENGES)
  const [newName, setNewName] = useState('')
  const [newDiv, setNewDiv] = useState('male')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeInput, setNoticeInput] = useState('')
  const [showNoticeEdit, setShowNoticeEdit] = useState(false)

  const [startDate] = useState('2026-05-15')
  const currentWeek = getCurrentWeek(startDate)

  // ── 초기 데이터 로드
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // 참가자
        const { data: mData } = await supabase.from('members').select('*').order('created_at')
        if (mData) setMembers(mData)

        // 주간 기록
        const { data: rData } = await supabase.from('week_records').select('*')
        if (rData) {
          const map = {}
          rData.forEach(r => {
            if (!map[r.member_id]) map[r.member_id] = Array.from({ length: TOTAL_WEEKS }, () => ({ visits: [], clears: {} }))
            map[r.member_id][r.week_idx] = { visits: r.visits || [], clears: r.clears || {} }
          })
          setAllWeekData(map)
        }

        // 종목 설정 + 공지사항
        const { data: sData } = await supabase.from('settings').select('challenges,notice').eq('id', 1).single()
        if (sData?.challenges) setChallenges(sData.challenges)
        if (sData?.notice !== undefined) setNotice(sData.notice || '')
      } catch (e) { console.error('load error', e) }
      setLoading(false)
    }
    load()
  }, [])

  // ── 실시간 구독
  useEffect(() => {
    const memberSub = supabase.channel('members-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        supabase.from('members').select('*').order('created_at').then(({ data }) => { if (data) setMembers(data) })
      }).subscribe()

    const recordSub = supabase.channel('records-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'week_records' }, payload => {
        const r = payload.new
        if (!r) return
        setAllWeekData(prev => {
          const next = { ...prev }
          if (!next[r.member_id]) next[r.member_id] = Array.from({ length: TOTAL_WEEKS }, () => ({ visits: [], clears: {} }))
          const arr = [...(next[r.member_id] || [])]
          arr[r.week_idx] = { visits: r.visits || [], clears: r.clears || {} }
          next[r.member_id] = arr
          return next
        })
      }).subscribe()

    const settingsSub = supabase.channel('settings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, payload => {
        if (payload.new?.challenges) setChallenges(payload.new.challenges)
        if (payload.new?.notice !== undefined) setNotice(payload.new.notice || '')
      }).subscribe()

    return () => { memberSub.unsubscribe(); recordSub.unsubscribe(); settingsSub.unsubscribe() }
  }, [])

  // ── 참가자 추가
  const addMember = async () => {
    if (!newName.trim()) return
    const used = members.map(m => m.color)
    const color = MEMBER_COLORS.find(c => !used.includes(c)) || MEMBER_COLORS[members.length % MEMBER_COLORS.length]
    const nm = { id: Date.now().toString(), name: newName.trim(), division: newDiv, color }
    setNewName('')
    // 로컬 상태 즉시 반영
    setMembers(prev => [...prev, nm])
    setAllWeekData(prev => ({ ...prev, [nm.id]: Array.from({ length: TOTAL_WEEKS }, () => ({ visits: [], clears: {} })) }))
    // DB에도 저장
    await supabase.from('members').insert(nm)
  }

  // ── 참가자 삭제
  const removeMember = async (id) => {
    // 로컬 상태 즉시 반영 (화면 바로 업데이트)
    setMembers(prev => prev.filter(m => m.id !== id))
    setAllWeekData(prev => { const n = { ...prev }; delete n[id]; return n })
    // DB에서도 삭제
    await supabase.from('members').delete().eq('id', id)
  }

  // ── 주간 기록 업데이트 (debounce 없이 즉시 저장)
  const updateWeekData = useCallback(async (memberId, weekIdx, data) => {
    // 로컬 상태 즉시 반영
    setAllWeekData(prev => {
      const next = { ...prev }
      const arr = [...(next[memberId] || Array.from({ length: TOTAL_WEEKS }, () => ({ visits: [], clears: {} })))]
      arr[weekIdx] = data
      next[memberId] = arr
      return next
    })
    setSaving(true)
    await supabase.from('week_records').upsert({
      member_id: memberId,
      week_idx: weekIdx,
      visits: data.visits || [],
      clears: data.clears || {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'member_id,week_idx' })
    setSaving(false)
  }, [])

  // ── 종목 설정 저장
  const saveChallenges = async (newChallenges) => {
    setSaving(true)
    setChallenges(newChallenges)
    await supabase.from('settings').upsert({ id: 1, challenges: newChallenges, updated_at: new Date().toISOString() })
    setSaving(false)
  }

  // ── 공지사항 저장
  const saveNotice = async () => {
    setNotice(noticeInput)
    setShowNoticeEdit(false)
    await supabase.from('settings').upsert({ id: 1, challenges, notice: noticeInput, updated_at: new Date().toISOString() })
  }

  const filtered = members.filter(m => division === 'all' || m.division === division)

  const topOverall = [...members].map(m => {
    const wd = allWeekData[m.id] || []
    const pts = calcTotal(wd.map(w => {
      if (!w) return null
      const vs = new Set(w.visits || [])
      const chs = challenges.map(ch => ({ ...ch, cleared: parseFloat(w.clears?.[ch.id] || 0) >= ch.clear }))
      return calcWeekPts(vs, chs)
    }))
    return { ...m, pts }
  }).sort((a, b) => b.pts - a.pts).slice(0, 3)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
      <div style={{ ...BH, fontSize: 20, color: '#fff', letterSpacing: 3 }}>로딩중...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f2', color: '#111' }}>
      {/* 헤더 */}
      <div style={{ background: '#111', padding: '32px 24px 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...BH, fontSize: 12, letterSpacing: 5, color: '#888', marginBottom: 6 }}>🔥 로얄짐 바디챌린지</div>
              <h1 style={{ ...BN, fontSize: 'clamp(48px,7vw,80px)', margin: 0, lineHeight: 0.85, letterSpacing: 3, color: '#fff' }}>
                ROYAL GYM<br /><span style={{ color: '#E8524A' }}>CHALLENGE</span>
              </h1>
            </div>
            <div style={{ background: '#222', border: '1px solid #333', borderRadius: 12, padding: '14px 18px', minWidth: 210 }}>
              <div style={{ ...BH, fontSize: 11, letterSpacing: 3, color: '#777', marginBottom: 10 }}>이번 주 점수 기준</div>
              {[['🔥 주 5회 이상 출석','+2P'],['✅ 주 3~4회 출석','+1P'],['💪 주차 미션 클리어','+0.5P']].map(([l,p]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, gap: 12 }}>
                  <span style={{ ...PT, fontSize: 14, color: '#ccc' }}>{l}</span>
                  <span style={{ ...BN, fontSize: 20, color: '#fff', lineHeight: 1, flexShrink: 0 }}>{p}</span>
                </div>
              ))}
            </div>
            {topOverall.length > 0 && (
              <div style={{ background: '#222', border: '1px solid #333', borderRadius: 12, padding: '14px 18px', minWidth: 180 }}>
                <div style={{ ...BH, fontSize: 11, letterSpacing: 3, color: '#777', marginBottom: 10 }}>🏆 현재 TOP 3</div>
                {topOverall.map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                    <span style={{ fontSize: 18 }}>{['🥇','🥈','🥉'][i]}</span>
                    <span style={{ ...BH, fontSize: 15, color: '#fff', flex: 1 }}>{m.name}</span>
                    <span style={{ ...BN, fontSize: 20, color: '#fff' }}>{m.pts.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
              <div style={{ ...BH, fontSize: 12, color: '#aaa', marginBottom: 6 }}>{currentWeek+1}주차 진행중 🔴 (총 6주){saving && ' · 저장중...'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {challenges.map(ch => (
                  <div key={ch.id} style={{ background: '#333', borderRadius: 8, padding: '5px 10px', ...PT, fontSize: 12, color: '#ccc' }}>{ch.icon} {ch.name}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
            {/* 순위 탭은 누구나 */}
            <button onClick={() => setTab('rank')} style={{
              background: tab==='rank'?'#fff':'transparent', border: 'none',
              color: tab==='rank'?'#111':'#888', ...BH, fontSize: 14, letterSpacing: 2,
              padding: '14px 22px', cursor: 'pointer', borderRadius: tab==='rank'?'8px 8px 0 0':'0',
            }}>🏆 순위</button>

            {/* 기록/설정 탭은 운영자만 */}
            {isAdmin ? (
              <>
                {[['challenge','💪 기록'],['settings','⚙️ 종목설정']].map(([t,l]) => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    background: tab===t?'#fff':'transparent', border: 'none',
                    color: tab===t?'#111':'#888', ...BH, fontSize: 14, letterSpacing: 2,
                    padding: '14px 22px', cursor: 'pointer', borderRadius: tab===t?'8px 8px 0 0':'0',
                  }}>{l}</button>
                ))}
                <button onClick={() => { setIsAdmin(false); setTab('rank') }} style={{
                  marginLeft: 'auto', background: 'transparent', border: '1px solid #444',
                  color: '#888', ...BH, fontSize: 11, letterSpacing: 1,
                  padding: '8px 14px', cursor: 'pointer', borderRadius: 6, marginBottom: 4,
                }}>🔓 로그아웃</button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} style={{
                marginLeft: 'auto', background: 'transparent', border: '1px solid #444',
                color: '#888', ...BH, fontSize: 11, letterSpacing: 1,
                padding: '8px 14px', cursor: 'pointer', borderRadius: 6, marginBottom: 4,
              }}>🔐 운영자</button>
            )}
          </div>
        </div>
      </div>

      {/* 공지사항 배너 */}
      {(notice || isAdmin) && (
        <div style={{ background: '#fff', borderBottom: '2px solid #e8e8e8' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>📢</span>
            <div style={{ flex: 1 }}>
              <div style={{ ...BH, fontSize: 12, color: '#888', letterSpacing: 2, marginBottom: 4 }}>운영자 공지</div>
              {showNoticeEdit && isAdmin ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    value={noticeInput}
                    onChange={e => setNoticeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveNotice()}
                    placeholder="공지사항을 입력하세요..."
                    style={{ flex: 1, minWidth: 200, background: '#f5f5f5', border: '2px solid #e0e0e0', color: '#111', padding: '8px 12px', ...PT, fontSize: 14, borderRadius: 8 }}
                    autoFocus
                  />
                  <button onClick={saveNotice} style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 18px', ...BH, fontSize: 12, cursor: 'pointer', borderRadius: 8 }}>저장</button>
                  <button onClick={() => setShowNoticeEdit(false)} style={{ background: '#f5f5f5', color: '#888', border: '2px solid #e0e0e0', padding: '8px 14px', ...BH, fontSize: 12, cursor: 'pointer', borderRadius: 8 }}>취소</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ ...PT, fontSize: 15, color: notice ? '#111' : '#bbb', flex: 1 }}>
                    {notice || '(공지사항 없음)'}
                  </span>
                  {isAdmin && (
                    <button onClick={() => { setNoticeInput(notice); setShowNoticeEdit(true) }}
                      style={{ background: 'none', border: '1px solid #ddd', color: '#888', padding: '5px 12px', ...BH, fontSize: 11, cursor: 'pointer', borderRadius: 6, flexShrink: 0 }}>
                      ✏️ 수정
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 운영자 로그인 모달 */}
      {showLoginModal && (
        <AdminLoginModal
          onSuccess={() => { setIsAdmin(true); setShowLoginModal(false); setTab('challenge') }}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* 주차별 미션 배너 */}
      <div style={{ background: '#fff', borderBottom: '2px solid #e8e8e8' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ ...BH, fontSize: 11, letterSpacing: 3, color: '#888', marginBottom: 12 }}>주차별 미션</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {WEEKLY_MISSIONS.map(m => {
              const isCurrent = m.week === currentWeek + 1
              return (
                <div key={m.week} style={{
                  flexShrink: 0, minWidth: 180,
                  background: isCurrent ? m.color : '#f5f5f5',
                  border: `2px solid ${isCurrent ? m.color : '#e8e8e8'}`,
                  borderRadius: 10, padding: '12px 14px',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ ...BH, fontSize: 10, color: isCurrent ? 'rgba(255,255,255,0.8)' : '#bbb', marginBottom: 4 }}>{m.week}주차 {isCurrent ? '🔴 진행중' : ''}</div>
                  <div style={{ ...BH, fontSize: 13, color: isCurrent ? '#fff' : '#333', marginBottom: 4 }}>{m.title}</div>
                  <div style={{ ...PT, fontSize: 11, color: isCurrent ? 'rgba(255,255,255,0.85)' : '#888', lineHeight: 1.5 }}>{m.date}</div>
                  <div style={{ ...PT, fontSize: 10, color: isCurrent ? 'rgba(255,255,255,0.7)' : '#aaa', marginTop: 4, lineHeight: 1.5 }}>{m.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 상품 안내 */}
      <div style={{ background: '#111' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 24px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...BH, fontSize: 11, letterSpacing: 3, color: '#555' }}>챌린지 상품</span>
          {[['🥇','1등','운동화'],['🥈','2등','닭가슴살 팩'],['🥉','3등','헬스장 이용권']].map(([emoji,rank,prize]) => (
            <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>{emoji}</span>
              <span style={{ ...BH, fontSize: 13, color: '#fff' }}>{rank}</span>
              <span style={{ ...PT, fontSize: 12, color: '#aaa' }}>{prize}</span>
            </div>
          ))}
          <span style={{ ...PT, fontSize: 11, color: '#444', marginLeft: 'auto' }}>5/15 ~ 6/25 · 총 6주</span>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>
        {(tab === 'rank' || tab === 'challenge') && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            {[['all','전체'],['male','♂ 남자부'],['female','♀ 여자부']].map(([v,l]) => (
              <button key={v} onClick={() => setDivision(v)} style={{ padding: '10px 18px', background: division===v?'#111':'#fff', border: `2px solid ${division===v?'#111':'#ddd'}`, color: division===v?'#fff':'#666', ...BH, fontSize: 14, letterSpacing: 1, cursor: 'pointer', borderRadius: 8 }}>{l}</button>
            ))}
            <span style={{ ...PT, fontSize: 14, color: '#888', marginLeft: 4 }}>남 {members.filter(m=>m.division==='male').length}명 · 여 {members.filter(m=>m.division==='female').length}명</span>
          </div>
        )}

        {tab === 'rank' && <LiveRank members={filtered.length ? filtered : members} allWeekData={allWeekData} currentWeek={currentWeek} challenges={challenges} />}

        {tab === 'challenge' && isAdmin && (
          <>
            <div style={{ background: '#fff', border: '2px solid #e8e8e8', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ ...BH, fontSize: 14, color: '#555', letterSpacing: 2, marginBottom: 14 }}>참가자 추가</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ ...PT, fontSize: 13, color: '#888', marginBottom: 6 }}>이름</div>
                  <input style={{ background: '#f5f5f5', border: '2px solid #e0e0e0', color: '#111', padding: '10px 16px', ...PT, fontSize: 15, borderRadius: 8, width: 150 }}
                    placeholder="참가자 이름" value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addMember()} />
                </div>
                <div>
                  <div style={{ ...PT, fontSize: 13, color: '#888', marginBottom: 6 }}>부문</div>
                  <select value={newDiv} onChange={e => setNewDiv(e.target.value)}
                    style={{ background: '#f5f5f5', border: '2px solid #e0e0e0', color: '#111', padding: '10px 14px', ...PT, fontSize: 15, borderRadius: 8, cursor: 'pointer' }}>
                    <option value="male">♂ 남자부</option>
                    <option value="female">♀ 여자부</option>
                  </select>
                </div>
                <button onClick={addMember} style={{ background: '#111', color: '#fff', border: 'none', padding: '10px 24px', ...BH, fontSize: 15, letterSpacing: 1, cursor: 'pointer', borderRadius: 8 }}>+ 추가</button>
              </div>
            </div>
            {filtered.length === 0
              ? <div style={{ ...PT, fontSize: 16, color: '#bbb', textAlign: 'center', padding: '80px 0', border: '2px dashed #e0e0e0', borderRadius: 14 }}>참가자를 추가하세요</div>
              : filtered.map(m => (
                <MemberCard key={m.id} member={m}
                  weekData={allWeekData[m.id] || []}
                  onUpdate={(wi, data) => updateWeekData(m.id, wi, data)}
                  onRemove={removeMember}
                  currentWeek={currentWeek}
                  challenges={challenges}
                  saving={saving} />
              ))
            }
          </>
        )}

        {tab === 'settings' && isAdmin && <ChallengeSettings challenges={challenges} onSave={saveChallenges} saving={saving} />}

        <div style={{ height: 60 }} />
      </div>
    </div>
  )
}
