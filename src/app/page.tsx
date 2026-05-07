import fs from 'fs'
import path from 'path'
import { DashData } from '@/lib/types'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const raw  = fs.readFileSync(path.join(process.cwd(), 'public', 'data.json'), 'utf-8')
  const data = JSON.parse(raw) as DashData
  return <Dashboard data={data} />
}
