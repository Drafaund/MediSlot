import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Avatar, Input, Textarea, Toast, Badge } from '../components/ui';

const SYMPTOM_CHIPS = ['Fever', 'Cough', 'Runny nose', 'Epigastric pain', 'Fatigue', 'Nausea', 'Dizziness', 'Shortness of breath', 'Chest pain', 'Insomnia'];

const DoctorRecord = () => {
  const { patientId: appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [existingRecord, setExistingRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const DRAFT_KEY = `medislot_draft_${appointmentId}`;
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

        if (appt.status === 'completed') {
          // Mode view: ambil rekam medis yang sudah tersimpan
          api.get(`/medical-records/appointment/${appointmentId}`)
            .then(r => setExistingRecord(r.data.data))
            .catch(() => {});
        } else {
          // Mode input: restore draft atau pre-fill dari catatan appointment
          const complaint = appt.notes || '';
          const savedDraft = localStorage.getItem(`medislot_draft_${appointmentId}`);
          if (savedDraft) {
            try { setForm(prev => ({ ...prev, ...JSON.parse(savedDraft) })); }
            catch { localStorage.removeItem(`medislot_draft_${appointmentId}`); setForm(prev => ({ ...prev, chiefComplaint: complaint })); }
          } else {
            setForm(prev => ({ ...prev, chiefComplaint: complaint }));
          }
        }

        // Fetch patient's medical record history created by this doctor
        const patientId = appt.patientId?._id || appt.patientId;
        if (patientId) {
          api.get(`/medical-records/patient/${patientId}`)
            .then(r => setHistory(r.data.data || []))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleSymptom = (s) => setField('symptoms', form.symptoms.includes(s) ? form.symptoms.filter(x => x !== s) : [...form.symptoms, s]);
  const updRx = (i, k, v) => setField('prescription', form.prescription.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
  const addRx = () => setField('prescription', [...form.prescription, { name: '', dosage: '', frequency: '', duration: '' }]);
  const removeRx = (i) => setField('prescription', form.prescription.filter((_, idx) => idx !== i));

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setDraftSaved(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/medical-records', {
        appointmentId,
        patientId: appointment?.patientId?._id || appointment?.patientId,
        chiefComplaint: form.chiefComplaint,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms,
        vitalSigns: { bloodPressure: form.bp, heartRate: form.hr ? Number(form.hr) : undefined, temperature: form.temp ? Number(form.temp) : undefined, weight: form.weight ? Number(form.weight) : undefined, height: form.height ? Number(form.height) : undefined },
        treatment: form.treatment,
        prescription: form.prescription.filter(p => p.name),
        notes: form.notes,
        followUpDate: form.followUpDate || undefined,
        clinicName: appointment?.doctorId?.clinicName,
        date: appointment?.date,
        time: appointment?.timeSlot,
      });
      localStorage.removeItem(DRAFT_KEY);
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save medical record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>;

  if (appointment && !['confirmed', 'completed'].includes(appointment.status)) {
    return (
      <div className="msStack-md" style={{ maxWidth: 600, margin: '0 auto' }}>
        <button className="msBack" onClick={() => navigate('/doctor/dashboard')}>
          <Icon name="chevron-l" size={16}/> Back to dashboard
        </button>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Icon name="clock" size={44} style={{ color: 'var(--muted)', marginBottom: 16 }}/>
            <h2 style={{ marginBottom: 8 }}>Appointment not yet confirmed</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
              Please confirm the patient's appointment first before filling in the medical record.
            </p>
            <Btn variant="primary" style={{ marginTop: 24 }} onClick={() => navigate('/doctor/dashboard')}>
              Back to dashboard
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  const patient = appointment?.patientId;
  const patientName = patient?.name || 'Patient';
  const patientInitials = patientName.split(' ').map(x => x[0]).slice(0, 2).join('');

  const calcAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  const patientAge = calcAge(patient?.dateOfBirth);

  // ── VIEW MODE: appointment completed + rekam medis sudah ada ──
  if (appointment?.status === 'completed' && existingRecord) {
    const rec = existingRecord;
    return (
      <div className="msStack-md" style={{ maxWidth: 900 }}>
        <button className="msBack" onClick={() => navigate('/doctor/dashboard')}>
          <Icon name="chevron-l" size={16}/> Back to dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="msEyebrow">Medical Record · Queue #{String(appointment?.queueNumber || 1).padStart(2, '0')}</div>
            <h1 className="msPageTitle">Consultation summary</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <Avatar initials={patientInitials} color="mauve" size={36}/>
              <div>
                <strong>{patientName}</strong>
                <span style={{ color: 'var(--muted)' }}> · {appointment?.timeSlot} · {new Date(appointment?.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <Badge tone="sage" icon="check-circ">Completed</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            <div className="msStack-md">
              <Card>
                <div className="msEyebrow" style={{ marginBottom: 14 }}>1 · Complaint & symptoms</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Chief complaint</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{rec.chiefComplaint || '—'}</p>
                </div>
                {rec.symptoms?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Symptoms</div>
                    <div className="msChip-row">
                      {rec.symptoms.map(s => <span key={s} className="msChip msChip-active">{s}</span>)}
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <div className="msEyebrow" style={{ marginBottom: 14 }}>2 · Vital signs</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Blood pressure', value: rec.vitalSigns?.bloodPressure, unit: 'mmHg' },
                    { label: 'Heart rate', value: rec.vitalSigns?.heartRate, unit: 'bpm' },
                    { label: 'Temperature', value: rec.vitalSigns?.temperature, unit: '°C' },
                    { label: 'Weight', value: rec.vitalSigns?.weight, unit: 'kg' },
                    { label: 'Height', value: rec.vitalSigns?.height, unit: 'cm' },
                  ].map(({ label, value, unit }) => (
                    <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 15 }}>{value || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{unit}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="msEyebrow" style={{ marginBottom: 14 }}>3 · Diagnosis & treatment</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Diagnosis</div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{rec.diagnosis || '—'}</p>
                </div>
                {rec.treatment && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Treatment & therapy plan</div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{rec.treatment}</p>
                  </div>
                )}
              </Card>

              {rec.prescription?.length > 0 && (
                <Card>
                  <div className="msEyebrow" style={{ marginBottom: 14 }}>4 · Prescription</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rec.prescription.map((p, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr 1fr', gap: 8, padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Medicine</div><strong style={{ fontSize: 13 }}>{p.name}</strong></div>
                        <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Dose</div><span style={{ fontSize: 13 }}>{p.dosage || '—'}</span></div>
                        <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Frequency</div><span style={{ fontSize: 13 }}>{p.frequency || '—'}</span></div>
                        <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Duration</div><span style={{ fontSize: 13 }}>{p.duration || '—'}</span></div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {(rec.notes || rec.followUpDate) && (
                <Card>
                  <div className="msEyebrow" style={{ marginBottom: 14 }}>5 · Notes & follow-up</div>
                  {rec.notes && <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{rec.notes}</p>}
                  {rec.followUpDate && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--accent-soft)', borderRadius: 8, fontSize: 13, color: 'var(--accent)' }}>
                      <Icon name="calendar" size={13}/> Follow-up: {new Date(rec.followUpDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Right: patient info */}
            <div style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }} className="msStack-sm">
              <Card>
                <div className="msEyebrow" style={{ marginBottom: 10 }}>Patient data</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar initials={patientInitials} color="mauve" size={44}/>
                  <div>
                    <div style={{ fontWeight: 600 }}>{patientName}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {[patient?.gender, patientAge != null ? `${patientAge} years old` : null].filter(Boolean).join(' · ') || patient?.email}
                    </div>
                  </div>
                </div>
                {(patient?.bloodType || patient?.allergies?.length > 0) && (
                  <div style={{ padding: '10px 0' }}>
                    {patient?.bloodType && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: 'var(--muted)' }}>Blood type</span>
                        <strong style={{ fontFamily: 'var(--mono)' }}>{patient.bloodType}</strong>
                      </div>
                    )}
                    {patient?.allergies?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Allergies</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {patient.allergies.map(a => (
                            <span key={a} style={{ padding: '2px 8px', borderRadius: 6, background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 500 }}>⚠ {a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
              <Card style={{ background: 'var(--bg-2)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Recorded by</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{rec.doctorId?.userId?.name || 'Doctor'}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{rec.doctorId?.specialization}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{rec.doctorId?.clinicName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  Saved on {new Date(rec.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="msStack-md" style={{ maxWidth: 1080 }}>
      <button className="msBack" onClick={() => navigate('/doctor/dashboard')}>
        <Icon name="chevron-l" size={16}/> Back to dashboard
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="msEyebrow">Medical Record · Queue #{String(appointment?.queueNumber || 1).padStart(2, '00')}</div>
          <h1 className="msPageTitle">Enter examination results</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Avatar initials={patientInitials} color="mauve" size={36}/>
            <div>
              <strong>{patientName}</strong>
              <span style={{ color: 'var(--muted)' }}> · {appointment?.timeSlot}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" onClick={handleSaveDraft}>Save draft</Btn>
          <Btn variant="primary" icon="check" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save medical record'}
          </Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <div className="msStack-md">
          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>1 · Complaint & symptoms</div>
            <Textarea label="Chief complaint" value={form.chiefComplaint} onChange={v => setField('chiefComplaint', v)}
              placeholder="Patient's main complaint summarized from the anamnesis"/>
            <div style={{ marginTop: 12 }}>
              <span className="msField-lbl">Symptoms</span>
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
            <div className="msEyebrow" style={{ marginBottom: 14 }}>2 · Vital signs</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              <Input label="Blood pressure" value={form.bp} onChange={v => setField('bp', v)} hint="mmHg"/>
              <Input label="Heart rate" value={form.hr} onChange={v => setField('hr', v)} hint="bpm"/>
              <Input label="Temperature" value={form.temp} onChange={v => setField('temp', v)} hint="°C"/>
              <Input label="Weight" value={form.weight} onChange={v => setField('weight', v)} hint="kg" placeholder="70"/>
              <Input label="Height" value={form.height} onChange={v => setField('height', v)} hint="cm" placeholder="170"/>
            </div>
          </Card>

          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>3 · Diagnosis & treatment</div>
            <Input label="Diagnosis" value={form.diagnosis} onChange={v => setField('diagnosis', v)} placeholder="Example: Acute gastritis, hypertension grade I"/>
            <div style={{ marginTop: 12 }}>
              <Textarea label="Treatment & therapy plan" value={form.treatment} onChange={v => setField('treatment', v)}
                placeholder="Patient education, rest recommendations, medical procedures, etc."/>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="msEyebrow">4 · Prescription</div>
              <Btn variant="ghost" icon="plus" size="sm" onClick={addRx}>Add medicine</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.prescription.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr 1fr auto', gap: 8, padding: 12, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', alignItems: 'flex-end' }}>
                  <Input label={i === 0 ? 'Medicine name' : null} value={p.name} onChange={v => updRx(i, 'name', v)} placeholder="Paracetamol 500mg"/>
                  <Input label={i === 0 ? 'Dose' : null} value={p.dosage} onChange={v => updRx(i, 'dosage', v)} placeholder="1 tablet"/>
                  <Input label={i === 0 ? 'Frequency' : null} value={p.frequency} onChange={v => updRx(i, 'frequency', v)} placeholder="3x daily"/>
                  <Input label={i === 0 ? 'Duration' : null} value={p.duration} onChange={v => updRx(i, 'duration', v)} placeholder="5 days"/>
                  <button className="msIcon-btn" onClick={() => removeRx(i)} disabled={form.prescription.length === 1} style={{ alignSelf: 'flex-end', marginBottom: 2 }}>
                    <Icon name="x" size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>5 · Notes & follow-up</div>
            <Textarea label="Additional notes" value={form.notes} onChange={v => setField('notes', v)}/>
            <div style={{ marginTop: 12 }}>
              <Input label="Next follow-up date (optional)" type="date" value={form.followUpDate} onChange={v => setField('followUpDate', v)}/>
            </div>
          </Card>
        </div>

        {/* Right: AI hint + context */}
        <div style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }} className="msStack-sm">
          <Card style={{ background: 'var(--bg-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="sparkles" size={14} style={{ color: 'var(--accent)' }}/>
              <span className="msEyebrow" style={{ color: 'var(--accent)' }}>AI Suggestion</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
              Ensure the diagnosis is consistent with reported symptoms. Add a follow-up note if the condition requires ongoing monitoring.
            </p>
          </Card>

          <Card>
            <div className="msEyebrow" style={{ marginBottom: 10 }}>Patient data</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <Avatar initials={patientInitials} color="mauve" size={44}/>
              <div>
                <div style={{ fontWeight: 600 }}>{patientName}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {[patient?.gender, patientAge != null ? `${patientAge} years old` : null].filter(Boolean).join(' · ') || patient?.email}
                </div>
              </div>
            </div>

            {/* Patient medical info */}
            {(patient?.bloodType || patient?.allergies?.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                {patient?.bloodType && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--muted)' }}>Blood type</span>
                    <strong style={{ fontFamily: 'var(--mono)' }}>{patient.bloodType}</strong>
                  </div>
                )}
                {patient?.allergies?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Allergies</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {patient.allergies.map(a => (
                        <span key={a} style={{ padding: '2px 8px', borderRadius: 6, background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 500 }}>
                          ⚠ {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {appointment && (
              <div style={{ marginTop: 12 }}>
                <div className="msEyebrow">Appointment</div>
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })} · {appointment.timeSlot}
                </div>
                {appointment.notes && (
                  <div style={{ marginTop: 8, padding: 10, background: 'var(--bg-2)', borderRadius: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                    {appointment.notes}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Patient visit history panel from this doctor */}
          <Card padded={false}>
            <button
              onClick={() => setHistoryOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="file" size={15} style={{ color: 'var(--accent)' }}/>
                <span className="msEyebrow" style={{ color: 'var(--accent)' }}>
                  Your visit history ({history.length})
                </span>
              </div>
              <Icon name={historyOpen ? 'chevron-u' : 'chevron-d'} size={14} style={{ color: 'var(--muted)' }}/>
            </button>

            {historyOpen && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {history.length === 0 ? (
                  <div style={{ padding: '14px 18px', fontSize: 13, color: 'var(--muted)' }}>
                    No prior visit history.
                  </div>
                ) : history.map((rec, i) => (
                  <div key={rec._id} style={{
                    padding: '12px 18px',
                    borderTop: i ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(rec.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{rec.diagnosis}</div>
                    {rec.chiefComplaint && (
                      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Complaint: {rec.chiefComplaint}</div>
                    )}
                    {rec.prescription?.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                        💊 {rec.prescription.map(p => p.name).join(', ')}
                      </div>
                    )}
                    {rec.vitalSigns?.bloodPressure && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        BP: {rec.vitalSigns.bloodPressure}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {draftSaved && <Toast msg="Draft saved locally to your browser" onClose={() => setDraftSaved(false)}/>}
      {saved && <Toast msg="Medical record saved successfully" onClose={() => { setSaved(false); navigate('/doctor/dashboard'); }}/>}
    </div>
  );
};

export default DoctorRecord;
