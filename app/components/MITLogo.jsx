export default function MITLogo({ className = '', variant = 'dark' }) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`mit-logo ${className}`}
      style={{
        display: 'flex',
        flexDirection: isDark ? 'column' : 'row',
        alignItems: isDark ? 'flex-start' : 'center',
        gap: isDark ? '4px' : '12px',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontSize: isDark ? '1.8rem' : '2.2rem',
          fontWeight: '900',
          color: isDark ? '#ffffff' : 'var(--accent-primary)',
          letterSpacing: isDark ? '-0.5px' : '-1.5px',
          fontFamily: 'var(--font-heading)',
          lineHeight: '1',
          textTransform: isDark ? 'uppercase' : 'none'
        }}
      >
        MIT {isDark && <span style={{ fontWeight: 300 }}>ACADEMY</span>}
      </span>

      {!isDark && (
        <div
          style={{
            width: '1px',
            height: '32px',
            backgroundColor: 'var(--text-tertiary)',
            opacity: 0.5,
          }}
        ></div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.2',
          justifyContent: 'center',
          color: isDark ? '#94a3b8' : 'var(--accent-primary)',
          fontFamily: 'var(--font-body)',
          textTransform: isDark ? 'uppercase' : 'none',
          letterSpacing: isDark ? '1px' : 'normal'
        }}
      >
        {!isDark && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Academy of</span>}
        <span style={{ fontSize: isDark ? '0.65rem' : '0.9rem', fontWeight: isDark ? '600' : '500' }}>
          {isDark ? 'Of Engineering' : 'Engineering'}
        </span>
      </div>
    </div>
  );
}
