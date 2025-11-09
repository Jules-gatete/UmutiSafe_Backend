const net = require('net');
const tls = require('tls');

const host = process.argv[2] || 'aws-1-eu-west-1.pooler.supabase.com';
const port = Number(process.argv[3]) || 6543;

const socket = net.connect({ host, port }, () => {
  // Send SSLRequest packet (length: 8 bytes, payload: 80877103)
  const sslRequest = Buffer.alloc(8);
  sslRequest.writeInt32BE(8, 0);
  sslRequest.writeInt32BE(80877103, 4);
  socket.write(sslRequest);
});

socket.once('data', (chunk) => {
  if (chunk.toString() !== 'S') {
    console.error('Server does not support SSL. Response:', chunk.toString());
    socket.end();
    process.exit(1);
    return;
  }

  const tlsSocket = tls.connect({
    socket,
    servername: host,
    rejectUnauthorized: false
  }, () => {
    const chain = [];
    let cert = tlsSocket.getPeerCertificate(true);

    while (cert && Object.keys(cert).length) {
        const raw = cert.raw;
        let pem;
        if (raw && raw.length) {
          const b64 = raw.toString('base64');
          const wrapped = b64.match(/.{1,64}/g).join('\n');
          pem = `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----\n`;
        }

      chain.push({
        subject: cert.subject,
        issuer: cert.issuer,
        valid_from: cert.valid_from,
        valid_to: cert.valid_to,
          fingerprint256: cert.fingerprint256,
          pem
      });

      if (!cert.issuerCertificate || cert.issuerCertificate === cert) {
        break;
      }
      cert = cert.issuerCertificate;
    }

  console.log(JSON.stringify(chain, null, 2));
    tlsSocket.end();
  });

  tlsSocket.on('error', (err) => {
    console.error('TLS error:', err.message);
    process.exit(1);
  });
});

socket.on('error', (err) => {
  console.error('TCP error:', err.message);
  process.exit(1);
});
