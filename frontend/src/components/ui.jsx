import { useEffect } from 'react';

// ─── Icon set ────────────────────────────────────────────────────────────────
export const Icon = ({ name, size = 20, stroke = 1.6, className, style }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round',
    strokeLinejoin: 'round', className, style,
  };
  const P = (...children) => <svg {...props}>{children}</svg>;
  switch (name) {
    case 'home': return P(<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>);
    case 'search': return P(<circle cx="11" cy="11" r="7"/>, <path d="m20 20-3.5-3.5"/>);
    case 'calendar': return P(<rect x="3" y="5" width="18" height="16" rx="2"/>, <path d="M16 3v4M8 3v4M3 10h18"/>);
    case 'file': return P(<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>, <path d="M14 3v5h5M9 13h6M9 17h4"/>);
    case 'user': return P(<circle cx="12" cy="8" r="4"/>, <path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>);
    case 'users': return P(<circle cx="9" cy="8" r="4"/>, <path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/>, <path d="M17 11a4 4 0 0 0 0-8M22 21c0-3-2-5-5-5.5"/>);
    case 'stetho': return P(<path d="M4 4v6a4 4 0 0 0 8 0V4"/>, <path d="M4 4h2M10 4h2M8 14v3a4 4 0 0 0 8 0v-2"/>, <circle cx="18" cy="13" r="2"/>);
    case 'sparkles': return P(<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M5.5 18.5 8 16M16 8l2.5-2.5"/>);
    case 'shield': return P(<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>, <path d="m9 12 2 2 4-4"/>);
    case 'chevron-r': return P(<path d="m9 6 6 6-6 6"/>);
    case 'chevron-l': return P(<path d="m15 6-6 6 6 6"/>);
    case 'chevron-d': return P(<path d="m6 9 6 6 6-6"/>);
    case 'chevron-u': return P(<path d="m18 15-6-6-6 6"/>);
    case 'menu': return P(<path d="M4 6h16M4 12h16M4 18h16"/>);
    case 'plus': return P(<path d="M12 5v14M5 12h14"/>);
    case 'check': return P(<path d="m5 12 5 5L20 7"/>);
    case 'x': return P(<path d="m6 6 12 12M18 6 6 18"/>);
    case 'star': return P(<path d="m12 3 2.7 6 6.3.5-4.8 4.2 1.5 6.3L12 16.7 6.3 20l1.5-6.3L3 9.5l6.3-.5z"/>);
    case 'pin': return P(<path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/>, <circle cx="12" cy="9" r="2.5"/>);
    case 'clock': return P(<circle cx="12" cy="12" r="9"/>, <path d="M12 7v5l3 2"/>);
    case 'arrow-r': return P(<path d="M5 12h14M13 5l7 7-7 7"/>);
    case 'arrow-l': return P(<path d="M19 12H5M11 5l-7 7 7 7"/>);
    case 'logout': return P(<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/>, <path d="M10 17l-5-5 5-5M5 12h11"/>);
    case 'bell': return P(<path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/>, <path d="M10 21a2 2 0 0 0 4 0"/>);
    case 'filter': return P(<path d="M4 5h16M7 12h10M10 19h4"/>);
    case 'check-circ': return P(<circle cx="12" cy="12" r="9"/>, <path d="m8 12 3 3 5-6"/>);
    case 'info': return P(<circle cx="12" cy="12" r="9"/>, <path d="M12 8h.01M11 12h1v4h1"/>);
    case 'warn': return P(<path d="M12 3 2 20h20z"/>, <path d="M12 10v4M12 17h.01"/>);
    case 'heart': return P(<path d="M12 21s-7-4.4-9.3-9.1A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5.9C19 16.6 12 21 12 21z"/>);
    case 'chat': return P(<path d="M21 12a8 8 0 0 1-12.5 6.7L3 20l1.3-5A8 8 0 1 1 21 12z"/>);
    case 'edit': return P(<path d="M12 20h9"/>, <path d="M16 4l4 4-11 11H5v-4z"/>);
    case 'doc-add': return P(<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>, <path d="M14 3v5h5"/>, <path d="M12 12v6M9 15h6"/>);
    case 'settings': return P(<circle cx="12" cy="12" r="3"/>, <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9A1.7 1.7 0 0 0 10 4.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>);
    default: return null;
  }
};

// ─── Logo ──────────────────────────────────────────────────────────────────
export const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--accent)"/>
    <path d="M16 9v14M9 16h14" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round"/>
    <circle cx="16" cy="16" r="3.2" fill="var(--paper)"/>
  </svg>
);

// ─── Button ────────────────────────────────────────────────────────────────
export const Btn = ({ children, variant = 'primary', size = 'md', icon, iconRight, onClick, disabled, type = 'button', full, style, className = '' }) => {
  const s = { primary: 'msBtn-primary', secondary: 'msBtn-secondary', ghost: 'msBtn-ghost', danger: 'msBtn-danger', subtle: 'msBtn-subtle' }[variant];
  const sz = { sm: 'msBtn-sm', md: 'msBtn-md', lg: 'msBtn-lg' }[size];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`msBtn ${s} ${sz} ${full ? 'msBtn-full' : ''} ${className}`} style={style}>
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16}/>}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : 16}/>}
    </button>
  );
};

// ─── Card ──────────────────────────────────────────────────────────────────
export const Card = ({ children, padded = true, hover, onClick, style, className = '' }) => (
  <div onClick={onClick} style={style}
    className={`msCard ${padded ? 'msCard-pad' : ''} ${hover ? 'msCard-hover' : ''} ${onClick ? 'msCard-click' : ''} ${className}`}>
    {children}
  </div>
);

// ─── Badge ─────────────────────────────────────────────────────────────────
export const Badge = ({ children, tone = 'neutral', icon, size = 'md' }) => (
  <span className={`msBadge msBadge-${tone} ${size === 'sm' ? 'msBadge-sm' : ''}`}>
    {icon && <Icon name={icon} size={12}/>}
    {children}
  </span>
);

// ─── Avatar ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = {
  sage:  { bg: '#DCEAE3', fg: '#2F6B5C' },
  coral: { bg: '#FCE4D6', fg: '#A14922' },
  mauve: { bg: '#EDE0EA', fg: '#7B3F70' },
  ocean: { bg: '#D8E4EE', fg: '#2C5273' },
  amber: { bg: '#F2E6CC', fg: '#7A5520' },
};
export const Avatar = ({ initials, color = 'sage', size = 44, ring }) => {
  const c = AVATAR_COLORS[color] || AVATAR_COLORS.sage;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c.bg, color: c.fg, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.36, flexShrink: 0,
      boxShadow: ring ? `0 0 0 3px var(--paper), 0 0 0 4px ${c.fg}30` : undefined,
      letterSpacing: '-0.01em',
    }}>{initials}</div>
  );
};

// ─── Form inputs ───────────────────────────────────────────────────────────
export const Input = ({ label, value, onChange, placeholder, icon, type = 'text', hint, error, ...rest }) => (
  <label className="msField">
    {label && <span className="msField-lbl">{label}</span>}
    <div className={`msInput-wrap ${error ? 'msInput-err' : ''}`}>
      {icon && <Icon name={icon} size={16} style={{ color: 'var(--muted)' }}/>}
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} className="msInput" {...rest}/>
    </div>
    {(hint || error) && <span className={`msField-hint ${error ? 'msField-err' : ''}`}>{error || hint}</span>}
  </label>
);

export const Select = ({ label, value, onChange, options, placeholder }) => (
  <label className="msField">
    {label && <span className="msField-lbl">{label}</span>}
    <div className="msInput-wrap msSelect-wrap">
      <select value={value} onChange={e => onChange?.(e.target.value)} className="msInput msSelect">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="chevron-d" size={16} style={{ color: 'var(--muted)', position: 'absolute', right: 12, pointerEvents: 'none' }}/>
    </div>
  </label>
);

export const Textarea = ({ label, value, onChange, placeholder, hint, rows = 3 }) => (
  <label className="msField">
    {label && <span className="msField-lbl">{label}</span>}
    <textarea value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} rows={rows} className="msTextarea"/>
    {hint && <span className="msField-hint">{hint}</span>}
  </label>
);

// ─── Section header ────────────────────────────────────────────────────────
export const SectionHeader = ({ title, sub, action, eyebrow }) => (
  <div className="msSecHd">
    <div>
      {eyebrow && <div className="msEyebrow">{eyebrow}</div>}
      <h2 className="msSecHd-t">{title}</h2>
      {sub && <p className="msSecHd-s">{sub}</p>}
    </div>
    {action}
  </div>
);

// ─── Empty state ───────────────────────────────────────────────────────────
export const Empty = ({ icon = 'file', title, sub, action }) => (
  <div className="msEmpty">
    <div className="msEmpty-icon"><Icon name={icon} size={28} stroke={1.4}/></div>
    <div className="msEmpty-t">{title}</div>
    {sub && <div className="msEmpty-s">{sub}</div>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

// ─── Stat tile ─────────────────────────────────────────────────────────────
export const Stat = ({ label, value, sub, tone, icon }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 32, fontFamily: 'var(--serif)', lineHeight: 1.1, marginTop: 6, fontWeight: 600 }}>{value}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: tone === 'accent' ? 'var(--accent-soft)' : 'var(--bg-2)',
          color: tone === 'accent' ? 'var(--accent)' : 'var(--ink)',
          display: 'grid', placeItems: 'center',
        }}>
          <Icon name={icon} size={18}/>
        </div>
      )}
    </div>
  </Card>
);

// ─── Doctor card ───────────────────────────────────────────────────────────
export const formatIDR = n => 'Rp ' + n.toLocaleString('id-ID');

export const DoctorCard = ({ d, onClick }) => (
  <Card hover onClick={onClick}>
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Avatar initials={d.initials || d.name?.split(' ').map(x => x[0]).slice(0,2).join('') || '??'} color={d.color || 'sage'} size={56}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div className="msDoctor-name">{d.name || 'Dokter'}</div>
          <div className="msDoctor-spec">
            {d.specLabel || d.specialization}
            {d.experience > 0 && ` · ${d.experience} thn pengalaman`}
          </div>
        </div>
        <div className="msDoctor-meta">
          <span><Icon name="pin" size={13}/> {d.clinic || d.clinicName}, {d.city}</span>
        </div>
        <div className="msDoctor-foot">
          <div className="msDoctor-fee">
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Konsultasi</span>
            <span style={{ fontWeight: 600 }}>{formatIDR(d.fee || d.consultationFee || 0)}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(d.bpjs || d.acceptBPJS) && <Badge tone="sage" icon="shield">BPJS</Badge>}
            <Badge tone="ink">Tersedia</Badge>
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// ─── Toast ────────────────────────────────────────────────────────────────
export const Toast = ({ msg, onClose }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className="msToast"><Icon name="check-circ" size={18}/>{msg}</div>;
};
