import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Badge, Avatar, Btn, Textarea, Empty, formatIDR } from '../components/ui';

const generateDates = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      label: i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : d.toLocaleDateString('id-ID', { weekday: 'short' }),
      date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayNum: d.getDate(),
    });
  }
  return dates;
};

const BookingForm = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
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
      alert(err.response?.data?.message || 'Gagal booking, coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Memuat…</div>;
  if (!doctor) return <Empty icon="user" title="Dokter tidak ditemukan" action={<Btn variant="secondary" onClick={() => navigate('/doctors')}>Kembali</Btn>}/>;

  const d = doctor;
  const doctorName = d.userId?.name || d.name || 'Dokter';
  const initials = doctorName.split(' ').map(x => x[0]).slice(0, 2).join('');

  const slotTimes = availableSlots.length > 0
    ? availableSlots.map(s => ({ time: typeof s === 'string' ? s : s.time, taken: false }))
    : [
        { time: '09.00', taken: false }, { time: '09.30', taken: false }, { time: '10.00', taken: false },
        { time: '10.30', taken: false }, { time: '11.00', taken: false }, { time: '14.00', taken: false },
        { time: '14.30', taken: false }, { time: '15.00', taken: false },
      ];

  if (step === 'done' && bookedAppt) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto 0', textAlign: 'center' }}>
        <div className="msSuccess">
          <Icon name="check" size={36} stroke={2}/>
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 600, marginTop: 24, lineHeight: 1.1 }}>
          <span style={{ color: 'var(--accent)' }}>Berhasil!</span> Appointment kamu sudah dibooking.
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: 15 }}>
          Konfirmasi telah dikirim ke email kamu. Klinik akan menghubungi jika perlu.
        </p>
        <Card style={{ marginTop: 32, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div>
              <div className="msEyebrow">Nomor antrian virtual</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 56, fontWeight: 700, lineHeight: 1, color: 'var(--accent)', marginTop: 4 }}>
                #{String(bookedAppt.queueNumber || 7).padStart(2, '0')}
              </div>
            </div>
            <Badge tone="sage" icon="check-circ">Booking terkonfirmasi</Badge>
          </div>
          <div style={{ display: 'flex', gap: 16, paddingTop: 16, alignItems: 'center' }}>
            <Avatar initials={initials} color="sage" size={48}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{doctorName}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{d.clinicName}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div><div className="msEyebrow">Tanggal</div><div style={{ marginTop: 4, fontWeight: 600 }}>{dates[selDateIdx].date} 2026</div></div>
            <div><div className="msEyebrow">Waktu</div><div style={{ marginTop: 4, fontWeight: 600 }}>{selTime} WIB</div></div>
            <div><div className="msEyebrow">Pembayaran</div><div style={{ marginTop: 4, fontWeight: 600 }}>{paymentType === 'bpjs' ? 'BPJS Kesehatan' : 'Umum'}</div></div>
            <div><div className="msEyebrow">Biaya</div><div style={{ marginTop: 4, fontWeight: 600 }}>{paymentType === 'bpjs' ? 'Ditanggung BPJS' : formatIDR(d.consultationFee || 0)}</div></div>
          </div>
        </Card>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
          <Btn variant="primary" icon="calendar" onClick={() => navigate('/dashboard')}>Lihat appointment saya</Btn>
          <Btn variant="ghost" onClick={() => navigate('/')}>Kembali ke beranda</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="msStack-md" style={{ maxWidth: 1040 }}>
      <button className="msBack" onClick={() => navigate(`/doctors/${doctorId}`)}>
        <Icon name="chevron-l" size={16}/> Kembali ke profil dokter
      </button>
      <div>
        <div className="msEyebrow">Booking appointment</div>
        <h1 className="msPageTitle">Pilih jadwal dengan {doctorName}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'flex-start' }}>
        <div className="msStack-md">
          {/* Date picker */}
          <Card>
            <div className="msEyebrow" style={{ marginBottom: 14 }}>1 · Pilih tanggal</div>
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
              <div className="msEyebrow">2 · Pilih waktu — {dates[selDateIdx].date}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
                <span><span className="msSlot-dot" style={{ background: 'var(--accent)' }}/> Dipilih</span>
                <span><span className="msSlot-dot" style={{ background: 'var(--bg-2)' }}/> Tersedia</span>
              </div>
            </div>
            {slotsLoading ? (
              <div style={{ height: 100, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>Memuat slot…</div>
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
            <div className="msEyebrow" style={{ marginBottom: 14 }}>3 · Metode pembayaran</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setPaymentType('umum')} className={`msPay ${paymentType === 'umum' ? 'msPay-active' : ''}`}>
                <Icon name="user" size={18}/>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>Umum / Pribadi</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatIDR(d.consultationFee || 0)}</div>
                </div>
                {paymentType === 'umum' && <Icon name="check" size={16} style={{ color: 'var(--accent)' }}/>}
              </button>
              <button onClick={() => d.acceptBPJS && setPaymentType('bpjs')} disabled={!d.acceptBPJS}
                className={`msPay ${paymentType === 'bpjs' ? 'msPay-active' : ''} ${!d.acceptBPJS ? 'msPay-disabled' : ''}`}>
                <Icon name="shield" size={18}/>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>BPJS Kesehatan</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{d.acceptBPJS ? 'Ditanggung BPJS' : 'Tidak tersedia'}</div>
                </div>
                {paymentType === 'bpjs' && <Icon name="check" size={16} style={{ color: 'var(--accent)' }}/>}
              </button>
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <Textarea label="4 · Catatan / keluhan awal (opsional)"
              hint="Bantu dokter mempersiapkan konsultasi — sebutkan keluhan utama atau obat yang sedang diminum."
              value={notes} onChange={setNotes} rows={3}
              placeholder="Contoh: Kontrol diabetes rutin, mau cek HbA1c terbaru."/>
          </Card>
        </div>

        {/* Sticky summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <Card>
            <div className="msEyebrow">Ringkasan booking</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
              <Avatar initials={initials} color="sage" size={48}/>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{doctorName}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{d.specialization}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{d.clinicName}</div>
              </div>
            </div>
            <div className="msSummary-row"><span>Tanggal</span><strong>{dates[selDateIdx].date}</strong></div>
            <div className="msSummary-row">
              <span>Waktu</span>
              <strong style={{ color: selTime ? 'var(--ink)' : 'var(--muted)' }}>{selTime ? `${selTime} WIB` : 'Belum dipilih'}</strong>
            </div>
            <div className="msSummary-row"><span>Pembayaran</span><strong>{paymentType === 'bpjs' ? 'BPJS' : 'Umum'}</strong></div>
            <div className="msSummary-row" style={{ paddingTop: 14, marginTop: 6, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 15 }}>Total</span>
              <strong style={{ fontSize: 20, fontFamily: 'var(--serif)', fontWeight: 600 }}>
                {paymentType === 'bpjs' ? 'Rp 0' : formatIDR(d.consultationFee || 0)}
              </strong>
            </div>
            <Btn variant="primary" size="lg" full disabled={!selTime || submitting} style={{ marginTop: 16 }} onClick={handleBook} icon="check">
              {submitting ? 'Memproses…' : 'Konfirmasi booking'}
            </Btn>
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Booking gratis · Bisa dibatalkan hingga 2 jam sebelum jadwal
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
