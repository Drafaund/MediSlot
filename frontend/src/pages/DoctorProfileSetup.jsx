import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Input, Textarea, Toast } from '../components/ui';

const SPECIALIZATIONS = [
  'Dokter Umum', 'Penyakit Dalam', 'Anak', 'Kandungan',
  'Bedah Umum', 'Jantung & Pembuluh Darah', 'Saraf', 'Mata',
  'THT', 'Kulit & Kelamin', 'Ortopedi', 'Urologi',
  'Psikiatri', 'Paru', 'Gigi & Mulut',
];

const DoctorProfileSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [toast, setToast] = useState(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    specialization: '',
    licenseNumber: '',
    clinicName: '',
    clinicAddress: '',
    city: '',
    consultationFee: '',
    yearsOfExperience: '',
    acceptBPJS: false,
    bio: '',
    additionalDegrees: [],
  });
  const [degreeInput, setDegreeInput] = useState('');

  useEffect(() => {
    api.get('/doctors/my-profile')
      .then(({ data }) => {
        if (data.data) {
          const p = data.data;
          setForm({
            specialization: p.specialization || '',
            licenseNumber: p.licenseNumber || '',
            clinicName: p.clinicName || '',
            clinicAddress: p.clinicAddress || '',
            city: p.city || '',
            consultationFee: p.consultationFee?.toString() || '',
            yearsOfExperience: p.yearsOfExperience != null ? p.yearsOfExperience.toString() : '',
            acceptBPJS: p.acceptBPJS || false,
            bio: p.bio || '',
            additionalDegrees: p.additionalDegrees || [],
          });
          setIsEdit(true);
        }
      })
      .catch(() => { /* profile doesn't exist yet, create mode */ })
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.specialization || !form.licenseNumber || !form.clinicName || !form.city) {
      setToast('Specialization, license number, clinic name, and city are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        consultationFee: Number(form.consultationFee) || 0,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
      };
      if (isEdit) {
        await api.put('/doctors/profile', payload);
      } else {
        await api.post('/doctors/profile', payload);
        setIsEdit(true);
      }
      setSaved(true);
      setToast('Profile saved successfully');
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', height: 300, color: 'var(--muted)' }}>
      Loading…
    </div>
  );

  return (
    <div className="msStack-md" style={{ maxWidth: 780 }}>
      <div>
        <div className="msEyebrow">{isEdit ? 'Edit Profile' : 'Profile Setup'}</div>
        <h1 className="msPageTitle">{isEdit ? 'Update practice profile' : 'Complete doctor profile'}</h1>
        {!isEdit && (
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>
            Your profile will be reviewed by admin before appearing in patient search.
          </p>
        )}
      </div>

      {/* Pending verification banner */}
      {saved && !isEdit && (
        <div style={{ display: 'flex', gap: 12, padding: '14px 18px', background: 'var(--accent-soft)', borderRadius: 12, border: '1px solid var(--accent)' }}>
          <Icon name="info" size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}/>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>Profile pending verification</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
              Admin will review your profile. Once verified, you will appear in patient search.
            </div>
          </div>
        </div>
      )}

      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Professional information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="msField-lbl">Specialization *</label>
            <select value={form.specialization} onChange={e => set('specialization', e.target.value)}
              className="msPick" style={{ width: '100%', border: '1px solid var(--border)', marginTop: 6, background: 'var(--paper)', outline: 'none', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}>
              <option value="">— Select specialization —</option>
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input label="License Number (STR) *" placeholder="STR-XX-2024-001" value={form.licenseNumber} onChange={v => set('licenseNumber', v)}/>
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Clinic information</div>
        <div className="msStack-sm">
          <Input label="Clinic name *" placeholder="Pratama Health Clinic" value={form.clinicName} onChange={v => set('clinicName', v)}/>
          <Input label="Clinic address" placeholder="Jl. Mangkubumi No. 12" value={form.clinicAddress} onChange={v => set('clinicAddress', v)}/>
          <Input label="City *" placeholder="Yogyakarta" value={form.city} onChange={v => set('city', v)}/>
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Fees & payment</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
          <div>
            <label className="msField-lbl">Consultation fee (Rp)</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 13 }}>Rp</span>
              <input type="number" min={0} placeholder="150000"
                value={form.consultationFee}
                onChange={e => set('consultationFee', e.target.value)}
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px 10px 36px', fontSize: 14, background: 'var(--paper)', outline: 'none', boxSizing: 'border-box' }}/>
            </div>
          </div>
          <div>
            <label className="msField-lbl">Experience (years)</label>
            <input type="number" min={0} max={60} placeholder="10"
              value={form.yearsOfExperience}
              onChange={e => set('yearsOfExperience', e.target.value)}
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, background: 'var(--paper)', outline: 'none', boxSizing: 'border-box', marginTop: 6 }}/>
          </div>
          <div>
            <label className="msField-lbl">BPJS Kesehatan</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, cursor: 'pointer' }}>
              <label className="msToggle msToggle-md">
                <input type="checkbox" checked={form.acceptBPJS} onChange={e => set('acceptBPJS', e.target.checked)}/>
                <span className="msToggle-track"/>
              </label>
              <span style={{ fontSize: 14, color: form.acceptBPJS ? 'var(--accent)' : 'var(--muted)' }}>
                {form.acceptBPJS ? 'Accepts BPJS' : 'Does not accept BPJS'}
              </span>
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 8 }}>Additional degrees</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          Sub-specializations, academic degrees, or other certifications (e.g. M.Kes, Ph.D, Sp.PD-KEMD).
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={degreeInput}
            onChange={e => setDegreeInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = degreeInput.trim();
                if (val && !form.additionalDegrees.includes(val)) {
                  set('additionalDegrees', [...form.additionalDegrees, val]);
                }
                setDegreeInput('');
              }
            }}
            placeholder="Example: Sp.PD-KEMD, M.Kes…"
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: 'var(--paper)', outline: 'none' }}
          />
          <button type="button" onClick={() => {
            const val = degreeInput.trim();
            if (val && !form.additionalDegrees.includes(val)) set('additionalDegrees', [...form.additionalDegrees, val]);
            setDegreeInput('');
          }} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--paper)', cursor: 'pointer', fontSize: 13 }}>
            Add
          </button>
        </div>
        {form.additionalDegrees.length > 0 && (
          <div className="msChip-row">
            {form.additionalDegrees.map(d => (
              <span key={d} className="msChip msChip-active" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {d}
                <button type="button" onClick={() => set('additionalDegrees', form.additionalDegrees.filter(x => x !== d))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: 14 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <Textarea label="Bio / brief description"
          hint="Experience, practice focus, or anything patients should know."
          placeholder="Internal medicine specialist with 10 years of experience..."
          value={form.bio} onChange={v => set('bio', v)} rows={4}/>
      </Card>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {isEdit && (
          <Btn variant="ghost" onClick={() => navigate('/doctor/dashboard')}>Back to dashboard</Btn>
        )}
        <Btn variant="primary" icon="check" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save & continue'}
        </Btn>
      </div>

      {saved && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" icon="calendar" onClick={() => navigate('/doctor/schedule')}>
            Set practice schedule
          </Btn>
          <Btn variant="ghost" onClick={() => navigate('/doctor/dashboard')}>
            Go to dashboard
          </Btn>
        </div>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default DoctorProfileSetup;
