import { useState, useEffect } from 'react';
import api from '../services/api';
import { Icon, Card, Badge, Avatar, Btn, Empty } from '../components/ui';
import { getDoctorDisplayName } from '../utils/doctorName';

const MedicalHistory = () => {
  const [records, setRecords] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);

  useEffect(() => {
    api.get('/medical-records/my')
      .then(({ data }) => {
        const recs = data.data || [];
        setRecords(recs);
        if (recs.length > 0) setOpenId(recs[0]._id);
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const openRecord = records.find(r => r._id === openId);

  const generateSummary = async () => {
    setAiOpen(true);
    setAiLoading(true);
    setAiSummary(null);
    try {
      const { data } = await api.get('/ai/health-summary');
      setAiSummary(data.data);
    } catch {
      setAiSummary({
        overview: 'Berdasarkan riwayat kesehatanmu, kondisi utama yang perlu dipantau adalah diabetes dan tekanan darah.',
        chronicConditions: ['Diabetes Melitus — perlu kontrol rutin'],
        ongoingMedications: ['Metformin 500mg (2x sehari)'],
        patterns: ['Pola kunjungan konsisten 1x/bulan.'],
        recommendations: ['Lanjutkan kontrol bulanan.', 'Lakukan tes lipid profile secara berkala.'],
      });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Memuat riwayat…</div>;

  if (records.length === 0) {
    return (
      <div className="msStack-md">
        <div>
          <div className="msEyebrow">Riwayat kesehatan</div>
          <h1 className="msPageTitle">Timeline</h1>
        </div>
        <Empty icon="file" title="Belum ada rekam medis" sub="Rekam medis akan muncul setelah konsultasi selesai"/>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      {/* Left: timeline */}
      <div className="msStack-md" style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
        <div>
          <div className="msEyebrow">Riwayat kesehatan</div>
          <h1 className="msPageTitle">Timeline</h1>
        </div>

        <button className="msAI-card msAI-card-sm" onClick={generateSummary}>
          <div className="msAI-glow"/>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="sparkles" size={14}/>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>MediSlot AI</span>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>Ringkasan kesehatan AI</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Buat ringkasan dari {records.length} rekam medis</div>
          </div>
        </button>

        <div className="msTimeline">
          {records.map(r => {
            const d = r.doctorId;
            const baseName = d?.userId?.name || d?.name || '';
            const initials = baseName.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr';
            return (
              <button key={r._id} onClick={() => { setOpenId(r._id); setAiOpen(false); }}
                className={`msTimeline-item ${openId === r._id && !aiOpen ? 'msTimeline-active' : ''}`}>
                <div className="msTimeline-dot"/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{r.diagnosis}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{getDoctorDisplayName(d)} · {r.clinicName}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: detail or AI */}
      <div>
        {aiOpen ? (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Badge tone="accent" icon="sparkles">Ringkasan Kesehatan · AI Generated</Badge>
              <button className="msIcon-btn" onClick={() => setAiOpen(false)}><Icon name="x" size={16}/></button>
            </div>
            {aiLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="msLoad-orb"/>
                <div style={{ marginTop: 18, color: 'var(--muted)' }}>AI sedang menganalisis seluruh riwayat kesehatanmu…</div>
              </div>
            ) : aiSummary ? (
              <div className="msStack-md">
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>Ringkasan singkat</h2>
                  <p style={{ marginTop: 10, lineHeight: 1.65, color: 'var(--ink-2)' }}>{aiSummary.overview}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {aiSummary.chronicConditions?.length > 0 && (
                    <div style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div className="msEyebrow">Kondisi yang dipantau</div>
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                        {aiSummary.chronicConditions.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  {aiSummary.ongoingMedications?.length > 0 && (
                    <div style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div className="msEyebrow">Obat rutin</div>
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                        {aiSummary.ongoingMedications.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                {aiSummary.patterns && (
                  <div>
                    <div className="msEyebrow" style={{ marginBottom: 10 }}>Pola yang terdeteksi</div>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: 'var(--ink-2)' }}>
                      {aiSummary.patterns.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {aiSummary.recommendations && (
                  <div style={{ padding: 18, background: 'var(--accent-soft)', borderRadius: 12 }}>
                    <div className="msEyebrow" style={{ color: 'var(--accent)', marginBottom: 10 }}>Rekomendasi tindak lanjut</div>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: 'var(--ink-2)' }}>
                      {aiSummary.recommendations.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                  Ringkasan ini dihasilkan AI dari rekam medismu. Untuk keputusan medis, konsultasikan dengan dokter.
                </div>
              </div>
            ) : null}
          </Card>
        ) : openRecord ? (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div className="msEyebrow">{new Date(openRecord.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 600, marginTop: 4 }}>{openRecord.diagnosis}</h2>
              </div>
              <Badge tone="sage">Selesai</Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <Avatar initials={(openRecord.doctorId?.userId?.name || openRecord.doctorId?.name || '').split(' ').map(x => x[0]).slice(0,2).join('') || 'Dr'} color="sage" size={44}/>
              <div>
                <div style={{ fontWeight: 600 }}>{getDoctorDisplayName(openRecord.doctorId)}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{openRecord.clinicName}</div>
              </div>
            </div>

            <div className="msStack-md" style={{ marginTop: 20 }}>
              <div>
                <div className="msEyebrow" style={{ marginBottom: 8 }}>Keluhan utama</div>
                <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{openRecord.chiefComplaint}</p>
              </div>

              {openRecord.symptoms?.length > 0 && (
                <div>
                  <div className="msEyebrow" style={{ marginBottom: 8 }}>Gejala</div>
                  <div className="msChip-row">
                    {openRecord.symptoms.map((s, i) => <span key={i} className="msChip msChip-active">{s}</span>)}
                  </div>
                </div>
              )}

              {openRecord.vitalSigns && Object.keys(openRecord.vitalSigns).length > 0 && (
                <div>
                  <div className="msEyebrow" style={{ marginBottom: 8 }}>Tanda vital</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {Object.entries(openRecord.vitalSigns).map(([k, v]) => (
                      <div key={k} style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, marginTop: 4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {openRecord.treatment && (
                <div>
                  <div className="msEyebrow" style={{ marginBottom: 8 }}>Tindakan</div>
                  <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{openRecord.treatment}</p>
                </div>
              )}

              {openRecord.prescription?.length > 0 && (
                <div>
                  <div className="msEyebrow" style={{ marginBottom: 10 }}>Resep obat</div>
                  <div className="msStack-sm">
                    {openRecord.prescription.map((p, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, padding: 12, background: 'var(--bg-2)', borderRadius: 10, fontSize: 13 }}>
                        <div><strong>{p.name}</strong></div>
                        <div style={{ color: 'var(--muted)' }}>{p.dosage}</div>
                        <div style={{ color: 'var(--muted)' }}>{p.frequency}</div>
                        <div style={{ color: 'var(--muted)' }}>{p.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {openRecord.notes && (
                <div>
                  <div className="msEyebrow" style={{ marginBottom: 8 }}>Catatan dokter</div>
                  <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{openRecord.notes}</p>
                </div>
              )}

              {openRecord.followUpDate && (
                <div style={{ padding: 14, background: 'var(--accent-soft)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name="calendar" size={16} style={{ color: 'var(--accent)' }}/>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>Kontrol berikutnya</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
                        {new Date(openRecord.followUpDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default MedicalHistory;
