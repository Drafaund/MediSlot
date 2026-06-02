import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Avatar, Input, Textarea, Toast, Badge } from '../components/ui';

const SYMPTOM_CHIPS = ['Fever', 'Cough', 'Runny nose', 'Epigastric pain', 'Fatigue', 'Nausea', 'Dizziness', 'Shortness of breath', 'Chest pain', 'Insomnia'];

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

        // Fetch patient's medical record history created by this doctor
        const patientId = appt.patientId?._id || appt.patientId;
        if (patientId) {
          api.get(`/medical-records/patient/${patientId}`)
            .then(r => setHistory(r.data.data || []))
            .catch(() => { /* patient has no prior history */ });
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
      alert(err.response?.data?.message || 'Failed to save medical record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>;

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
          <Btn variant="ghost" onClick={() => handleSave()}>Save draft</Btn>
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

      {saved && <Toast msg="Medical record saved successfully" onClose={() => { setSaved(false); navigate('/doctor/dashboard'); }}/>}
    </div>
  );
};

export default DoctorRecord;
