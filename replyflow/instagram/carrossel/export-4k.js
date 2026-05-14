/**
 * ReplyFlow — Export slide-4 em 4K
 * Resolução: 4320 × 5400 px (escala 4×)
 */

const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');

const DIR   = __dirname;
const W     = 1080;
const H     = 1350;
const SCALE = 4; // 4× = 4320×5400 px (4K)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('🚀  ReplyFlow — export slide-4 4K\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-file-access-from-files',
    ],
  });

  const slides = ['slide-1', 'slide-2', 'slide-3', 'slide-4'];

  for (const name of slides) {
    const htmlFile = path.join(DIR, name + '.html');
    if (!fs.existsSync(htmlFile)) {
      console.warn('⚠️  ' + name + '.html não encontrado — pulando.');
      continue;
    }

    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });

    const fileUrl = 'file:///' + htmlFile.split('\\').join('/');
    console.log('📄  Carregando ' + name + '...');
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(1500); // aguarda fontes + renders

    const slideEl = await page.$('.slide');
    if (!slideEl) {
      console.warn('⚠️  .slide não encontrado em ' + name + '.html');
      await page.close();
      continue;
    }

    const outPath = path.join(DIR, name + '-4k.png');
    await slideEl.screenshot({ path: outPath, type: 'png' });
    await page.close();

    const { size } = fs.statSync(outPath);
    console.log(
      '✅  ' + name + '-4k.png  →  ' +
      (W * SCALE) + '×' + (H * SCALE) + ' px  ' +
      '(' + (size / 1024 / 1024).toFixed(2) + ' MB)'
    );
  }

  await browser.close();
  console.log('\n🎉  Export concluído! Arquivos em:\n   ' + DIR);
})();
