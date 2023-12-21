const fse = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const genericPool = require('generic-pool');
const crypto = require('crypto');
import { formatRes, uploadOss } from '../utils/index';

const imgPath = path.join(__dirname, '../../public/img');

const createPuppeteerPool = ({
  // pool 的最大容量
  max = 5,
  // pool 的最小容量
  min = 1,
  //1h 连接在池中保持空闲而不被回收的最小时间值
  idleTimeoutMillis = 60 * 60 * 1000,
  evictionRunIntervalMillis = 60 * 1000, // 1min 检查空闲实例的间隔时间，单位：毫秒
  // 最大使用数
  maxUses = 200,
  // 在连接池交付实例前是否先经过 factory.validate 测试
  testOnBorrow = true,
  validator = () => Promise.resolve(true),
  ...otherConfig
}: any = {}) => {
  const factory = {
    // 创建实例
    create: () =>
      puppeteer
        .launch({
          headless: 'new',
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-zygote',
            '--no-sandbox',
          ],
        })
        .then(instance => {
          console.log('create puppeteer instance success', instance);
          instance.useCount = 0;
          return instance;
        }),
    // 销毁实例
    destroy: instance => {
      instance.close();
    },
    // 验证实例可用性
    validate: instance => {
      return validator().then(valid =>
        // maxUses 小于 0 或者 instance 使用计数小于 maxUses 时可用
        Promise.resolve(valid && (maxUses <= 0 || instance.useCount < maxUses))
      );
    },
  };
  const config = {
    max,
    min,
    idleTimeoutMillis,
    evictionRunIntervalMillis,
    testOnBorrow,
    ...otherConfig,
  };
  // 创建连接池
  const pool = genericPool.createPool(factory, config);
  const genericAcquire = pool.acquire.bind(pool);
  // 池中资源连接时进行的操作
  pool.acquire = () =>
    genericAcquire().then(instance => {
      instance.useCount += 1;
      return instance;
    });
  pool.use = async fn => {
    let resource;
    return pool
      .acquire()
      .then(r => {
        resource = r;
        return r;
      })
      .then(fn)
      .then(
        result => {
          // 释放资源
          pool.release(resource);
          return result;
        },
        err => {
          pool.release(resource);
          throw err;
        }
      );
  };
  return pool;
};

const pool = createPuppeteerPool({
  puppeteerArgs: {},
});

const getScreenshot = async ({
  logger = console,
  url,
  html = '',
  template = '',
  data = {},
  options = {},
}) => {
  return pool.use(async browser => {
    try {
      const start = new Date().getTime();
      if (!html && !url && !template)
        return formatRes(false, '参数错误-缺少模板或者页面链接', null, console);
      const hash = crypto.createHash('sha256');
      const hashedData = hash.update(html || url || template).digest('hex');

      logger.log(`================start-${hashedData}================`);
      await fse.ensureDir(imgPath);
      // 设置页面尺寸、内容
      const page = await browser.newPage();
      await page.emulateTimezone('Asia/Shanghai');
      // 默认iphoneX尺寸
      page.setViewport({
        width: 375,
        height: 812,
        ...options,
      });
      if (template) {
        html = ejs.render(template, data);
        logger.log('1、设置页面尺寸、内容-开始，type: template');
      } else {
        logger.log(
          `1、设置页面尺寸、内容-开始，type:${html ? 'html' : 'url'} `
        );
      }
      if (html) {
        await page.setContent(html);
      } else if (url) {
        await page.goto(url);
      }

      logger.log('2、设置页面尺寸、内容-结束，等待浏览器渲染');
      await waitForNetworkIdle(page, 50);

      logger.log('3、渲染完成，截图-开始');
      const currentImageFileName = `${dayjs().format(
        'HH-mm-ss'
      )}-${hashedData}.png`;
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
      fse.remove(currentImageFullPath);
      const end = new Date().getTime();
      logger.log(`6、上传oss成功，总耗时：${end - start}ms，oss res: ${res}`);
      logger.log(`================end-${hashedData}================`);
      return formatRes(true, '截图成功', res, logger);
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
