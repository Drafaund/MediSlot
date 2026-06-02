import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Toast } from '../components/ui';

const DAYS = [
  { label: 'Monday', idx: 1 }, { label: 'Tuesday', idx: 2 }, { label: 'Wednesday', idx: 3 },
  { label: 'Thursday', idx: 4 }, { label: 'Friday', idx: 5 }, { label: 'Saturday', idx: 6 },
  { label: 'Sunday', idx: 0 },
];

const DEFAULT_SCHEDULE = DAYS.map(d => ({
  dayOfWeek: d.idx,
  day: d.label,
  active: [1, 2, 3, 5].includes(d.idx),
  startTime: '08:00', endTime: '12:00', slotDuration: 30, maxPatients: 8, _id: null,
}));

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/doctors/my-profile');
        const doctorId = data.data?._id;
        if (!doctorId) return;
        const schRes = await api.get(`/schedules/${doctorId}`);
        const existing = schRes.data.data || [];
        if (existing.length > 0) {
          setSchedule(DAYS.map(d => {
            const found = existing.find(s => s.dayOfWeek === d.idx);
            return {
              dayOfWeek: d.idx, day: d.label,
              active: found ? found.isActive : false,
              startTime: found?.startTime || '08:00',
              endTime: found?.endTime || '12:00',
              slotDuration: found?.slotDuration || 30,
              maxPatients: found?.maxPatients || 8,
              _id: found?._id || null,
            };
          }));
        }
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const toggleDay = (idx) => setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, active: !s.active } : s));
  const updateField = (idx, key, val) => setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, [key]: val } : s));

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const s of schedule) {
        const payload = { dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, slotDuration: s.slotDuration, maxPatients: s.maxPatients, isActive: s.active };
        if (s._id) {
          await api.put(`/schedules/${s._id}`, payload);
        } else if (s.active) {
          await api.post('/schedules', payload);
        }
      }
      setToast('Schedule saved successfully');
    } catch {
      setToast('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const totalSlots = schedule.filter(s => s.active).reduce((acc, s) => acc + s.maxPatients, 0);

  return (
    <div className="msStack-md" style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="msEyebrow">Practice Schedule</div>
          <h1 className="msPageTitle">Manage weekly slots</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>Changes sync immediately to patient bookings</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" icon="x" onClick={() => navigate('/doctor/dashboard')}>Cancel</Btn>
          <Btn variant="primary" icon="check" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </Btn>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 400, borderRadius: 14, background: 'var(--bg-2)' }}/>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <Card padded={false}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>Weekly schedule</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Click toggle to enable/disable days</div>
            </div>
            <div>
              {schedule.map((s, i) => (
                <div key={s.dayOfWeek} className={`msSched-row ${!s.active ? 'msSched-row-off' : ''}`}>
                  <label className="msToggle msToggle-md">
                    <input type="checkbox" checked={s.active} onChange={() => toggleDay(i)}/>
                    <span className="msToggle-track"/>
                  </label>
                  <div style={{ minWidth: 88 }}>
                    <strong style={{ fontSize: 15 }}>{s.day}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, opacity: s.active ? 1 : 0.4 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Start</span>
                    <input type="time" value={s.startTime} onChange={e => updateField(i, 'startTime', e.target.value)}
                      disabled={!s.active} className="msPick" style={{ border: '1px solid var(--border)', outline: 'none', background: 'var(--paper)' }}/>
                    <span style={{ color: 'var(--muted)' }}>→</span>
                    <input type="time" value={s.endTime} onChange={e => updateField(i, 'endTime', e.target.value)}
                      disabled={!s.active} className="msPick" style={{ border: '1px solid var(--border)', outline: 'none', background: 'var(--paper)' }}/>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140, opacity: s.active ? 1 : 0.4 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Slot</span>
                    <select value={s.slotDuration} onChange={e => updateField(i, 'slotDuration', Number(e.target.value))}
                      disabled={!s.active} className="msPick" style={{ border: '1px solid var(--border)', outline: 'none', background: 'var(--paper)' }}>
                      {[15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} min</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130, opacity: s.active ? 1 : 0.4 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Max</span>
                    <input type="number" min={1} max={30} value={s.maxPatients} onChange={e => updateField(i, 'maxPatients', Number(e.target.value))}
                      disabled={!s.active} className="msPick" style={{ width: 60, border: '1px solid var(--border)', outline: 'none', background: 'var(--paper)' }}/>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>patients</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="msStack-sm">
            <Card>
              <div className="msEyebrow">Weekly capacity</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 36, marginTop: 6, fontWeight: 600 }}>
                {totalSlots} <span style={{ fontSize: 16, color: 'var(--muted)' }}>slots / week</span>
              </div>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {schedule.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((s) => (
                  <div key={s.dayOfWeek} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{s.day.slice(0, 3)}</div>
                    <div style={{ height: 40, borderRadius: 6, background: s.active ? 'var(--accent)' : 'var(--bg-2)', color: s.active ? 'var(--paper)' : 'var(--muted)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600 }}>
                      {s.active ? s.maxPatients : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="msEyebrow">Info</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10 }}>
                <Icon name="info" size={16} style={{ color: 'var(--accent)', marginTop: 2 }}/>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                  Patients can only book on the days and times you have enabled. Changes apply to slots that have not yet been booked.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default DoctorSchedule;
