import { Meta } from '@/lib/types'

interface Props { meta: Meta }

const Step = ({ n, title, desc }: { n: string; title: string; desc: string }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-800 text-white"
      style={{ background: '#2A9D8F' }}>{n}</div>
    <div className="pt-[3px]">
      <p className="text-[13px] font-700 text-navy mb-[2px]">{title}</p>
      <p className="text-[12.5px] text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
)

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-[10px] py-[4px] rounded-full text-[11.5px] font-600 mr-2 mb-2"
    style={{ background: 'rgba(42,157,143,.1)', color: '#2A9D8F', border: '1px solid rgba(42,157,143,.22)' }}>
    {children}
  </span>
)

export default function About({ meta }: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Hero */}
      <div className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#091929 0%,#0d2240 60%,#133052 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #2A9D8F 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <p className="text-[10px] font-700 uppercase tracking-[.14em] mb-2" style={{ color: '#52C5B6' }}>
            Memorial University of Newfoundland · Faculty of Medicine
          </p>
          <h1 className="text-[26px] font-900 leading-tight mb-3">
            Reddit Primary Care<br />Discourse in Canada
          </h1>
          <p className="text-[14px] leading-relaxed" style={{ color: '#8ECAE6', maxWidth: '600px' }}>
            An interactive analysis of {meta.total.toLocaleString()} Reddit posts and comments from Canadian subreddits,
            exploring how Canadians discuss primary health care access across regions and time.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {[`${meta.date_min} – ${meta.date_max}`, `${meta.total.toLocaleString()} records`, `${meta.years.length} years`, `${meta.geos.length} locations`].map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-[11px] font-600"
                style={{ background: 'rgba(42,157,143,.18)', border: '1px solid rgba(82,197,182,.28)', color: '#52C5B6' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Research team */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <p className="text-[10px] font-700 uppercase tracking-[.13em] mb-4" style={{ color: '#2A9D8F' }}>Research Team</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-800 text-[14px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#2A9D8F,#52C5B6)' }}>MN</div>
              <div>
                <p className="text-[14px] font-700 text-navy">Maisam Najafizada</p>
                <p className="text-[12px] text-slate-500">Principal Investigator, Associate Professor</p>
                <p className="text-[12px] text-slate-400 mt-[2px]">Faculty of Medicine, Memorial University<br />St. John's, NL, Canada</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-800 text-[14px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#264653,#457B9D)' }}>TT</div>
              <div>
                <p className="text-[14px] font-700 text-navy">Terrence Tricco</p>
                <p className="text-[12px] text-slate-500">Associate Professor, Department of Computer Science</p>
                <p className="text-[12px] text-slate-400 mt-[2px]">Memorial University of Newfoundland</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-800 text-[14px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#E9C46A,#F4A261)' }}>ES</div>
              <div>
                <p className="text-[14px] font-700 text-navy">Elhamy Samak</p>
                <p className="text-[12px] text-slate-500">Clinical Assistant Professor of Family Medicine</p>
                <p className="text-[12px] text-slate-400 mt-[2px]">Memorial University of Newfoundland</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-800 text-[14px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#E76F51,#F4A261)' }}>SS</div>
              <div>
                <p className="text-[14px] font-700 text-navy">Steve Slade</p>
                <p className="text-[12px] text-slate-500">Director of Research</p>
                <p className="text-[12px] text-slate-400 mt-[2px]">The College of Family Physicians of Canada</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-800 text-[14px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#8ECAE6,#457B9D)' }}>AZ</div>
              <div>
                <p className="text-[14px] font-700 text-navy">Abdul Rahman Zahiri</p>
                <p className="text-[12px] text-slate-500">Research Assistant</p>
                <p className="text-[12px] text-slate-400 mt-[2px]">Data collection, NLP analysis,<br />and dashboard development</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-800 text-[14px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#457B9D,#1D3557)' }}>PW</div>
              <div>
                <p className="text-[14px] font-700 text-navy">Peizhong (Peter) Wang</p>
                <p className="text-[12px] text-slate-500">Co-Investigator</p>
                <p className="text-[12px] text-slate-400 mt-[2px]">Faculty of Medicine, Memorial University<br />St. John&apos;s, NL, Canada</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-800 text-[14px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#84A98C,#52796F)' }}>JP</div>
              <div>
                <p className="text-[14px] font-700 text-navy">Jacob Power</p>
                <p className="text-[12px] text-slate-500">Collaborator</p>
                <p className="text-[12px] text-slate-400 mt-[2px]">2nd Year Medical Student<br />Faculty of Medicine, Memorial University</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-800 text-[14px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#9D8189,#B5838D)' }}>HR</div>
              <div>
                <p className="text-[14px] font-700 text-navy">Hashim Rawab</p>
                <p className="text-[12px] text-slate-500">Collaborator</p>
                <p className="text-[12px] text-slate-400 mt-[2px]">1st Year PhD Student<br />Faculty of Medicine, Memorial University</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <p className="text-[10px] font-700 uppercase tracking-[.13em] mb-4" style={{ color: '#2A9D8F' }}>Research Questions</p>
          <ul className="space-y-3">
            {[
              'How do Canadians discuss primary health care access challenges on Reddit?',
              'Which provinces and cities have the highest discourse volume and engagement?',
              'How does sentiment around primary care differ across regions and time?',
              'What topics dominate the Canadian primary care conversation?',
            ].map((q, i) => (
              <li key={i} className="flex gap-3 text-[12.5px] text-slate-600 leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-800 flex items-center justify-center mt-[1px]"
                  style={{ background: 'rgba(42,157,143,.12)', color: '#2A9D8F' }}>{i + 1}</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <p className="text-[10px] font-700 uppercase tracking-[.13em] mb-6" style={{ color: '#2A9D8F' }}>Data Pipeline</p>
        <div className="space-y-5">
          <Step n="1" title="Data Collection"
            desc={`${meta.total.toLocaleString()} posts and comments collected from 32 Canadian subreddits via Google BigQuery Reddit dataset. Subreddits include province-level (r/ontario, r/alberta, etc.) and city-level (r/toronto, r/vancouver, etc.) communities.`} />
          <Step n="2" title="Keyword Filtering"
            desc="Records filtered to those mentioning primary care keywords: doctor, physician, family doctor, GP, walk-in clinic, healthcare, nurse practitioner, health card, referral, and related terms." />
          <Step n="3" title="Geographic Tagging"
            desc="Each record tagged to its province or city based on its source subreddit. Records from r/canada and r/AskCanada tagged as Canada (General)." />
          <Step n="4" title="Sentiment Analysis"
            desc="VADER (Valence Aware Dictionary and sEntiment Reasoner) applied to each record. Compound score from −1 (most negative) to +1 (most positive). Thresholds: Positive ≥ 0.05, Negative ≤ −0.05, Neutral otherwise." />
          <Step n="5" title="Topic Modelling"
            desc="BERTopic applied to identify latent discussion themes. Each record assigned a topic label. Results aggregated by geography and time period." />
          <Step n="6" title="Dashboard"
            desc="Pre-aggregated data exported to JSON and visualised with Plotly.js in this Next.js interactive dashboard. Filters applied client-side for instant response." />
        </div>
      </div>

      {/* Tools */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <p className="text-[10px] font-700 uppercase tracking-[.13em] mb-4" style={{ color: '#2A9D8F' }}>Tools & Technologies</p>
        <div className="mb-3">
          <p className="text-[11px] font-700 uppercase tracking-[.1em] text-slate-400 mb-2">Data & NLP</p>
          {['Google BigQuery', 'Python 3.11', 'pandas', 'VADER (NLTK)', 'BERTopic', 'scikit-learn'].map(t => <Tag key={t}>{t}</Tag>)}
        </div>
        <div>
          <p className="text-[11px] font-700 uppercase tracking-[.1em] text-slate-400 mb-2">Dashboard</p>
          {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Plotly.js 3', 'react-plotly.js', 'lucide-react'].map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      </div>

      {/* Note */}
      <div className="rounded-xl px-5 py-4 text-[11.5px] leading-relaxed"
        style={{ background: 'rgba(233,196,106,.1)', border: '1px solid rgba(233,196,106,.3)', color: '#92670A' }}>
        <strong>Ethical note:</strong> All data is sourced from public Reddit posts. No personally identifiable
        information is collected or stored. The dataset is used solely for academic research on primary care discourse patterns.
      </div>
    </div>
  )
}
