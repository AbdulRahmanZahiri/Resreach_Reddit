'use client'
import { useMemo } from 'react'
import { useDash } from '@/lib/context'
import { aggHist, qFromHist } from '@/lib/aggregations'
import { C, BL } from '@/lib/constants'
import PlotlyChart from '@/components/PlotlyChart'
import ChartCard from '@/components/ChartCard'

export default function Engagement() {
  const { data: d, filters: f } = useDash()

  const sfKey = (k: string) => { const [yr, geo, pt] = k.split('|'); return f.years.has(Number(yr)) && (f.geo === 'all' || geo === f.geo) && (f.pt === 'all' || Number(pt) === Number(f.pt)) }
  const cfKey = (k: string) => { const [yr, geo]     = k.split('|'); return f.years.has(Number(yr)) && (f.geo === 'all' || geo === f.geo) }

  const scoreY  = useMemo(() => aggHist(d.score_bins,   sfKey, d.score_x.length),   [d, f])
  const upvoteY = useMemo(() => aggHist(d.upvote_bins,  sfKey, d.upvote_x.length),  [d, f])
  const cmtY    = useMemo(() => aggHist(d.comment_bins, cfKey, d.comment_x.length), [d, f])

  const [,,scoreMed]  = useMemo(() => qFromHist(d.score_x,   scoreY),  [d, scoreY])
  const [,,upvoteMed] = useMemo(() => qFromHist(d.upvote_x,  upvoteY), [d, upvoteY])
  const [,,cmtMed]    = useMemo(() => qFromHist(d.comment_x, cmtY),    [d, cmtY])

  const ppKey = (k: string) => { const [yr, geo, pt] = k.split('|'); return f.years.has(Number(yr)) && (f.geo === 'all' || geo === f.geo) && Number(pt) === 1 }
  const ccKey = (k: string) => { const [yr, geo, pt] = k.split('|'); return f.years.has(Number(yr)) && (f.geo === 'all' || geo === f.geo) && Number(pt) === 0 }
  const scoreP = useMemo(() => aggHist(d.score_bins, ppKey, d.score_x.length), [d, f])
  const scoreC = useMemo(() => aggHist(d.score_bins, ccKey, d.score_x.length), [d, f])
  const [lp,q1p,mp,q3p,hp] = useMemo(() => qFromHist(d.score_x, scoreP), [d, scoreP])
  const [lc,q1c,mc,q3c,hc] = useMemo(() => qFromHist(d.score_x, scoreC), [d, scoreC])

  const medLine = (med: number) => ({
    shapes: [{ type: 'line', x0: med, x1: med, y0: 0, y1: 1, yref: 'paper', line: { color: C.coral, width: 2, dash: 'dash' } }] as never[],
    annotations: [{ x: med, y: 0.96, yref: 'paper', text: `Median=${med?.toFixed(1)}`, showarrow: false, font: { color: C.coral, size: 11 }, xanchor: 'left', xshift: 6 }] as never[],
  })

  return (
    <div>
      <div className="grid grid-cols-2 gap-[18px] mb-5">
        <ChartCard title="Score Distribution" subtitle="clipped −50 to 200">
          <PlotlyChart height={280} data={[{
            x: d.score_x, y: scoreY, type: 'bar',
            marker: { color: C.teal, line: { color: C.navy, width: 0.2 }, opacity: 0.85 },
            hovertemplate: 'Score ~%{x}<br>%{y:,}<extra></extra>',
          }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Score' } }, yaxis: { ...BL.yaxis, title: { text: 'Count' }, tickformat: ',' }, showlegend: false, ...medLine(scoreMed) }} />
        </ChartCard>

        <ChartCard title="Upvote Ratio Distribution">
          <PlotlyChart height={280} data={[{
            x: d.upvote_x, y: upvoteY, type: 'bar',
            marker: { color: C.gold, line: { color: C.navy, width: 0.2 }, opacity: 0.85 },
            hovertemplate: 'Ratio ~%{x:.2f}<br>%{y:,}<extra></extra>',
          }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Upvote Ratio' } }, yaxis: { ...BL.yaxis, title: { text: 'Count' }, tickformat: ',' }, showlegend: false, ...medLine(upvoteMed) }} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-[18px]">
        <ChartCard title="Score: Posts vs Comments">
          <PlotlyChart height={290} data={[
            { type: 'box', name: 'Top-Level Post', q1: [q1p], median: [mp], q3: [q3p], lowerfence: [lp], upperfence: [hp], marker: { color: C.teal }, line: { color: C.navy, width: 1.2 }, fillcolor: 'rgba(42,157,143,.35)' } as never,
            { type: 'box', name: 'Comment/Reply',  q1: [q1c], median: [mc], q3: [q3c], lowerfence: [lc], upperfence: [hc], marker: { color: C.coral }, line: { color: C.navy, width: 1.2 }, fillcolor: 'rgba(231,111,81,.35)' } as never,
          ]} layout={{ yaxis: { ...BL.yaxis, title: { text: 'Score (approx.)' } } }} />
        </ChartCard>

        <ChartCard title="Comment Count per Post">
          <PlotlyChart height={290} data={[{
            x: d.comment_x, y: cmtY, type: 'bar',
            marker: { color: C.tealL, line: { color: C.navy, width: 0.2 }, opacity: 0.85 },
            hovertemplate: '~%{x} comments<br>%{y:,}<extra></extra>',
          }]} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Number of Comments' } }, yaxis: { ...BL.yaxis, title: { text: 'Count' }, tickformat: ',' }, showlegend: false, ...medLine(cmtMed) }} />
        </ChartCard>
      </div>
    </div>
  )
}
