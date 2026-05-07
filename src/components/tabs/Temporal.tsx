'use client'
import { useMemo } from 'react'
import { useDash } from '@/lib/context'
import { aggMonthly, aggYearly } from '@/lib/aggregations'
import { C, BL } from '@/lib/constants'
import PlotlyChart from '@/components/PlotlyChart'
import ChartCard from '@/components/ChartCard'

export default function Temporal() {
  const { data: d, filters: f } = useDash()
  const monthly = useMemo(() => aggMonthly(d, f), [d, f])
  const yearly  = useMemo(() => aggYearly(d, f),  [d, f])

  return (
    <div>
      <ChartCard title="Monthly Post & Comment Volume" className="mb-5">
        <PlotlyChart height={320} data={[{
          x: monthly.x, y: monthly.y, type: 'scatter', mode: 'lines',
          fill: 'tozeroy', fillcolor: 'rgba(42,157,143,.13)',
          line: { color: C.teal, width: 2.5 },
          hovertemplate: '<b>%{x}</b><br>%{y:,} records<extra></extra>',
        }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Month' } }, yaxis: { ...BL.yaxis, title: { text: 'Records' }, tickformat: ',' }, showlegend: false }} />
      </ChartCard>

      <div className="grid grid-cols-2 gap-[18px]">
        <ChartCard title="Records by Year">
          <PlotlyChart height={280} data={[{
            x: yearly.x, y: yearly.y, type: 'bar',
            marker: { color: yearly.y.map(v => v === Math.max(...yearly.y) ? C.coral : C.teal), line: { color: C.navy, width: 0.5 } },
            text: yearly.y.map(v => v.toLocaleString()), textposition: 'outside',
            hovertemplate: '%{x}: %{y:,}<extra></extra>',
          }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Year' }, type: 'category' }, yaxis: { ...BL.yaxis, title: { text: 'Count' }, tickformat: ',' }, showlegend: false }} />
        </ChartCard>

        <ChartCard title="Cumulative Growth">
          <PlotlyChart height={280} data={[{
            x: monthly.x,
            y: monthly.y.reduce((acc: number[], v) => { acc.push((acc[acc.length - 1] || 0) + v); return acc }, [] as number[]),
            type: 'scatter', mode: 'lines',
            line: { color: C.gold, width: 2.5 },
            fill: 'tozeroy', fillcolor: 'rgba(233,196,106,.13)',
            hovertemplate: '<b>%{x}</b><br>Cumulative: %{y:,}<extra></extra>',
          }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Month' } }, yaxis: { ...BL.yaxis, title: { text: 'Cumulative Records' }, tickformat: ',' }, showlegend: false }} />
        </ChartCard>
      </div>
    </div>
  )
}
