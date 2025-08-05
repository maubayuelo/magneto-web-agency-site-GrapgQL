import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="main">
      <section className="not-found" style={{ 
        padding: '60px 15px', 
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px'
      }}>
        <h1 className="typo-4xl-extrabold">Project Not Found</h1>
        <p className="typo-xl-medium">
          The project you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
          <Link href="/portfolio" className="btn btn-primary">
            View All Projects
          </Link>
          <Link href="/" className="btn btn-secondary">
            Go Home
          </Link>
        </div>
      </section>
    </div>
  );
}
