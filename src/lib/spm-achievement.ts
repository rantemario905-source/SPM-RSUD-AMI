export interface AchievementIndicator {
  calculation_method: 'percentage' | 'average' | 'scaled' | 'numerator'
  calculation_scale?: number | null
}

export interface StandardTarget {
  comparator: '<=' | '>='
  target: number
}

export interface AchievementEntry {
  numerator: number | null
  denominator: number | null
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
  if (numerator === null || denominator === null || denominator <= 0) return null
  if (indicator.calculation_method === 'average') return numerator / denominator
  if (indicator.calculation_method === 'numerator') return numerator
  if (indicator.calculation_method === 'scaled') return (numerator / denominator) * (indicator.calculation_scale ?? 1000)
  return (numerator / denominator) * 100
}

export function meetsStandard(value: number, target: StandardTarget): boolean {
  return target.comparator === '<=' ? value <= target.target : value >= target.target
}

export function formatValue(value: number): string {
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

export function achievementUnit(indicator: AchievementIndicator & { unit_label?: string; result_unit?: string }): string {
  if (indicator.calculation_method === 'average' || indicator.calculation_method === 'numerator') return indicator.unit_label ?? ''
  if (indicator.calculation_method === 'scaled') return indicator.result_unit || 'per 1.000'
  return '%'
}

export function formatAchievement(value: number, indicator: AchievementIndicator & { unit_label?: string; result_unit?: string }): string {
  const unit = achievementUnit(indicator)
  return `${formatValue(value)}${unit ? ` ${unit}` : ''}`
}
