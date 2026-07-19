'use client';

export default function TestPage() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅ Deployment Success</h1>
      <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)' }}>
        If you can see this page, the client application is successfully deployed and routing is working.
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>API URL: {process.env.NEXT_PUBLIC_API_URL || '/api'}</p>
      </div>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: '2rem',
          background: '#e50914',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Go to Homepage
      </button>
    </div>
  );
}
