'use client'
import { useMemo } from 'react'
import { useDash } from '@/lib/context'
import {
  aggTopicGeo, aggKeywords,
  aggFourCDist, aggFourCSentiment,
} from '@/lib/aggregations'
import { C, BL, TOPICS_LIST, FOUR_C_COLORS, FOUR_C_LIST } from '@/lib/constants'
import PlotlyChart from '@/components/PlotlyChart'
import ChartCard from '@/components/ChartCard'

/* ─── Simple section label ───────────────────────────────────────────────── */
function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 16px' }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color, flexShrink: 0 }} />
      <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', letterSpacing: '-.01em' }}>{label}</p>
      <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
    </div>
  )
}

/* ─── 4C stat card ───────────────────────────────────────────────────────── */
function FourCCard({ cat, desc, n, total }: { cat: string; desc: string; n: number; total: number }) {
  const color = FOUR_C_COLORS[cat] || '#94A3B8'
  const pct   = total > 0 ? (n / total * 100) : 0
  return (
    <div style={{
      background: 'white', borderRadius: 14,
      border: '1px solid #E2E8F0', borderTop: `4px solid ${color}`,
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.06)',
      transition: 'transform .18s, box-shadow .18s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 10px rgba(0,0,0,.08),0 16px 32px rgba(0,0,0,.11)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color }}>{cat}</p>
      </div>
      <p style={{ fontSize: 32, fontWeight: 800, color: '#0B1F3A', lineHeight: 1, letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums' }}>
        {n.toLocaleString()}
        <span style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', marginLeft: 5 }}>posts</span>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 12px' }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 40 }}>{pct.toFixed(1)}%</span>
      </div>
      <p style={{ fontSize: 10.5, color: '#94A3B8', lineHeight: 1.55, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>{desc}</p>
    </div>
  )
}

export default function Topics() {
  const { data: d, filters: f } = useDash()

  const provGeo  = useMemo(() => aggTopicGeo(d, f, 'province'), [d, f])
  const keywords = useMemo(() => aggKeywords(d),                [d])
  const fourCDist = useMemo(() => aggFourCDist(d, f),           [d, f])
  const fourCSent = useMemo(() => aggFourCSentiment(d, f),      [d, f])

  /* 4C derived values */
  const cats      = [...FOUR_C_LIST] as string[]
  const fourCMap  = Object.fromEntries(fourCDist)
  const fourCTotal = cats.reduce((s, c) => s + (fourCMap[c] || 0), 0)

  /* Sentiment helper */
  const sentOrdered = cats.map(c => fourCSent.find(s => s.label === c) || { label: c, pos: 0, neg: 0, neu: 0, mix: 0, n: 1 })
  const pct = (v: number, total: number) => total > 0 ? +(v / total * 100).toFixed(1) : 0

  /* BERTopic province heatmap */
  const geos   = provGeo.slice(0, 9).map(([g]) => g)
  const topics = TOPICS_LIST.filter(t => provGeo.some(([, o]) => (o[t] || 0) > 0))
  const heatZ  = topics.map(t => geos.map(g => provGeo.find(([gg]) => gg === g)?.[1][t] || 0))

  return (
    <div>

      {/* ══════ 4C PRIMARY CARE FRAMEWORK ══════ */}
      <SectionLabel label="4C Primary Care Framework" color="#E76F51" />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <FourCCard cat="Contact / Access"  n={fourCMap['Contact / Access']  || 0} total={fourCTotal}
          desc="Finding a doctor, waitlists, appointments, walk-in & urgent care" />
        <FourCCard cat="Continuity"        n={fourCMap['Continuity']        || 0} total={fourCTotal}
          desc="Seeing the same provider over time — ongoing care relationships" />
        <FourCCard cat="Coordination"      n={fourCMap['Coordination']      || 0} total={fourCTotal}
          desc="Referrals, specialist access, test results, inter-provider comms" />
        <FourCCard cat="Comprehensiveness" n={fourCMap['Comprehensiveness'] || 0} total={fourCTotal}
          desc="Mental health, chronic conditions, prevention, whole-person care" />
      </div>

      <div className="grid grid-cols-2 gap-[18px] mb-2">

        {/* 4C distribution — horizontal bar */}
        <ChartCard title="Discussion Volume by Care Dimension"
          subtitle="How many posts relate to each of the four primary care dimensions">
          <PlotlyChart height={300} data={[{
            type: 'bar' as const,
            orientation: 'h' as never,
            x: cats.map(c => fourCMap[c] || 0),
            y: cats,
            marker: {
              color: cats.map(c => FOUR_C_COLORS[c]),
              line: { color: 'white', width: 1.5 },
            },
            text: cats.map(c => {
              const n = fourCMap[c] || 0
              const p = fourCTotal > 0 ? (n / fourCTotal * 100).toFixed(1) : '0'
              return `  ${n.toLocaleString()} · ${p}%`
            }),
            textposition: 'outside' as never,
            textfont: { size: 11, color: '#0B1F3A', family: 'Inter, sans-serif' },
            hovertemplate: '<b>%{y}</b><br>%{x:,} posts<extra></extra>',
            cliponaxis: false as never,
          }]} layout={{
            ...BL,
            xaxis: { ...BL.xaxis, title: { text: 'Posts' }, tickformat: ',' },
            yaxis: { ...BL.yaxis, autorange: 'reversed' as never, tickfont: { size: 11 } },
            margin: { t: 16, b: 48, l: 165, r: 120 },
            showlegend: false,
          }} />
        </ChartCard>

        {/* 4C sentiment stacked bar */}
        <ChartCard title="Sentiment Tone per Care Dimension"
          subtitle="What % of posts in each category express negative, mixed, or positive sentiment">
          <PlotlyChart height={300} data={[
            {
              x: sentOrdered.map(s => pct(s.neg, s.n)),
              y: sentOrdered.map(s => s.label),
              name: 'Negative', type: 'bar', orientation: 'h',
              marker: { color: C.coral },
              hovertemplate: '<b>%{y}</b><br>Negative: %{x:.1f}%<extra></extra>',
            },
            {
              x: sentOrdered.map(s => pct(s.mix, s.n)),
              y: sentOrdered.map(s => s.label),
              name: 'Mixed', type: 'bar', orientation: 'h',
              marker: { color: C.gold },
              hovertemplate: '<b>%{y}</b><br>Mixed: %{x:.1f}%<extra></extra>',
            },
            {
              x: sentOrdered.map(s => pct(s.neu, s.n)),
              y: sentOrdered.map(s => s.label),
              name: 'Neutral', type: 'bar', orientation: 'h',
              marker: { color: C.tealL },
              hovertemplate: '<b>%{y}</b><br>Neutral: %{x:.1f}%<extra></extra>',
            },
            {
              x: sentOrdered.map(s => pct(s.pos, s.n)),
              y: sentOrdered.map(s => s.label),
              name: 'Positive', type: 'bar', orientation: 'h',
              marker: { color: C.teal },
              hovertemplate: '<b>%{y}</b><br>Positive: %{x:.1f}%<extra></extra>',
            },
          ]} layout={{
            barmode: 'stack',
            xaxis: { ...BL.xaxis, title: { text: '% of posts' }, range: [0, 100] },
            yaxis: { ...BL.yaxis, tickfont: { size: 11 } },
            legend: { orientation: 'h', y: 1.12, font: { size: 10 } },
            margin: { ...BL.margin, l: 175 },
          }} />
        </ChartCard>

      </div>

      {/* ══════ TOPIC DISCUSSION BY PROVINCE ══════ */}
      <SectionLabel label="Where Are Topics Most Discussed? — By Province" color="#2A9D8F" />

      <ChartCard
        title="BERTopic Cluster × Province"
        subtitle="Darker cell = more posts · rows = auto-discovered topic clusters · columns = provinces"
        className="mb-2">
        <PlotlyChart height={250} data={[{
          type: 'heatmap' as never,
          z: heatZ,
          x: geos,
          y: topics,
          colorscale: [[0, '#EAF5FC'], [0.4, '#52C5B6'], [1, '#0B1F3A']] as never,
          hovertemplate: '<b>%{y}</b><br>%{x}: %{z:,} posts<extra></extra>',
          showscale: true,
          colorbar: { thickness: 12, len: 0.9, outlinewidth: 0, tickfont: { size: 9 } },
        }]} layout={{
          ...BL,
          margin: { t: 20, b: 80, l: 160, r: 40 },
          xaxis: { ...BL.xaxis, tickangle: -30, tickfont: { size: 10.5 } },
          yaxis: { ...BL.yaxis, tickfont: { size: 10.5 } },
        } as never} />
      </ChartCard>

      {/* ══════ COLLECTION KEYWORDS ══════ */}
      <SectionLabel label="Collection Keywords — Frequency & Sentiment" color="#264653" />

      <ChartCard title="Keyword Frequency"
        subtitle="How often each keyword appears across all posts · colour = sentiment lean (red = negative-heavy, teal = balanced)"
        className="mb-2">
        <PlotlyChart height={340} data={[{
          x: keywords.map(k => k.n),
          y: keywords.map(k => k.kw),
          type: 'bar', orientation: 'h',
          marker: {
            color: keywords.map(k =>
              k.neg_pct > 55 ? C.coral :
              k.neg_pct > 35 ? C.gold  : C.teal
            ),
            line: { color: 'white', width: 0.5 },
          },
          text: keywords.map(k => `  ${k.n.toLocaleString()}`),
          textposition: 'outside' as never,
          textfont: { size: 10.5, color: '#0B1F3A' },
          hovertemplate: '<b>%{y}</b><br>%{x:,} mentions · %{customdata:.1f}% negative<extra></extra>',
          customdata: keywords.map(k => k.neg_pct),
          cliponaxis: false as never,
        }]} layout={{
          xaxis: { ...BL.xaxis, title: { text: 'Mentions' }, tickformat: ',' },
          yaxis: { ...BL.yaxis, autorange: 'reversed' as never, tickfont: { size: 11 } },
          showlegend: false,
          margin: { ...BL.margin, l: 160, r: 100 },
        }} />
      </ChartCard>

    </div>
  )
}
