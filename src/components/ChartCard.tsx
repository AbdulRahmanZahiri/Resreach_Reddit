interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  accent?: string
}

export default function ChartCard({ title, subtitle, children, className = '', accent }: Props) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.06)', transition: 'box-shadow .2s, transform .2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 6px rgba(0,0,0,.06), 0 12px 32px rgba(0,0,0,.09)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      {accent && <div style={{ height: 3, background: accent }} />}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-[13px] font-semibold text-slate-800 tracking-tight leading-snug">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-[2px] leading-snug">{subtitle}</p>}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}
