import { describe, expect, it } from 'vitest'
import { calculationName, calculationOptions, calculationPreview } from '../src/lib/spm-calculation'

describe('spm-calculation', () => {
  it('menyediakan enam pilihan rumus dengan penjelasan, contoh, dan panduan', () => {
    expect(calculationOptions.map((option) => option.value)).toEqual(['percentage', 'average', 'scaled', 'numerator', 'direct', 'free_text'])
    for (const option of calculationOptions) {
      expect(option.name).toBeTruthy()
      expect(option.short).toBeTruthy()
      expect(option.description).toBeTruthy()
      expect(option.example).toBeTruthy()
      expect(option.guidance).toBeTruthy()
      expect(option.inputHint).toBeTruthy()
    }
  })

  it('menampilkan nama rumus yang mudah dipahami', () => {
    expect(calculationName('percentage')).toBe('Persentase (%)')
    expect(calculationName('average')).toBe('Rata-rata')
    expect(calculationName('scaled')).toBe('Rasio per 1.000')
    expect(calculationName('numerator')).toBe('Jumlah (hitung banyaknya)')
    expect(calculationName('direct')).toBe('Nilai akhir (skor/angka jadi)')
    expect(calculationName('free_text')).toBe('Teks bebas (capaian diketik)')
  })

  it('menampilkan pratinjau capaian teks bebas apa adanya', () => {
    expect(calculationPreview('free_text')).toContain('Biru')
    expect(calculationPreview('free_text', 'Hijau')).toContain('Hijau')
  })

  it('menjelaskan perbedaan jumlah dan nilai akhir secara eksplisit', () => {
    const numerator = calculationOptions.find((option) => option.value === 'numerator')
    const direct = calculationOptions.find((option) => option.value === 'direct')
    expect(numerator?.contrast).toContain('skor atau nilai akhir')
    expect(direct?.contrast).toContain('menghitung banyaknya')
  })

  it('menampilkan pratinjau yang konsisten dengan perhitungan capaian', () => {
    expect(calculationPreview('percentage')).toBe('80 ÷ 100 × 100 = 80 %')
    expect(calculationPreview('average')).toBe('225 ÷ 50 = 4,5 menit')
    expect(calculationPreview('average', 'jam')).toBe('225 ÷ 50 = 4,5 jam')
    expect(calculationPreview('scaled')).toBe('3 ÷ 1.000 × 1.000 = 3 per 1.000')
    expect(calculationPreview('numerator')).toBe('Hitung banyaknya: 12 → 12 orang')
    expect(calculationPreview('direct')).toBe('Salin nilai akhir: 92 → 92 skor')
  })
})
