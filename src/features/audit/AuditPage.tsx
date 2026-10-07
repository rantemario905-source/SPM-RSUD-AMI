import { History } from 'lucide-react'
import { demoAudit } from '../../data/demo'
import './AuditPage.css'

function AuditPage() {
  return (
    <section className="audit-page">
      <div className="reports-heading"><div><span className="eyebrow">AKUNTABILITAS DATA</span><h1>Jejak perubahan</h1><p>Riwayat mencatat siapa yang mengubah, waktu perubahan, serta nilai sebelum dan sesudah.</p></div></div>
      <div className="reports-demo-note">Riwayat berikut hanya data simulasi untuk pratinjau aplikasi.</div>
      <div className="audit-list">{demoAudit.map((item) => <article className="audit-row" key={`${item.field}-${item.date}`}><span className="audit-icon"><History size={16} /></span><div className="audit-main"><div className="audit-topline"><strong>{item.field}</strong><time>{item.date}</time></div><div className="audit-values"><span>{item.before}</span><b aria-hidden="true">→</b><span>{item.after}</span></div><small>Diubah oleh {item.person}</small></div></article>)}</div>
      <p className="audit-retention">Riwayat tidak menyediakan kolom alasan dan tidak menghapus nilai sebelumnya.</p>
    </section>
  )
}

export default AuditPage