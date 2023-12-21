import { Body, Controller, Get, Inject, Post } from '@midwayjs/core';
import { ScreenshotService } from '../service/screenshot.service';
import { IScreenshotReq } from '../interface';

@Controller('/api')
export class HomeController {
  @Inject()
  screenshotService: ScreenshotService;

  @Get('/')
  async home(): Promise<string> {
    return 'Hello Screenshot!';
  }

  @Get('/doc')
  async doc(): Promise<string> {
    return 'TODO : API Document';
  }

  @Post('/screenshot')
  async createScreenshot(@Body() params: IScreenshotReq) {
    const res = await this.screenshotService.getScreenshot(params);
    return res;
  }

  @Post('/screenshot2')
  async createScreenshot2(@Body() params: IScreenshotReq) {
    const res = await this.screenshotService.getScreenshot2(params);
    return res;
  }
}
