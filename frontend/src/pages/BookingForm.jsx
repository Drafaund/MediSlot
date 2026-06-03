import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Icon, Card, Badge, Avatar, Btn, Textarea, Empty, formatIDR } from '../components/ui';
import { formatDoctorName } from '../utils/doctorName';

const generateDates = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayNum: d.getDate(),
    });
  }
  return dates;
};

const BookingForm = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // All hooks must be called before any conditional return (Rules of Hooks)
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('select');

  const dates = generateDates();
  const [selDateIdx, setSelDateIdx] = useState(0);
  const [selTime, setSelTime] = useState(null);
  const [paymentType, setPaymentType] = useState('umum');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookedAppt, setBookedAppt] = useState(null);

  // Check profile after all hooks — not before
  const profileIncomplete = !user?.dateOfBirth || !user?.gender;

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const { data } = await api.get(`/doctors/${doctorId}`);
        setDoctor(data.data);
      } catch { /* fail silently */ }
      finally { setLoading(false); }
    };
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    setSlotsLoading(true);
    setSelTime(null);
    api.get(`/schedules/${doctorId}/slots?date=${dates[selDateIdx].dateStr}`)
      .then(({ data }) => setAvailableSlots(data.data || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
    // eslint-disable-next-line
  }, [selDateIdx, doctorId]);

  const handleBook = async () => {
    if (!selTime) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/appointments', {
        doctorId,
        date: dates[selDateIdx].dateStr,
        timeSlot: selTime,
        notes,
      });
      setBookedAppt(data.data);
      setStep('done');
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>;
  if (!doctor) return <Empty icon="user" title="Doctor not found" action={<Btn variant="secondary" onClick={() => navigate('/doctors')}>Back</Btn>}/>;

  const d = doctor;
  const rawName = d.userId?.name || d.name || 'Doctor';
  const doctorName = formatDoctorName(rawName, d.specialization, d.additionalDegrees);
  const initials = rawName.split(' ').map(x => x[0]).slice(0, 2).join('');

  const slotTimes = availableSlots.map(s => ({ time: typeof s === 'string' ? s : s.time, taken: false }));

  // Profile guard — after all hooks
  if (profileIncomplete) {
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <Icon name="user" size={28} style={{ color: 'var(--accent)' }}/>
        </div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, marginBottom: 10 }}>Complete your profile first</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Before booking, you need to fill in your date of birth and gender.
          This information is important so the doctor can prepare the right examination.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Btn variant="primary" icon="user" onClick={() => navigate('/profile?onboarding=true')}>
            Complete profile now
          </Btn>
          <Btn variant="ghost" onClick={() => navigate(-1)}>Back</Btn>
        </div>
      </div>
    );
  }

  if (step === 'done' && bookedAppt) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto 0', textAlign: 'center' }}>
        <div className="msSuccess">
          <Icon name="check" size={36} stroke={2}/>
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 600, marginTop: 24, lineHeight: 1.1 }}>
          <span style={{ color: 'var(--accent)' }}>Success!</span> Your appointment has been booked.
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: 15 }}>
          Confirmation has been sent to your email. The clinic will contact you if needed.
        </p>
        <Card style={{ marginTop: 32, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div>
              <div className="msEyebrow">Virtual queue number</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 56, fontWeight: 700, lineHeight: 1, color: 'var(--accent)', marginTop: 4 }}>
                #{String(bookedAppt.queueNumber || 7).padStart(2, '0')}
              </div>
            </div>
            <Badge tone="sage" icon="check-circ">Booking confirmed</Badge>
          </div>
          <div style={{ display: 'flex', gap: 16, paddingTop: 16, alignItems: 'center' }}>
            <Avatar initials={initials} color="sage" size={48}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{doctorName}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{d.clinicName}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div><div className="msEyebrow">Date</div><div style={{ marginTop: 4, fontWeight: 600 }}>{dates[selDateIdx].date} 2026</div></div>
            <div><div className="msEyebrow">Time</div><div style={{ marginTop: 4, fontWeight: 600 }}>{selTime}</div></div>
            <div><div className="msEyebrow">Payment</div><div style={{ marginTop: 4, fontWeight: 600 }}>{paymentType === 'bpjs' ? 'BPJS Kesehatan' : 'General'}</div></div>
            <div><div className="msEyebrow">Fee</div><div style={{ marginTop: 4, fontWeight: 600 }}>{paymentType === 'bpjs' ? 'Covered by BPJS' : formatIDR(d.consultationFee || 0)}</div></div>
          </div>
        </Card>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
          <Btn variant="primary" icon="calendar" onClick={() => navigate('/dashboard')}>View my appointments</Btn>
          <Btn variant="ghost" onClick={() => navigate('/')}>Back to home</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="msStack-md" style={{ maxWidth: 1040 }}>
      <button className="msBack" onClick={() => navigate(`/doctors/${doctorId}`)}>
        <Icon name="chevron-l" size={16}/> Back to doctor profile
      </button>
      <div>
        <div className="msEyebrow">Book appointment</div>
        <h1 className="msPageTitle">Choose a schedule with {doctorName}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'flex-start' }}>
        <div className="msStack-md">
          {/* Date picker */}
          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>1 · Select date</div>
            <div className="msDateScroll">
              {dates.map((dt, i) => (
                <button key={i} onClick={() => setSelDateIdx(i)} className={`msDate-pill ${selDateIdx === i ? 'msDate-pill-active' : ''}`}>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{dt.label}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 28, lineHeight: 1, margin: '4px 0' }}>{dt.dayNum}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{dt.date.split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Time picker */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="msEyebrow">2 · Select time — {dates[selDateIdx].date}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
                <span><span className="msSlot-dot" style={{ background: 'var(--accent)' }}/> Selected</span>
                <span><span className="msSlot-dot" style={{ background: 'var(--bg-2)' }}/> Available</span>
              </div>
            </div>
            {slotsLoading ? (
              <div style={{ height: 100, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>Loading slots…</div>
            ) : slotTimes.length === 0 ? (
              <div style={{ height: 100, display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                No available slots for this date.<br/>
                <span style={{ fontSize: 12 }}>The doctor may not practice on this day, or all slots have passed.</span>
              </div>
            ) : (
              <div className="msSlot-grid">
                {slotTimes.map(s => (
                  <button key={s.time} disabled={s.taken} onClick={() => setSelTime(s.time)}
                    className={`msSlot ${s.taken ? 'msSlot-taken' : ''} ${selTime === s.time ? 'msSlot-active' : ''}`}>
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Payment */}
          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>3 · Payment method</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setPaymentType('umum')} className={`msPay ${paymentType === 'umum' ? 'msPay-active' : ''}`}>
                <Icon name="user" size={18}/>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>General / Personal</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatIDR(d.consultationFee || 0)}</div>
                </div>
                {paymentType === 'umum' && <Icon name="check" size={16} style={{ color: 'var(--accent)' }}/>}
              </button>
              <button onClick={() => d.acceptBPJS && setPaymentType('bpjs')} disabled={!d.acceptBPJS}
                className={`msPay ${paymentType === 'bpjs' ? 'msPay-active' : ''} ${!d.acceptBPJS ? 'msPay-disabled' : ''}`}>
                <Icon name="shield" size={18}/>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>BPJS Kesehatan</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{d.acceptBPJS ? 'Covered by BPJS' : 'Not available'}</div>
                </div>
                {paymentType === 'bpjs' && <Icon name="check" size={16} style={{ color: 'var(--accent)' }}/>}
              </button>
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <Textarea label="4 · Notes / initial complaint (optional)"
              hint="Help the doctor prepare for the consultation — mention your main complaint or current medications."
              value={notes} onChange={setNotes} rows={3}
              placeholder="Example: Regular diabetes check-up, want to check latest HbA1c."/>
          </Card>
        </div>

        {/* Sticky summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <Card>
            <div className="msEyebrow">Booking summary</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
              <Avatar initials={initials} color="sage" size={48}/>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{doctorName}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{d.specialization}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{d.clinicName}</div>
              </div>
            </div>
            <div className="msSummary-row"><span>Date</span><strong>{dates[selDateIdx].date}</strong></div>
            <div className="msSummary-row">
              <span>Time</span>
              <strong style={{ color: selTime ? 'var(--ink)' : 'var(--muted)' }}>{selTime ? `${selTime}` : 'Not selected'}</strong>
            </div>
            <div className="msSummary-row"><span>Payment</span><strong>{paymentType === 'bpjs' ? 'BPJS' : 'General'}</strong></div>
            <div className="msSummary-row" style={{ paddingTop: 14, marginTop: 6, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 15 }}>Total</span>
              <strong style={{ fontSize: 20, fontFamily: 'var(--serif)', fontWeight: 600 }}>
                {paymentType === 'bpjs' ? 'Rp 0' : formatIDR(d.consultationFee || 0)}
              </strong>
            </div>
            <Btn variant="primary" size="lg" full disabled={!selTime || submitting} style={{ marginTop: 16 }} onClick={handleBook} icon="check">
              {submitting ? 'Processing…' : 'Confirm booking'}
            </Btn>
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Free booking · Can be cancelled up to 2 hours before schedule
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
