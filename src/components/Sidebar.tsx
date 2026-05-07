'use client'
import { FilterState } from '@/lib/types'

interface Props {
  meta: { total: number; date_min: string; date_max: string; years: number[]; geos: string[] }
  filters: FilterState
  kpis: { total: number; posts: number; cmts: number; peakM: string; avgSc: string; sent: { avg: number } }
  onYearChange: (y: number, checked: boolean) => void
  onGeoChange:  (g: string) => void
  onPtChange:   (p: string) => void
  onReset:      () => void
  isFiltered:   boolean
}

export default function Sidebar({ meta, filters, kpis, onYearChange, onGeoChange, onPtChange, onReset, isFiltered }: Props) {
  const sentLabel = kpis.sent.avg >= 0.05 ? 'Positive' : kpis.sent.avg <= -0.05 ? 'Negative' : 'Neutral'
  const sentColor = kpis.sent.avg >= 0.05 ? '#2A9D8F' : kpis.sent.avg <= -0.05 ? '#E76F51' : '#E9C46A'

  return (
    <aside id="sidebar"
      className="w-[252px] min-w-[252px] flex flex-col h-screen sticky top-0 overflow-y-auto z-50"
      style={{ background: 'linear-gradient(180deg, #0D1B2E 0%, #111827 50%, #0F1923 100%)', borderRight: '1px solid rgba(255,255,255,.06)' }}>

      {/* Ambient glow top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(42,157,143,.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Brand */}
      <div className="relative px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-[7px] mb-3">
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'linear-gradient(135deg, #2A9D8F, #1E7268)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(42,157,143,.4)',
            fontSize: 12, color: 'white', fontWeight: 700,
          }}>R</div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#2A9D8F' }}>
            Memorial University · FOM
          </p>
        </div>
        <h2 style={{ fontSize: 13.5, fontWeight: 700, color: 'white', lineHeight: 1.35, letterSpacing: '-.01em' }}>
          Reddit Primary Care<br />Discourse in Canada
        </h2>
        <p style={{ fontSize: 10.5, color: '#4B5563', marginTop: 6, lineHeight: 1.5 }}>
          {meta.date_min} – {meta.date_max}<br />
          <span style={{ color: '#6B7280' }}>{meta.total.toLocaleString()} records</span>
        </p>
      </div>

      {/* Filters */}
      <div className="relative px-5 py-5 flex flex-col gap-5" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <SectionLabel>Filters</SectionLabel>

        {/* Year */}
        <div>
          <FilterLabel>Year</FilterLabel>
          <div className="flex flex-col gap-[5px]">
            {meta.years.map(y => {
              const on = filters.years.has(y)
              return (
                <label key={y} className="flex items-center gap-[9px] cursor-pointer group">
                  <span style={{
                    width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? 'linear-gradient(135deg,#2A9D8F,#1E7268)' : 'transparent',
                    border: on ? 'none' : '1.5px solid rgba(255,255,255,.12)',
                    boxShadow: on ? '0 1px 6px rgba(42,157,143,.4)' : 'none',
                    transition: 'all .15s ease',
                  }}>
                    {on && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <input type="checkbox" checked={on} onChange={e => onYearChange(y, e.target.checked)} className="sr-only" />
                  <span style={{
                    fontSize: 12.5, fontWeight: on ? 600 : 400,
                    color: on ? 'white' : '#6B7280',
                    transition: 'color .15s',
                  }}>{y}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Location */}
        <div>
          <FilterLabel>Location</FilterLabel>
          <div style={{ position: 'relative' }}>
            <select value={filters.geo} onChange={e => onGeoChange(e.target.value)}
              style={{
                width: '100%', borderRadius: 9, padding: '7px 30px 7px 10px',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', outline: 'none',
                appearance: 'none', WebkitAppearance: 'none',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                color: '#D1D5DB',
              }}>
              <option value="all" style={{ background: '#1F2937' }}>All Locations</option>
              {meta.geos.map(g => <option key={g} value={g} style={{ background: '#1F2937' }}>{g}</option>)}
            </select>
            <svg style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: .5 }}
              width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Post type */}
        <div>
          <FilterLabel>Post Type</FilterLabel>
          <div style={{ display: 'flex', borderRadius: 9, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)' }}>
            {[['all','All'],['1','Posts'],['0','Comments']].map(([v, l], i) => {
              const on = filters.pt === v
              return (
                <button key={v} onClick={() => onPtChange(v)}
                  style={{
                    flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: on ? 600 : 400,
                    cursor: 'pointer', transition: 'all .15s ease',
                    background: on ? 'linear-gradient(135deg,#2A9D8F,#1E7268)' : 'transparent',
                    color: on ? 'white' : '#6B7280',
                    borderRight: i < 2 ? '1px solid rgba(255,255,255,.08)' : 'none',
                    boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.1)' : 'none',
                  }}>
                  {l}
                </button>
              )
            })}
          </div>
        </div>

        {/* Reset */}
        {isFiltered && (
          <button onClick={onReset}
            style={{
              width: '100%', padding: '7px 0', borderRadius: 9, fontSize: 11.5, fontWeight: 550,
              cursor: 'pointer', transition: 'all .15s ease',
              background: 'rgba(231,111,81,.08)', color: '#E76F51',
              border: '1px solid rgba(231,111,81,.2)',
            }}>
            ✕ Reset filters
          </button>
        )}
      </div>

      {/* Live snapshot */}
      <div className="relative px-5 py-5 flex flex-col gap-[13px]" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <SectionLabel>Filtered Snapshot</SectionLabel>

        <SnapStat label="Records" value={kpis.total.toLocaleString()}
          sub={`${kpis.posts.toLocaleString()} posts · ${kpis.cmts.toLocaleString()} comments`} />
        <SnapStat label="Peak Month" value={kpis.peakM} />
        <SnapStat label="Avg Score"  value={kpis.avgSc} />
        <SnapStat label="Avg Sentiment" value={kpis.sent.avg.toFixed(3)}
          sub={sentLabel} subColor={sentColor} />
      </div>

      {/* Team */}
      <div className="relative px-5 py-5 flex flex-col gap-[12px] mt-auto">
        <SectionLabel>Research Team</SectionLabel>
        <TeamLine role="Principal Investigator" name="Prof. Maisam Najafizada" />
        <TeamLine role="Research Assistant"     name="Abdul Rahman Zahiri" />
        <TeamLine role="Data Source"            name="Reddit · Google BigQuery" />
      </div>
    </aside>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#374151' }}>
      {children}
    </p>
  )
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4B5563', marginBottom: 9 }}>
      {children}
    </p>
  )
}

function SnapStat({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div>
      <p style={{ fontSize: 9.5, fontWeight: 500, color: '#4B5563', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 17, fontWeight: 750, color: 'white', lineHeight: 1, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 10, marginTop: 3, fontWeight: 500, color: subColor || '#6B7280' }}>{sub}</p>}
    </div>
  )
}

function TeamLine({ role, name }: { role: string; name: string }) {
  return (
    <div>
      <p style={{ fontSize: 9.5, color: '#374151' }}>{role}</p>
      <p style={{ fontSize: 11.5, fontWeight: 550, color: '#9CA3AF' }}>{name}</p>
    </div>
  )
}
