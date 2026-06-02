import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, Btn, Input, Toast } from '../components/ui';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS    = ['Laki-laki', 'Perempuan'];

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
      await refreshUser();   // perbarui user context agar form tidak reset ke data lama
      setToast('Profil berhasil disimpan');
    } catch (err) {
      setToast(err.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const age = calcAge(form.dateOfBirth);

  return (
    <div className="msStack-md" style={{ maxWidth: 680 }}>
      <div>
        <div className="msEyebrow">Akun Pasien</div>
        <h1 className="msPageTitle">Profil saya</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          Informasi ini membantu dokter memberikan penanganan yang tepat.
        </p>
      </div>

      {/* Info dasar */}
      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Informasi dasar</div>
        <div className="msStack-sm">
          <Input label="Nama lengkap" value={form.name} onChange={v => set('name', v)} placeholder="Sri Lestari"/>
          <Input label="Nomor telepon" value={form.phone} onChange={v => set('phone', v)} placeholder="081234567890"/>
        </div>
      </Card>

      {/* Data medis */}
      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Data medis</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input label={`Tanggal lahir${age != null ? ` (${age} tahun)` : ''}`}
              type="date" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)}/>
          </div>
          <div>
            <label className="msField-lbl">Jenis kelamin</label>
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
            <label className="msField-lbl">Golongan darah</label>
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

      {/* Alergi */}
      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 6 }}>Alergi yang diketahui</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          Informasikan obat, makanan, atau zat yang menyebabkan reaksi alergi.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={allergyInput}
            onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
            placeholder="Contoh: Penisilin, Seafood, Debu…"
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: 'var(--paper)', outline: 'none' }}
          />
          <Btn variant="secondary" onClick={addAllergy}>Tambah</Btn>
        </div>

        {form.allergies.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>Belum ada alergi yang dicatat.</div>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="primary" icon="check" disabled={saving} onClick={handleSave}>
          {saving ? 'Menyimpan…' : 'Simpan profil'}
        </Btn>
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default PatientProfile;
