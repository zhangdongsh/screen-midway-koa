import { Inject, Provide } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
const { getScreenshot } = require('./screenshot');
const { getScreenshot2 } = require('./screenshot2');

@Provide()
export class ScreenshotService {
  @Inject()
  logger: ILogger;

  async getScreenshot(params: any = {}) {
    const res = await getScreenshot({ ...params });
    return res;
  }

  async getScreenshot2(params: any) {
    const res = await getScreenshot2({ ...params });
    return res;
  }
}
