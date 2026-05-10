'use client'
import { useState, useMemo, useLayoutEffect, useRef } from 'react'
import { DashData, FilterState } from '@/lib/types'
import { aggKPIs } from '@/lib/aggregations'
import { DashProvider } from '@/lib/context'
import Sidebar from '@/components/Sidebar'
import Overview   from '@/components/tabs/Overview'
import Geographic from '@/components/tabs/Geographic'
import Engagement from '@/components/tabs/Engagement'
import Sentiment  from '@/components/tabs/Sentiment'
import Topics     from '@/components/tabs/Topics'
import About      from '@/components/tabs/About'

const TABS = [
  { id: 'overview',   label: 'Overview'           },
  { id: 'topics',     label: 'Topics & Themes'    },
  { id: 'sentiment',  label: 'Sentiment Analysis' },
  { id: 'geographic', label: 'Geographic'         },
  { id: 'engagement', label: 'Engagement'         },
  { id: 'about',      label: 'About & Methods'    },
]

export default function Dashboard({ data }: { data: DashData }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState<FilterState>({
    years: new Set(data.meta.years),
    geo: 'all',
    pt: 'all',
  })

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const barRef  = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState({ left: 0, width: 0, top: 0, height: 0, ready: false })

  useLayoutEffect(() => {
    const tab = tabRefs.current[activeTab]
    const bar = barRef.current
    if (!tab || !bar) return
    const b = bar.getBoundingClientRect()
    const t = tab.getBoundingClientRect()
    setPill({ left: t.left - b.left, width: t.width, top: t.top - b.top, height: t.height, ready: true })
  }, [activeTab])

  const onYearChange = (y: number, checked: boolean) =>
    setFilters(f => { const s = new Set(f.years); checked ? s.add(y) : s.delete(y); return { ...f, years: s } })
  const onGeoChange  = (g: string) => setFilters(f => ({ ...f, geo: g }))
  const onPtChange   = (p: string) => setFilters(f => ({ ...f, pt: p }))
  const resetFilters = () => setFilters({ years: new Set(data.meta.years), geo: 'all', pt: 'all' })
  const isFiltered   = filters.geo !== 'all' || filters.pt !== 'all' || filters.years.size !== data.meta.years.length

  const kpis = useMemo(() => aggKPIs(data, filters), [data, filters])

  const tabContent: Record<string, React.ReactNode> = {
    overview:   <Overview />,
    geographic: <Geographic />,
    engagement: <Engagement />,
    sentiment:  <Sentiment />,
    topics:     <Topics />,
    about:      <About meta={data.meta} />,
  }

  return (
    <DashProvider data={data} filters={filters} setGeo={onGeoChange} setTab={setActiveTab}>
      <div className="flex min-h-screen" style={{ background: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
        <Sidebar
          meta={data.meta} filters={filters} kpis={kpis}
          onYearChange={onYearChange} onGeoChange={onGeoChange} onPtChange={onPtChange}
          onReset={resetFilters} isFiltered={isFiltered}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white border-b border-slate-200"
            style={{ boxShadow: '0 1px 12px rgba(0,0,0,.06)' }}>

            <div className="px-8 py-3 flex items-center justify-between">
              <div>
                <h1 style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3A', letterSpacing: '-.02em', lineHeight: 1 }}>
                  Reddit Primary Care Discourse — Canada
                </h1>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  {data.meta.date_min} – {data.meta.date_max}
                  <span className="mx-2 opacity-40">·</span>
                  {data.meta.total.toLocaleString()} records
                  <span className="mx-2 opacity-40">·</span>
                  4-layer ML sentiment · BERTopic
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isFiltered && (
                  <button onClick={resetFilters}
                    className="text-xs font-medium cursor-pointer transition-colors hover:opacity-80"
                    style={{ color: '#E76F51', background: 'rgba(231,111,81,.08)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(231,111,81,.2)' }}>
                    ✕ Reset filters
                  </button>
                )}
                <span style={{ fontSize: 10.5, color: '#94A3B8', background: '#F8FAFC', padding: '4px 12px', borderRadius: 20, border: '1px solid #E2E8F0' }}>
                  Memorial University · FOM
                </span>
              </div>
            </div>

            {/* Tab bar */}
            <div ref={barRef} className="relative px-6 flex items-center gap-1 pb-2">
              {pill.ready && (
                <div className="tab-pill" style={{ left: pill.left, width: pill.width, top: pill.top, height: pill.height }} />
              )}
              {TABS.map(t => {
                const active = activeTab === t.id
                return (
                  <button key={t.id}
                    ref={el => { tabRefs.current[t.id] = el }}
                    onClick={() => setActiveTab(t.id)}
                    className="relative cursor-pointer transition-colors duration-150 whitespace-nowrap"
                    style={{
                      zIndex: 1,
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: active ? 600 : 500,
                      color: active && pill.ready ? 'white' : active ? '#2A9D8F' : '#64748B',
                      background: 'transparent',
                      border: 'none',
                    }}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-7 overflow-auto">
            <div key={activeTab} className="tab-content">
              {tabContent[activeTab]}
            </div>
          </main>

          <footer className="px-8 py-3 bg-white border-t border-slate-100">
            <p style={{ fontSize: 10.5, color: '#CBD5E1' }}>
              © 2025 Memorial University of Newfoundland · Faculty of Medicine · Primary Health Care Research
              <span className="mx-2">·</span>
              Data: Reddit / Google BigQuery · NLP: 4-layer ML ensemble + BERTopic
            </p>
          </footer>
        </div>
      </div>
    </DashProvider>
  )
}
