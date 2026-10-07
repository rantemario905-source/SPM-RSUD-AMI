export type IndicatorInputType = 'ratio' | 'number' | 'duration' | 'category' | 'text'
export type IndicatorCalculation = 'percentage' | 'average' | 'scaled' | 'numerator'

export interface IndicatorEntry {
  code: string
  name: string
  definition: string
  standard: string
  type: IndicatorInputType
  unit: string
  numerator: string
  denominator: string
  value: string
  analysis: string
  calculation?: IndicatorCalculation
  scale?: number
  resultUnit?: string
}

export const sampleUnits = [
  {
    id: 'igd',
    name: 'Gawat Darurat',
    indicators: [
      { code: 'IGD-01', name: 'Kemampuan menangani life saving anak dan dewasa', definition: 'Pasien yang mendapat pertolongan life saving dibanding pasien yang membutuhkan.', standard: '100%', type: 'ratio', unit: '%', numerator: '42', denominator: '42', value: '', analysis: 'Seluruh pasien yang membutuhkan life saving telah mendapat pertolongan.' },
      { code: 'IGD-02', name: 'Jam buka Pelayanan Gawat Darurat', definition: 'Ketersediaan pelayanan gawat darurat selama 24 jam penuh.', standard: '24 jam', type: 'duration', calculation: 'average', unit: 'jam', numerator: '744', denominator: '31', value: '', analysis: 'Pelayanan tersedia selama 24 jam.' },
      { code: 'IGD-03', name: 'Pemberi pelayanan gawat darurat bersertifikat', definition: 'Tenaga pemberi layanan yang memiliki sertifikat BLS/PPGD/GELS/BTCLS yang masih berlaku.', standard: '100%', type: 'ratio', unit: '%', numerator: '18', denominator: '20', value: '', analysis: '18 dari 20 tenaga pemberi layanan memiliki sertifikat yang masih berlaku.' },
      { code: 'IGD-04', name: 'Ketersediaan tim penanggulangan bencana', definition: 'Tim rumah sakit yang dibentuk untuk memberikan pertolongan klinis saat bencana.', standard: '1 tim', type: 'category', calculation: 'numerator', unit: 'tim', numerator: '1', denominator: '1', value: '', analysis: 'Tim penanggulangan bencana rumah sakit tersedia.' },
      { code: 'IGD-05', name: 'Waktu tanggap pelayanan dokter di Gawat Darurat', definition: 'Waktu sejak pasien datang sampai dilayani dokter.', standard: '≤ 5 menit', type: 'duration', calculation: 'average', unit: 'menit', numerator: '225', denominator: '50', value: '', analysis: 'Rerata waktu tanggap masih di bawah standar.' },
      { code: 'IGD-06', name: 'Kepuasan pelanggan Gawat Darurat', definition: 'Persentase penilaian puas pada survei pelanggan IGD.', standard: '≥ 70%', type: 'ratio', unit: '%', numerator: '36', denominator: '50', value: '', analysis: 'Hasil survei kepuasan mencapai 72%.' },
      { code: 'IGD-07', name: 'Kematian pasien < 24 jam', definition: 'Jumlah kematian kurang dari 24 jam per jumlah pasien yang ditangani.', standard: '≤ 2 per 1.000 pasien', type: 'ratio', calculation: 'scaled', unit: '', scale: 1000, resultUnit: 'per 1.000 pasien', numerator: '1', denominator: '1000', value: '', analysis: 'Terdapat 1 kematian per 1.000 pasien.' },
      { code: 'IGD-08', name: 'Tidak ada pasien yang diharuskan membayar uang muka', definition: 'Pasien yang tidak diminta uang muka dibanding pasien yang membutuhkan layanan.', standard: '100%', type: 'ratio', unit: '%', numerator: '42', denominator: '42', value: '', analysis: 'Tidak ada pasien yang diminta membayar uang muka.' },
    ] satisfies IndicatorEntry[],
  },
  {
    id: 'rajal',
    name: 'Rawat Jalan',
    indicators: [
      { code: 'RJ-01', name: 'Dokter pemberi pelayanan di Poliklinik Spesialis', definition: 'Dokter spesialis yang memberikan pelayanan pada poliklinik spesialis.', standard: '100% dokter spesialis', type: 'ratio', unit: '%', numerator: '10', denominator: '10', value: '', analysis: 'Seluruh pelayanan poliklinik spesialis diberikan dokter spesialis.' },
      { code: 'RJ-02', name: 'Ketersediaan pelayanan rawat jalan', definition: 'Ketersediaan minimal layanan anak, penyakit dalam, kebidanan, dan bedah.', standard: '100%', type: 'ratio', unit: '%', numerator: '4', denominator: '4', value: '', analysis: 'Empat jenis layanan minimal tersedia.' },
      { code: 'RJ-03', name: 'Jam buka pelayanan rawat jalan', definition: 'Jam mulai pelayanan rawat jalan spesialistik pada hari kerja.', standard: '08.30 – selesai', type: 'text', calculation: 'percentage', unit: '%', numerator: '22', denominator: '22', value: '', analysis: 'Pelayanan dibuka pukul 08.30 sesuai jadwal pada seluruh hari kerja.' },
      { code: 'RJ-04', name: 'Waktu tunggu di rawat jalan', definition: 'Waktu dari pasien mendaftar sampai dilayani dokter spesialis.', standard: '≤ 60 menit', type: 'duration', calculation: 'average', unit: 'menit', numerator: '2250', denominator: '50', value: '', analysis: 'Rerata waktu tunggu 45 menit, masih di bawah standar.' },
      { code: 'RJ-05', name: 'Kepuasan pelanggan rawat jalan', definition: 'Persentase penilaian puas pada survei pasien rawat jalan.', standard: '≥ 80%', type: 'ratio', unit: '%', numerator: '43', denominator: '50', value: '', analysis: 'Hasil survei kepuasan mencapai 86%.' },
      { code: 'RJ-06', name: 'Penegakan diagnosis TB melalui pemeriksaan mikroskopis/TB- TCM', definition: 'Diagnosis TB rawat jalan yang ditegakkan melalui pemeriksaan mikroskopis/TB-TCM.', standard: '≥ 60%', type: 'ratio', unit: '%', numerator: '8', denominator: '12', value: '', analysis: '8 dari 12 diagnosis TB ditegakkan melalui pemeriksaan yang ditentukan.' },
      { code: 'RJ-07', name: 'Pencatatan dan pelaporan TB di rumah sakit', definition: 'Kasus TB rawat jalan yang dicatat dan dilaporkan.', standard: '100%', type: 'ratio', unit: '%', numerator: '12', denominator: '12', value: '', analysis: 'Seluruh kasus TB rawat jalan telah dicatat dan dilaporkan.' },
    ] satisfies IndicatorEntry[],
  },
  {
    id: 'ranap',
    name: 'Rawat Inap',
    indicators: [
      { code: 'RI-01', name: 'Pemberi pelayanan di rawat inap', definition: 'Ketersediaan dokter spesialis pemberi pelayanan rawat inap.', standard: '100% dokter spesialis', type: 'ratio', unit: '%', numerator: '12', denominator: '12', value: '', analysis: 'Seluruh pelayanan diberikan oleh dokter spesialis.' },
      { code: 'RI-02', name: 'Dokter penanggung jawab pasien rawat inap', definition: 'Pasien rawat inap yang memiliki dokter penanggung jawab.', standard: '100%', type: 'ratio', unit: '%', numerator: '48', denominator: '48', value: '', analysis: 'Semua pasien rawat inap memiliki dokter penanggung jawab.' },
      { code: 'RI-03', name: 'Ketersediaan pelayanan rawat inap', definition: 'Ketersediaan layanan minimal anak, penyakit dalam, kebidanan, dan bedah.', standard: '100%', type: 'ratio', unit: '%', numerator: '4', denominator: '4', value: '', analysis: 'Empat jenis layanan minimal tersedia.' },
      { code: 'RI-04', name: 'Jam visite dokter spesialis', definition: 'Kunjungan dokter spesialis pada hari kerja.', standard: '08.00–14.00 setiap hari kerja', type: 'text', calculation: 'percentage', unit: '%', numerator: '22', denominator: '22', value: '', analysis: 'Visite dokter dilakukan pada rentang 08.00–14.00 sesuai standar.' },
      { code: 'RI-05', name: 'Kejadian infeksi pascaoperasi', definition: 'Pasien yang mengalami infeksi pascaoperasi dibanding seluruh pasien yang dioperasi.', standard: '≤ 1,5%', type: 'ratio', unit: '%', numerator: '1', denominator: '80', value: '', analysis: 'Terdapat 1 kejadian dari 80 pasien operasi.' },
      { code: 'RI-06', name: 'Kejadian infeksi nosokomial', definition: 'Pasien rawat inap yang mengalami infeksi nosokomial dibanding seluruh pasien rawat inap.', standard: '≤ 1,5%', type: 'ratio', unit: '%', numerator: '2', denominator: '150', value: '', analysis: 'Terdapat 2 kejadian dari 150 pasien rawat inap.' },
      { code: 'RI-07', name: 'Tidak ada pasien jatuh yang berakibat kecacatan/kematian', definition: 'Kepatuhan pelayanan dalam mencegah pasien jatuh yang berakibat kecacatan atau kematian.', standard: '100%', type: 'ratio', unit: '%', numerator: '90', denominator: '90', value: '', analysis: 'Tidak ada kejadian pasien jatuh yang berakibat kecacatan atau kematian.' },
      { code: 'RI-08', name: 'Kematian pasien > 48 jam', definition: 'Kematian pasien setelah lebih dari 48 jam dirawat dibanding jumlah pasien rawat inap.', standard: '≤ 0,24%', type: 'ratio', unit: '%', numerator: '1', denominator: '500', value: '', analysis: 'Terdapat 1 kematian dari 500 pasien rawat inap.' },
      { code: 'RI-09', name: 'Kejadian pulang paksa', definition: 'Pasien yang pulang atas permintaan sendiri sebelum dinyatakan boleh pulang oleh dokter.', standard: '≤ 5%', type: 'ratio', unit: '%', numerator: '2', denominator: '60', value: '', analysis: 'Terdapat 2 kejadian pulang paksa dari 60 pasien.' },
      { code: 'RI-10', name: 'Kepuasan pasien rawat inap', definition: 'Persentase penilaian puas pada survei pasien rawat inap.', standard: '≥ 80%', type: 'ratio', unit: '%', numerator: '45', denominator: '50', value: '', analysis: 'Hasil survei kepuasan mencapai 90%.' },
      { code: 'RI-11', name: 'Penegakan diagnosis TB melalui pemeriksaan mikroskopis/TCM', definition: 'Diagnosis TB rawat inap yang ditegakkan melalui pemeriksaan mikroskopis/TCM.', standard: '≥ 60%', type: 'ratio', unit: '%', numerator: '18', denominator: '25', value: '', analysis: '18 dari 25 diagnosis TB ditegakkan melalui pemeriksaan yang ditentukan.' },
      { code: 'RI-12', name: 'Pencatatan dan pelaporan TB di rumah sakit', definition: 'Kasus TB rawat inap yang dicatat dan dilaporkan.', standard: '100%', type: 'ratio', unit: '%', numerator: '28', denominator: '28', value: '', analysis: 'Seluruh kasus TB rawat inap telah dicatat dan dilaporkan.' },
    ] satisfies IndicatorEntry[],
  },
]