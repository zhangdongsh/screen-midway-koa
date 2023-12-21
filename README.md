# my_midway_project

## QuickStart

<!-- add docs here for user -->

see [midway docs][midway] for more detail.

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:9000/
```

### Deploy

```bash
$ npm build
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.

[midway]: https://midwayjs.org

### DOC

#### 测试域名 api

```
https://screen-koa-node-lnnuhdgezs.cn-hangzhou.fcapp.run/api/screenshot
```

#### 入参 参考 src/interface.ts

```
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
```

#### 出参 参考 src/interface.ts

```
{
    "success": true,
    "msg": "截图成功",
    "data": "https://front-static.ab-inbev.cn/bees/zds-poster-test/20231221/05-59-05-1397c1db64c0442335a58aef098df156986cdde80045164ff0964794805d0871.png",
    "timestamp": "2023-12-21T05:59:05.463Z"
}
```

#### demo

参考 /public/index.html

```
curl --location --request POST 'https://screen-koa-node-lnnuhdgezs.cn-hangzhou.fcapp.run/api/screenshot' \
--header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
--header 'Content-Type: application/json' \
--data-raw '{
    "url": "https://www.baidu.com"
}'
```
