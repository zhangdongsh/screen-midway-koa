const path = require('path');
const dayjs = require('dayjs');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
import { formatRes, uploadOss } from '../utils/index';

const getScreenshot2 = async ({
  hash = 'hash',
  url,
  html = '',
  template = '',
  data = {},
  options = {},
}) => {
  const start = new Date().getTime();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-zygote',
      '--no-sandbox',
    ],
  });
  const page = await browser.newPage();

  await page.emulateTimezone('Asia/Shanghai');
  await page.setViewport({
    width: 375,
    height: 812,
    ...options,
  });

  if (template) {
    html = ejs.render(template, data);
  }

  if (html) {
    await page.setContent(html);
  } else if (url) {
    await page.goto(url);
  }

  await waitForNetworkIdle(page, 50);

  const imgPath = path.join(__dirname, '../../public/img');
  const currentImageFileName = `${dayjs().format('HH-mm-ss')}-${hash}.png`;
  const filePath = `${imgPath}/${currentImageFileName}`;
  // let contentType = 'image/png';
  await page.screenshot({ path: filePath, fullPage: true, type: 'png' });
  await page.close();
  await browser.close();

  const res = await uploadOss(currentImageFileName, filePath, console);

  const end = new Date().getTime();

  console.log(`上传oss成功，耗时：${end - start}ms，oss res: ${res}`);

  return formatRes(true, '截图成功', res, console);
};

/** 等待页面渲染完成，默认配置{ waitUntil: 'networkidle2'}有500ms延迟，这里手动优化速度 */
const waitForNetworkIdle = async (page, timeout, maxInflightRequests = 0) => {
  page.on('request', onRequestStarted);
  page.on('requestfinished', onRequestFinished);
  page.on('requestfailed', onRequestFinished);

  let inflight = 0;
  let fulfill;
  const promise = new Promise(x => (fulfill = x));
  let timeoutId = setTimeout(onTimeoutDone, timeout);
  return promise;

  function onTimeoutDone() {
    page.removeListener('request', onRequestStarted);
    page.removeListener('requestfinished', onRequestFinished);
    page.removeListener('requestfailed', onRequestFinished);
    fulfill();
  }

  function onRequestStarted() {
    ++inflight;
    if (inflight > maxInflightRequests) clearTimeout(timeoutId);
  }

  function onRequestFinished() {
    if (inflight === 0) return;
    --inflight;
    if (inflight === maxInflightRequests)
      timeoutId = setTimeout(onTimeoutDone, timeout);
  }
};

process.on('unhandledRejection', (err: any) => {
  console.error(err);
  return formatRes(false, err?.message || err, null, console);
});

module.exports = {
  getScreenshot2,
};
