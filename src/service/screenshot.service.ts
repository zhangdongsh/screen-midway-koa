import { Inject, Provide } from '@midwayjs/core';
// import { IUserOptions } from '../interface';
import { ILogger } from '@midwayjs/logger';
const { getScreenshot } = require('./screenshot');
const { getScreenshot2 } = require('./screenshot2');
const { getScreenshot3 } = require('./screenshot3');

@Provide()
export class ScreenshotService {
  @Inject()
  logger: ILogger;

  async getScreenshot(params: any = {}) {
    const res = await getScreenshot({ ...params, logger: this.logger });
    return res;
  }

  async getScreenshot2(params: any) {
    const res = await getScreenshot2({ ...params, logger: this.logger });
    return res;
  }

  async getScreenshot3(params: any) {
    const res = await getScreenshot3({ ...params, logger: this.logger });
    return res;
  }
}
