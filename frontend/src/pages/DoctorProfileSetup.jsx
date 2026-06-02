import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Input, Textarea, Toast } from '../components/ui';

const SPECIALIZATIONS = [
  'Penyakit Dalam', 'Anak', 'Obstetri & Ginekologi', 'Bedah Umum',
  'Jantung & Pembuluh Darah', 'Saraf', 'Mata', 'THT',
  'Kulit & Kelamin', 'Ortopedi', 'Urologi', 'Psikiatri',
  'Paru', 'Gigi & Mulut', 'Umum',
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
  });

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
          });
          setIsEdit(true);
        }
      })
      .catch(() => { /* profil belum ada, mode create */ })
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.specialization || !form.licenseNumber || !form.clinicName || !form.city) {
      setToast('Spesialisasi, nomor STR, nama klinik, dan kota wajib diisi');
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
      setToast('Profil berhasil disimpan');
    } catch (err) {
      setToast(err.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', height: 300, color: 'var(--muted)' }}>
      Memuat…
    </div>
  );

  return (
    <div className="msStack-md" style={{ maxWidth: 780 }}>
      <div>
        <div className="msEyebrow">{isEdit ? 'Edit Profil' : 'Setup Profil'}</div>
        <h1 className="msPageTitle">{isEdit ? 'Perbarui profil praktik' : 'Lengkapi profil dokter'}</h1>
        {!isEdit && (
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>
            Profil akan ditinjau admin sebelum muncul di pencarian pasien.
          </p>
        )}
      </div>

      {/* Banner verifikasi pending */}
      {saved && !isEdit && (
        <div style={{ display: 'flex', gap: 12, padding: '14px 18px', background: 'var(--accent-soft)', borderRadius: 12, border: '1px solid var(--accent)' }}>
          <Icon name="info" size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}/>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>Profil menunggu verifikasi</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
              Admin akan meninjau profil Anda. Setelah diverifikasi, Anda akan muncul di pencarian pasien.
            </div>
          </div>
        </div>
      )}

      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Informasi profesional</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="msField-lbl">Spesialisasi *</label>
            <select value={form.specialization} onChange={e => set('specialization', e.target.value)}
              className="msPick" style={{ width: '100%', border: '1px solid var(--border)', marginTop: 6, background: 'var(--paper)', outline: 'none', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}>
              <option value="">— Pilih spesialisasi —</option>
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Nomor STR *" placeholder="STR-XX-2024-001" value={form.licenseNumber} onChange={v => set('licenseNumber', v)}/>
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Informasi klinik</div>
        <div className="msStack-sm">
          <Input label="Nama klinik *" placeholder="Klinik Pratama Sehat" value={form.clinicName} onChange={v => set('clinicName', v)}/>
          <Input label="Alamat klinik" placeholder="Jl. Mangkubumi No. 12" value={form.clinicAddress} onChange={v => set('clinicAddress', v)}/>
          <Input label="Kota *" placeholder="Yogyakarta" value={form.city} onChange={v => set('city', v)}/>
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 16 }}>Biaya & pembayaran</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
          <div>
            <label className="msField-lbl">Biaya konsultasi (Rp)</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 13 }}>Rp</span>
              <input type="number" min={0} placeholder="150000"
                value={form.consultationFee}
                onChange={e => set('consultationFee', e.target.value)}
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px 10px 36px', fontSize: 14, background: 'var(--paper)', outline: 'none', boxSizing: 'border-box' }}/>
            </div>
          </div>
          <div>
            <label className="msField-lbl">Pengalaman (tahun)</label>
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
                {form.acceptBPJS ? 'Menerima BPJS' : 'Tidak menerima BPJS'}
              </span>
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <Textarea label="Bio / deskripsi singkat"
          hint="Pengalaman, fokus praktik, atau hal yang ingin pasien tahu."
          placeholder="Dokter spesialis penyakit dalam dengan pengalaman 10 tahun..."
          value={form.bio} onChange={v => set('bio', v)} rows={4}/>
      </Card>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {isEdit && (
          <Btn variant="ghost" onClick={() => navigate('/doctor/dashboard')}>Kembali ke dashboard</Btn>
        )}
        <Btn variant="primary" icon="check" disabled={saving} onClick={handleSave}>
          {saving ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Simpan & lanjutkan'}
        </Btn>
      </div>

      {saved && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" icon="calendar" onClick={() => navigate('/doctor/schedule')}>
            Atur jadwal praktik
          </Btn>
          <Btn variant="ghost" onClick={() => navigate('/doctor/dashboard')}>
            Ke dashboard
          </Btn>
        </div>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default DoctorProfileSetup;
