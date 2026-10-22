# 魔方 React 皮肤 NewLife.Cube.React

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

魔方（NewLife.Cube）第三代 WebAPI 前端的 **React 皮肤**，独立 NuGet 包 + 独立仓库管理。基于 **React 19 + Ant Design 6 + Zustand + Vite**，由后端字段元数据（`GetPage`）驱动，动态渲染通用列表页 / 表单页，符合[魔方皮肤设计规范](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md)。

引用 `NewLife.Cube` + `NewLife.Cube.React` 两个包，`dotnet run` 后浏览器打开即有完整管理后台——登录、动态菜单、字段元数据驱动的列表/表单、CRUD、导入导出、AI 助手等，**零前端开发**。

> 演示/教程：魔方教程 <https://newlifex.com/cube> | 演示站点 <https://cube.newlifex.com>

---

## 亮点

- **开箱即用**：`app.UseReact(env)` 一行接入，构建产物嵌入 DLL 随 NuGet 分发，无物理文件依赖
- **字段元数据驱动**：列表/表单/搜索/详情全部由后端 `GetPage` 元数据动态渲染，新增实体零前端开发
- **符合魔方皮肤设计规范**：认证登录全流程、通用列表、通用表单、LOV/上传/富文本/AI 助手等公共组件
- **消费共享公共包**：基于 `@cube/*`（api-core/auth-logic/page-logic/field-mapping/page-utils），框架无关核心多皮肤共享
- **单一主题 × 明暗**：antd token 驱动的原生观感，明暗切换一键完成
- **AI 智能助手**：SSE 流式对话 + 快捷指令 + 智能填表 + 系统诊断，内置 mermaid 渲染
- **多语言本地化**：11 种界面语言，`?lang=`/Cookie/`Accept-Language` 与 NewLife.Core、NewLife.Cube 同链路（需 NewLife.Cube ≥ 6.15.2026.1022），服务端菜单、字段元数据与运行时消息随语言切换重新拉取
- **测试完备**：单测 136 个 + E2E 48 个全过，Playwright 登录会话复用

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

## License

[MIT](LICENSE) © 2002-2026 新生命开发团队
