import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Avatar, Input, Textarea, Toast, Badge } from '../components/ui';

const SYMPTOM_CHIPS = ['Demam', 'Batuk', 'Pilek', 'Nyeri ulu hati', 'Lemas', 'Mual', 'Pusing', 'Sesak napas', 'Nyeri dada', 'Insomnia'];

const DoctorRecord = () => {
  const { patientId: appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    chiefComplaint: '', diagnosis: '', symptoms: [],
    bp: '120/80', hr: '78', temp: '36.7', weight: '', height: '',
    treatment: '', prescription: [{ name: '', dosage: '', frequency: '', duration: '' }],
    notes: '', followUpDate: '',
  });

  useEffect(() => {
    api.get(`/appointments/${appointmentId}`)
      .then(({ data }) => {
        const appt = data.data;
        setAppointment(appt);
        setForm(prev => ({ ...prev, chiefComplaint: appt.notes || '' }));

        // Fetch riwayat rekam medis pasien yang dibuat oleh dokter ini
        const patientId = appt.patientId?._id || appt.patientId;
        if (patientId) {
          api.get(`/medical-records/patient/${patientId}`)
            .then(r => setHistory(r.data.data || []))
            .catch(() => { /* pasien belum pernah ditangani, tidak ada riwayat */ });
        }
      })
      .catch(() => { /* use empty form */ })
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleSymptom = (s) => setField('symptoms', form.symptoms.includes(s) ? form.symptoms.filter(x => x !== s) : [...form.symptoms, s]);
  const updRx = (i, k, v) => setField('prescription', form.prescription.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
  const addRx = () => setField('prescription', [...form.prescription, { name: '', dosage: '', frequency: '', duration: '' }]);
  const removeRx = (i) => setField('prescription', form.prescription.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/medical-records', {
        appointmentId,
        patientId: appointment?.patientId?._id || appointment?.patientId,
        chiefComplaint: form.chiefComplaint,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms,
        vitalSigns: { bp: form.bp, hr: form.hr, temp: form.temp, weight: form.weight, height: form.height },
        treatment: form.treatment,
        prescription: form.prescription.filter(p => p.name),
        notes: form.notes,
        followUpDate: form.followUpDate || undefined,
        clinicName: appointment?.doctorId?.clinicName,
        date: appointment?.date,
        time: appointment?.timeSlot,
      });
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan rekam medis');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Memuat…</div>;

  const patient = appointment?.patientId;
  const patientName = patient?.name || 'Pasien';
  const patientInitials = patientName.split(' ').map(x => x[0]).slice(0, 2).join('');

  return (
    <div className="msStack-md" style={{ maxWidth: 1080 }}>
      <button className="msBack" onClick={() => navigate('/doctor/dashboard')}>
        <Icon name="chevron-l" size={16}/> Kembali ke dashboard
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="msEyebrow">Rekam Medis · Antrian #{String(appointment?.queueNumber || 1).padStart(2, '0')}</div>
          <h1 className="msPageTitle">Input hasil pemeriksaan</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Avatar initials={patientInitials} color="mauve" size={36}/>
            <div>
              <strong>{patientName}</strong>
              <span style={{ color: 'var(--muted)' }}> · {appointment?.timeSlot} WIB</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" onClick={() => handleSave()}>Simpan draft</Btn>
          <Btn variant="primary" icon="check" disabled={saving} onClick={handleSave}>
            {saving ? 'Menyimpan…' : 'Simpan rekam medis'}
          </Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <div className="msStack-md">
          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>1 · Keluhan & gejala</div>
            <Textarea label="Keluhan utama (chief complaint)" value={form.chiefComplaint} onChange={v => setField('chiefComplaint', v)}
              placeholder="Keluhan utama pasien yang dirangkum dari anamnesis"/>
            <div style={{ marginTop: 12 }}>
              <span className="msField-lbl">Gejala</span>
              <div className="msChip-row" style={{ marginTop: 6 }}>
                {SYMPTOM_CHIPS.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)}
                    className={`msChip ${form.symptoms.includes(s) ? 'msChip-active' : ''}`}>
                    {form.symptoms.includes(s) && <Icon name="check" size={11}/>}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>2 · Tanda vital</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              <Input label="Tek. darah" value={form.bp} onChange={v => setField('bp', v)} hint="mmHg"/>
              <Input label="Detak jantung" value={form.hr} onChange={v => setField('hr', v)} hint="bpm"/>
              <Input label="Suhu" value={form.temp} onChange={v => setField('temp', v)} hint="°C"/>
              <Input label="Berat" value={form.weight} onChange={v => setField('weight', v)} hint="kg" placeholder="70"/>
              <Input label="Tinggi" value={form.height} onChange={v => setField('height', v)} hint="cm" placeholder="170"/>
            </div>
          </Card>

          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>3 · Diagnosis & tindakan</div>
            <Input label="Diagnosis" value={form.diagnosis} onChange={v => setField('diagnosis', v)} placeholder="Contoh: Gastritis akut, hipertensi grade I"/>
            <div style={{ marginTop: 12 }}>
              <Textarea label="Tindakan & rencana terapi" value={form.treatment} onChange={v => setField('treatment', v)}
                placeholder="Edukasi pasien, anjuran istirahat, tindakan medis, dll"/>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="msEyebrow">4 · Resep obat</div>
              <Btn variant="ghost" icon="plus" size="sm" onClick={addRx}>Tambah obat</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.prescription.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr 1fr auto', gap: 8, padding: 12, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', alignItems: 'flex-end' }}>
                  <Input label={i === 0 ? 'Nama obat' : null} value={p.name} onChange={v => updRx(i, 'name', v)} placeholder="Paracetamol 500mg"/>
                  <Input label={i === 0 ? 'Dosis' : null} value={p.dosage} onChange={v => updRx(i, 'dosage', v)} placeholder="1 tablet"/>
                  <Input label={i === 0 ? 'Frekuensi' : null} value={p.frequency} onChange={v => updRx(i, 'frequency', v)} placeholder="3x sehari"/>
                  <Input label={i === 0 ? 'Durasi' : null} value={p.duration} onChange={v => updRx(i, 'duration', v)} placeholder="5 hari"/>
                  <button className="msIcon-btn" onClick={() => removeRx(i)} disabled={form.prescription.length === 1} style={{ alignSelf: 'flex-end', marginBottom: 2 }}>
                    <Icon name="x" size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>5 · Catatan & follow-up</div>
            <Textarea label="Catatan tambahan" value={form.notes} onChange={v => setField('notes', v)}/>
            <div style={{ marginTop: 12 }}>
              <Input label="Tanggal kontrol berikutnya (opsional)" type="date" value={form.followUpDate} onChange={v => setField('followUpDate', v)}/>
            </div>
          </Card>
        </div>

        {/* Right: AI hint + context */}
        <div style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }} className="msStack-sm">
          <Card style={{ background: 'var(--bg-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="sparkles" size={14} style={{ color: 'var(--accent)' }}/>
              <span className="msEyebrow" style={{ color: 'var(--accent)' }}>Saran AI</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
              Pastikan diagnosis konsisten dengan gejala yang dilaporkan. Tambahkan catatan follow-up jika kondisi memerlukan pemantauan lanjutan.
            </p>
          </Card>

          <Card>
            <div className="msEyebrow" style={{ marginBottom: 10 }}>Data pasien</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <Avatar initials={patientInitials} color="mauve" size={44}/>
              <div>
                <div style={{ fontWeight: 600 }}>{patientName}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{patient?.email}</div>
              </div>
            </div>
            {appointment && (
              <div style={{ marginTop: 12 }}>
                <div className="msEyebrow">Appointment</div>
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  {new Date(appointment.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} · {appointment.timeSlot} WIB
                </div>
                {appointment.notes && (
                  <div style={{ marginTop: 8, padding: 10, background: 'var(--bg-2)', borderRadius: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                    {appointment.notes}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Panel riwayat rekam medis pasien dari dokter ini */}
          <Card padded={false}>
            <button
              onClick={() => setHistoryOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="file" size={15} style={{ color: 'var(--accent)' }}/>
                <span className="msEyebrow" style={{ color: 'var(--accent)' }}>
                  Riwayat kunjungan Anda ({history.length})
                </span>
              </div>
              <Icon name={historyOpen ? 'chevron-u' : 'chevron-d'} size={14} style={{ color: 'var(--muted)' }}/>
            </button>

            {historyOpen && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {history.length === 0 ? (
                  <div style={{ padding: '14px 18px', fontSize: 13, color: 'var(--muted)' }}>
                    Belum ada riwayat kunjungan sebelumnya.
                  </div>
                ) : history.map((rec, i) => (
                  <div key={rec._id} style={{
                    padding: '12px 18px',
                    borderTop: i ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(rec.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{rec.diagnosis}</div>
                    {rec.chiefComplaint && (
                      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Keluhan: {rec.chiefComplaint}</div>
                    )}
                    {rec.prescription?.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                        💊 {rec.prescription.map(p => p.name).join(', ')}
                      </div>
                    )}
                    {rec.vitalSigns?.bloodPressure && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        TD: {rec.vitalSigns.bloodPressure}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {saved && <Toast msg="Rekam medis berhasil disimpan" onClose={() => { setSaved(false); navigate('/doctor/dashboard'); }}/>}
    </div>
  );
};

export default DoctorRecord;
