// Gera QR Code no terminal para o link mobile do ReplyFlow
// Uso: node scripts/qr.js http://192.168.x.x:3000
const url = process.argv[2];
if (!url) { console.error("URL nao informada"); process.exit(1); }

try {
  const qr = require("qrcode-terminal");
  qr.generate(url, { small: true });
} catch (e) {
  console.log("  (qrcode-terminal nao encontrado — rode: npm i -D qrcode-terminal)");
}
