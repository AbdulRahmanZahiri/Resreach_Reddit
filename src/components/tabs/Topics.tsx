'use client'
import { useMemo } from 'react'
import { useDash } from '@/lib/context'
import {
  aggTopicGeo, aggKeywords, aggTopicTotals, aggBertopicTotals,
  aggFourCDist, aggFourCSentiment,
} from '@/lib/aggregations'
import { C, BL, TOPICS_LIST, FOUR_C_COLORS, FOUR_C_LIST } from '@/lib/constants'
import PlotlyChart from '@/components/PlotlyChart'
import ChartCard from '@/components/ChartCard'

/* ─── BERTopic original clusters (5 unsupervised clusters from BERTopic) ─── */
// fallbackTotal = keyword-based estimate; overridden by live bertopic_monthly data when available
const BERTOPIC_CLUSTERS = [
  { name: 'Access Barriers',    color: '#E76F51', fallback: 26036,
    desc: 'Posts about inability to find or reach a family doctor — doctor shortages, full practices, emergency room visits' },
  { name: 'Provider & Team',    color: '#2A9D8F', fallback: 37352,
    desc: 'Discussions about family physicians, nurse practitioners, specialists, and the broader primary care team' },
  { name: 'Care Navigation',    color: '#E9C46A', fallback: 2771,
    desc: 'How patients move through the system — referrals, finding a new doctor, transfers, and process questions' },
  { name: 'Care Continuity',    color: '#52C5B6', fallback: 979,
    desc: 'Seeing the same provider over time, follow-up appointments, and long-term patient-doctor relationships' },
  { name: 'General Discussion', color: '#8ECAE6', fallback: 22260,
    desc: 'Broader healthcare policy debate, comparisons with other countries, and general primary care discourse' },
]

/* ─── Static BERTopic data (pre-computed, not filter-dependent) ─── */
// Cluster totals = real counts from the filtered 89,398-record healthcare-relevant CSV (topic_4c_label column)
// Sub-topic names and proportions come from BERTopic run on a 30,000-record sample
const SUBTOPICS = [
  {
    topic: 'Contact / Access', color: '#E76F51', total: 81220,
    subs: [
      { name: 'Appointment & Urgent Care Access', n: 5373, keywords: ['family doctor','urgent care','appointment','walk-in','clinic','care'] },
      { name: 'Waitlists & Wait Times',           n: 1641, keywords: ['waitlist','wait times','canada','year','people','paid'] },
      { name: 'Family Doctor Availability',       n: 4994, keywords: ['family doctor','doctors','care','health','patients','shortage'] },
      { name: 'Finding a New Doctor',             n: 1092, keywords: ['new doctor','accepting patients','looking for','family doctor','register'] },
    ],
  },
  {
    topic: 'General Discussion', color: '#8ECAE6', total: 32521,
    subs: [
      { name: 'Healthcare System & Policy',  n: 5878, keywords: ['healthcare','health','canada','doctors','system','policy'] },
      { name: 'Wait Times & Access Lists',   n: 1758, keywords: ['wait list','wait times','canada','years','access'] },
    ],
  },
  {
    topic: 'Comprehensiveness', color: '#52C5B6', total: 2313,
    subs: [
      { name: 'Mental Health & ADHD',         n: 308, keywords: ['adhd','mental health','psychiatrist','diagnosis','medication'] },
      { name: 'Prescriptions & Pharmacy',     n: 179, keywords: ['prescription','pharmacy','medication','refill','drug'] },
      { name: 'Chronic & Preventive Care',    n: 185, keywords: ['chronic','pain','symptoms','blood test','mri','xray'] },
    ],
  },
  {
    topic: 'Care Coordination', color: '#E9C46A', total: 2220,
    subs: [
      { name: 'Referrals & Walk-In Clinics',   n: 223, keywords: ['referral','walk-in clinic','family doctor','wait','need'] },
      { name: 'University & Transfer of Care', n: 194, keywords: ['ubc','transfer of care','canada','student','campus'] },
      { name: 'Mental Health Referrals',       n: 104, keywords: ['psychiatrist','adhd','referral','mental health','help'] },
    ],
  },
  {
    topic: 'Care Continuity', color: '#2A9D8F', total: 816,
    subs: [
      { name: 'Long-Term Healthcare',          n: 100, keywords: ['long-term','healthcare','wait','health system','ongoing'] },
      { name: 'Regular Provider Relationship', n: 62,  keywords: ['regular','same doctor','walk-in','patient','family clinic'] },
      { name: 'Patient Experience',            n: 29,  keywords: ['feel','pain','experience','know','doctor'] },
    ],
  },
]

/* ─── Section label ─── */
function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 16px' }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color, flexShrink: 0 }} />
      <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', letterSpacing: '-.01em' }}>{label}</p>
      <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
    </div>
  )
}

/* ─── 4C stat card ─── */
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

/* ─── Sub-topic cluster card ─── */
function SubTopicCard({ topic, color, total, subs, liveTotal }: typeof SUBTOPICS[0] & { liveTotal?: number }) {
  const displayTotal = liveTotal ?? total
  // Scale sub-topic counts from BERTopic sample proportions × live total
  const sampleSum = subs.reduce((s, x) => s + x.n, 0) || 1
  const scaledSubs = subs.map(s => ({ ...s, n: Math.round((s.n / sampleSum) * displayTotal) }))
  const maxN = Math.max(...scaledSubs.map(s => s.n))
  return (
    <div style={{
      background: 'white', borderRadius: 14, border: '1px solid #E2E8F0',
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 14px rgba(0,0,0,.06)',
    }}>
      <div style={{ background: color, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '-.01em' }}>{topic}</p>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,.75)', background: 'rgba(0,0,0,.15)', padding: '2px 9px', borderRadius: 20 }}>
          {displayTotal.toLocaleString()} posts
        </span>
      </div>
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {scaledSubs.map((s, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: '#0F172A' }}>{s.name}</p>
              <span style={{ fontSize: 10.5, color: '#64748B', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 8 }}>
                {s.n.toLocaleString()} posts
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden', marginBottom: 7 }}>
              <div style={{ height: '100%', width: `${(s.n / maxN) * 100}%`, background: color, opacity: 0.7 + i * 0.1, borderRadius: 3 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {s.keywords.map(kw => (
                <span key={kw} style={{
                  fontSize: 9.5, padding: '2px 7px', borderRadius: 20,
                  background: color + '15', color, border: `1px solid ${color}30`,
                  fontWeight: 500,
                }}>{kw}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Topics() {
  const { data: d, filters: f } = useDash()

  const provGeo        = useMemo(() => aggTopicGeo(d, f, 'province'),  [d, f])
  const keywords       = useMemo(() => aggKeywords(d),                  [d])
  const fourCDist      = useMemo(() => aggFourCDist(d, f),              [d, f])
  const fourCSent      = useMemo(() => aggFourCSentiment(d, f),         [d, f])
  const topicTotals    = useMemo(() => aggTopicTotals(d, f),            [d, f])
  const bertopicTotals = useMemo(() => aggBertopicTotals(d, f),         [d, f])

  /* 4C */
  const cats        = [...FOUR_C_LIST] as string[]
  const fourCMap    = Object.fromEntries(fourCDist)
  const fourCTotal  = cats.reduce((s, c) => s + (fourCMap[c] || 0), 0)
  const sentOrdered = cats.map(c => fourCSent.find(s => s.label === c) || { label: c, pos: 0, neg: 0, neu: 0, mix: 0, n: 1 })
  const pct = (v: number, total: number) => total > 0 ? +(v / total * 100).toFixed(1) : 0

  /* Province heatmap */
  const geos   = provGeo.slice(0, 9).map(([g]) => g)
  const topics = TOPICS_LIST.filter(t => provGeo.some(([, o]) => (o[t] || 0) > 0))
  const heatZ  = topics.map(t => geos.map(g => provGeo.find(([gg]) => gg === g)?.[1][t] || 0))

  /* Sunburst data for sub-topic hierarchy */
  const sbIds: string[]     = ['Topics']
  const sbLabels: string[]  = ['All Topics']
  const sbParents: string[] = ['']
  const sbValues: number[]  = [SUBTOPICS.reduce((s, t) => s + (topicTotals[t.topic] ?? t.total), 0)]
  const sbColors: string[]  = ['#F1F5F9']

  SUBTOPICS.forEach(t => {
    const liveTotal   = topicTotals[t.topic] ?? t.total
    const sampleSum   = t.subs.reduce((s, x) => s + x.n, 0) || 1
    sbIds.push(t.topic)
    sbLabels.push(t.topic)
    sbParents.push('Topics')
    sbValues.push(liveTotal)
    sbColors.push(t.color)
    // Round each child independently, then correct the largest one so the
    // children sum EXACTLY to liveTotal — Plotly silently drops the whole
    // sunburst trace if branchvalues='total' children ever exceed the parent.
    const subVals = t.subs.map(s => Math.round((s.n / sampleSum) * liveTotal))
    const overflow = subVals.reduce((a, b) => a + b, 0) - liveTotal
    if (overflow !== 0 && subVals.length > 0) {
      const idx = subVals.indexOf(Math.max(...subVals))
      subVals[idx] -= overflow
    }
    t.subs.forEach((s, i) => {
      const id = `${t.topic}::${s.name}`
      sbIds.push(id)
      sbLabels.push(s.name)
      sbParents.push(t.topic)
      sbValues.push(subVals[i])
      sbColors.push(t.color + (i === 0 ? 'CC' : '88'))
    })
  })

  /* Bubble chart — volume vs. negativity */
  const maxVol        = Math.max(...cats.map(c => fourCMap[c] || 1))
  const bubbleSizeref = 2.0 * maxVol / (48 ** 2)

  /* Radar — short labels that wrap nicely */
  const radarLabels = ['Contact', 'Continuity', 'Coordination', 'Comprehens.']
  const radarWrap   = [...radarLabels, radarLabels[0]]

  return (
    <div>

      {/* ══════ SECTION 1: What People Are Really Talking About ══════ */}
      <SectionLabel label="What People Are Really Talking About" color="#2A9D8F" />

      {/* Sunburst + Province heatmap side by side */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <ChartCard
          title="How the Conversation Breaks Down by Theme"
          subtitle="BERTopic applied across all 89,398 healthcare-relevant records · inner ring = 5 clusters · outer ring = sub-themes · click any slice to drill in">
          <PlotlyChart height={400} data={[{
            type: 'sunburst' as never,
            ids: sbIds, labels: sbLabels, parents: sbParents, values: sbValues,
            marker: { colors: sbColors, line: { width: 2, color: 'white' } } as never,
            branchvalues: 'total' as never,
            hovertemplate: '<b>%{label}</b><br>%{value:,} posts · %{percentParent:.1%} of parent<extra></extra>' as never,
            textfont: { size: 10, family: 'Inter, sans-serif' },
            insidetextorientation: 'radial' as never,
            leaf: { opacity: 0.85 },
          } as never]} layout={{
            paper_bgcolor: 'white',
            margin: { t: 8, b: 8, l: 8, r: 8 },
            font: { family: 'Inter, sans-serif' },
          } as never} />
        </ChartCard>

        <ChartCard
          title="Which Provinces Are Driving Each Topic?"
          subtitle="Each row is a discussion theme · darker shade = more posts from that province">
          <PlotlyChart height={400} data={[{
            type: 'heatmap' as never, z: heatZ, x: geos, y: topics,
            colorscale: [[0, '#EAF5FC'], [0.4, '#52C5B6'], [1, '#0B1F3A']] as never,
            hovertemplate: '<b>%{y}</b><br>%{x}: %{z:,} posts<extra></extra>',
            showscale: true, colorbar: { thickness: 12, len: 0.9, outlinewidth: 0, tickfont: { size: 9 } },
          }]} layout={{
            ...BL,
            margin: { t: 20, b: 95, l: 160, r: 40 },
            xaxis: { ...BL.xaxis, tickangle: -35, tickfont: { size: 10 } },
            yaxis: { ...BL.yaxis, tickfont: { size: 10.5 } },
          } as never} />
        </ChartCard>
      </div>

      {/* BERTopic cluster overview cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {BERTOPIC_CLUSTERS.map(c => {
          const liveN = bertopicTotals[c.name]
          const n     = liveN ?? c.fallback
          const total = Object.values(bertopicTotals).reduce((s, v) => s + v, 0) || 89398
          const pct   = (n / total * 100).toFixed(1)
          return (
            <div key={c.name} style={{
              background: 'white', borderRadius: 12, border: '1px solid #E2E8F0',
              borderTop: `4px solid ${c.color}`, padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}>
              <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.11em', color: c.color, marginBottom: 8 }}>{c.name}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#0B1F3A', lineHeight: 1, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>
                {n.toLocaleString()}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0 10px' }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{pct}%</span>
              </div>
              <p style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Sub-topic detail cards */}
      <div className="grid grid-cols-3 gap-4 mb-2">
        {SUBTOPICS.slice(0, 3).map(t => <SubTopicCard key={t.topic} {...t} liveTotal={topicTotals[t.topic]} />)}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-2">
        {SUBTOPICS.slice(3).map(t => <SubTopicCard key={t.topic} {...t} liveTotal={topicTotals[t.topic]} />)}
      </div>

      {/* ══════ SECTION 2: Primary Care Through the 4C Lens ══════ */}
      <SectionLabel label="Primary Care Through the 4C Lens" color="#E76F51" />

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

      <div className="grid grid-cols-3 gap-5 mb-2">

        {/* Bubble chart: volume vs negativity */}
        <ChartCard title="Volume vs. Frustration by Care Dimension"
          subtitle="Bubble size = discussion volume · x-axis = how negatively people feel about that dimension">
          <PlotlyChart height={290} data={[{
            type: 'scatter' as const,
            mode: 'markers+text' as never,
            x: sentOrdered.map(s => pct(s.neg, s.n)),
            y: cats.map(c => fourCMap[c] || 0),
            text: ['Contact', 'Continuity', 'Coordination', 'Compreh.'],
            textposition: 'top center' as never,
            textfont: { size: 10.5, color: '#0F172A', family: 'Inter, sans-serif' },
            marker: {
              size: cats.map(c => fourCMap[c] || 0),
              sizemode: 'area' as never,
              sizeref: bubbleSizeref,
              color: cats.map(c => FOUR_C_COLORS[c]),
              opacity: 0.82,
              line: { color: 'white', width: 2.5 },
            },
            hovertemplate: '<b>%{text}</b><br>Posts: %{y:,}<br>Negative: %{x:.1f}%<extra></extra>',
          }]} layout={{
            xaxis: { ...BL.xaxis, title: { text: '% Negative Sentiment' }, range: [0, 80], ticksuffix: '%' as never },
            yaxis: { ...BL.yaxis, title: { text: 'Total Posts' }, tickformat: ',' },
            showlegend: false,
            margin: { t: 35, b: 55, l: 75, r: 20 },
            paper_bgcolor: 'white',
          }} />
        </ChartCard>

        {/* Radar: sentiment profile */}
        <ChartCard title="Sentiment Profile Across Care Dimensions"
          subtitle="How positive, negative, and mixed sentiment compare across all four care pillars">
          <PlotlyChart height={290} data={[
            {
              type: 'scatterpolar' as never,
              r: [...sentOrdered.map(s => pct(s.neg, s.n)), pct(sentOrdered[0].neg, sentOrdered[0].n)],
              theta: radarWrap,
              fill: 'toself' as never,
              name: 'Negative',
              line: { color: C.coral, width: 2 },
              fillcolor: C.coral + '28',
            } as never,
            {
              type: 'scatterpolar' as never,
              r: [...sentOrdered.map(s => pct(s.pos, s.n)), pct(sentOrdered[0].pos, sentOrdered[0].n)],
              theta: radarWrap,
              fill: 'toself' as never,
              name: 'Positive',
              line: { color: C.teal, width: 2 },
              fillcolor: C.teal + '28',
            } as never,
            {
              type: 'scatterpolar' as never,
              r: [...sentOrdered.map(s => pct(s.mix, s.n)), pct(sentOrdered[0].mix, sentOrdered[0].n)],
              theta: radarWrap,
              fill: 'toself' as never,
              name: 'Mixed',
              line: { color: C.gold, width: 2 },
              fillcolor: C.gold + '28',
            } as never,
          ] as never[]} layout={{
            polar: {
              radialaxis: { visible: true, range: [0, 75], ticksuffix: '%', tickfont: { size: 8 }, gridcolor: '#E2E8F0' },
              angularaxis: { tickfont: { size: 10.5 }, gridcolor: '#E2E8F0' },
              bgcolor: 'white',
            },
            showlegend: true,
            legend: { orientation: 'h', y: -0.18, font: { size: 9.5 }, x: 0.15 },
            margin: { t: 20, b: 55, l: 20, r: 20 },
            paper_bgcolor: 'white',
          } as never} />
        </ChartCard>

        {/* Stacked sentiment bar */}
        <ChartCard title="How Frustrated Are People About Each Issue?"
          subtitle="Sentiment breakdown as a share of total posts within each care dimension">
          <PlotlyChart height={290} data={[
            { x: sentOrdered.map(s => pct(s.neg, s.n)), y: sentOrdered.map(s => s.label), name: 'Negative', type: 'bar', orientation: 'h' as never, marker: { color: C.coral }, hovertemplate: '<b>%{y}</b><br>Negative: %{x:.1f}%<extra></extra>' },
            { x: sentOrdered.map(s => pct(s.mix, s.n)), y: sentOrdered.map(s => s.label), name: 'Mixed',    type: 'bar', orientation: 'h' as never, marker: { color: C.gold },  hovertemplate: '<b>%{y}</b><br>Mixed: %{x:.1f}%<extra></extra>' },
            { x: sentOrdered.map(s => pct(s.neu, s.n)), y: sentOrdered.map(s => s.label), name: 'Neutral',  type: 'bar', orientation: 'h' as never, marker: { color: C.tealL }, hovertemplate: '<b>%{y}</b><br>Neutral: %{x:.1f}%<extra></extra>' },
            { x: sentOrdered.map(s => pct(s.pos, s.n)), y: sentOrdered.map(s => s.label), name: 'Positive', type: 'bar', orientation: 'h' as never, marker: { color: C.teal },  hovertemplate: '<b>%{y}</b><br>Positive: %{x:.1f}%<extra></extra>' },
          ]} layout={{
            barmode: 'stack',
            xaxis: { ...BL.xaxis, title: { text: '% of posts' }, range: [0, 100] },
            yaxis: { ...BL.yaxis, tickfont: { size: 10 } },
            legend: { orientation: 'h', y: 1.12, font: { size: 9 } },
            margin: { t: 16, b: 48, l: 165, r: 20 },
          }} />
        </ChartCard>

      </div>

      {/* ══════ SECTION 3: The Words That Define the Data ══════ */}
      <SectionLabel label="The Words That Define the Data" color="#264653" />

      <ChartCard title="Most Frequently Mentioned Terms"
        subtitle="Pre-computed across all 89,398 healthcare-relevant records · not affected by the year/post-type filter · red = negative-heavy · teal = balanced"
        className="mb-2">
        <PlotlyChart height={340} data={[{
          x: keywords.map(k => k.n), y: keywords.map(k => k.kw),
          type: 'bar', orientation: 'h' as never,
          marker: {
            color: keywords.map(k => k.neg_pct > 55 ? C.coral : k.neg_pct > 35 ? C.gold : C.teal),
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
