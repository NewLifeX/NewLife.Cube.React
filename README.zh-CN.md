# 魔方 React 皮肤 NewLife.Cube.React

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Português](README.pt.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [العربية](README.ar.md)
<!-- lang:end -->

魔方（NewLife.Cube）第三代 WebAPI 前端的 **React 皮肤**，独立 NuGet 包 + 独立仓库管理。基于 **React 19 + Ant Design 6 + Zustand + Vite**，由后端字段元数据（`meta`）驱动，动态渲染通用列表页 / 表单页，符合[魔方皮肤设计规范](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md)。

引用 `NewLife.Cube` + `NewLife.Cube.React` 两个包，`dotnet run` 后浏览器打开即有完整管理后台——登录、动态菜单、字段元数据驱动的列表/表单、CRUD、导入导出、AI 助手等，**零前端开发**。

> 演示/教程：魔方教程 <https://newlifex.com/cube> | 演示站点 <https://cube.newlifex.com>

> ℹ️ 本中文版与 [English README](README.md) 同批维护；若两者内容不一致，以英文版为对外口径。

---

## 亮点

- **开箱即用**：`app.UseReact(env)` 一行接入，构建产物嵌入 DLL 随 NuGet 分发，无物理文件依赖
- **字段元数据驱动**：列表/表单/搜索/详情全部由后端 `meta` 元数据动态渲染，新增实体零前端开发
- **符合魔方皮肤设计规范**：认证登录全流程、通用列表、通用表单、LOV/上传/富文本/AI 助手等公共组件
- **消费共享公共包**：基于 `@cube/*`（api-core/auth-logic/page-logic/field-mapping/page-utils），框架无关核心多皮肤共享
- **单一主题 × 明暗**：antd token 驱动的原生观感，明暗切换一键完成
- **AI 智能助手**：SSE 流式对话 + 快捷指令 + 智能填表 + 系统诊断，内置 mermaid 渲染
- **多语言本地化**：11 种全量翻译界面语言（后端清单 ∩ 前端全量语言，资源覆盖 32 种；与 NewLife.Core/Cube 同链路，需 NewLife.Cube ≥ 6.15.2026.1022），支持跟随系统与强制语言，服务端菜单、字段元数据与运行时消息随语言切换重新拉取
- **测试完备**：单测 136 个 + E2E 48 个全过，Playwright 登录会话复用

## 生态版图

NewLife 生态按依赖分层，各项目独立版本、独立发版。下面的版图在所有 NewLife 仓库中逐字一致；每个项目链接到代码仓库与主 NuGet 包。

| 项目 | 一句话定位 | 下载量 |
| --- | --- | --- |
| **基础底座** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | 日志、配置、缓存、网络、序列化、定时调度与 APM 追踪。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | 数据中间件：单表百亿级、自动分表、读写分离，支持 10 多种数据库。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | 高性能网络库：单机 177 万 pps、14.5 Gbps（TCP 1KB，2026-10 实测），400 万 Tcp 长连接。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | 协议通信与 RPC 框架，面向 CS 应用与物联网设备。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | 把 .NET 应用安装为操作系统守护进程：Windows 服务与 Linux systemd。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | `dotnet new` 项目模板：控制台、Web、WebApi、服务、数据与物联网。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **数据存储与消息** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | Redis 客户端：微秒级延迟、百万级吞吐，内置消息队列。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | 纯托管 RocketMQ 客户端，支持 Apache RocketMQ 与阿里云消息队列。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | MQTT 客户端与服务端，客户端支持阿里云物联网。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | C# 混合数据库：嵌入/网络双模，关系型、时序、消息队列与 KV 于一体。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | MySql 驱动与数据访问辅助层，基于 NewLife 数据栈实现。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web、AI 与分布式** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | 魔方快速开发平台：用户权限、SSO、OAuth 服务端与 CRUD 脚手架。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | 星尘分布式服务平台：节点管理、APM、配置中心、注册中心与发布中心。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | 蚂蚁调度：分布式任务与实时数据平台，支持分片、重试与回溯补算。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | 统一接入 46 家大模型服务商，附带开箱即用的 ChatAI Web 对话应用。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **工业与物联网** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | IoT 标准库，定义物联网通信协议契约与设备抽象。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | Modbus TCP/RTU/ASCII，基于 NewLife.IoT 实现。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | 西门子 PLC 协议，基于 NewLife.IoT 实现。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | 欧姆龙 PLC 协议，基于 NewLife.IoT 实现。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | 三菱 Melsec PLC 协议，基于 NewLife.IoT 实现。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | OPC 客户端，用于工业数据采集。 | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | BACnet 楼宇自控协议栈。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | 开源轻量级 IoT 平台，含网关与设备管理。 | — |
| **车联网** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | JT/T 808 车辆定位协议：70+ 消息体，覆盖 2011/2013/2019 三个版本。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | JT/T 809 部标平台互联协议，面向运输管理部门。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | JT/T 1078 车载视频：RTP 解析、FLV/fMP4 转封装与直播推送。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **领域组件** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | 一个包覆盖 Excel、Word、PPT、PDF 等 15+ 文档格式。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | 跨平台音频：编解码、设备 IO、DSP、容器与流式处理。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | 视频编解码、封装格式、帧处理与流媒体。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | 百度/高德/腾讯/天地图统一接口，支持地理编码与坐标转换。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | IPv4 归属地：离线内存映射库 + 在线 API 双源。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **工具与产品** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | 码神工具：网络、串口、加解密、正则、Modbus 与 MQTT。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | 自托管 Git 源代码管理系统。 | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | 从低版本宿主启动时，自动安装匹配的 .NET 运行时。 | — |

> 徽章取各项目主包；主题包、扩展包与卫星包见对应 NuGet 页面。未在表中列出的 30 多个包（FTP、LoRa、Office 扩展、各类协议驱动等）见 [NewLifeX 组织](https://github.com/NewLifeX) 与 [newlifex.com](https://newlifex.com)。本表以 NewLife.Core README 为维护源。

## 文档索引

- 📋 [需求文档](Doc/需求文档.md) — 愿景、核心目标、功能需求、暂缓/不做什么
- ✅ [功能清单](Doc/功能清单.md) — 实现/测试/注释三维状态追踪
- 🏗️ [架构设计](Doc/架构设计.md) — .NET 皮肤集成、公共包策略、前端架构
- 🖥️ [前端工程说明](NewLife.Cube.React/web/README.md) — web 目录开发/构建/测试指南

## 快速开始

前置：本地需有 `../NewLife.Cube` monorepo（团队公共前端包仓库，且已 `pnpm install` 保证 `packages/*/dist` 存在）。

```bash
# 1. 启动后端 API（CubeDemo，默认 http://localhost:5050，SQLite 免外部依赖）
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. 启动前端 dev（端口 5188）
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

浏览器打开 <http://localhost:5188> 即可看到登录页，登录后进入完整管理后台。

## 本地开发

```bash
# 前端构建/检查/单测（web/ 目录）
cd NewLife.Cube.React/web
pnpm build        # 输出 ../wwwroot（供 .NET 嵌入）
pnpm type-check   # tsc 类型检查
pnpm test:unit    # Vitest 单测（136 个）
pnpm test:e2e     # Playwright E2E（48 个；默认 5050，可 $env:E2E_BASE_URL 覆盖）

# .NET 构建（嵌入 wwwroot → DLL）
dotnet build 魔方React.slnx -c Release
```

**修改公共包**：改 `../NewLife.Cube/packages/*` 源码后，在 monorepo 执行 `pnpm build:packages`（或 `pnpm dev:packages` watch 实时重建），皮肤（`file:` 符号链接）即时生效。

## 测试

- **单元测试**：Vitest + React Testing Library + jsdom，136 个用例全过
- **E2E 测试**：Playwright 48 个用例（登录/注册/激活/忘记密码/安全中心/列表增删改/导入导出/布局/上传/AI），登录会话复用
- **.NET 集成**：CubeDemo + `UseReact` 全流程端到端（登录→菜单→CRUD→导出→刷新不 404）

## 发布

- **NuGet 包**：`NewLife.Cube.React`（版本 `1.0.{yyyy.MMdd}`，含 snupkg 符号包）
- **CI 自动化**：⏸ 规划中——待公共包 npm 发布就绪后改造 `.github/workflows/`（web 前置构建 → `dotnet pack` → 发布 nuget.org + GitHub Packages），见[功能清单](Doc/功能清单.md) §4

## 相关仓库

| 仓库 | 说明 |
|------|------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | 魔方核心（WebAPI/权限/菜单/字段元数据）+ 前端公共包 `packages/@cube/*` |
| [魔方皮肤设计规范](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | 魔方所有皮肤应遵循的统一设计规范，React 皮肤符合该规范 |
| NewLife.Cube.Vue | Vue 系前端皮肤（Vue3 + Element Plus） |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | 本仓库（React 系前端皮肤） |

## 新生命开发团队

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

新生命团队成立于 2002 年，二十余年专注 .NET 与物联网技术生态，主导开源项目近百个（生态版图收录 34 个主干项目），为电力、物流、医疗、工控、互联网等行业提供软硬件一体化解决方案；以“学无先后达者为师”为信条。

开源组件在 NuGet 累计下载 <!--nuget-total:start-->6.48M<!--nuget-total:end--> 次（全生态口径，截至 2026-10）。

网站：https://newlifex.com · 开源组织：https://github.com/NewLifeX

<details>
<summary>微信公众号：智能大石头（扫码关注）</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## License

[MIT](LICENSE) © 2002-2026 新生命开发团队
