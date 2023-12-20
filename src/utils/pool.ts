const puppeteer = require('puppeteer');
const genericPool = require('generic-pool');

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
} = {}) => {
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
module.exports = createPuppeteerPool;
