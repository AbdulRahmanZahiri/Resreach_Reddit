export interface MonthlyRow { ym: string; geo: string; pt: number; n: number }
export interface GeoStat { geo: string; yr: number; pt: number; n: number; sc_sum: number; sc_n: number; gt: string }
export interface SentMonthly { ym: string; geo: string; pt: number; pos: number; neg: number; neu: number; mix: number; avg_c: number }
export interface SentGeo { geo: string; yr: number; pt: number; gt: string; pos: number; neg: number; neu: number; mix: number; avg_c: number }
export interface KwSent { kw: string; avg_c: number; pos_pct: number; neg_pct: number; mix_pct: number; n: number }
export interface TopicMonthly { ym: string; topic: string; pt: number; n: number }
export interface TopicGeo { geo: string; yr: number; pt: number; gt: string; topic: string; n: number }
export interface FourCMonthly { ym: string; geo: string; pt: number; label: string; n: number; pos: number; neg: number; neu: number; mix: number }
export interface FourCGeo { geo: string; yr: number; pt: number; gt: string; label: string; n: number; pos: number; neg: number; neu: number; mix: number }
export interface WordFreq { w: string; n: number }
export interface Meta { total: number; date_min: string; date_max: string; years: number[]; geos: string[] }

export interface DashData {
  monthly: MonthlyRow[]
  geo_stats: GeoStat[]
  score_bins: Record<string, number[]>
  score_x: number[]
  upvote_bins: Record<string, number[]>
  upvote_x: number[]
  comment_bins: Record<string, number[]>
  comment_x: number[]
  words: Record<string, WordFreq[]>
  sentiment_monthly: SentMonthly[]
  sentiment_geo: SentGeo[]
  kw_sentiment: KwSent[]
  topics_monthly: TopicMonthly[]
  topics_geo: TopicGeo[]
  fourC_monthly: FourCMonthly[]
  fourC_geo: FourCGeo[]
  meta: Meta
}

export interface FilterState {
  years: Set<number>
  geo: string
  pt: string
}
