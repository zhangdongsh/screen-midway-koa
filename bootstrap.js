const { Bootstrap } = require('@midwayjs/bootstrap');
Bootstrap.configure({
  globalConfig: {
    koa: {
      port: 9000,
    },
  },
}).run();
