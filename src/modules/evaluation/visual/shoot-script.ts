/**
 * The screenshot helper given to the design reviewer (written into its folder as shoot.cjs).
 *
 *   node shoot.cjs <name> [steps.json]
 *
 * Opens the running app, performs the steps (to fill it with realistic data or open dialogs), then
 * saves full-page screenshots at desktop (1440) and phone (390) width as <name>-desktop.png and
 * <name>-phone.png, and prints measured problems: console errors, failed requests, horizontal
 * overflow, unreadably small text, broken images, elements cut off at the right edge.
 * Steps: [{ "do": "click"|"fill"|"select"|"press"|"wait"|"goto", "selector"?: "...", "value"?: "...", "ms"?: 500 }]
 */
export function shootScript(playwrightPath: string, browserPath: string, url: string): string {
  return `const { chromium } = require(${JSON.stringify(playwrightPath)});
const fs = require('fs');
const [name = 'shot', stepsFile] = process.argv.slice(2);
const steps = stepsFile ? JSON.parse(fs.readFileSync(stepsFile, 'utf8')) : [];
const URL_ = ${JSON.stringify(url)};
async function act(page, s) {
  if (s.do === 'goto') return page.goto(new URL(s.value || '/', URL_).toString(), { waitUntil: 'networkidle' });
  if (s.do === 'click') return page.click(s.selector, { timeout: 5000 });
  if (s.do === 'fill') return page.fill(s.selector, String(s.value ?? ''), { timeout: 5000 });
  if (s.do === 'select') return page.selectOption(s.selector, String(s.value ?? ''), { timeout: 5000 });
  if (s.do === 'press') return page.keyboard.press(String(s.value || 'Enter'));
  if (s.do === 'wait') return page.waitForTimeout(Math.min(Number(s.ms) || 500, 5000));
}
(async () => {
  const browser = await chromium.launch({ executablePath: ${JSON.stringify(browserPath)}, headless: true });
  const report = {};
  for (const [label, width, height, scale] of [['desktop', 1440, 900, 1], ['phone', 390, 844, 2]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
    const page = await ctx.newPage();
    const problems = { consoleErrors: [], failedRequests: [], stepErrors: [] };
    page.on('console', (m) => m.type() === 'error' && problems.consoleErrors.push(m.text().slice(0, 200)));
    page.on('pageerror', (e) => problems.consoleErrors.push(String(e.message).slice(0, 200)));
    page.on('response', (r) => r.status() >= 400 && problems.failedRequests.push(r.status() + ' ' + r.url()));
    await page.goto(URL_, { waitUntil: 'networkidle' }).catch((e) => problems.stepErrors.push('open: ' + e.message));
    for (const s of steps) {
      try { await act(page, s); await page.waitForTimeout(150); } catch (e) { problems.stepErrors.push(JSON.stringify(s) + ': ' + e.message.split('\\n')[0]); }
    }
    await page.waitForTimeout(600);
    Object.assign(problems, await page.evaluate(() => {
      const vw = window.innerWidth;
      const all = [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; });
      const tinyText = all.filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 11).map((el) => el.tagName.toLowerCase() + ': ' + el.textContent.trim().slice(0, 30)).slice(0, 10);
      const cutOff = all.filter((el) => el.getBoundingClientRect().right > vw + 1 && getComputedStyle(el).position !== 'fixed').map((el) => el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0]).slice(0, 10);
      const brokenImages = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src).slice(0, 5);
      return { horizontalOverflow: document.scrollingElement.scrollWidth > vw + 1, tinyText, cutOff, brokenImages };
    }));
    await page.screenshot({ path: name + '-' + label + '.png', fullPage: true });
    report[label] = problems;
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  console.log('Saved ' + name + '-desktop.png and ' + name + '-phone.png. Open them with the Read tool to look at them.');
})().catch((e) => { console.error(e.message); process.exit(1); });
`;
}
