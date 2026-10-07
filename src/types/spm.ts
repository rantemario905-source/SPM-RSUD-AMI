export type AppPage = 'dashboard' | 'entry' | 'reports' | 'indicators' | 'periods' | 'audit' | 'users'
export type ReportStatus = 'Belum diisi' | 'Sudah dicatat' | 'Periode terkunci'

export interface UnitReport {
  id: string
  unit: string
  period: string
  completion: number
  status: ReportStatus
  updatedAt: string
  changedBy: string
}