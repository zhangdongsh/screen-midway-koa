import { Body, Controller, Get, Inject, Post } from '@midwayjs/core';
import { ScreenshotService } from '../service/screenshot.service';

@Controller('/')
export class HomeController {
  @Inject()
  screenshotService: ScreenshotService;

  @Get('/')
  async home(): Promise<string> {
    return 'Hello Midwayjs!';
  }

  @Post('/test')
  async test(@Body() params: any) {
    console.log('body-params', params);
    return { success: true, message: 'OK', data: params };
  }

  @Post('/screen')
  async createScreenshot(@Body() params: any) {
    console.log('body-params', params);
    const res = await this.screenshotService.getScreenshot(params);
    return res;
  }

  @Post('/screen2')
  async createScreenshot2(@Body() params: any) {
    console.log('body-params', params);
    const res = await this.screenshotService.getScreenshot2(params);
    return res;
  }

  @Post('/screen3')
  async createScreenshot3(@Body() params: any) {
    console.log('body-params', params);
    const res = await this.screenshotService.getScreenshot3(params);
    return res;
  }
}
