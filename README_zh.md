# Nexty-Directory 二次开发指南

nexty-directory 基于 [Nexty 模板](https://nexty.dev/)开发，对所有 Nexty 付费用户开放。

- 线上网站：https://dofollow.tools/
- 源码：https://github.com/WeNextDev/nexty-directory

本指南旨在帮助你快速进行 `Nexty-Directory` 模板的二次开发，以便你能轻松地将其定制为自己的导航站。

## 1. 修改网站基本信息

网站的核心信息，如名称、标语、描述和社交链接等，都集中在 `config/site.ts` 文件中。请根据你的实际需求修改此文件。

## 2. 支付

本项目不包含内置的在线支付或订阅计费能力。如果你需要对精选展示/推广服务收费，建议使用手动收款（例如 PayPal/USDT），并将用户引导到 `/services` 页面进行联系与付款。

## 3. 修改邮件模板

当用户注册、订阅 Newsletter 或使用魔法链接登录时，系统会自动发送邮件。这些邮件模板位于 `emails/` 目录下。

- `emails/user-welcome.tsx`: 新用户欢迎邮件。
- `emails/newsletter-welcome.tsx`: 用户订阅 Newsletter 后的欢迎邮件。
- `emails/product-approved.tsx`: 产品审核通过/上线通知邮件。
- `emails/magic-link-email.tsx`: 魔法链接登录邮件。

## 4. 替换 Badge

`public/badge` 文件夹里是导航站的 badge，这样可以让用户为你宣传导航站。badge 创建可以在[这里](https://findly.tools/badge-generator)完成

## 5. 替换 DR (Domain Rating) Badge

在 `components/shared/FrogDR.tsx` 组件中，硬编码了一个 `ahrefs` 的 DR 徽章。你需要将其替换为你自己的域名评级徽章，或者如果你不需要显示该信息，可以直接删除此组件。你可以在[这里](https://frogdr.com/)创建自己的 DR badge。
