import { DashData, FilterState } from './types'
import { PROVINCE_LABELS, CITY_LABELS, GEO_COORDS, CITY_TO_PROVINCE, TOPICS_LIST, TOPIC_COLORS, FOUR_C_LIST, FOUR_C_COLORS } from './constants'

const mY = (f: FilterState, y: string | number) => f.years.has(Number(y))
const mG = (f: FilterState, g: string) => f.geo === 'all' || g === f.geo
const mP = (f: FilterState, p: string | number) => f.pt === 'all' || Number(p) === Number(f.pt)

export function aggMonthly(d: DashData, f: FilterState) {
  const m: Record<string, number> = {}
  d.monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mG(f, r.geo) || !mP(f, r.pt)) return
    m[r.ym] = (m[r.ym] || 0) + r.n
  })
  const x = Object.keys(m).sort()
  return { x, y: x.map(k => m[k]) }
}

export function aggYearly(d: DashData, f: FilterState) {
  const m: Record<string, number> = {}
  d.monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mG(f, r.geo) || !mP(f, r.pt)) return
    const yr = r.ym.slice(0, 4)
    m[yr] = (m[yr] || 0) + r.n
  })
  const x = Object.keys(m).sort()
  return { x, y: x.map(k => m[k]) }
}

// Returns province totals combining the province subreddit + all its city subreddits
export function aggProvinceGrouped(d: DashData, f: FilterState): [string, number][] {
  const n: Record<string, number> = {}
  d.geo_stats.forEach(r => {
    if (!mY(f, r.yr) || !mP(f, r.pt)) return
    if (PROVINCE_LABELS.has(r.geo)) {
      n[r.geo] = (n[r.geo] || 0) + r.n
    } else if (CITY_TO_PROVINCE[r.geo]) {
      const prov = CITY_TO_PROVINCE[r.geo]
      n[prov] = (n[prov] || 0) + r.n
    }
  })
  return Object.entries(n).sort((a, b) => b[1] - a[1])
}

export function aggGeoBar(d: DashData, f: FilterState, geoType: string, metric: 'count' | 'score'): [string, number][] {
  const sum: Record<string, number> = {}
  const cnt: Record<string, number> = {}
  const n: Record<string, number> = {}
  d.geo_stats.forEach(r => {
    if (r.gt !== geoType || !mY(f, r.yr) || !mP(f, r.pt)) return
    n[r.geo] = (n[r.geo] || 0) + r.n
    sum[r.geo] = (sum[r.geo] || 0) + r.sc_sum
    cnt[r.geo] = (cnt[r.geo] || 0) + r.sc_n
  })
  if (metric === 'count') return Object.entries(n).sort((a, b) => b[1] - a[1])
  return Object.keys(sum)
    .map(g => [g, cnt[g] ? sum[g] / cnt[g] : 0] as [string, number])
    .filter(([, v]) => isFinite(v) && v !== 0)
    .sort((a, b) => b[1] - a[1])
}

export function aggGeoTrends(d: DashData, f: FilterState) {
  const EXCL = new Set(['Unknown', 'Canada (General)', 'r/AskCanada'])
  const gc: Record<string, number> = {}
  d.monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mP(f, r.pt) || EXCL.has(r.geo)) return
    gc[r.geo] = (gc[r.geo] || 0) + r.n
  })
  let top6 = Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0])
  if (f.geo !== 'all' && !EXCL.has(f.geo))
    top6 = [f.geo, ...top6.filter(g => g !== f.geo)].slice(0, 6)
  const allMs = [...new Set(d.monthly.map(r => r.ym))].sort()
  const ser: Record<string, Record<string, number>> = {}
  top6.forEach(g => (ser[g] = {}))
  d.monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mP(f, r.pt) || !ser[r.geo]) return
    ser[r.geo][r.ym] = (ser[r.geo][r.ym] || 0) + r.n
  })
  const palette = ['#2A9D8F','#E76F51','#E9C46A','#52C5B6','#8ECAE6','#264653']
  return top6.map((g, i) => ({
    name: g, x: allMs,
    y: allMs.map(m => ser[g]?.[m] || 0),
    col: palette[i % 6],
    w: f.geo !== 'all' && g === f.geo ? 3 : 1.8,
  }))
}

export function aggHist(bins: Record<string, number[]>, filterFn: (key: string) => boolean, len: number) {
  const y = new Array(len).fill(0)
  Object.entries(bins).forEach(([k, arr]) => {
    if (!filterFn(k)) return
    arr.forEach((v, i) => (y[i] += v))
  })
  return y
}

export function qFromHist(x: number[], y: number[]): [number, number, number, number, number] {
  const total = y.reduce((a, b) => a + b, 0)
  if (!total) return [0, 0, 0, 0, 0]
  let cum = 0
  let q1 = x[0], med = x[0], q3 = x[0]
  let q1Set = false, medSet = false, q3Set = false
  for (let i = 0; i < y.length; i++) {
    cum += y[i]
    if (!q1Set  && cum / total >= 0.25) { q1  = x[i]; q1Set  = true }
    if (!medSet && cum / total >= 0.5)  { med = x[i]; medSet = true }
    if (!q3Set  && cum / total >= 0.75) { q3  = x[i]; q3Set  = true }
  }
  const iqr = q3 - q1
  return [Math.max(x[0], q1 - 1.5 * iqr), q1, med, q3, Math.min(x[x.length - 1], q3 + 1.5 * iqr)]
}

export function aggSentMonthly(d: DashData, f: FilterState) {
  const m: Record<string, { pos: number; neu: number; neg: number; mix: number }> = {}
  d.sentiment_monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mG(f, r.geo) || !mP(f, r.pt)) return
    if (!m[r.ym]) m[r.ym] = { pos: 0, neu: 0, neg: 0, mix: 0 }
    m[r.ym].pos += r.pos; m[r.ym].neu += r.neu; m[r.ym].neg += r.neg; m[r.ym].mix += (r.mix ?? 0)
  })
  const x = Object.keys(m).sort()
  return { x, pos: x.map(k => m[k].pos), neu: x.map(k => m[k].neu), neg: x.map(k => m[k].neg), mix: x.map(k => m[k].mix) }
}

export function aggSentGeo(d: DashData, f: FilterState, geoType: string) {
  const m: Record<string, { pos: number; neu: number; neg: number; mix: number }> = {}
  d.sentiment_geo.forEach(r => {
    if (r.gt !== geoType || !mY(f, r.yr) || !mP(f, r.pt)) return
    if (!m[r.geo]) m[r.geo] = { pos: 0, neu: 0, neg: 0, mix: 0 }
    m[r.geo].pos += r.pos; m[r.geo].neu += r.neu; m[r.geo].neg += r.neg; m[r.geo].mix += (r.mix ?? 0)
  })
  return Object.entries(m)
    .map(([g, v]) => [g, v, v.pos + v.neu + v.neg + v.mix] as [string, typeof v, number])
    .sort((a, b) => b[2] - a[2])
}

/* Province sentiment combining province-tagged + city-tagged posts under each province */
export function aggSentGeoProvince(d: DashData, f: FilterState) {
  // pre-build: which cities belong to each province (from the mapping)
  const citiesOf: Record<string, string[]> = {}
  Object.entries(CITY_TO_PROVINCE).forEach(([city, prov]) => {
    if (!citiesOf[prov]) citiesOf[prov] = []
    citiesOf[prov].push(city)
  })

  const m: Record<string, { pos: number; neu: number; neg: number; mix: number }> = {}

  d.sentiment_geo.forEach(r => {
    if (!mY(f, r.yr) || !mP(f, r.pt)) return
    if (r.gt === 'province') {
      if (!m[r.geo]) m[r.geo] = { pos: 0, neu: 0, neg: 0, mix: 0 }
      m[r.geo].pos += r.pos; m[r.geo].neu += r.neu; m[r.geo].neg += r.neg; m[r.geo].mix += (r.mix ?? 0)
    } else if (r.gt === 'city') {
      const prov = CITY_TO_PROVINCE[r.geo]
      if (!prov) return
      if (!m[prov]) m[prov] = { pos: 0, neu: 0, neg: 0, mix: 0 }
      m[prov].pos += r.pos; m[prov].neu += r.neu; m[prov].neg += r.neg; m[prov].mix += (r.mix ?? 0)
    }
  })

  return Object.entries(m)
    .map(([g, v]) => {
      const n     = v.pos + v.neu + v.neg + v.mix
      const cities = citiesOf[g] ?? []
      const label  = cities.length > 0
        ? `${g} (+ ${cities.join(', ')})`
        : g
      return { key: g, label, ...v, n }
    })
    .sort((a, b) => b.n - a.n)
    .slice(0, 10)
}

export function aggSentOverall(d: DashData, f: FilterState) {
  let pos = 0, neu = 0, neg = 0, mix = 0, sc = 0, n = 0
  d.sentiment_monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mG(f, r.geo) || !mP(f, r.pt)) return
    pos += r.pos; neu += r.neu; neg += r.neg; mix += (r.mix ?? 0)
    const total = r.pos + r.neu + r.neg + (r.mix ?? 0)
    sc += r.avg_c * total
    n  += total
  })
  return { pos, neu, neg, mix, avg: n ? sc / n : 0 }
}

export function aggTopicDist(d: DashData, f: FilterState) {
  const m: Record<string, number> = {}
  d.topics_monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mP(f, r.pt)) return
    m[r.topic] = (m[r.topic] || 0) + r.n
  })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

export function aggTopicMonthly(d: DashData, f: FilterState) {
  const ms = [...new Set(d.topics_monthly.map(r => r.ym))].sort()
  const m: Record<string, Record<string, number>> = {}
  d.topics_monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mP(f, r.pt)) return
    if (!m[r.topic]) m[r.topic] = {}
    m[r.topic][r.ym] = (m[r.topic][r.ym] || 0) + r.n
  })
  const TOPICS = ['Access Barriers','Care Navigation','Provider & Team','Care Continuity','General Discussion']
  return { ms, series: TOPICS.map(t => ({ topic: t, y: ms.map(m2 => m[t]?.[m2] || 0) })) }
}

export function aggTopicGeo(d: DashData, f: FilterState, geoType: string) {
  const m: Record<string, Record<string, number>> = {}
  d.topics_geo.forEach(r => {
    if (r.gt !== geoType || !mY(f, r.yr) || !mP(f, r.pt)) return
    if (!m[r.geo]) m[r.geo] = {}
    m[r.geo][r.topic] = (m[r.geo][r.topic] || 0) + r.n
  })
  return Object.entries(m)
    .map(([g, v]) => [g, v, Object.values(v).reduce((a, b) => a + b, 0)] as [string, Record<string, number>, number])
    .sort((a, b) => b[2] - a[2])
}

export function aggKeywords(d: DashData) {
  return d.kw_sentiment.slice().sort((a, b) => b.n - a.n)
}

export function aggTopicTotals(d: DashData, f: FilterState): Record<string, number> {
  const m: Record<string, number> = {}
  d.topics_monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mP(f, r.pt)) return
    m[r.topic] = (m[r.topic] || 0) + r.n
  })
  return m
}

export function aggWords(d: DashData, f: FilterState) {
  const m: Record<string, number> = {}
  Object.entries(d.words).forEach(([key, arr]) => {
    const [yr, pt] = key.split('|')
    if (!mY(f, yr) || !mP(f, pt)) return
    arr.forEach(({ w, n }) => (m[w] = (m[w] || 0) + n))
  })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

export function aggKPIs(d: DashData, f: FilterState) {
  let total = 0, posts = 0, cmts = 0, scSum = 0, scN = 0
  d.geo_stats.forEach(r => {
    if (!mY(f, r.yr) || !mG(f, r.geo) || !mP(f, r.pt)) return
    total += r.n
    if (r.pt === 1) posts += r.n; else cmts += r.n
    scSum += r.sc_sum; scN += r.sc_n
  })
  const { x, y } = aggMonthly(d, f)
  let peakM = '—', peakN = 0
  x.forEach((m, i) => { if (y[i] > peakN) { peakN = y[i]; peakM = m } })
  const gc: Record<string, number> = {}
  d.geo_stats.forEach(r => {
    if (!mY(f, r.yr) || !mP(f, r.pt) || r.geo === 'Unknown') return
    gc[r.geo] = (gc[r.geo] || 0) + r.n
  })
  const topAll = Object.entries(gc).sort((a, b) => b[1] - a[1])
  const topLoc  = topAll[0]?.[0] || '—'
  const topProv = topAll.find(([g]) => PROVINCE_LABELS.has(g))?.[0] || '—'
  const topCity = topAll.find(([g]) => CITY_LABELS.has(g))?.[0] || '—'
  const avgSc   = scN > 0 ? (scSum / scN).toFixed(1) : '—'
  const sent    = aggSentOverall(d, f)
  const sentLbl = sent.avg >= 0.05 ? 'Mostly Positive' : sent.avg <= -0.05 ? 'Mostly Negative' : 'Mostly Neutral'
  return { total, posts, cmts, peakM, peakN, topLoc, topProv, topCity, avgSc, sent, sentLbl }
}

// ── 4C Framework aggregations ────────────────────────────────────────────────

export function aggFourCDist(d: DashData, f: FilterState): [string, number][] {
  const m: Record<string, number> = {}
  d.fourC_geo.forEach(r => {
    if (!mY(f, r.yr) || !mG(f, r.geo) || !mP(f, r.pt)) return
    m[r.label] = (m[r.label] || 0) + r.n
  })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

export function aggFourCMonthly(d: DashData, f: FilterState) {
  const m: Record<string, Record<string, number>> = {}
  d.fourC_monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mG(f, r.geo) || !mP(f, r.pt)) return
    if (!m[r.ym]) m[r.ym] = {}
    m[r.ym][r.label] = (m[r.ym][r.label] || 0) + r.n
  })
  const ms = Object.keys(m).sort()
  return {
    ms,
    series: [...FOUR_C_LIST].map(label => ({
      label,
      y: ms.map(ym => m[ym]?.[label] || 0),
    })),
  }
}

export function aggFourCGeo(d: DashData, f: FilterState, geoType: string): [string, Record<string, number>, number][] {
  const m: Record<string, Record<string, number>> = {}
  d.fourC_geo.forEach(r => {
    if (!mY(f, r.yr) || !mG(f, r.geo) || !mP(f, r.pt) || r.gt !== geoType) return
    if (!m[r.geo]) m[r.geo] = {}
    m[r.geo][r.label] = (m[r.geo][r.label] || 0) + r.n
  })
  return Object.entries(m)
    .map(([g, labels]) => [g, labels, Object.values(labels).reduce((s, n) => s + n, 0)] as [string, Record<string, number>, number])
    .sort((a, b) => b[2] - a[2])
}

export function aggFourCSentiment(d: DashData, f: FilterState) {
  const m: Record<string, { pos: number; neg: number; neu: number; mix: number; n: number }> = {}
  d.fourC_monthly.forEach(r => {
    if (!mY(f, r.ym.slice(0, 4)) || !mG(f, r.geo) || !mP(f, r.pt)) return
    if (!m[r.label]) m[r.label] = { pos: 0, neg: 0, neu: 0, mix: 0, n: 0 }
    m[r.label].pos += r.pos
    m[r.label].neg += r.neg
    m[r.label].neu += r.neu
    m[r.label].mix += r.mix
    m[r.label].n   += r.n
  })
  return Object.entries(m)
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.n - a.n)
}

export function aggFourCSankey(d: DashData, f: FilterState) {
  const raw  = aggFourCGeo(d, f, 'province').slice(0, 7)
  const geos = raw.map(([g]) => g)
  const cats = [...FOUR_C_LIST] as string[]
  const catNodeColors = [FOUR_C_COLORS['Contact / Access'], FOUR_C_COLORS['Continuity'], FOUR_C_COLORS['Coordination'], FOUR_C_COLORS['Comprehensiveness']]
  const catLinkColors = ['rgba(231,111,81,.15)', 'rgba(42,157,143,.15)', 'rgba(233,196,106,.15)', 'rgba(82,197,182,.15)']
  const labels     = [...geos, ...cats]
  const nodeColors = [...geos.map(() => 'rgba(142,202,230,.85)'), ...catNodeColors]
  const sources: number[] = [], targets: number[] = [], values: number[] = [], linkColors: string[] = []
  raw.forEach(([, catMap], i) => {
    cats.forEach((cat, ci) => {
      const val = catMap[cat] || 0
      if (val > 0) { sources.push(i); targets.push(geos.length + ci); values.push(val); linkColors.push(catLinkColors[ci]) }
    })
  })
  return { labels, nodeColors, sources, targets, values, linkColors }
}

export function aggSentSankey(d: DashData, f: FilterState) {
  const raw = aggSentGeo(d, f, 'province').slice(0, 7)
  const geos = raw.map(([g]) => g)
  const labels = [...geos, 'Negative', 'Mixed', 'Neutral', 'Positive']
  const nodeColors = [
    ...geos.map(() => 'rgba(142,202,230,.85)'),
    'rgba(231,111,81,.9)', 'rgba(233,196,106,.9)', 'rgba(82,197,182,.9)', 'rgba(42,157,143,.9)',
  ]
  const sources: number[] = [], targets: number[] = [], values: number[] = [], linkColors: string[] = []
  raw.forEach(([, v], i) => {
    const pairs: [number, number, string][] = [
      [v.neg, geos.length,     'rgba(231,111,81,.15)'],
      [v.mix, geos.length + 1, 'rgba(233,196,106,.15)'],
      [v.neu, geos.length + 2, 'rgba(82,197,182,.15)'],
      [v.pos, geos.length + 3, 'rgba(42,157,143,.15)'],
    ]
    pairs.forEach(([val, ti, col]) => {
      if (val > 0) { sources.push(i); targets.push(ti); values.push(val); linkColors.push(col) }
    })
  })
  return { labels, nodeColors, sources, targets, values, linkColors }
}

export function aggTopicSunburst(d: DashData, f: FilterState) {
  const topicTotals: Record<string, number> = {}
  const topicGeos: Record<string, Record<string, number>> = {}
  TOPICS_LIST.forEach(t => { topicTotals[t] = 0; topicGeos[t] = {} })
  d.topics_geo.forEach(r => {
    if (!mY(f, r.yr) || !mP(f, r.pt) || r.gt !== 'province') return
    topicTotals[r.topic] = (topicTotals[r.topic] || 0) + r.n
    topicGeos[r.topic][r.geo] = (topicGeos[r.topic][r.geo] || 0) + r.n
  })
  const ids: string[] = ['root'], labels: string[] = ['Topics'], parents: string[] = ['']
  const values: number[] = [TOPICS_LIST.reduce((s, t) => s + topicTotals[t], 0)]
  const colors: string[] = ['rgba(255,255,255,0)']
  TOPICS_LIST.forEach(t => {
    ids.push(t); labels.push(t); parents.push('root')
    values.push(topicTotals[t]); colors.push(TOPIC_COLORS[t] || '#2A9D8F')
    Object.entries(topicGeos[t]).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([g, n]) => {
      ids.push(`${t}|${g}`); labels.push(g); parents.push(t)
      values.push(n); colors.push((TOPIC_COLORS[t] || '#2A9D8F') + 'AA')
    })
  })
  return { ids, labels, parents, values, colors }
}

export function aggProvinceRadar(d: DashData, f: FilterState) {
  const provCount = aggGeoBar(d, f, 'province', 'count').slice(0, 6)
  const scoreMap  = new Map(aggGeoBar(d, f, 'province', 'score'))
  const sentArr   = aggSentGeo(d, f, 'province')
  const sentMap   = new Map(sentArr.map(([g, v, t]) => [g, { ...v, t }] as [string, typeof v & { t: number }]))
  const maxCount  = provCount[0]?.[1] || 1
  const maxScore  = Math.max(...provCount.map(([g]) => scoreMap.get(g) || 0), 0.01)
  const palette   = ['#2A9D8F', '#E76F51', '#E9C46A', '#52C5B6', '#8ECAE6', '#264653']
  return provCount.map(([g, n], i) => {
    const sv = sentMap.get(g) || { pos: 0, neu: 0, neg: 0, mix: 0, t: 1 }
    const total = sv.t || 1
    return {
      name: g, color: palette[i % 6],
      values: [
        +(n / maxCount * 100).toFixed(1),
        +((scoreMap.get(g) || 0) / maxScore * 100).toFixed(1),
        +(sv.pos / total * 100).toFixed(1),
        +((sv.neu + sv.mix) / total * 100).toFixed(1),
        +(sv.neg / total * 100).toFixed(1),
      ],
    }
  })
}

export function aggMap(d: DashData, f: FilterState) {
  const cnt: Record<string, number> = {}
  const scS: Record<string, number> = {}
  const scN: Record<string, number> = {}
  d.geo_stats.forEach(r => {
    if (!mY(f, r.yr) || !mP(f, r.pt) || !GEO_COORDS[r.geo]) return
    cnt[r.geo] = (cnt[r.geo] || 0) + r.n
    scS[r.geo] = (scS[r.geo] || 0) + r.sc_sum
    scN[r.geo] = (scN[r.geo] || 0) + r.sc_n
  })

  // Roll each city's posts into its parent province so province bubbles always
  // reflect the full provincial conversation (province sub + all city subs combined)
  const provCnt: Record<string, number> = { ...cnt }
  Object.entries(cnt).forEach(([geo, n]) => {
    if (!PROVINCE_LABELS.has(geo)) {
      const prov = CITY_TO_PROVINCE[geo]
      if (prov) provCnt[prov] = (provCnt[prov] || 0) + n
    }
  })

  const maxN    = Math.max(...Object.values(provCnt), 1)
  const sizeref = 2.0 * maxN / (48 ** 2)
  const prov = { lat: [] as number[], lon: [] as number[], text: [] as string[], n: [] as number[] }
  const city = { lat: [] as number[], lon: [] as number[], text: [] as string[], n: [] as number[] }
  Object.entries(cnt).forEach(([geo, n]) => {
    const coords = GEO_COORDS[geo]; if (!coords) return
    const [lat, lon] = coords
    const sc  = scN[geo] ? (scS[geo] / scN[geo]).toFixed(1) : '—'
    if (PROVINCE_LABELS.has(geo)) {
      const total = provCnt[geo]
      const txt = `<b>${geo}</b><br>${total.toLocaleString()} records<br>Avg Score: ${sc}`
      prov.lat.push(lat); prov.lon.push(lon); prov.text.push(txt); prov.n.push(total)
    } else {
      const txt = `<b>${geo}</b><br>${n.toLocaleString()} records<br>Avg Score: ${sc}`
      city.lat.push(lat); city.lon.push(lon); city.text.push(txt); city.n.push(n)
    }
  })
  return { prov, city, sizeref }
}
