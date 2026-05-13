/**
 * ReplyFlow — Instagram Carousel Export
 * Gera PNGs 2K+ (2160×2700 px) a partir dos HTMLs na mesma pasta.
 *
 * Uso:
 *   node instagram/carrossel/export.js
 */

const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');

const DIR    = path.resolve(__dirname);
const SLIDES = ['slide-1', 'slide-2', 'slide-3'];
const SCALE  = 2;           // 2× = 2160×2700 px  (>2K)
const W      = 1080;
const H      = 1350;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('🚀  ReplyFlow — export carrossel\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  for (const name of SLIDES) {
    const htmlFile = path.join(DIR, `${name}.html`);

    if (!fs.existsSync(htmlFile)) {
      console.warn(`⚠️  ${name}.html não encontrado — pulando.`);
      continue;
    }

    const page = await browser.newPage();

    /* viewport exato do slide com escala 2× */
    await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });

    /* file:// com barras forward para Windows */
    const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 20000 });

    /* aguarda fontes Google (Inter) e animações estabilizarem */
    await sleep(900);

    /* captura o elemento .slide (exato 1080×1350 px CSS → 2160×2700 px PNG) */
    const slideEl = await page.$('.slide');

    if (!slideEl) {
      console.warn(`⚠️  .slide não encontrado em ${name}.html`);
      await page.close();
      continue;
    }

    const outPath = path.join(DIR, `${name}.png`);
    await slideEl.screenshot({ path: outPath });

    await page.close();

    const { size } = fs.statSync(outPath);
    console.log(
      `✅  ${name}.png  →  ${W * SCALE}×${H * SCALE} px  ` +
      `(${(size / 1024).toFixed(0)} KB)`
    );
  }

  await browser.close();
  console.log('\n🎉  Export concluído! Arquivos salvos em:\n   ' + DIR);
})();
