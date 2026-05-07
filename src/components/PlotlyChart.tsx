'use client'
import { useState, useEffect, ComponentType } from 'react'
import type { Layout, Data, Config } from 'plotly.js'
import { BL, CFG } from '@/lib/constants'

type PlotProps = {
  data: Data[]
  layout: Partial<Layout>
  config: Partial<Config>
  style: React.CSSProperties
  useResizeHandler: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (event: any) => void
}

interface Props {
  data: Data[]
  layout?: Partial<Layout>
  height?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClickHandler?: (event: any) => void
}

export default function PlotlyChart({ data, layout = {}, height = 300, onClickHandler }: Props) {
  const [Plot, setPlot] = useState<ComponentType<PlotProps> | null>(null)

  useEffect(() => {
    import('react-plotly.js').then(m => {
      setPlot(() => m.default as ComponentType<PlotProps>)
    })
  }, [])

  if (!Plot) {
    return <div style={{ height, background: '#F0F5F8', borderRadius: 8 }} />
  }

  return (
    <Plot
      data={data}
      layout={{ ...BL, ...layout } as Partial<Layout>}
      config={CFG as Partial<Config>}
      style={{ width: '100%', height }}
      useResizeHandler
      onClick={onClickHandler}
    />
  )
}
