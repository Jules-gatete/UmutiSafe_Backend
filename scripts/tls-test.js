const tls = require('tls');
const fs = require('fs');
const net = require('net');

const raw = fs.readFileSync('prod-ca-chain.crt', 'utf8');
const parts = raw
  .split(/(?=-----BEGIN CERTIFICATE-----)/g)
  .map((part) => part.trim())
  .filter(Boolean)
  .map((part) => (part.endsWith('\n') ? part : `${part}\n`));

const socket = net.connect(6543, 'aws-1-eu-west-1.pooler.supabase.com', () => {
  const sslRequest = Buffer.from([0x00, 0x00, 0x00, 0x08, 0x04, 0xd2, 0x16, 0x2f]);
  socket.write(sslRequest);
  socket.once('data', (response) => {
    if (response.toString() !== 'S') {
      console.error('Server refused SSL', response.toString());
      socket.end();
      return;
    }

    const tlsSocket = tls.connect(
      {
        socket,
        ca: parts,
        servername: 'aws-1-eu-west-1.pooler.supabase.com',
        rejectUnauthorized: true,
      },
      () => {
        console.log('TLS authorized', tlsSocket.authorized, tlsSocket.authorizationError);
        tlsSocket.end();
      }
    );

    tlsSocket.on('error', (err) => {
      console.error('TLS error', err.message);
    });
  });
});

socket.on('error', (err) => {
  console.error('Net error', err.message);
});
