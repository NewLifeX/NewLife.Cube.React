# 魔方 React 皮膚 NewLife.Cube.React

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Português](README.pt.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [العربية](README.ar.md)
<!-- lang:end -->

魔方（NewLife.Cube）第三代 WebAPI 前端的 **React 皮膚**，獨立 NuGet 套件 + 獨立儲存庫管理。基於 **React 19 + Ant Design 6 + Zustand + Vite**，由後端欄位中繼資料（`meta`）驅動，動態渲染通用清單頁 / 表單頁，符合[魔方皮膚設計規範](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md)。

引用 `NewLife.Cube` + `NewLife.Cube.React` 兩個套件，`dotnet run` 後瀏覽器開啟即有完整管理後台——登入、動態選單、欄位中繼資料驅動的清單/表單、CRUD、匯入匯出、AI 助理等，**零前端開發**。

> 示範/教學：魔方教學 <https://newlifex.com/cube> | 示範網站 <https://cube.newlifex.com>

> ⚠️ 本繁體中文版與 [English README](README.md) 同批維護；若兩者內容不一致，以英文版為對外口徑。

---

## 亮點

- **開箱即用**：`app.UseReact(env)` 一行接入，建置產物內嵌 DLL 隨 NuGet 散布，無實體檔案依賴
- **欄位中繼資料驅動**：清單/表單/搜尋/詳情全部由後端 `meta` 中繼資料動態渲染，新增實體零前端開發
- **符合魔方皮膚設計規範**：認證登入全流程、通用清單、通用表單、LOV/上傳/富文字/AI 助理等公共元件
- **消費共享公共套件**：基於 `@cube/*`（api-core/auth-logic/page-logic/field-mapping/page-utils），框架無關核心多皮膚共享
- **單一主題 × 明暗**：antd token 驅動的原生觀感，明暗切換一鍵完成
- **AI 智慧助理**：SSE 串流對話 + 快捷指令 + 智慧填表 + 系統診斷，內建 mermaid 渲染
- **多語言在地化**：11 種全量翻譯介面語言（後端清單 ∩ 前端全量語言；後端語言清單 32 種，其餘 21 種統一回退英文；與 NewLife.Core/Cube 同鏈路，需 NewLife.Cube ≥ 6.15.2026.1022），支援跟隨系統與強制語言，伺服器選單、欄位中繼資料與執行時訊息隨語言切換重新拉取
- **測試完備**：單元測試 136 個 + E2E 48 個全過，Playwright 登入工作階段重用

## 生態版圖

NewLife 生態系按相依分層，各專案獨立版本、獨立發行。下面的版圖在所有 NewLife 儲存庫中逐字一致；每個專案連結到程式碼儲存庫與主 NuGet 套件。

| 專案 | 一句話定位 | 下載量 |
| --- | --- | --- |
| **基礎底座** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | 日誌、設定、快取、網路、序列化、排程與 APM 追蹤。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | 資料中介層：單表百億級、自動分表、讀寫分離，支援 10 多種資料庫。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | 高效能網路庫：單機 177 萬 pps、14.5 Gbps（TCP 1KB，2026-10 實測），400 萬 Tcp 長連線。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | 協定通訊與 RPC 框架，面向 CS 應用程式與物聯網裝置。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | 將 .NET 應用程式安裝為作業系統常駐服務：Windows 服務與 Linux systemd。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | `dotnet new` 專案範本：主控台、Web、API、服務、資料與物聯網。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **資料儲存與訊息** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | Redis 用戶端：微秒級延遲、百萬級吞吐，內建訊息佇列。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | 純受控 RocketMQ 用戶端，支援 Apache RocketMQ 與阿里雲訊息佇列。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | MQTT 用戶端與服務端，含阿里雲物聯網接入。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | C# 混合式資料庫：內嵌或網路雙模，關係型、時序、訊息佇列與 KV 於一體。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | 建構於 NewLife 資料堆疊之上的 MySql 驅動與輔助層。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web、AI 與分散式** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | 快速後台開發框架：權限、SSO、OAuth 服務端與 CRUD 樣板。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | 分散式服務平台：節點管理、APM、設定中心、註冊中心與發佈中心。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | 分散式任務與即時資料排程平台，支援分片、重試與回溯補算。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | 統一接入 46 家大模型服務商，附帶開箱即用的 ChatAI Web 對話應用。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **工業與物聯網** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | 物聯網標準庫，定義通訊協定契約與裝置抽象。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | 建構於 NewLife.IoT 之上的 Modbus TCP/RTU/ASCII 實作。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | 建構於 NewLife.IoT 之上的西門子 PLC 協定。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | 建構於 NewLife.IoT 之上的歐姆龍 PLC 協定。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | 建構於 NewLife.IoT 之上的三菱 Melsec PLC 協定。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | 工業資料存取的 OPC 用戶端。 | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | BACnet 樓宇自動化協定堆疊。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | 開源輕量級物聯網平台，含閘道與裝置管理。 | — |
| **車聯網** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | JT/T 808 車輛定位協定：70+ 訊息體，涵蓋 2011/2013/2019 三個版本。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | JT/T 809 部標平台互聯協定，面向運輸管理部門。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | JT/T 1078 車載視訊：RTP 解析、FLV/fMP4 轉封裝與直播推送。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **領域元件** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | 一個套件涵蓋 Excel、Word、PPT、PDF 等 15+ 文件格式。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | 跨平台音訊：編解碼、裝置 IO、DSP、容器與串流處理。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | 視訊編解碼、封裝格式、影格處理與串流。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | 百度／高德／騰訊／天地圖統一介面，支援地理編碼與座標轉換。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | IPv4 歸屬地：離線記憶體映射資料庫 + 線上 API 雙來源。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **工具與產品** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | 開發者工具箱：網路、序列埠、加解密、正規表示式、Modbus 與 MQTT。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | 自架 Git 原始碼管理系統。 | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | 從較舊的宿主啟動時，自動安裝相符的 .NET 執行階段。 | — |

> 徽章取各專案主套件；主題套件、擴充套件與衛星套件見對應 NuGet 頁面。未在表中列出的 30 多個套件（FTP、LoRa、Office 擴充、各類協定驅動等）見 [NewLifeX 組織](https://github.com/NewLifeX) 與 [newlifex.com](https://newlifex.com)。本表以 NewLife.Core README 為維護來源。

## 文件索引

- 📋 [需求文件](Doc/需求文档.md) — 願景、核心目標、功能需求、暫緩/不做什麼
- ✅ [功能清單](Doc/功能清单.md) — 實作/測試/註解三維狀態追蹤
- 🏗️ [架構設計](Doc/架构设计.md) — .NET 皮膚整合、公共套件策略、前端架構
- 🖥️ [前端工程說明](NewLife.Cube.React/web/README.md) — web 目錄開發/建置/測試指南

## 快速開始

前置：本機需有 `../NewLife.Cube` monorepo（團隊公共前端套件儲存庫，且已 `pnpm install` 保證 `packages/*/dist` 存在）。

```bash
# 1. 啟動後端 API（CubeDemo，預設 http://localhost:5050，SQLite 免外部依賴）
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. 啟動前端 dev（連接埠 5188）
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

瀏覽器開啟 <http://localhost:5188> 即可看到登入頁，登入後進入完整管理後台。

## 本機開發

```bash
# 前端建置/檢查/單元測試（web/ 目錄）
cd NewLife.Cube.React/web
pnpm build        # 輸出 ../wwwroot（供 .NET 內嵌）
pnpm type-check   # tsc 型別檢查
pnpm test:unit    # Vitest 單元測試（136 個）
pnpm test:e2e     # Playwright E2E（48 個；預設 5050，可用 $env:E2E_BASE_URL 覆寫）

# .NET 建置（內嵌 wwwroot → DLL）
dotnet build 魔方React.slnx -c Release
```

**修改公共套件**：改 `../NewLife.Cube/packages/*` 原始碼後，在 monorepo 執行 `pnpm build:packages`（或 `pnpm dev:packages` watch 即時重建），皮膚（`file:` 符號連結）即時生效。

## 測試

- **單元測試**：Vitest + React Testing Library + jsdom，136 個案例全過
- **E2E 測試**：Playwright 48 個案例（登入/註冊/啟用/忘記密碼/安全中心/清單增刪改/匯入匯出/版面/上傳/AI），登入工作階段重用
- **.NET 整合**：CubeDemo + `UseReact` 全流程端對端（登入→選單→CRUD→匯出→重新整理不 404）

## 發佈

- **NuGet 套件**：`NewLife.Cube.React`（版本 `1.0.{yyyy.MMdd}`，含 snupkg 符號套件）
- **CI 自動化**：⏸ 規劃中——待公共套件 npm 發佈就緒後改造 `.github/workflows/`（web 前置建置 → `dotnet pack` → 發佈 nuget.org + GitHub Packages），見[功能清單](Doc/功能清单.md) §4

## 相關儲存庫

| 儲存庫 | 說明 |
|------|------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | 魔方核心（WebAPI/權限/選單/欄位中繼資料）+ 前端公共套件 `packages/@cube/*` |
| [魔方皮膚設計規範](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | 魔方所有皮膚應遵循的統一設計規範，React 皮膚符合該規範 |
| NewLife.Cube.Vue | Vue 系前端皮膚（Vue3 + Element Plus） |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | 本儲存庫（React 系前端皮膚） |

## 新生命開發團隊

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

新生命團隊成立於 2002 年，二十餘年專注 .NET 與物聯網技術生態，主導開源專案近百個（生態版圖收錄 34 個主幹專案），為電力、物流、醫療、工控、網際網路等行業提供軟硬體一體化解決方案；以「學無先後達者為師」為信條。

開源元件在 NuGet 累計下載 <!--nuget-total:start-->6.48M<!--nuget-total:end--> 次（全生態口徑，截至 2026-10）。

網站：https://newlifex.com · 開源組織：https://github.com/NewLifeX

<details>
<summary>微信公眾號：智能大石头（掃碼關注）</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## 授權

[MIT](LICENSE) © 2002-2026 新生命開發團隊
