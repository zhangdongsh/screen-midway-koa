const OSS = require('ali-oss');
const dayjs = require('dayjs');

/** 格式化返回信息 */
export const formatRes = (success, msg, data, logger) => {
  const timestamp = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  logger.info('util/formatRes', {
    success,
    msg,
    data,
    timestamp,
  });
  return {
    success,
    msg,
    data,
    timestamp,
  };
};

/** 上传oss */
export const uploadOss = async (name, path, logger) => {
  // test
  if (!process.env.ACCESS_KEY_ID) return name;

  const client = new OSS({
    // endpoint: 'front-static.ab-inbev.cn',
    // cname: true,
    endpoint: 'oss-cn-shanghai.aliyuncs.com',
    accessKeyId: process.env.ACCESS_KEY_ID,
    accessKeySecret: process.env.ACCESS_KEY_SECRET,
    bucket: 'abi-static-resource',
    secure: true,
  });
  return new Promise((resolve, reject) => {
    const now = new Date();
    const timespan = [
      now.getFullYear(),
      `${now.getMonth() + 1}`.padStart(2, '0'),
      now.getDate(),
    ].join('');
    client
      .put(`/bees/zds-poster-test/${timespan}/${name}`, path)
      .then(res => {
        logger.info('oss upload success', res.url);
        // return resolve(res.url);
        return resolve(`https://front-static.ab-inbev.cn/${res.name}`);
      })
      .catch(err => {
        logger.error('oss error:', err);
        return reject(err);
      });
  });
};
