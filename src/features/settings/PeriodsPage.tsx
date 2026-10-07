import { useState } from 'react'
import { CalendarClock, LockKeyhole, LockKeyholeOpen } from 'lucide-react'
import './PeriodsPage.css'

const initialPeriods = [
  { label: 'Oktober 2026', start: '01 Okt 2026', end: '31 Okt 2026', state: 'Terbuka' },
  { label: 'September 2026', start: '01 Sep 2026', end: '30 Sep 2026', state: 'Terkunci' },
  { label: 'Agustus 2026', start: '01 Agu 2026', end: '31 Agu 2026', state: 'Terkunci' },
]

function PeriodsPage() {
  const [periods, setPeriods] = useState(initialPeriods)

  function togglePeriod(label: string) {
    setPeriods((current) => current.map((period) => period.label === label ? { ...period, state: period.state === 'Terbuka' ? 'Terkunci' : 'Terbuka' } : period))
  }

  return (
    <section className="periods-page">
      <div className="reports-heading"><div><span className="eyebrow">PENGATURAN DATA</span><h1>Periode pelaporan</h1><p>Periode terkunci menjadi baca-saja kecuali untuk pengguna yang memiliki akses koreksi khusus.</p></div></div>
      <div className="reports-demo-note">Perubahan di sini hanya simulasi. Hak pengelolaan periode akan dibatasi setelah akun dan peran dikonfigurasi.</div>
      <div className="periods-toolbar"><CalendarClock size={17} /><strong>Penguncian periode bulanan</strong><span>Unit dapat mengisi data selama periode terbuka.</span></div>
      <div className="period-list">{periods.map((period) => {
        const locked = period.state === 'Terkunci'
        return <article className="period-row" key={period.label}><span className={`period-icon${locked ? ' locked' : ''}`}>{locked ? <LockKeyhole size={17} /> : <LockKeyholeOpen size={17} />}</span><div className="period-name"><strong>{period.label}</strong><small>{period.start} – {period.end}</small></div><span className={`period-badge${locked ? ' locked' : ''}`}>{period.state}</span><button className="period-action" type="button" onClick={() => togglePeriod(period.label)}>{locked ? 'Buka' : 'Kunci'}</button></article>
      })}</div>
      <div className="periods-note"><LockKeyhole size={15} /><span>Jejak perubahan tetap mencatat pengguna, waktu, dan nilai sebelum/sesudah. Alasan perubahan tidak diminta.</span></div>
    </section>
  )
}

export default PeriodsPage