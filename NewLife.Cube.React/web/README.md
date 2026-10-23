# NewLife.Cube.React

魔方（NewLife.Cube）第三代 WebAPI 前端的 **React 皮肤**。基于 **React 19 + Ant Design 6 + Zustand + Vite**，由后端字段元数据（`meta`）驱动，动态渲染通用列表页 / 表单页，符合魔方皮肤设计规范。

> 本项目为**全新重构**（原 UMI Max 版本已废弃），依赖公共前端库 `@newlifex/*`（`file:` 本地引用 `../NewLife.Cube/packages`，见[架构设计](../../Doc/架构设计.md) §3）。

---

## 技术栈

| 层 | 选型 |
|----|------|
| 构建 | Vite 6（产物输出 `../wwwroot`，由 .NET 项目嵌入程序集） |
| UI | Ant Design 6 + @ant-design/icons（单一主题 × 明暗） |
| 状态 | Zustand 5（登录态 / 菜单 / 多标签 / 主题） |
| 路由 | react-router v6（静态路由 + catch-all `*` → 动态实体页） |
| 数据 | axios（`@newlifex/api-core`）+ `@newlifex/page-logic` 页面 Store |
| 图表 | ECharts 5（懒加载） |
| AI | `marked` + `dompurify` + mermaid（CDN 懒加载） |
| 测试 | Vitest 3 + RTL（单测）；Playwright 1.54（E2E） |

---

## 目录结构

```
web/
├─ src/
│  ├─ configure/        # 配置系统（默认配置 + window._CUBE_CONFIG_ 运行时覆盖）
│  ├─ api/              # 全局 CubeApi 客户端（token 事件 / 统一错误提示）
│  ├─ stores/           # user / menu / tabs / theme 各 Zustand store
│  ├─ router/           # 静态路由表 + RouteMeta
│  ├─ layouts/          # RootLayout / MainLayout（Sider 菜单、Header、多标签、Footer）
│  ├─ pages/            # Login / Register / Activate / ForgotPassword / ProfileSecurity / Home / DefaultEntity / NotFound
│  ├─ views/            # list（通用列表页）+ form（表单弹窗 / 表单页）
│  ├─ components/       # field 控件族、ai 助手、公共组件
│  ├─ hooks/            # usePageStore / useLoginConfig / useSiteConfig / useLookup / useLovOptions
│  ├─ utils/            # fieldControl / url / passwordRules / icon / menuItems
│  └─ types/            # FieldMeta / ControlType 等共享类型
├─ e2e/                 # Playwright E2E（auth.setup 会话复用 + login/list 场景）
├─ tests/               # Vitest 环境与全局 mock
└─ package.json
```

> 文档（需求/功能清单/架构设计）位于仓库根 `Doc/`：[需求文档](../../Doc/需求文档.md) / [功能清单](../../Doc/功能清单.md) / [架构设计](../../Doc/架构设计.md)

---

## 本地开发

前置：
1. 本地有 `../NewLife.Cube` monorepo（团队公共前端包仓库）且已 `pnpm install`，保证 `packages/*/dist` 存在（`@newlifex/*` 以 `file:` 引用，详见[架构设计](../../Doc/架构设计.md) §3）
2. 启动后端 API（如 `CubeDemo`，默认 `http://localhost:5050`），`/api` 与 `/Ai` 由 Vite 代理转发（剥掉 `/api` 前缀）

```bash
# 安装依赖（web/ 目录执行一次即可）
pnpm install

# 启动开发服务器（端口 5188）
pnpm dev
```

## 构建

```bash
pnpm build
```

构建产物输出到 `../wwwroot/`，由 .NET 项目 `NewLife.Cube.React.csproj` 嵌入程序集，通过 `app.UseReact(env)` 以 SPA 回退方式提供。

## 测试

```bash
# 单元测试（Vitest，136 个）
pnpm test:unit

# E2E 测试（Playwright，48 个；默认 5050，可用 $env:E2E_BASE_URL="http://localhost:7081" 覆盖指向一体站点）
pnpm test:e2e
```

---

## 文档

- 📋 [需求文档](../../Doc/需求文档.md) — 愿景、核心目标、功能需求
- ✅ [功能清单](../../Doc/功能清单.md) — 三维状态追踪（含 SKIN/PKG/CI 模块）
- 🏗️ [架构设计](../../Doc/架构设计.md) — .NET 皮肤集成、公共包策略、前端架构
- 📖 [仓库 README](../../README.md) — 项目门面、快速开始
