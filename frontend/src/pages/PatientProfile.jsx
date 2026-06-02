import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Input, Toast } from '../components/ui';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS    = ['Male', 'Female'];

const calcAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const PatientProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [allergyInput, setAllergyInput] = useState('');

  const [form, setForm] = useState({
    name:        '',
    phone:       '',
    dateOfBirth: '',
    gender:      '',
    bloodType:   '',
    allergies:   [],
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name:        user.name        || '',
      phone:       user.phone       || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      gender:      user.gender      || '',
      bloodType:   user.bloodType   || '',
      allergies:   user.allergies   || [],
    });
  }, [user]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (!val || form.allergies.includes(val)) return;
    set('allergies', [...form.allergies, val]);
    setAllergyInput('');
  };

  const removeAllergy = (a) => set('allergies', form.allergies.filter(x => x !== a));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      await refreshUser();   // refresh user context so form doesn't reset to old data
      setToast('Profile saved successfully');
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const age = calcAge(form.dateOfBirth);

  const isProfileComplete = !!(form.dateOfBirth && form.gender);

  return (
    <div className="msStack-md" style={{ maxWidth: 680 }}>
      <div>
        <div className="msEyebrow">Patient Account</div>
        <h1 className="msPageTitle">{isOnboarding ? 'Complete your profile' : 'My profile'}</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          This information helps doctors provide the right care.
        </p>
      </div>

      {/* Onboarding banner */}
      {isOnboarding && (
        <div style={{ display: 'flex', gap: 14, padding: '16px 20px', background: 'var(--accent-soft)', borderRadius: 12, border: '1px solid var(--accent)' }}>
          <Icon name="info" size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}/>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>Welcome to MediSlot!</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Before booking a doctor, please complete your personal data.
              This data helps doctors prepare the right examination.
              <br/>
              <strong>Required:</strong> Date of birth and gender.
            </div>
          </div>
        </div>
      )}

      {/* Completeness indicator */}
      {!isProfileComplete && (
        <div style={{ display: 'flex', gap: 10, padding: '10px 16px', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FCD34D', alignItems: 'center' }}>
          <Icon name="warn" size={16} style={{ color: '#92400E', flexShrink: 0 }}/>
          <span style={{ fontSize: 13, color: '#92400E' }}>
            Profile incomplete — fill in <strong>date of birth</strong> and <strong>gender</strong> to be able to book a doctor.
          </span>
        </div>
      )}

      {/* Basic info */}
      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Basic information</div>
        <div className="msStack-sm">
          <Input label="Full name" value={form.name} onChange={v => set('name', v)} placeholder="Jane Doe"/>
          <Input label="Phone number" value={form.phone} onChange={v => set('phone', v)} placeholder="081234567890"/>
        </div>
      </Card>

      {/* Medical data */}
      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Medical data</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input label={`Date of birth${age != null ? ` (${age} years old)` : ''}`}
              type="date" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)}/>
          </div>
          <div>
            <label className="msField-lbl">Gender</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {GENDERS.map(g => (
                <button key={g} type="button" onClick={() => set('gender', g)}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: `1px solid ${form.gender === g ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.gender === g ? 'var(--accent-soft)' : 'var(--paper)',
                    color: form.gender === g ? 'var(--accent)' : 'var(--ink-2)',
                    cursor: 'pointer',
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="msField-lbl">Blood type</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {BLOOD_TYPES.map(bt => (
                <button key={bt} type="button" onClick={() => set('bloodType', bt)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${form.bloodType === bt ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.bloodType === bt ? 'var(--accent-soft)' : 'var(--paper)',
                    color: form.bloodType === bt ? 'var(--accent)' : 'var(--ink-2)',
                    cursor: 'pointer',
                  }}>
                  {bt}
                </button>
              ))}
              {form.bloodType && (
                <button type="button" onClick={() => set('bloodType', '')}
                  style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Allergies */}
      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 6 }}>Known allergies</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          Inform about medicines, foods, or substances that cause allergic reactions.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={allergyInput}
            onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
            placeholder="Example: Penicillin, Seafood, Dust…"
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: 'var(--paper)', outline: 'none' }}
          />
          <Btn variant="secondary" onClick={addAllergy}>Add</Btn>
        </div>

        {form.allergies.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>No allergies recorded yet.</div>
        ) : (
          <div className="msChip-row">
            {form.allergies.map(a => (
              <span key={a} className="msChip msChip-active" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {a}
                <button type="button" onClick={() => removeAllergy(a)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'inherit', fontSize: 14 }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {isOnboarding && isProfileComplete && (
          <Btn variant="ghost" onClick={() => navigate('/')}>Skip</Btn>
        )}
        <Btn variant="primary" icon="check" disabled={saving} onClick={async () => {
          await handleSave();
          if (isOnboarding && form.dateOfBirth && form.gender) {
            setTimeout(() => navigate('/doctors'), 1200);
          }
        }}>
          {saving ? 'Saving…' : isOnboarding ? 'Save & start finding doctors' : 'Save profile'}
        </Btn>
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default PatientProfile;
