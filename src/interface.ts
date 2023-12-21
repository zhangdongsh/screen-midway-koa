/**
 * @description Screen-Service parameters
 */
export interface IScreenshotReq {
  /** h5链接，直接打开当前url截图 */
  url?: string;
  /** html 字符串，直接打开当前html截图 */
  html?: string;
  /** ejs 规范的模板 */
  template?: string;
  /** ejs 规范的模板的数据源 */
  templateData?: ITemplateData;
  /**
   * 设置视窗尺寸, 默认iphoneX尺寸 375*812
   * https://puppeteer.bootcss.com/api#pagesetviewportviewport
   */
  viewportOptions?: IViewportOptions;
  /**
   * 设置截图参数 page.screenshot([options])
   * https://puppeteer.bootcss.com/api#pagescreenshotoptions
   */
  screenshotOptions?: IScreenshotOptions;
}

interface IViewportOptions {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  isLandscape?: boolean;
}

interface ITemplateData {
  [key: string]: any;
}

interface IScreenshotOptions {
  fullPage?: boolean;
  omitBackground?: boolean;
  encoding?: string;
  quality?: number;
  clip?: IScreenshotClip;
}

interface IScreenshotClip {
  x: number;
  y: number;
  width: number;
  height: number;
}
