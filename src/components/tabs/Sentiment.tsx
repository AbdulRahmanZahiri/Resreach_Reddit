'use client'
import { useMemo } from 'react'
import { useDash } from '@/lib/context'
import { aggSentMonthly, aggSentOverall, aggSentGeo, aggSentGeoProvince, aggSentSankey } from '@/lib/aggregations'
import { C, BL } from '@/lib/constants'
import PlotlyChart from '@/components/PlotlyChart'
import ChartCard from '@/components/ChartCard'

function SentGeoChart({ title, subtitle, geoType }: { title: string; subtitle?: string; geoType: string }) {
  const { data: d, filters: f } = useDash()

  const provData = useMemo(() => aggSentGeoProvince(d, f), [d, f])
  const cityRaw  = useMemo(() => aggSentGeo(d, f, 'city'), [d, f])

  const isProvince = geoType === 'province'

  // Province: use combined data with city-inclusive labels
  // City: use original per-city data
  const keys   = isProvince
    ? provData.map(p => p.key).reverse()
    : cityRaw.slice(0, 10).map(([g]) => g).reverse()
  const labels = isProvince
    ? provData.map(p => p.label).reverse()
    : keys

  const get = (field: 'pos' | 'neu' | 'neg' | 'mix') =>
    isProvince
      ? keys.map(k => provData.find(p => p.key === k)![field])
      : keys.map(k => cityRaw.find(([g]) => g === k)![1][field])

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <PlotlyChart height={340} data={[
        { x: get('neg'), y: labels, name: 'Negative', type: 'bar', orientation: 'h', marker: { color: C.coral } },
        { x: get('mix'), y: labels, name: 'Mixed',    type: 'bar', orientation: 'h', marker: { color: C.gold } },
        { x: get('neu'), y: labels, name: 'Neutral',  type: 'bar', orientation: 'h', marker: { color: C.tealL } },
        { x: get('pos'), y: labels, name: 'Positive', type: 'bar', orientation: 'h', marker: { color: C.teal } },
      ]} layout={{
        barmode: 'stack',
        xaxis: { ...BL.xaxis, title: { text: 'Records' }, tickformat: ',' },
        yaxis: { ...BL.yaxis, tickfont: { size: isProvince ? 9 : 11 } },
        legend: { orientation: 'h', y: 1.08 },
        margin: { ...BL.margin, l: isProvince ? 250 : 115 },
      }} />
    </ChartCard>
  )
}

export default function Sentiment() {
  const { data: d, filters: f } = useDash()
  const monthly = useMemo(() => aggSentMonthly(d, f), [d, f])
  const overall = useMemo(() => aggSentOverall(d, f), [d, f])
  const sankey  = useMemo(() => aggSentSankey(d, f),  [d, f])
  const kw      = d.kw_sentiment


  return (
    <div>

      <ChartCard title="Monthly Sentiment Trend" className="mb-5">
        <PlotlyChart height={300} data={[
          { x: monthly.x, y: monthly.neg, name: 'Negative', type: 'bar', marker: { color: C.coral }, hovertemplate: '%{x}<br>Negative: %{y:,}<extra></extra>' },
          { x: monthly.x, y: monthly.mix, name: 'Mixed',    type: 'bar', marker: { color: C.gold },  hovertemplate: '%{x}<br>Mixed: %{y:,}<extra></extra>' },
          { x: monthly.x, y: monthly.neu, name: 'Neutral',  type: 'bar', marker: { color: C.tealL }, hovertemplate: '%{x}<br>Neutral: %{y:,}<extra></extra>' },
          { x: monthly.x, y: monthly.pos, name: 'Positive', type: 'bar', marker: { color: C.teal },  hovertemplate: '%{x}<br>Positive: %{y:,}<extra></extra>' },
        ]} layout={{ barmode: 'stack', xaxis: { ...BL.xaxis, title: { text: 'Month' } }, yaxis: { ...BL.yaxis, title: { text: 'Records' }, tickformat: ',' }, legend: { orientation: 'h', y: 1.08 } }} />
      </ChartCard>

      <div className="grid grid-cols-2 gap-[18px] mb-5">

        {/* Overall Sentiment Distribution */}
        <ChartCard title="Overall Sentiment Distribution">
          <PlotlyChart height={300} data={[{
            values: [overall.pos, overall.neu, overall.mix, overall.neg],
            labels: ['Positive', 'Neutral', 'Mixed', 'Negative'],
            type: 'pie', hole: 0.45,
            marker: { colors: [C.teal, C.tealL, C.gold, C.coral] },
            hovertemplate: '%{label}: %{value:,} (%{percent})<extra></extra>',
            textinfo: 'label+percent',
          }]} layout={{ showlegend: true, margin: { t: 40, b: 28, l: 20, r: 20 } }} />
        </ChartCard>

        {/* Keyword sentiment breakdown */}
        <ChartCard title="Sentiment Breakdown by Keyword" subtitle="% of records mentioning each keyword — sorted by most negative">
          {(() => {
            const sorted = [...kw].sort((a, b) => b.neg_pct - a.neg_pct)
            const kws    = sorted.map(k => k.kw)
            const neu    = sorted.map(k => Math.max(0, 100 - k.pos_pct - k.neg_pct - k.mix_pct))
            return (
              <PlotlyChart height={300} data={[
                { x: sorted.map(k => k.neg_pct), y: kws, name: 'Negative', type: 'bar', orientation: 'h',
                  marker: { color: C.coral }, hovertemplate: '<b>%{y}</b><br>Negative: %{x:.1f}%<extra></extra>' },
                { x: sorted.map(k => k.mix_pct), y: kws, name: 'Mixed',    type: 'bar', orientation: 'h',
                  marker: { color: C.gold },  hovertemplate: '<b>%{y}</b><br>Mixed: %{x:.1f}%<extra></extra>' },
                { x: neu,                        y: kws, name: 'Neutral',  type: 'bar', orientation: 'h',
                  marker: { color: C.tealL }, hovertemplate: '<b>%{y}</b><br>Neutral: %{x:.1f}%<extra></extra>' },
                { x: sorted.map(k => k.pos_pct), y: kws, name: 'Positive', type: 'bar', orientation: 'h',
                  marker: { color: C.teal },  hovertemplate: '<b>%{y}</b><br>Positive: %{x:.1f}%<extra></extra>' },
              ]} layout={{
                barmode: 'stack',
                xaxis: { ...BL.xaxis, title: { text: '% of mentions' }, range: [0, 100] },
                yaxis: { ...BL.yaxis },
                legend: { orientation: 'h', y: 1.1, font: { size: 10 } },
                margin: { ...BL.margin, l: 155 },
              }} />
            )
          })()}
        </ChartCard>
      </div>

      {/* Sankey: Province → Sentiment */}
      <ChartCard title="Sentiment Flow — Province to Outcome"
        subtitle="Each ribbon shows how discussion volume from a province distributes across sentiment categories"
        className="mb-5">
        <PlotlyChart height={400} data={[{
          type: 'sankey' as never,
          orientation: 'h' as never,
          node: {
            pad: 24,
            thickness: 28,
            line: { color: 'rgba(0,0,0,.06)', width: 0.5 },
            label: sankey.labels,
            color: sankey.nodeColors,
            hovertemplate: '<b>%{label}</b><br>%{value:,} records<extra></extra>',
          },
          link: {
            source: sankey.sources,
            target: sankey.targets,
            value:  sankey.values,
            color:  sankey.linkColors,
            hovertemplate: '%{source.label} → %{target.label}<br><b>%{value:,}</b> records<extra></extra>',
          },
        }]} layout={{
          paper_bgcolor: 'white', plot_bgcolor: 'white',
          font: { family: 'Inter, sans-serif', size: 12, color: '#0B1F3A' },
          margin: { t: 14, b: 14, l: 14, r: 14 },
        } as never} />
      </ChartCard>

      <div className="grid grid-cols-2 gap-[18px] mb-5">
        <SentGeoChart title="Sentiment by Province" geoType="province"
          subtitle="69,226 of 119,090 records have an identified province/city · 49,864 from national subreddits (r/canada, r/askcanada) or unspecified location cannot be attributed to a province" />
        <SentGeoChart title="Sentiment by City" geoType="city"
          subtitle="Records from city-level subreddits only · each city's posts are also rolled into its province total above" />
      </div>

    </div>
  )
}
