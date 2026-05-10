'use client'
import { useMemo, useEffect, useState, useRef } from 'react'
import { useDash } from '@/lib/context'
import { aggMonthly, aggYearly, aggKPIs, aggSentMonthly, aggMap, aggSentOverall, aggWords, aggGeoBar } from '@/lib/aggregations'
import { C, BL } from '@/lib/constants'
import PlotlyChart from '@/components/PlotlyChart'
import ChartCard from '@/components/ChartCard'

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    prev.current = target
    let start = 0
    const id = requestAnimationFrame(function step(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(from + (target - from) * eased))
      if (p < 1) requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(id)
  }, [target, duration])
  return val
}

function KpiCard({ label, rawValue, display, sub, accent }: {
  label: string; rawValue: number; display?: string; sub: string; accent: string
}) {
  const animated = useCountUp(rawValue)
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden count-up"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.07)', transition: 'box-shadow .2s, transform .2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0,0,0,.07), 0 12px 28px rgba(0,0,0,.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.07)' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '12px 12px 0 0' }} />
      <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.11em', color: '#94A3B8', marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: '#0B1F3A', lineHeight: 1, letterSpacing: '-.03em' }}>
        {display ?? animated.toLocaleString()}
      </p>
      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 7, lineHeight: 1.4 }}>{sub}</p>
    </div>
  )
}

function FindingRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-start gap-3 py-[10px] border-b border-slate-100 last:border-0">
      <div style={{ width: 3, height: 16, borderRadius: 2, background: color, flexShrink: 0, marginTop: 1 }} />
      <div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0F172A' }}>{label} </span>
        <span style={{ fontSize: 11.5, color: '#64748B' }}>{value}</span>
      </div>
    </div>
  )
}

function WordCloud({ words }: { words: [string, number][] }) {
  const top = words.slice(0, 55)
  const maxN = top[0]?.[1] || 1
  const positions = top.map((_, i) => {
    const angle = i * 2.39996
    const r = Math.sqrt(i / Math.max(top.length, 1)) * 0.88
    return { x: r * Math.cos(angle), y: r * Math.sin(angle) * 0.58 }
  })
  const shades = ['#0B1F3A', '#1A3A5C', '#2A9D8F', '#1E7268', '#3DB8A8', '#52C5B6', '#8ECAE6', '#264653']
  const data = [{
    type: 'scatter', mode: 'text',
    x: positions.map(p => p.x),
    y: positions.map(p => p.y),
    text: top.map(([w]) => w),
    hovertext: top.map(([w, n]) => `${w}: ${n.toLocaleString()} mentions`),
    hoverinfo: 'text',
    textfont: {
      size: top.map(([, n]) => 9 + (n / maxN) * 24),
      color: top.map(([, n]) => shades[Math.floor((1 - n / maxN) * (shades.length - 1))]),
      family: 'Inter, sans-serif',
    },
  }] as never[]
  return (
    <PlotlyChart height={300} data={data} layout={{
      xaxis: { visible: false, range: [-1.05, 1.05] },
      yaxis: { visible: false, range: [-0.72, 0.72] },
      margin: { t: 8, b: 8, l: 8, r: 8 },
      showlegend: false, hovermode: 'closest',
      paper_bgcolor: 'white', plot_bgcolor: 'white',
    }} />
  )
}

export default function Overview() {
  const { data: d, filters: f, setGeo, setTab } = useDash()

  const kpis    = useMemo(() => aggKPIs(d, f),        [d, f])
  const monthly = useMemo(() => aggMonthly(d, f),     [d, f])
  const yearly  = useMemo(() => aggYearly(d, f),      [d, f])
  const sent    = useMemo(() => aggSentMonthly(d, f), [d, f])
  const map     = useMemo(() => aggMap(d, f),         [d, f])
  const overall = useMemo(() => aggSentOverall(d, f), [d, f])
  const words   = useMemo(() => aggWords(d, f),       [d, f])
  const provCnt = useMemo(() => aggGeoBar(d, f, 'province', 'count'), [d, f])

  const total = overall.pos + overall.neu + overall.neg
  const negPct = total > 0 ? Math.round((overall.neg / total) * 100) : 0
  const posPct = total > 0 ? Math.round((overall.pos / total) * 100) : 0

  const kpiCards = [
    { label: 'Total Records',  rawValue: kpis.total,  sub: `${kpis.posts.toLocaleString()} posts · ${kpis.cmts.toLocaleString()} comments`, accent: C.teal },
    { label: 'Peak Month',     rawValue: kpis.peakN,  display: kpis.peakM, sub: `${kpis.peakN.toLocaleString()} records that month`, accent: C.gold },
    { label: 'Top Location',   rawValue: 0,           display: kpis.topLoc, sub: 'by record count', accent: C.coral },
    { label: 'Avg Post Score', rawValue: Math.round((parseFloat(kpis.avgSc) || 0) * 10), display: kpis.avgSc, sub: `leading province: ${kpis.topProv}`, accent: C.tealL },
    { label: 'Avg Sentiment',  rawValue: Math.round(Math.abs(overall.avg) * 1000), display: overall.avg.toFixed(3), sub: kpis.sentLbl, accent: '#8ECAE6' },
  ]

  const handleMapClick = (event: { points?: { text?: string }[] }) => {
    const raw   = event?.points?.[0]?.text ?? ''
    const label = raw.replace(/<[^>]+>/g, '').split('\n')[0].trim()
    if (label) { setGeo(label); setTab('geographic') }
  }

  return (
    <div>
      {/* KPI row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {kpiCards.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Map */}
      <ChartCard title="Discussion Heatmap — Canada"
        subtitle="Bubble size = record count · Teal = province subreddit · Coral = city subreddit · Click any bubble to filter"
        className="mb-6">
        <PlotlyChart height={430} onClickHandler={handleMapClick} data={[
          { type: 'scattergeo', name: 'Province', lat: map.prov.lat, lon: map.prov.lon, text: map.prov.text, mode: 'markers',
            marker: { size: map.prov.n, color: C.teal, opacity: 0.7, sizemode: 'area', sizeref: map.sizeref, line: { width: 1.5, color: 'white' } },
            hovertemplate: '%{text}<extra></extra>' } as never,
          { type: 'scattergeo', name: 'City', lat: map.city.lat, lon: map.city.lon, text: map.city.text, mode: 'markers',
            marker: { size: map.city.n, color: C.coral, opacity: 0.7, sizemode: 'area', sizeref: map.sizeref, line: { width: 1.5, color: 'white' } },
            hovertemplate: '%{text}<extra></extra>' } as never,
        ]} layout={{
          paper_bgcolor: 'white', showlegend: true,
          legend: { x: 0.01, y: 0.01, bgcolor: 'rgba(255,255,255,.9)', bordercolor: '#E2E8F0', borderwidth: 1 },
          margin: { t: 8, b: 8, l: 8, r: 8 },
          geo: { scope: 'north america', showland: true, landcolor: '#EAF5FC', showocean: true, oceancolor: '#DAEEF8',
            showcountries: true, countrycolor: '#90B8C6', countrywidth: 1, showlakes: true, lakecolor: '#DAEEF8',
            showsubunits: true, subunitcolor: '#B4CDD8', subunitwidth: 0.6,
            projection: { type: 'azimuthal equal area' }, lataxis: { range: [41, 74] }, lonaxis: { range: [-142, -50] } },
        } as never} />
      </ChartCard>

      {/* Monthly + Yearly + Cumulative */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <ChartCard title="Monthly Discussion Volume" subtitle="Posts and comments combined">
          <PlotlyChart height={250} data={[{
            x: monthly.x, y: monthly.y, type: 'scatter', mode: 'lines',
            fill: 'tozeroy', fillcolor: 'rgba(42,157,143,.1)',
            line: { color: C.teal, width: 2 },
            hovertemplate: '<b>%{x}</b><br>%{y:,} records<extra></extra>',
          }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Month' } }, yaxis: { ...BL.yaxis, title: { text: 'Records' }, tickformat: ',' }, showlegend: false }} />
        </ChartCard>

        <ChartCard title="Records by Year">
          <PlotlyChart height={250} data={[{
            x: yearly.x, y: yearly.y, type: 'bar',
            marker: { color: yearly.y.map(v => v === Math.max(...yearly.y) ? C.coral : C.teal), line: { color: C.navy, width: 0.4 } },
            text: yearly.y.map(v => v.toLocaleString()), textposition: 'outside',
            hovertemplate: '%{x}: %{y:,}<extra></extra>',
          }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Year' }, type: 'category' }, yaxis: { ...BL.yaxis, title: { text: 'Count' }, tickformat: ',' }, showlegend: false }} />
        </ChartCard>

        <ChartCard title="Cumulative Growth" subtitle="Total posts accumulated over time">
          <PlotlyChart height={250} data={[{
            x: monthly.x,
            y: monthly.y.reduce((acc: number[], v) => { acc.push((acc[acc.length - 1] || 0) + v); return acc }, [] as number[]),
            type: 'scatter', mode: 'lines',
            line: { color: C.gold, width: 2 },
            fill: 'tozeroy', fillcolor: 'rgba(233,196,106,.13)',
            hovertemplate: '<b>%{x}</b><br>Cumulative: %{y:,}<extra></extra>',
          }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Month' } }, yaxis: { ...BL.yaxis, title: { text: 'Total Records' }, tickformat: ',' }, showlegend: false }} />
        </ChartCard>
      </div>

      {/* Word cloud + key findings + sentiment */}
      <div className="grid grid-cols-3 gap-5">
        <ChartCard title="Most Discussed Terms" subtitle="Word size proportional to frequency" className="col-span-1">
          <WordCloud words={words} />
        </ChartCard>

        {/* Key findings */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden col-span-1"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.06)' }}>
          <div style={{ height: 3, background: '#2A9D8F' }} />
          <div className="px-5 py-3 border-b border-slate-100">
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', letterSpacing: '-.01em' }}>Key Findings</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>From filtered dataset</p>
          </div>
          <div className="px-5 pb-2 pt-1">
            <FindingRow label="Most active location:" value={`${kpis.topLoc} — click map bubbles to drill down`} color={C.teal} />
            <FindingRow label="Negative sentiment:" value={`${negPct}% of records — frustration with access and wait times`} color={C.coral} />
            <FindingRow label="Positive sentiment:" value={`${posPct}% of records — appreciation for providers`} color={C.teal} />
            <FindingRow label="Peak activity:" value={`${kpis.peakM} with ${kpis.peakN.toLocaleString()} records`} color={C.gold} />
            <FindingRow label="Top province:" value={`${provCnt[0]?.[0] ?? '—'} leads provincial discussion volume`} color={C.tealL} />
          </div>
        </div>

        <ChartCard title="Monthly Sentiment Trend" subtitle="Stacked by ML ensemble classification" className="col-span-1">
          <PlotlyChart height={300} data={[
            { x: sent.x, y: sent.neg, name: 'Negative', type: 'bar', marker: { color: C.coral }, hovertemplate: '%{x}<br>Negative: %{y:,}<extra></extra>' },
            { x: sent.x, y: sent.mix, name: 'Mixed',    type: 'bar', marker: { color: C.gold },  hovertemplate: '%{x}<br>Mixed: %{y:,}<extra></extra>' },
            { x: sent.x, y: sent.neu, name: 'Neutral',  type: 'bar', marker: { color: C.tealL }, hovertemplate: '%{x}<br>Neutral: %{y:,}<extra></extra>' },
            { x: sent.x, y: sent.pos, name: 'Positive', type: 'bar', marker: { color: C.teal },  hovertemplate: '%{x}<br>Positive: %{y:,}<extra></extra>' },
          ]} layout={{ barmode: 'stack', xaxis: { ...BL.xaxis, title: { text: 'Month' } }, yaxis: { ...BL.yaxis, title: { text: 'Records' }, tickformat: ',' }, legend: { orientation: 'h', y: 1.08 } }} />
        </ChartCard>
      </div>
    </div>
  )
}
