const tls = require('tls');

const host = process.argv[2] || 'aws-1-eu-west-1.pooler.supabase.com';
const port = Number(process.argv[3]) || 6543;

const socket = tls.connect({ host, port, rejectUnauthorized: false }, () => {
  const certChain = [];
  let peer = socket.getPeerCertificate(true);

  while (peer && Object.keys(peer).length) {
    certChain.push({
      subject: peer.subject,
      issuer: peer.issuer,
      valid_from: peer.valid_from,
      valid_to: peer.valid_to,
      fingerprint: peer.fingerprint,
      serialNumber: peer.serialNumber
    });
    if (peer.issuerCertificate === peer) break;
    peer = peer.issuerCertificate;
  }

  console.log(JSON.stringify(certChain, null, 2));
  socket.end();
});

socket.on('error', (err) => {
  console.error('TLS inspect error:', err);
  process.exit(1);
});
