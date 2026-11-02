export interface AchievementIndicator {
  calculation_method: 'percentage' | 'average' | 'scaled' | 'numerator' | 'direct' | 'free_text'
  calculation_scale?: number | null
}

export interface StandardTarget {
  comparator: '<=' | '>='
  target: number
}

export interface AchievementEntry {
  numerator: number | null
  denominator: number | null
  result_text?: string | null
}

export function parseTarget(standard: string): StandardTarget | null {
  const text = (standard ?? '').trim()
  const match = text.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const target = Number(match[1].replace(',', '.'))
  const comparator = text.startsWith('≤') || text.startsWith('<') ? '<=' : '>='
  return { comparator, target }
}

export function achievement(entry: AchievementEntry, indicator: AchievementIndicator): number | null {
  const numerator = entry.numerator
  const denominator = entry.denominator
  if (indicator.calculation_method === 'free_text') return null
  if (numerator === null) return null
  if (indicator.calculation_method === 'numerator' || indicator.calculation_method === 'direct') return numerator
  if (denominator === null || denominator <= 0) return null
  if (indicator.calculation_method === 'average') return numerator / denominator
  if (indicator.calculation_method === 'scaled') return (numerator / denominator) * (indicator.calculation_scale ?? 1000)
  return (numerator / denominator) * 100
}

export function entryAchievementText(entry: AchievementEntry, indicator: AchievementIndicator & { unit_label?: string; result_unit?: string }): string | null {
  if (indicator.calculation_method === 'free_text') {
    const text = (entry.result_text ?? '').trim()
    return text || null
  }
  const value = achievement(entry, indicator)
  return value === null ? null : formatAchievement(value, indicator)
}

export function entryHasValue(entry: AchievementEntry, indicator: AchievementIndicator): boolean {
  if (indicator.calculation_method === 'free_text') return Boolean((entry.result_text ?? '').trim())
  if (entry.numerator === null) return false
  return indicator.calculation_method === 'numerator' || indicator.calculation_method === 'direct' || entry.denominator !== null
}

export function meetsStandard(value: number, target: StandardTarget): boolean {
  return target.comparator === '<=' ? value <= target.target : value >= target.target
}

export function formatValue(value: number): string {
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

export function achievementUnit(indicator: AchievementIndicator & { unit_label?: string; result_unit?: string }): string {
  if (indicator.calculation_method === 'free_text') return ''
  if (indicator.calculation_method === 'average' || indicator.calculation_method === 'numerator' || indicator.calculation_method === 'direct') return indicator.unit_label ?? ''
  if (indicator.calculation_method === 'scaled') return indicator.result_unit || 'per 1.000'
  return '%'
}

export type IndicatorResultTone = 'baik' | 'perhatian' | 'netral' | 'kosong'

export interface IndicatorResult {
  value: string | null
  badge: string
  tone: IndicatorResultTone
}

export interface IndicatorResultIndicator extends AchievementIndicator {
  standard: string
  unit_label?: string
  result_unit?: string
}

export function indicatorResult(indicator: IndicatorResultIndicator, entry: AchievementEntry | null): IndicatorResult {
  if (!entry) return { value: null, badge: 'Belum diisi', tone: 'kosong' }
  if (indicator.calculation_method === 'free_text') {
    const text = entry.result_text?.trim() || null
    return { value: text, badge: text ? 'Tercatat' : 'Belum diisi', tone: text ? 'netral' : 'kosong' }
  }
  const value = achievement(entry, indicator)
  if (value === null) return { value: null, badge: 'Belum diisi', tone: 'kosong' }
  const target = parseTarget(indicator.standard)
  if (!target) return { value: formatAchievement(value, indicator), badge: 'Tanpa standar', tone: 'kosong' }
  const met = meetsStandard(value, target)
  return { value: formatAchievement(value, indicator), badge: met ? 'Memenuhi' : 'Di bawah standar', tone: met ? 'baik' : 'perhatian' }
}

export function formatAchievement(value: number, indicator: AchievementIndicator & { unit_label?: string; result_unit?: string }): string {
  const unit = achievementUnit(indicator)
  return `${formatValue(value)}${unit ? ` ${unit}` : ''}`
}
