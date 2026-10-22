# NewLife.Cube.React - NewLife.Cube の React スキン

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Português](README.pt.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [العربية](README.ar.md)
<!-- lang:end -->

Cube（NewLife.Cube）第3世代 WebAPI フロントエンドの **React スキン**です。独立した NuGet パッケージ兼リポジトリとして提供されます。**React 19 + Ant Design 6 + Zustand + Vite** を採用し、バックエンドのフィールドメタデータ（`meta`）に駆動されて汎用リストページ／フォームページを動的描画します。[魔方スキン設計仕様](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) に準拠しています。

`NewLife.Cube` と `NewLife.Cube.React` の2つのパッケージを参照し、`dotnet run` 後にブラウザを開くだけで完全な管理画面が使えます。ログイン、動的メニュー、フィールドメタデータ駆動のリスト／フォーム、CRUD、インポート／エクスポート、AI アシスタントなどを備え、**フロントエンド開発はゼロ**です。

> デモ／チュートリアル：魔方チュートリアル <https://newlifex.com/cube> | デモサイト <https://cube.newlifex.com>

> ⚠️ この翻訳は遅れている場合があります。正式な内容は [英語版 README](README.md) を参照してください。

---

## ハイライト

- **すぐに使える**：`app.UseReact(env)` の1行で導入。ビルド成果物は DLL に埋め込まれ NuGet パッケージとして配布されるため、実ファイルへの依存はありません
- **フィールドメタデータ駆動**：リスト／フォーム／検索／詳細はすべてバックエンドの `meta` メタデータから動的に描画。エンティティ追加時のフロントエンド開発は不要です
- **魔方スキン設計仕様に準拠**：認証ログイン全フロー、汎用リスト、汎用フォーム、LOV／アップロード／リッチテキスト／AI アシスタントなどの共通コンポーネントを提供
- **共有パッケージを利用**：`@cube/*`（api-core/auth-logic/page-logic/field-mapping/page-utils）に基づき、フレームワーク非依存のコアを複数スキンで共有
- **単一テーマ × ライト／ダーク**：antd トークンによるネイティブな見た目、ライト／ダーク切り替えはワンクリック
- **AI アシスタント**：SSE ストリーミング対話 + クイックコマンド + スマート入力 + システム診断、mermaid レンダリング内蔵
- **多言語ローカライズ**：11言語の完全翻訳 UI（バックエンド一覧 ∩ フロントエンド完全対応言語、リソースは32ロケール。NewLife.Core/Cube と同じ経路、NewLife.Cube ≥ 6.15.2026.1022 が必要）。システム追従と強制言語に対応し、言語切り替え時にサーバーメニュー、フィールドメタデータ、実行時メッセージを再取得
- **テスト充実**：単体テスト136件 + E2E 48件がすべて成功、Playwright のログインセッションを再利用

## エコシステムマップ

NewLife は、独立したバージョン管理を行うオープンソースプロジェクトの階層型エコシステムです。以下のマップはすべての NewLife リポジトリで逐語的に同一の内容を共有しており、各プロジェクトはコードリポジトリと主要な NuGet パッケージにリンクしています。

| プロジェクト | 概要 | ダウンロード数 |
| --- | --- | --- |
| **基盤** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | ログ、構成、キャッシュ、ネットワーク、シリアライズ、スケジューリング、APM トレーシング。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | データミドルウェア：単一テーブルで数百億件級、自動シャーディング、読み書き分離、10 種類以上のデータベースに対応。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | 高性能ネットワークライブラリ：単一マシンで 177 万 pps、14.5 Gbps（TCP 1KB、2026-10 実測）、400 万 Tcp 長接続。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | CS アプリケーションと IoT デバイス向けのプロトコル通信と RPC フレームワーク。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | .NET アプリケーションを OS デーモンとしてインストール：Windows サービスと Linux systemd。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | コンソール、Web、API、サービス、データ、IoT 向けの `dotnet new` プロジェクトテンプレート。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **データとメッセージング** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | マイクロ秒級の遅延、数百万 ops/s のスループット、メッセージキュー内蔵の Redis クライアント。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | Apache RocketMQ と Alibaba Cloud Message Queue に対応した純マネージド RocketMQ クライアント。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | MQTT クライアントとサーバー。Alibaba Cloud IoT への接続を含みます。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | C# 製ハイブリッドデータベース：組み込み/ネットワークの両モード、リレーショナル、時系列、メッセージキュー、KV を 1 つに。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | NewLife データスタック上に構築された MySql ドライバーとヘルパー層。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web、AI、分散** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | 高速管理プラットフォームフレームワーク：権限、SSO、OAuth サーバー、CRUD スキャフォールディング。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | 分散サービスプラットフォーム：ノード管理、APM、構成センター、登録センター、リリースセンター。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | シャーディング、リトライ、バックフィルに対応した分散タスクとリアルタイムデータのスケジューリングプラットフォーム。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | 46 社の LLM プロバイダーに統一接続するクライアントと、すぐに使える Web チャットアプリ ChatAI。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **産業と IoT** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | プロトコル契約とデバイス抽象を定義する IoT 標準ライブラリ。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | NewLife.IoT 上に実装された Modbus TCP/RTU/ASCII。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | NewLife.IoT 上に実装されたシーメンス PLC プロトコル。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | NewLife.IoT 上に実装されたオムロン PLC プロトコル。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | NewLife.IoT 上に実装された三菱 Melsec PLC プロトコル。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | 産業データアクセス向けの OPC クライアント。 | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | BACnet ビル管理プロトコルスタック。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | ゲートウェイとデバイス管理を備えた軽量なオープンソース IoT プラットフォーム。 | — |
| **車載テレマティクス** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | JT/T 808 車両位置情報プロトコル：70 以上のメッセージボディ、2011/2013/2019 に対応。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | 運輸管理部門向けの JT/T 809 プラットフォーム間プロトコル。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | JT/T 1078 車載ビデオ：RTP 解析、FLV/fMP4 リマックス、ライブ配信。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **ドメインコンポーネント** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | Excel、Word、PPT、PDF など 15 以上のドキュメント形式を 1 パッケージで。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | クロスプラットフォーム音声：コーデック、デバイス IO、DSP、コンテナ、ストリーミング。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | ビデオコーデック、コンテナ形式、フレーム処理、ストリーミング。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | 百度地図、高徳地図、テンセント地図、天地図を統一インターフェイス化。ジオコーディングと座標変換に対応。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | IPv4 位置情報：オフラインのメモリマップデータベースとオンライン API のフォールバック。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **ツールと製品** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | 開発者向けツールボックス：ネットワーク、シリアルポート、暗号化、正規表現、Modbus、MQTT。 | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | セルフホスト型 Git ソースコード管理システム。 | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | 古いホストから起動した際に対応する .NET ランタイムを自動インストールします。 | — |

> バッジは各プロジェクトの主要パッケージを示します。テーマ、拡張、サテライトパッケージは各 NuGet ページを参照してください。ここに記載していない 30 以上のパッケージ（FTP、LoRa、Office 拡張、各種プロトコルドライバーなど）は [NewLifeX 組織](https://github.com/NewLifeX) と [newlifex.com](https://newlifex.com) で公開しています。この表は NewLife.Core の README で管理されています。

## ドキュメント

- 📋 [要件定義](Doc/需求文档.md) — ビジョン、中核目標、機能要件、保留項目／非対象
- ✅ [機能一覧](Doc/功能清单.md) — 実装／テスト／コメントの3次元ステータス追跡
- 🏗️ [アーキテクチャ設計](Doc/架构设计.md) — .NET スキン統合、共有パッケージ戦略、フロントエンド構成
- 🖥️ [フロントエンドガイド](NewLife.Cube.React/web/README.md) — web ディレクトリの開発／ビルド／テストガイド

## クイックスタート

前提：ローカルに `../NewLife.Cube` monorepo（チーム共通のフロントエンドパッケージリポジトリ）があり、`pnpm install` 済みで `packages/*/dist` が存在すること。

```bash
# 1. バックエンド API を起動（CubeDemo、既定 http://localhost:5050、SQLite で外部依存なし）
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. フロントエンド dev を起動（ポート 5188）
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

ブラウザで <http://localhost:5188> を開くとログインページが表示され、ログイン後に完全な管理画面へ進みます。

## ローカル開発

```bash
# フロントエンドのビルド／チェック／単体テスト（web/ ディレクトリ）
cd NewLife.Cube.React/web
pnpm build        # ../wwwroot に出力（.NET への埋め込み用）
pnpm type-check   # tsc 型チェック
pnpm test:unit    # Vitest 単体テスト（136件）
pnpm test:e2e     # Playwright E2E（48件、既定 5050、$env:E2E_BASE_URL で上書き可）

# .NET ビルド（wwwroot を DLL に埋め込み）
dotnet build 魔方React.slnx -c Release
```

**共有パッケージの変更**：`../NewLife.Cube/packages/*` のソースを変更した後、monorepo で `pnpm build:packages`（または `pnpm dev:packages` で watch 再ビルド）を実行すると、スキン（`file:` シンボリックリンク）に即時反映されます。

## テスト

- **単体テスト**：Vitest + React Testing Library + jsdom、136件すべて成功
- **E2E テスト**：Playwright 48件（ログイン／登録／アクティベーション／パスワード忘れ／セキュリティセンター／リスト CRUD／インポート・エクスポート／レイアウト／アップロード／AI）、ログインセッションを再利用
- **.NET 統合**：CubeDemo + `UseReact` の全フロー（ログイン→メニュー→CRUD→エクスポート→更新しても404にならない）

## リリース

- **NuGet パッケージ**：`NewLife.Cube.React`（バージョン `1.0.{yyyy.MMdd}`、snupkg シンボルパッケージ付き）
- **CI 自動化**：⏸ 計画中 — 共有パッケージの npm 公開準備が整い次第 `.github/workflows/` を改修（web 事前ビルド → `dotnet pack` → nuget.org + GitHub Packages へ公開）。[機能一覧](Doc/功能清单.md) §4 を参照

## 関連リポジトリ

| リポジトリ | 説明 |
|------------|------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | 魔方コア（WebAPI／権限／メニュー／フィールドメタデータ）+ フロントエンド共有パッケージ `packages/@cube/*` |
| [魔方スキン設計仕様](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | すべての魔方スキンが従う統一設計仕様。React スキンはこれに準拠 |
| NewLife.Cube.Vue | Vue 系フロントエンドスキン（Vue3 + Element Plus） |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | 本リポジトリ（React 系フロントエンドスキン） |

## 新生命開発チーム

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

新生命チームは 2002 年に設立され、20 年以上にわたり .NET と IoT の技術エコシステムに注力し、100 近いオープンソースプロジェクトを主導し（うち 34 が主要プロジェクト）、電力、物流、医療、産業制御、インターネットなどの業界にソフトウェアとハードウェアを一体化したソリューションを提供しています。「学問に先後なし、達する者が師である」を信条としています。

オープンソースコンポーネントは NuGet で累計 <!--nuget-total:start-->6.48M<!--nuget-total:end--> 回ダウンロードされています（エコシステム全体、2026-10 時点）。

ウェブサイト：https://newlifex.com · オープンソース組織：https://github.com/NewLifeX

<details>
<summary>WeChat 公式アカウント：智能大石头（スキャンしてフォロー）</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## ライセンス

[MIT](LICENSE) © 2002-2026 新生命開発チーム
