import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Badge, Btn, Textarea, Select } from '../components/ui';

const SYMPTOM_CHIPS = ['Demam tinggi 3 hari', 'Nyeri dada saat naik tangga', 'Jerawat memburuk 2 bulan', 'Anak rewel & ruam', 'Lemas & sering haus', 'Pusing berputar'];
const DURATIONS = ['Kurang dari 24 jam', '1–3 hari', '4–7 hari', '1–4 minggu', 'Lebih dari 1 bulan'];
const AGE_GROUPS = ['Bayi (0–1 tahun)', 'Anak (2–12 tahun)', 'Remaja (13–17)', 'Dewasa (18–59)', 'Lansia (60+)'];

const StepDot = ({ n, active, done }) => (
  <div className={`msStep-dot ${active ? 'msStep-active' : ''} ${done ? 'msStep-done' : ''}`}>
    {done ? <Icon name="check" size={14}/> : n}
  </div>
);

const SymptomChecker = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/symptom-check', { symptoms, duration, ageGroup: age });
      setResult(data.data);
      setStep(2);
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.includes('RetryInfo') || msg.includes('quota') || err?.response?.status === 429) {
        setError('AI sedang sibuk, coba lagi dalam beberapa detik.');
      } else {
        setError('Gagal menghubungi AI. Pastikan koneksi internet aktif dan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep(0); setSymptoms(''); setDuration(''); setAge(''); setResult(null); setError(''); };

  return (
    <div className="msStack-lg" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="msAI-hero">
        <div className="msAI-pill"><Icon name="sparkles" size={14}/> MediSlot AI · Symptom Checker</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1.1, marginTop: 18, fontWeight: 600 }}>
          Ceritakan apa yang <span style={{ color: 'var(--accent)' }}>kamu rasakan</span>.<br/>
          AI akan rekomendasikan spesialis yang tepat.
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 12, maxWidth: 540, fontSize: 15, lineHeight: 1.5 }}>
          Ini bukan diagnosa medis — hanya panduan awal agar kamu tidak salah pilih dokter.
          Untuk kondisi darurat, segera ke IGD terdekat.
        </p>
      </div>

      {step === 0 && (
        <Card padded={false}>
          <div style={{ padding: 28 }}>
            <div className="msStep-bar">
              <StepDot n="1" active/><div className="msStep-line"/><StepDot n="2"/><div className="msStep-line"/><StepDot n="3"/>
            </div>
            <h3 style={{ marginTop: 18, fontSize: 20, fontFamily: 'var(--serif)', fontWeight: 600 }}>Apa keluhan utamamu?</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Tulis dengan bahasamu sendiri. Semakin detail, semakin baik.</p>
            <div style={{ marginTop: 20 }}>
              <Textarea value={symptoms} onChange={setSymptoms} rows={5}
                placeholder="Contoh: Sudah 3 hari ini saya merasa lemas, sering haus, dan buang air kecil lebih dari biasanya…"/>
            </div>
            <div className="msChip-row" style={{ marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 4 }}>Contoh:</span>
              {SYMPTOM_CHIPS.map(c => (
                <button key={c} className="msChip" onClick={() => setSymptoms(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="msCardFoot">
            <Btn variant="ghost" onClick={() => navigate('/')}>Batal</Btn>
            <Btn variant="primary" iconRight="arrow-r" disabled={!symptoms.trim()} onClick={() => setStep(1)}>Lanjut</Btn>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card padded={false}>
          <div style={{ padding: 28 }}>
            <div className="msStep-bar">
              <StepDot n="1" done/><div className="msStep-line msStep-line-done"/><StepDot n="2" active/><div className="msStep-line"/><StepDot n="3"/>
            </div>
            <h3 style={{ marginTop: 18, fontSize: 20, fontFamily: 'var(--serif)', fontWeight: 600 }}>Konteks tambahan</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Dua pertanyaan singkat agar rekomendasi lebih akurat.</p>
            <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Select label="Sudah berapa lama?" value={duration} onChange={setDuration} placeholder="Pilih durasi" options={DURATIONS}/>
              <Select label="Usia pasien" value={age} onChange={setAge} placeholder="Pilih kelompok usia" options={AGE_GROUPS}/>
            </div>
            <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Icon name="info" size={16} style={{ color: 'var(--accent)', marginTop: 2 }}/>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  Data yang kamu masukkan tidak disimpan oleh pihak ketiga. Hanya digunakan satu kali untuk rekomendasi ini.
                </div>
              </div>
            </div>
          </div>
          {error && (
            <div style={{ margin: '0 28px 16px', padding: '12px 14px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', fontSize: 13, color: '#B91C1C', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Icon name="warn" size={15}/> {error}
            </div>
          )}
          <div className="msCardFoot">
            <Btn variant="ghost" icon="arrow-l" onClick={() => setStep(0)}>Kembali</Btn>
            <Btn variant="primary" iconRight="sparkles" disabled={!duration || !age || loading} onClick={analyze}>
              {loading ? 'Menganalisis…' : 'Analisis dengan AI'}
            </Btn>
          </div>
        </Card>
      )}

      {step === 1 && loading && (
        <Card>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="msLoad-orb"/>
            <div style={{ marginTop: 18, color: 'var(--muted)' }}>AI sedang menganalisis gejalamu…</div>
          </div>
        </Card>
      )}

      {step === 2 && result && (
        <div className="msStack-md">
          <Card>
            <div className="msStep-bar" style={{ marginBottom: 18 }}>
              <StepDot n="1" done/><div className="msStep-line msStep-line-done"/><StepDot n="2" done/><div className="msStep-line msStep-line-done"/><StepDot n="3" active/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Badge tone="sage" icon="sparkles">Hasil analisis AI</Badge>
              <Badge tone="amber">Urgensi: {result.urgency || 'rendah'}</Badge>
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
              Berdasarkan gejalamu, ini rekomendasi kami:
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Urut berdasarkan tingkat kecocokan</p>
            {result.explanation && (
              <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                {result.explanation}
              </p>
            )}
          </Card>

          {(result.recs || result.recommendations || []).map((r, i) => (
            <Card key={i} hover onClick={() => navigate('/doctors')}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'var(--serif)', fontSize: 22 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600, fontSize: 17 }}>{r.spec || r.specialization}</div>
                    {r.conf && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="msConf-bar"><div style={{ width: `${r.conf}%`, background: 'var(--accent)' }}/></div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{r.conf}%</span>
                      </div>
                    )}
                  </div>
                  <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>{r.why || r.reason}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'var(--accent)', fontWeight: 500, fontSize: 14 }}>
                    Cari dokter spesialis ini <Icon name="arrow-r" size={14}/>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <div style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
            <Btn variant="secondary" icon="arrow-l" onClick={reset}>Cek gejala lain</Btn>
            <Btn variant="ghost" onClick={() => navigate('/')}>Kembali ke beranda</Btn>
          </div>

          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Icon name="warn" size={20} style={{ color: '#C8632C', flexShrink: 0, marginTop: 2 }}/>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                <strong>Disclaimer:</strong> Rekomendasi ini dihasilkan oleh AI dan <strong>bukan diagnosa medis resmi</strong>.
                Selalu konsultasikan dengan dokter untuk diagnosa yang sesuai. Jika kondisi memburuk, segera ke IGD terdekat.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
