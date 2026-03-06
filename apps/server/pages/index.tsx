/**
 * Minimal index page — serves as a status page for your ConsentKit deployment.
 * Not needed by the widget; safe to replace with your own page.
 */
export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>ConsentKit</h1>
      <p>Your ConsentKit server is running.</p>
      <ul>
        <li><a href="/api/config">GET /api/config</a></li>
        <li>POST /api/consent</li>
        <li><a href="/widget.js">widget.js</a></li>
      </ul>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Embed the widget on your site:
        <br />
        <code>{'<script src="https://YOUR_DOMAIN/widget.js" defer></script>'}</code>
      </p>
    </main>
  );
}
