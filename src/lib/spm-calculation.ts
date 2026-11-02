import type { IndicatorCalculation } from '../data/sample-indicators'
import { achievement, formatAchievement, formatValue } from './spm-achievement'

export interface CalculationOption {
  value: IndicatorCalculation
  name: string
  short: string
  description: string
  example: string
  guidance: string
  inputHint: string
  contrast?: string
  unitPlaceholder: string
  sample: {
    numerator: number
    denominator: number | null
    unit: string
    resultUnit?: string
    scale?: number
  }
}

export const calculationOptions: CalculationOption[] = [
  {
    value: 'percentage',
    name: 'Persentase (%)',
    short: 'Bagian dibanding keseluruhan',
    description: 'Jumlah bagian dibagi jumlah keseluruhan, lalu dikali 100.',
    example: '80 pasien patuh dari 100 pasien = 80%',
    guidance: 'Pilih bila indikator membandingkan dua jumlah, mis. pasien yang dilayani sesuai standar dibanding seluruh pasien.',
    inputHint: 'Isi Jumlah = bagian yang dihitung, Total = keseluruhan pembanding.',
    unitPlaceholder: '%',
    sample: { numerator: 80, denominator: 100, unit: '%' },
  },
  {
    value: 'average',
    name: 'Rata-rata',
    short: 'Rerata dari sekumpulan data',
    description: 'Seluruh nilai dijumlahkan, lalu dibagi banyaknya data.',
    example: 'Total 225 menit untuk 50 pasien = 4,5 menit',
    guidance: 'Pilih bila indikator mengukur waktu, lama layanan, atau nilai rata-rata dari beberapa data.',
    inputHint: 'Isi Jumlah = total nilai, Total = banyaknya data atau sampel.',
    unitPlaceholder: 'menit, jam, hari',
    sample: { numerator: 225, denominator: 50, unit: 'menit' },
  },
  {
    value: 'scaled',
    name: 'Rasio per 1.000',
    short: 'Kejadian per 1.000 kesempatan',
    description: 'Jumlah kejadian dibagi kesempatan, lalu dikali pengali skala.',
    example: '3 kejadian dari 1.000 hari rawat = 3 per 1.000',
    guidance: 'Pilih bila indikator menghitung kejadian per 1.000, mis. per 1.000 pasien atau per 1.000 hari rawat.',
    inputHint: 'Isi Jumlah = kejadian, Total = kesempatan, lalu tetapkan pengali skala.',
    unitPlaceholder: 'per 1.000 pasien',
    sample: { numerator: 3, denominator: 1000, unit: 'per 1.000', resultUnit: 'per 1.000', scale: 1000 },
  },
  {
    value: 'numerator',
    name: 'Jumlah (hitung banyaknya)',
    short: 'Hasil menghitung orang/benda/kejadian',
    description: 'Anda menghitung banyaknya sesuatu. Angka yang diisi adalah hasil hitung itu sendiri, bukan skor.',
    example: '12 orang dilatih → 12 orang',
    guidance: 'Pilih bila Anda menghitung banyaknya orang, alat, tim, atau kejadian.',
    inputHint: 'Isi banyaknya objek/kejadian; Total tidak diperlukan.',
    contrast: 'Ini untuk menghitung banyaknya. Bila angka Anda berupa skor atau nilai akhir, pilih "Nilai akhir (skor/angka jadi)".',
    unitPlaceholder: 'orang, tim, alat',
    sample: { numerator: 12, denominator: null, unit: 'orang' },
  },
  {
    value: 'direct',
    name: 'Nilai akhir (skor/angka jadi)',
    short: 'Sudah berupa nilai/skor dari penilaian',
    description: 'Angka capaian sudah ditetapkan dari penilaian atau pengukuran. Anda hanya mencatat nilai akhirnya, bukan menghitung banyaknya.',
    example: 'Skor audit = 92',
    guidance: 'Pilih bila angka yang diisi adalah skor, indeks, atau nilai akhir yang sudah jadi.',
    inputHint: 'Isi nilai/skor yang sudah ditetapkan; tidak perlu dihitung.',
    contrast: 'Ini untuk menyalin skor atau nilai akhir. Bila Anda menghitung banyaknya orang/benda/kejadian, pilih "Jumlah (hitung banyaknya)".',
    unitPlaceholder: 'skor, poin, nilai',
    sample: { numerator: 92, denominator: null, unit: 'skor' },
  },
  {
    value: 'free_text',
    name: 'Teks bebas (capaian diketik)',
    short: 'Capaian berupa kata atau keterangan',
    description: 'Capaian diketik apa adanya, tanpa menghitung jumlah dan total. Cocok untuk nilai seperti Biru, Hijau, Merah, atau Hitam.',
    example: 'Capaian Proper: Biru',
    guidance: 'Pilih bila capaian tidak berupa angka, mis. peringkat, kategori, atau keterangan kualitatif.',
    inputHint: 'Ketik capaian apa adanya; kolom jumlah dan total tidak diperlukan.',
    unitPlaceholder: 'Biru, Hijau, Merah, Hitam',
    sample: { numerator: 0, denominator: null, unit: 'Biru' },
  },
]

export function calculationOption(value: IndicatorCalculation): CalculationOption {
  return calculationOptions.find((option) => option.value === value) ?? calculationOptions[0]
}

export function calculationName(value: IndicatorCalculation): string {
  return calculationOption(value).name
}

export function calculationPreview(value: IndicatorCalculation, unitLabel?: string): string {
  const option = calculationOption(value)
  const unit = unitLabel?.trim() || option.sample.unit
  const indicator = {
    calculation_method: value,
    calculation_scale: option.sample.scale ?? null,
    unit_label: unit,
    result_unit: option.sample.resultUnit ?? unit,
  }
  if (value === 'free_text') {
    const text = unitLabel?.trim() || option.sample.unit
    return `Ketik capaian: ${text} → ${text}`
  }
  const result = achievement({ numerator: option.sample.numerator, denominator: option.sample.denominator }, indicator)
  const formatted = result === null ? '—' : formatAchievement(result, indicator)
  const numerator = formatValue(option.sample.numerator)
  const denominator = option.sample.denominator === null ? null : formatValue(option.sample.denominator)

  if (value === 'percentage') return `${numerator} ÷ ${denominator} × 100 = ${formatted}`
  if (value === 'average') return `${numerator} ÷ ${denominator} = ${formatted}`
  if (value === 'scaled') return `${numerator} ÷ ${denominator} × ${formatValue(option.sample.scale ?? 1000)} = ${formatted}`
  if (value === 'numerator') return `Hitung banyaknya: ${numerator} → ${formatted}`
  return `Salin nilai akhir: ${numerator} → ${formatted}`
}
