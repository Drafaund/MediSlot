import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Badge, Btn, Textarea, Select } from '../components/ui';

const SYMPTOM_CHIPS = ['High fever for 3 days', 'Chest pain when climbing stairs', 'Worsening acne for 2 months', 'Fussy child & rash', 'Fatigue & frequent thirst', 'Vertigo'];
const DURATIONS = ['Less than 24 hours', '1–3 days', '4–7 days', '1–4 weeks', 'More than 1 month'];
const AGE_GROUPS = ['Infant (0–1 year)', 'Child (2–12 years)', 'Teenager (13–17)', 'Adult (18–59)', 'Elderly (60+)'];

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
        setError('AI is busy, please try again in a few seconds.');
      } else {
        setError('Failed to connect to AI. Make sure your internet connection is active and try again.');
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
          Tell us what you <span style={{ color: 'var(--accent)' }}>are feeling</span>.<br/>
          AI will recommend the right specialist.
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 12, maxWidth: 540, fontSize: 15, lineHeight: 1.5 }}>
          This is not a medical diagnosis — just an initial guide so you don't choose the wrong doctor.
          For emergencies, go to the nearest emergency room immediately.
        </p>
      </div>

      {step === 0 && (
        <Card padded={false}>
          <div style={{ padding: 28 }}>
            <div className="msStep-bar">
              <StepDot n="1" active/><div className="msStep-line"/><StepDot n="2"/><div className="msStep-line"/><StepDot n="3"/>
            </div>
            <h3 style={{ marginTop: 18, fontSize: 20, fontFamily: 'var(--serif)', fontWeight: 600 }}>What is your main complaint?</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Write in your own words. The more detailed, the better.</p>
            <div style={{ marginTop: 20 }}>
              <Textarea value={symptoms} onChange={setSymptoms} rows={5}
                placeholder="Example: For the past 3 days I have been feeling weak, frequently thirsty, and urinating more than usual…"/>
            </div>
            <div className="msChip-row" style={{ marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 4 }}>Examples:</span>
              {SYMPTOM_CHIPS.map(c => (
                <button key={c} className="msChip" onClick={() => setSymptoms(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="msCardFoot">
            <Btn variant="ghost" onClick={() => navigate('/')}>Cancel</Btn>
            <Btn variant="primary" iconRight="arrow-r" disabled={!symptoms.trim()} onClick={() => setStep(1)}>Next</Btn>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card padded={false}>
          <div style={{ padding: 28 }}>
            <div className="msStep-bar">
              <StepDot n="1" done/><div className="msStep-line msStep-line-done"/><StepDot n="2" active/><div className="msStep-line"/><StepDot n="3"/>
            </div>
            <h3 style={{ marginTop: 18, fontSize: 20, fontFamily: 'var(--serif)', fontWeight: 600 }}>Additional context</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Two quick questions for more accurate recommendations.</p>
            <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Select label="How long has it been?" value={duration} onChange={setDuration} placeholder="Select duration" options={DURATIONS}/>
              <Select label="Patient age" value={age} onChange={setAge} placeholder="Select age group" options={AGE_GROUPS}/>
            </div>
            <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Icon name="info" size={16} style={{ color: 'var(--accent)', marginTop: 2 }}/>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  The data you enter is not stored by third parties. It is only used once for this recommendation.
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
            <Btn variant="ghost" icon="arrow-l" onClick={() => setStep(0)}>Back</Btn>
            <Btn variant="primary" iconRight="sparkles" disabled={!duration || !age || loading} onClick={analyze}>
              {loading ? 'Analyzing…' : 'Analyze with AI'}
            </Btn>
          </div>
        </Card>
      )}

      {step === 1 && loading && (
        <Card>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="msLoad-orb"/>
            <div style={{ marginTop: 18, color: 'var(--muted)' }}>AI is analyzing your symptoms…</div>
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
              <Badge tone="sage" icon="sparkles">AI analysis results</Badge>
              <Badge tone="amber">Urgency: {result.urgency || 'low'}</Badge>
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
              Based on your symptoms, here are our recommendations:
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Sorted by match level</p>
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
                    Find this specialist <Icon name="arrow-r" size={14}/>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <div style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
            <Btn variant="secondary" icon="arrow-l" onClick={reset}>Check other symptoms</Btn>
            <Btn variant="ghost" onClick={() => navigate('/')}>Back to home</Btn>
          </div>

          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Icon name="warn" size={20} style={{ color: '#C8632C', flexShrink: 0, marginTop: 2 }}/>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                <strong>Disclaimer:</strong> These recommendations are generated by AI and are <strong>not an official medical diagnosis</strong>.
                Always consult with a doctor for an appropriate diagnosis. If your condition worsens, go to the nearest emergency room immediately.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
