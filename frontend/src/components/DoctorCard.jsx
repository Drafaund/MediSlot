import { Link } from 'react-router-dom';

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const StarRating = ({ rating }) => {
  const value = parseFloat(rating) || 0;
  return (
    <span style={{ color: '#F39C12', fontSize: '0.9rem' }} aria-label={`Rating ${value} dari 5`}>
      {'★'.repeat(Math.floor(value))}{'☆'.repeat(5 - Math.floor(value))}
      <span style={{ color: '#555', marginLeft: '4px', fontSize: '0.8rem' }}>({value.toFixed(1)})</span>
    </span>
  );
};

const Avatar = ({ src, name }) => {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#2E86AB',
      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0
    }}>
      {initials}
    </div>
  );
};

const DoctorCard = ({ doctor }) => {
  const name = doctor.userId?.name ?? 'Nama tidak tersedia';
  const avatar = doctor.userId?.avatar ?? null;

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #E0E0E0',
      borderRadius: '10px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(46,134,171,0.15)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
    >
      {/* Header: avatar + nama + spesialisasi */}
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
        <Avatar src={avatar} name={name} />
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            dr. {name}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#2E86AB', fontWeight: '500' }}>
            {doctor.specialization}
          </p>
        </div>
      </div>

      {/* Info klinik */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <InfoRow icon="🏥" text={doctor.clinicName} />
        <InfoRow icon="📍" text={`${doctor.clinicAddress ? doctor.clinicAddress + ', ' : ''}${doctor.city}`} />
        <InfoRow icon="💰" text={formatRupiah(doctor.consultationFee)} bold />
      </div>

      {/* Badge + Rating */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {doctor.acceptBPJS && (
            <span style={{
              backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: '0.72rem',
              fontWeight: '600', padding: '2px 8px', borderRadius: '12px', border: '1px solid #C8E6C9'
            }}>
              ✓ BPJS
            </span>
          )}
        </div>
        <StarRating rating={doctor.rating} />
      </div>

      {/* CTA */}
      <Link
        to={`/doctors/${doctor._id}`}
        style={{
          display: 'block', textAlign: 'center', backgroundColor: '#2E86AB', color: 'white',
          padding: '0.55rem', borderRadius: '6px', textDecoration: 'none',
          fontWeight: '600', fontSize: '0.9rem', marginTop: 'auto',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#246d8c'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2E86AB'}
      >
        Lihat Detail & Booking
      </Link>
    </div>
  );
};

const InfoRow = ({ icon, text, bold }) => (
  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', fontSize: '0.82rem', color: '#444' }}>
    <span style={{ flexShrink: 0 }}>{icon}</span>
    <span style={{ fontWeight: bold ? '600' : 'normal', color: bold ? '#1a1a1a' : 'inherit' }}>{text}</span>
  </div>
);

export default DoctorCard;
