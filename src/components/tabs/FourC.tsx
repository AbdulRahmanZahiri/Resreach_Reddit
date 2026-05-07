'use client'
import { useMemo } from 'react'
import { useDash } from '@/lib/context'
import { aggFourCDist, aggFourCMonthly, aggFourCGeo, aggFourCSentiment, aggFourCSankey } from '@/lib/aggregations'
import { C, BL, FOUR_C_COLORS, FOUR_C_LIST } from '@/lib/constants'
import PlotlyChart from '@/components/PlotlyChart'
import ChartCard from '@/components/ChartCard'

export default function FourC() {
  const { data: d, filters: f } = useDash()

  const dist     = useMemo(() => aggFourCDist(d, f),            [d, f])
  const monthly  = useMemo(() => aggFourCMonthly(d, f),         [d, f])
  const provGeo  = useMemo(() => aggFourCGeo(d, f, 'province'), [d, f])
  const cityGeo  = useMemo(() => aggFourCGeo(d, f, 'city'),     [d, f])
  const sentiment = useMemo(() => aggFourCSentiment(d, f),      [d, f])
  const sankey   = useMemo(() => aggFourCSankey(d, f),          [d, f])

  const cats = [...FOUR_C_LIST] as string[]

  /* ── Heatmap builder ── */
  const makeHeatmap = (rows: ReturnType<typeof aggFourCGeo>) => {
    const geos   = rows.slice(0, 8).map(([g]) => g)
    const topics = cats.filter(c => rows.some(([, obj]) => (obj[c] || 0) > 0))
    const z      = topics.map(t => geos.map(g => rows.find(([gg]) => gg === g)?.[1][t] || 0))
    return { geos, topics, z }
  }
  const ph = makeHeatmap(provGeo)
  const ch = makeHeatmap(cityGeo)

  /* ── Sentiment stacked bar ── */
  const sentOrdered = cats.map(cat => sentiment.find(s => s.label === cat) || { label: cat, pos: 0, neg: 0, neu: 0, mix: 0, n: 1 })
  const sentLabels  = sentOrdered.map(s => s.label)
  const toNegPct   = (s: typeof sentOrdered[0]) => s.n > 0 ? +(s.neg / s.n * 100).toFixed(1) : 0

  return (
    <div>

      {/* Framework explanation */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 mb-5 flex items-start gap-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <div style={{ width: 3, borderRadius: 2, alignSelf: 'stretch', background: 'linear-gradient(180deg,#E76F51,#2A9D8F,#E9C46A,#52C5B6)', flexShrink: 0 }} />
        <div className="grid grid-cols-4 gap-5 flex-1">
          {[
            { cat: 'Contact / Access',   desc: 'Finding a doctor, appointments, waitlists, walk-in clinics, urgent care access' },
            { cat: 'Continuity',          desc: 'Seeing the same provider over time, stable ongoing care, regular doctor relationships' },
            { cat: 'Coordination',        desc: 'Referrals, specialist care, test results, communication between providers' },
            { cat: 'Comprehensiveness',   desc: 'Coverage of mental health, chronic conditions, prevention, whole-person care' },
          ].map(({ cat, desc }) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: FOUR_C_COLORS[cat], display: 'inline-block', flexShrink: 0 }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{cat}</p>
              </div>
              <p style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Treemap + Monthly trend */}
      <div className="grid grid-cols-2 gap-[18px] mb-5">
        <ChartCard title="4C Category Distribution — Treemap" subtitle="Size proportional to record count">
          <PlotlyChart height={360} data={[{
            type: 'treemap' as never,
            labels: dist.filter(([l]) => l !== 'unclear_or_other').map(([l]) => l),
            parents: dist.filter(([l]) => l !== 'unclear_or_other').map(() => ''),
            values: dist.filter(([l]) => l !== 'unclear_or_other').map(([, n]) => n),
            texttemplate: '<b>%{label}</b><br>%{value:,}' as never,
            hovertemplate: '<b>%{label}</b><br>%{value:,} records · %{percentRoot:.1%}<extra></extra>' as never,
            marker: {
              colors: dist.filter(([l]) => l !== 'unclear_or_other').map(([l]) => FOUR_C_COLORS[l] || C.teal),
              line: { width: 2.5, color: 'white' },
            } as never,
            textfont: { size: 13, color: 'white', family: 'Inter, sans-serif' },
          }]} layout={{ paper_bgcolor: 'white', margin: { t: 8, b: 8, l: 8, r: 8 } } as never} />
        </ChartCard>

        <ChartCard title="4C Topic Trend Over Time" subtitle="Monthly record count per care dimension">
          <PlotlyChart height={360} data={monthly.series.map(s => ({
            x: monthly.ms, y: s.y, name: s.label,
            type: 'scatter' as const, mode: 'lines' as const,
            line: { color: FOUR_C_COLORS[s.label] || C.teal, width: 2.5 },
            hovertemplate: `<b>${s.label}</b> %{x}: %{y:,}<extra></extra>`,
          }))} layout={{
            xaxis: { ...BL.xaxis, title: { text: 'Month' } },
            yaxis: { ...BL.yaxis, title: { text: 'Records' }, tickformat: ',' },
            legend: { orientation: 'h', y: -0.22, font: { size: 9.5 } },
          }} />
        </ChartCard>
      </div>

      {/* Sentiment by 4C + Province heatmap */}
      <div className="grid grid-cols-2 gap-[18px] mb-5">

        <ChartCard title="Sentiment within Each Care Dimension"
          subtitle="% of records per 4C category — sorted by most negative">
          <PlotlyChart height={340} data={[
            { x: sentOrdered.map(toNegPct),                      y: sentLabels, name: 'Negative', type: 'bar', orientation: 'h', marker: { color: C.coral },  hovertemplate: '<b>%{y}</b><br>Negative: %{x:.1f}%<extra></extra>' },
            { x: sentOrdered.map(s => s.n > 0 ? +(s.mix / s.n * 100).toFixed(1) : 0), y: sentLabels, name: 'Mixed',    type: 'bar', orientation: 'h', marker: { color: C.gold },   hovertemplate: '<b>%{y}</b><br>Mixed: %{x:.1f}%<extra></extra>' },
            { x: sentOrdered.map(s => s.n > 0 ? +(s.neu / s.n * 100).toFixed(1) : 0), y: sentLabels, name: 'Neutral',  type: 'bar', orientation: 'h', marker: { color: C.tealL },  hovertemplate: '<b>%{y}</b><br>Neutral: %{x:.1f}%<extra></extra>' },
            { x: sentOrdered.map(s => s.n > 0 ? +(s.pos / s.n * 100).toFixed(1) : 0), y: sentLabels, name: 'Positive', type: 'bar', orientation: 'h', marker: { color: C.teal },   hovertemplate: '<b>%{y}</b><br>Positive: %{x:.1f}%<extra></extra>' },
          ]} layout={{
            barmode: 'stack',
            xaxis: { ...BL.xaxis, title: { text: '% of records' }, range: [0, 100] },
            yaxis: { ...BL.yaxis },
            legend: { orientation: 'h', y: 1.1, font: { size: 10 } },
            margin: { ...BL.margin, l: 160 },
          }} />
        </ChartCard>

        <ChartCard title="4C Topic Mix by Province" subtitle="record count per care dimension">
          <PlotlyChart height={340} data={[{
            type: 'heatmap' as never,
            z: ph.z, x: ph.geos, y: ph.topics,
            colorscale: [[0, '#FFF5EE'], [0.5, '#E76F51'], [1, '#0B1F3A']] as never,
            hovertemplate: '<b>%{y}</b> · %{x}<br>%{z:,} records<extra></extra>',
            showscale: true,
            colorbar: { thickness: 12, len: 0.8, outlinewidth: 0, tickfont: { size: 9 } },
          }]} layout={{
            ...BL,
            margin: { t: 30, b: 80, l: 165, r: 40 },
            xaxis: { ...BL.xaxis, tickangle: -30, tickfont: { size: 10 } },
            yaxis: { ...BL.yaxis, tickfont: { size: 10 } },
          } as never} />
        </ChartCard>
      </div>

      {/* Province → 4C Sankey */}
      <ChartCard title="Care Dimension Flow — Province to 4C Category"
        subtitle="Each ribbon shows how discussion volume from a province distributes across the four care dimensions"
        className="mb-5">
        <PlotlyChart height={420} data={[{
          type: 'sankey' as never,
          orientation: 'h' as never,
          node: {
            pad: 24, thickness: 28,
            line: { color: 'rgba(0,0,0,.06)', width: 0.5 },
            label: sankey.labels,
            color: sankey.nodeColors,
            hovertemplate: '<b>%{label}</b><br>%{value:,} records<extra></extra>',
          },
          link: {
            source: sankey.sources, target: sankey.targets,
            value: sankey.values,   color: sankey.linkColors,
            hovertemplate: '%{source.label} → %{target.label}<br><b>%{value:,}</b> records<extra></extra>',
          },
        }]} layout={{
          paper_bgcolor: 'white', plot_bgcolor: 'white',
          font: { family: 'Inter, sans-serif', size: 12, color: '#0B1F3A' },
          margin: { t: 14, b: 14, l: 14, r: 14 },
        } as never} />
      </ChartCard>

      {/* City heatmap */}
      <ChartCard title="4C Topic Mix by City" subtitle="record count per care dimension">
        <PlotlyChart height={320} data={[{
          type: 'heatmap' as never,
          z: ch.z, x: ch.geos, y: ch.topics,
          colorscale: [[0, '#EAF5FC'], [0.5, '#2A9D8F'], [1, '#0B1F3A']] as never,
          hovertemplate: '<b>%{y}</b> · %{x}<br>%{z:,} records<extra></extra>',
          showscale: true,
          colorbar: { thickness: 12, len: 0.8, outlinewidth: 0, tickfont: { size: 9 } },
        }]} layout={{
          ...BL,
          margin: { t: 30, b: 80, l: 165, r: 40 },
          xaxis: { ...BL.xaxis, tickangle: -30, tickfont: { size: 10 } },
          yaxis: { ...BL.yaxis, tickfont: { size: 10 } },
        } as never} />
      </ChartCard>

    </div>
  )
}
