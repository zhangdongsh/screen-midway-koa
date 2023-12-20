const fse = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const ejs = require('ejs');
import { formatRes, uploadOss } from '../utils/index';

const createPuppeteerPool = require('../utils/pool');

const pool = createPuppeteerPool({
  puppeteerArgs: {},
});

const imgPath = path.join(__dirname, '../../public/img');

const getScreenshot = async ({
  logger = console,
  hash,
  url,
  html = '',
  template = '',
  data = {},
  options = {},
}) => {
  return pool.use(async browser => {
    try {
      const start = new Date().getTime();
      logger.log(`================start-${hash}================`);
      await fse.ensureDir(imgPath);
      // 设置页面尺寸、内容
      const page = await browser.newPage();
      // 默认iphoneX尺寸
      page.setViewport({
        width: 375,
        height: 812,
        ...options,
      });
      if (template) {
        html = ejs.render(template, data);
        // logger.log(`0、templete:${html} `);
      }
      logger.log(`1、设置页面尺寸、内容-开始，type:${html ? 'html' : 'url'} `);
      if (html) {
        await page.setContent(html);
      } else if (url) {
        await page.goto(url);
      }
      logger.log(`2、设置页面尺寸、内容-结束，等待浏览器渲染`);
      await waitForNetworkIdle(page, 50);

      logger.log('3、渲染完成，截图-开始');
      const currentImageFileName = `${dayjs().format('HH-mm-ss')}-${hash}.png`;
      const currentImageFullPath = `${imgPath}/${currentImageFileName}`;
      await page.screenshot({
        path: currentImageFullPath,
        fullPage: true,
      });

      logger.log('4、截图成功，关闭页面');
      await page.close();

      logger.log('5、上传oss，获取url');
      const res = await uploadOss(
        currentImageFileName,
        currentImageFullPath,
        logger
      );
      // fse.remove(currentImageFullPath);
      const end = new Date().getTime();

      logger.log(`6、上传oss成功，耗时：${end - start}ms，oss res: ${res}`);
      logger.log(`================end-${hash}================`);
      return formatRes(true, `截图成功`, res, logger);
    } catch (err) {
      logger.error(err);
      return formatRes(false, err?.message || err, null, logger);
    }
  });
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
  getScreenshot,
};
