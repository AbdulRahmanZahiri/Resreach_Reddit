'use client'
import { createContext, useContext } from 'react'
import { DashData, FilterState } from './types'

interface DashCtx {
  data: DashData
  filters: FilterState
  setGeo: (g: string) => void
  setTab: (t: string) => void
}
const Ctx = createContext<DashCtx | null>(null)

export function DashProvider({ data, filters, setGeo, setTab, children }: DashCtx & { children: React.ReactNode }) {
  return <Ctx.Provider value={{ data, filters, setGeo, setTab }}>{children}</Ctx.Provider>
}

export function useDash() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDash must be used inside DashProvider')
  return ctx
}
