# README 多语言规范

根目录的 `README.md`（English，默认落地页）、`README.zh-CN.md`（简体中文，双权威）与 `README.*.md` 是同一份说明文档的多语种版本。语言切换行由脚本从 `readme-languages.json` 生成，本文规定切换行的**顺序**、**权威关系**与**维护方式**。上游规范见 [NewLife.Core README 多语言规范](https://github.com/NewLifeX/X/blob/dev/Doc/README多语言规范.md)。

## 定序规则

1. **固定前三**：English（`README.md`，GitHub 默认落地页）→ 简体中文（`README.zh-CN.md`，与英文双权威）→ 繁體中文（`README.zh-TW.md`，与简体同源，紧邻便于对照）。
2. **其余按技术内容语种规模排序**：以 W3Techs「内容语种占比」（全球 top 1000 万站点首页）为依据，一次定序后**冻结**。
3. **新语种一律追加到末尾**，不做全局重排（同一语言的不同书写系统例外：紧跟其主语言）。

### 权威与同步

- **English 与简体中文为双权威**：内容变更必须在同一 PR 内同时更新 `README.md` 与 `README.zh-CN.md`；发布前以英文版为对外口径。
- **其他语种允许滞后**：开头必须写明「本翻译可能滞后，以 [English README](README.md) 为准」。
- **冲突处理**：英文与简体中文不一致时，以英文版为准并回补中文；不得让默认落地页长期落后。

### 当前顺序

| # | 语种 | 文件 | 依据（W3Techs，2025-12-03） |
|---|------|------|------|
| 1 | English | `README.md` | 默认落地页，固定第一位 |
| 2 | 简体中文 | `README.zh-CN.md` | 与英文同批维护，固定第二位 |
| 3 | 繁體中文 | `README.zh-TW.md` | 与简体同源，紧随简体便于对照 |
| 4 | Español | `README.es.md` | 6.0% |
| 5 | Deutsch | `README.de.md` | 5.9% |
| 6 | 日本語 | `README.ja.md` | 5.1% |
| 7 | Français | `README.fr.md` | 4.5% |
| 8 | Português | `README.pt.md` | 4.1% |
| 9 | Русский | `README.ru.md` | 3.7% |
| 10 | 한국어 | `README.ko.md` | 0.8% |
| 11 | العربية | `README.ar.md` | 0.5% |

## 维护方式

- **单一事实源**：`readme-languages.json`（`code` / `name` / `file`，数组顺序即展示顺序）。
- **生成与校验**：`sync-readme-languages.ps1` 按配置重写各 README 的切换块；加 `-Check` 只校验不写入，不一致时退出码 1。
- **CI 门禁**：`.github/workflows/readme.yml` 在 README、配置或脚本变动时执行 `-Check`，顺序不一致或多份副本漂移会直接失败。
- 各 README 只有下面标记块之间的内容由脚本生成，其余内容不受影响：

```markdown
<!-- lang:start -->
🌐 [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | ...
<!-- lang:end -->
```

## 新增一种语言

1. 翻译整篇 README，文件名用 `README.{BCP 47 语言标签}.md`；English 固定 `README.md`，简体中文固定 `README.zh-CN.md`，繁體中文固定 `README.zh-TW.md`。
2. 在 `readme-languages.json` 的 `languages` 数组**末尾**追加 `{ "code", "name", "file" }`，`name` 用本族语名称。
3. 在正文开头补上与其它版本一致的说明：「本翻译可能滞后，以 [English README](README.md) 为准」。
4. 运行 `pwsh -File sync-readme-languages.ps1` 生成切换行，再运行 `-Check` 确认。
5. 根目录新增了 README 却没登记到配置，脚本会直接报错，避免切换行静默漏掉该语种。

## 共享段落

- 「生态版图」与「团队介绍」两节在所有 NewLife 仓库中逐字一致，翻译以 [NewLife.Core](https://github.com/NewLifeX/X) 对应语种 README 为准。
- 修改版图或团队信息时，先改 Core，再同步到本仓库 11 个语种，避免各仓库口径漂移。
- 团队介绍中的 NuGet 累计下载量与 Core 保持一致；Core 更新后同步本仓库 11 个语种。

## 展示约定

- 语言名一律用**本族语名称**（`日本語`、`Español`），不用英文名，也不用国旗——语言 ≠ 国家。
- 当前页面的语种在切换行中省略自身，避免点到当前页。
- 分隔符统一为 ` | `，行首保留 `🌐`。
