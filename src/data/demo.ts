import type { UnitReport } from '../types/spm'

export const demoReports: UnitReport[] = [
  { id: 'SPM-0261', unit: 'Instalasi Gawat Darurat', period: 'Oktober 2026', completion: 100, status: 'Sudah dicatat', updatedAt: 'Hari ini, 09.42', changedBy: 'Siti Rahma' },
  { id: 'SPM-0260', unit: 'Rawat Jalan', period: 'Oktober 2026', completion: 92, status: 'Sudah dicatat', updatedAt: 'Hari ini, 08.18', changedBy: 'Dewi Lestari' },
  { id: 'SPM-0259', unit: 'Rawat Inap', period: 'September 2026', completion: 100, status: 'Periode terkunci', updatedAt: '30 Sep 2026, 15.26', changedBy: 'Rudi Hartono' },
  { id: 'SPM-0258', unit: 'Farmasi', period: 'Oktober 2026', completion: 76, status: 'Sudah dicatat', updatedAt: 'Kemarin, 13.05', changedBy: 'Maya Putri' },
  { id: 'SPM-0257', unit: 'Radiologi', period: 'Oktober 2026', completion: 0, status: 'Belum diisi', updatedAt: 'Belum ada input', changedBy: '-' },
]

export const demoAudit = [
  { field: 'Waktu tanggap dokter', before: '6 menit', after: '4,5 menit', person: 'Siti Rahma', date: '6 Okt 2026, 09.42' },
  { field: 'Analisa kepuasan pelanggan', before: 'Belum diisi', after: 'Capaian sesuai standar', person: 'Dewi Lestari', date: '6 Okt 2026, 08.18' },
  { field: 'Standar jam buka IGD', before: '24 jam', after: '24 jam', person: 'Admin SPM', date: '1 Okt 2026, 14.05' },
]

export const serviceProgress = [
  { name: 'Gawat Darurat', done: 8, total: 8, color: 'green' },
  { name: 'Rawat Jalan', done: 6, total: 7, color: 'blue' },
  { name: 'Rawat Inap', done: 12, total: 12, color: 'green' },
  { name: 'Penunjang Medik', done: 9, total: 13, color: 'amber' },
]