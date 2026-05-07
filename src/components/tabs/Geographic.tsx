'use client'
import { useMemo } from 'react'
import { useDash } from '@/lib/context'
import { aggGeoBar, aggGeoTrends, aggMap, aggProvinceGrouped } from '@/lib/aggregations'
import { C, BL, CITY_TO_PROVINCE } from '@/lib/constants'
import PlotlyChart from '@/components/PlotlyChart'
import ChartCard from '@/components/ChartCard'

function GeoBar({ title, data, isScore, leftMargin = 120 }: {
  title: string; data: [string, number][]; isScore: boolean; leftMargin?: number
}) {
  const top = data.slice(0, 12).reverse()
  const geos = top.map(e => e[0])
  const vals = top.map(e => isScore ? Math.round(e[1] * 10) / 10 : e[1])
  return (
    <ChartCard title={title}>
      <PlotlyChart height={340} data={[{
        x: vals, y: geos, type: 'bar', orientation: 'h',
        marker: { color: isScore ? C.gold : C.teal, line: { color: C.navy, width: 0.3 } },
        text: vals.map(v => isScore ? (v as number).toFixed(1) : (v as number).toLocaleString()),
        textposition: 'outside',
        hovertemplate: '<b>%{y}</b>: %{x}<extra></extra>',
      }]} layout={{ xaxis: { ...BL.xaxis, title: { text: isScore ? 'Avg Score' : 'Records' }, tickformat: isScore ? '' : ',' }, yaxis: { ...BL.yaxis }, showlegend: false, margin: { ...BL.margin, l: leftMargin } }} />
    </ChartCard>
  )
}

export default function Geographic() {
  const { data: d, filters: f } = useDash()
  const provGrouped = useMemo(() => aggProvinceGrouped(d, f),           [d, f])
  const provCnt     = useMemo(() => aggGeoBar(d, f, 'province', 'count'), [d, f])
  const cityCnt     = useMemo(() => aggGeoBar(d, f, 'city',     'count'), [d, f])
  const provSc      = useMemo(() => aggGeoBar(d, f, 'province', 'score'), [d, f])
  const citySc      = useMemo(() => aggGeoBar(d, f, 'city',     'score'), [d, f])
  const trends      = useMemo(() => aggGeoTrends(d, f),                   [d, f])
  const map         = useMemo(() => aggMap(d, f),                         [d, f])

  // Province subreddit bars with "city unspecified" suffix
  const provCntLabelled: [string, number][] = provCnt.map(([g, n]) => [`${g} (city unspecified)`, n])
  const provScLabelled:  [string, number][] = provSc.map(([g, n])  => [`${g} (city unspecified)`, n])

  // City subreddits with parent province tag
  const cityCntLabelled: [string, number][] = cityCnt
    .filter(([g]) => CITY_TO_PROVINCE[g])
    .map(([g, n]) => [`${g} (${CITY_TO_PROVINCE[g]})`, n])
  const cityScLabelled:  [string, number][] = citySc
    .filter(([g]) => CITY_TO_PROVINCE[g])
    .map(([g, n]) => [`${g} (${CITY_TO_PROVINCE[g]})`, n])

  // Province-grouped stacked bar: province-only vs city records
  const provStack: Record<string, { prov: number; city: number }> = {}
  provGrouped.forEach(([prov, total]) => { provStack[prov] = { prov: 0, city: total } })
  provCnt.forEach(([geo, n]) => { if (provStack[geo]) { provStack[geo].prov = n; provStack[geo].city -= n } })
  const stackedGeos = Object.keys(provStack).sort((a, b) => (provStack[b].prov + provStack[b].city) - (provStack[a].prov + provStack[a].city))

  return (
    <div>
      {/* Province summary: grouped totals */}
      <ChartCard
        title="Province Summary — Combined Totals"
        subtitle="Province subreddit (teal) + city subreddits (coral) stacked together. Province portion = r/ontario style posts without a specific city."
        className="mb-5"
      >
        <PlotlyChart height={320} data={[
          {
            x: stackedGeos.map(g => provStack[g].prov),
            y: stackedGeos, type: 'bar', orientation: 'h', name: 'Province subreddit only',
            marker: { color: C.teal },
            hovertemplate: '<b>%{y}</b> province subreddit: %{x:,}<extra></extra>',
          },
          {
            x: stackedGeos.map(g => Math.max(0, provStack[g].city)),
            y: stackedGeos, type: 'bar', orientation: 'h', name: 'City subreddits',
            marker: { color: C.coral },
            hovertemplate: '<b>%{y}</b> city subreddits: %{x:,}<extra></extra>',
          },
        ]} layout={{
          barmode: 'stack',
          xaxis: { ...BL.xaxis, title: { text: 'Total Records' }, tickformat: ',' },
          yaxis: { ...BL.yaxis },
          legend: { orientation: 'h', y: 1.08, font: { size: 10 } },
          margin: { ...BL.margin, l: 160 },
        }} />
      </ChartCard>


      <ChartCard title="Geographic Discussion Map — Canada" subtitle="Hover over a bubble for record count · Teal = province subreddit · Coral = city subreddit" className="mb-5">
        <PlotlyChart height={420} data={[
          { type: 'scattergeo', name: 'Province', lat: map.prov.lat, lon: map.prov.lon, text: map.prov.text, mode: 'markers',
            marker: { size: map.prov.n, color: C.teal, opacity: 0.72, sizemode: 'area', sizeref: map.sizeref, line: { width: 2, color: 'white' } },
            hovertemplate: '%{text}<extra></extra>' } as never,
          { type: 'scattergeo', name: 'City', lat: map.city.lat, lon: map.city.lon, text: map.city.text, mode: 'markers',
            marker: { size: map.city.n, color: C.coral, opacity: 0.72, sizemode: 'area', sizeref: map.sizeref, line: { width: 2, color: 'white' } },
            hovertemplate: '%{text}<extra></extra>' } as never,
        ]} layout={{
          paper_bgcolor: 'white', showlegend: true,
          legend: { x: 0.01, y: 0.01, bgcolor: 'rgba(255,255,255,.85)', bordercolor: '#D0DDE6', borderwidth: 1 },
          margin: { t: 10, b: 8, l: 8, r: 8 },
          geo: { scope: 'north america', showland: true, landcolor: '#EAF5FC', showocean: true, oceancolor: '#DAEEF8',
            showcountries: true, countrycolor: '#90B8C6', countrywidth: 1, showlakes: true, lakecolor: '#DAEEF8',
            showsubunits: true, subunitcolor: '#B4CDD8', subunitwidth: 0.6,
            projection: { type: 'azimuthal equal area' }, lataxis: { range: [41, 74] }, lonaxis: { range: [-142, -50] } },
        } as never} />
      </ChartCard>

      <div className="grid grid-cols-2 gap-[18px] mb-5">
        <GeoBar title="Province subreddits — Record Count (city unspecified)"  data={provCntLabelled} isScore={false} leftMargin={220} />
        <GeoBar title="City subreddits — Record Count"                         data={cityCntLabelled} isScore={false} leftMargin={160} />
      </div>
      <div className="grid grid-cols-2 gap-[18px] mb-5">
        <GeoBar title="Province subreddits — Average Score (city unspecified)" data={provScLabelled}  isScore={true}  leftMargin={220} />
        <GeoBar title="City subreddits — Average Score"                        data={cityScLabelled}  isScore={true}  leftMargin={160} />
      </div>

      <ChartCard title="Monthly Volume Trends" subtitle="Top 6 locations by total records">
        <PlotlyChart height={320} data={trends.map(s => ({
          x: s.x, y: s.y, name: s.name, type: 'scatter', mode: 'lines',
          line: { color: s.col, width: s.w },
          hovertemplate: '<b>%{fullData.name}</b> %{x}: %{y:,}<extra></extra>',
        }))} layout={{ xaxis: { ...BL.xaxis, title: { text: 'Month' } }, yaxis: { ...BL.yaxis, title: { text: 'Records' }, tickformat: ',' } }} />
      </ChartCard>
    </div>
  )
}
