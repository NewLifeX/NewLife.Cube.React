# NewLife.Cube.React - NewLife.Cube용 React 스킨

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Português](README.pt.md) | [Русский](README.ru.md) | [العربية](README.ar.md)
<!-- lang:end -->

Cube(NewLife.Cube) 3세대 WebAPI 프런트엔드의 **React 스킨**으로, 독립 NuGet 패키지와 저장소로 제공됩니다. **React 19 + Ant Design 6 + Zustand + Vite** 기반이며 백엔드 필드 메타데이터(`meta`)에 의해 구동되어 범용 목록/폼 페이지를 동적으로 렌더링하고, [큐브 스킨 디자인 규격](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md)을 준수합니다.

`NewLife.Cube`와 `NewLife.Cube.React` 두 패키지를 참조하고 `dotnet run` 후 브라우저를 열면 로그인, 동적 메뉴, 필드 메타데이터 기반 목록/폼, CRUD, 가져오기/내보내기, AI 어시스턴트 등이 포함된 완전한 관리 콘솔을 바로 사용할 수 있습니다. **프런트엔드 개발은 전혀 필요 없습니다.**

> 데모/튜토리얼: 큐브 튜토리얼 <https://newlifex.com/cube> | 데모 사이트 <https://cube.newlifex.com>

> ⚠️ 이 번역은 최신 내용과 다를 수 있습니다. 기준은 [영문 README](README.md)입니다.

---

## 주요 특징

- **즉시 사용 가능**: `app.UseReact(env)` 한 줄로 연동되며, 빌드 산출물이 DLL에 내장되어 NuGet 패키지로 배포되므로 물리 파일 의존성이 없습니다
- **필드 메타데이터 기반**: 목록/폼/검색/상세 화면이 모두 백엔드 `meta` 메타데이터로 동적 렌더링되며, 엔티티 추가 시 프런트엔드 개발이 필요 없습니다
- **큐브 스킨 디자인 규격 준수**: 인증 로그인 전체 흐름, 범용 목록, 범용 폼, LOV/업로드/리치 텍스트/AI 어시스턴트 등 공용 컴포넌트 제공
- **공용 패키지 사용**: npm 패키지 `@newlifex/cube`(API 호출 계층, 페이지 로직, 필드 매핑, 인증) 기반이며, 프레임워크 독립 코어를 여러 스킨이 공유합니다
- **단일 테마 × 라이트/다크**: antd 토큰 기반의 네이티브한 느낌, 라이트/다크 전환은 클릭 한 번
- **AI 어시스턴트**: SSE 스트리밍 대화 + 빠른 명령 + 스마트 폼 채우기 + 시스템 진단, mermaid 렌더링 내장
- **다국어 현지화**: 11개 언어 전체 번역 UI(백엔드 목록 ∩ 프런트엔드 전체 언어, 리소스 32개 로캘, NewLife.Core/Cube와 동일한 경로, NewLife.Cube ≥ 6.15.2026.1022 필요), 시스템 언어 따르기 및 강제 언어 지원, 언어 전환 시 서버 메뉴·필드 메타데이터·런타임 메시지를 다시 가져옴
- **테스트 완비**: 단위 테스트 420개 + E2E 124개 모두 통과, Playwright 로그인 세션 재사용

## 생태계 지도

NewLife는 독립적으로 버전이 관리되는 오픈소스 프로젝트의 계층형 생태계입니다. 아래 지도는 모든 NewLife 리포지토리에서 그대로 동일하게 공유되며, 각 프로젝트는 코드 리포지토리와 기본 NuGet 패키지로 연결됩니다.

| 프로젝트 | 한 줄 소개 | 다운로드 |
| --- | --- | --- |
| **기반** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | 로깅, 구성, 캐시, 네트워크, 직렬화, 스케줄링, APM 추적. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | 데이터 미들웨어: 단일 테이블 수백억 건, 자동 분할 테이블, 읽기/쓰기 분리, 10여 종 데이터베이스 지원. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | 고성능 네트워크 라이브러리: 단일 노드 177만 pps, 14.5 Gbps(TCP 1KB, 2026-10 실측), 400만 Tcp 장기 연결. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | CS 애플리케이션과 IoT 장치를 위한 프로토콜 통신 및 RPC 프레임워크. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | .NET 애플리케이션을 운영체제 데몬으로 설치: Windows 서비스와 Linux systemd. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | 콘솔, Web, API, 서비스, 데이터, IoT용 `dotnet new` 프로젝트 템플릿. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **데이터 및 메시징** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | Redis 클라이언트: 마이크로초 수준 지연, 백만 수준 처리량, 메시지 큐 내장. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | Apache RocketMQ와 알리바바 클라우드 메시지 큐를 지원하는 순수 관리형 RocketMQ 클라이언트. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | MQTT 클라이언트와 서버, 알리바바 클라우드 IoT 연결 포함. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | C# 하이브리드 데이터베이스: 임베디드/네트워크 두 모드, 관계형, 시계열, 메시지 큐, KV를 하나로. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | NewLife 데이터 스택 위에 구축한 MySql 드라이버와 도우미 계층. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web, AI 및 분산** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | 빠른 관리 플랫폼 프레임워크: 권한, SSO, OAuth 서버, CRUD 스캐폴딩. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | 분산 서비스 플랫폼: 노드 관리, APM, 구성 센터, 등록 센터, 배포 센터. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | 샤딩, 재시도, 백필을 지원하는 분산 작업 및 실시간 데이터 스케줄링 플랫폼. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | 46개 LLM 공급자를 통합 연결하는 클라이언트와 바로 사용할 수 있는 ChatAI 웹 채팅 애플리케이션. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **산업 및 IoT** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | 프로토콜 계약과 장치 추상을 정의하는 IoT 표준 라이브러리. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | NewLife.IoT 기반으로 구현한 Modbus TCP/RTU/ASCII. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | NewLife.IoT 기반으로 구현한 지멘스 PLC 프로토콜. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | NewLife.IoT 기반으로 구현한 오므론 PLC 프로토콜. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | NewLife.IoT 기반으로 구현한 미쓰비시 Melsec PLC 프로토콜. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | 산업 데이터 수집용 OPC 클라이언트. | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | BACnet 빌딩 자동화 프로토콜 스택. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | 게이트웨이와 장치 관리를 갖춘 경량 오픈소스 IoT 플랫폼. | — |
| **차량 텔레매틱스** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | JT/T 808 차량 위치 프로토콜: 70개 이상 메시지 본문, 2011/2013/2019 지원. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | 운송 관리 부서를 위한 JT/T 809 플랫폼 간 프로토콜. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | JT/T 1078 차량용 비디오: RTP 파싱, FLV/fMP4 리먹싱, 라이브 스트리밍. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **도메인 컴포넌트** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | Excel, Word, PPT, PDF 등 15개 이상 문서 형식을 하나의 패키지로. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | 크로스 플랫폼 오디오: 코덱, 장치 IO, DSP, 컨테이너, 스트리밍. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | 비디오 코덱, 컨테이너 형식, 프레임 처리, 스트리밍. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | 바이두/고덕/텐센트/톈디투 지도 통합 인터페이스, 지오코딩과 좌표 변환 지원. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | IPv4 위치 정보: 오프라인 메모리 매핑 데이터베이스와 온라인 API 이중 소스. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **도구 및 제품** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | 개발자 도구 모음: 네트워크, 시리얼 포트, 암호화, 정규식, Modbus, MQTT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | 셀프 호스팅 Git 소스 코드 관리 시스템. | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | 구버전 호스트에서 시작할 때 일치하는 .NET 런타임을 자동으로 설치합니다. | — |

> 배지는 각 프로젝트의 기본 패키지를 나타냅니다. 테마, 확장, 위성 패키지는 해당 NuGet 페이지에서 확인하세요. 여기에 나열하지 않은 30여 개 패키지(FTP, LoRa, Office 확장, 각종 프로토콜 드라이버 등)는 [NewLifeX 조직](https://github.com/NewLifeX)과 [newlifex.com](https://newlifex.com)에서 확인할 수 있습니다. 이 표는 NewLife.Core README에서 관리됩니다.

## 문서

- 📋 [요구사항 문서](Doc/需求文档.md) — 비전, 핵심 목표, 기능 요구사항, 보류/비목표
- ✅ [기능 목록](Doc/功能清单.md) — 구현/테스트/주석 3차원 상태 추적
- 🏗️ [아키텍처 설계](Doc/架构设计.md) — .NET 스킨 통합, 공용 패키지 전략, 프런트엔드 아키텍처
- 🖥️ [프런트엔드 가이드](NewLife.Cube.React/web/README.md) — web 디렉터리 개발/빌드/테스트 가이드

## 빠른 시작

사전 조건: Node.js 24 + pnpm 9(공용 프런트엔드 로직은 npm 패키지 `@newlifex/cube`에서 가져오므로 로컬 monorepo가 필요 없습니다).

```bash
# 1. 백엔드 API 시작 (CubeDemo, 기본 http://localhost:5050, SQLite로 외부 의존성 없음)
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. 프런트엔드 dev 시작 (포트 5188)
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

브라우저에서 <http://localhost:5188>을 열면 로그인 페이지가 표시되며, 로그인 후 전체 관리 콘솔로 이동합니다.

## 로컬 개발

```bash
# 프런트엔드 빌드/검사/단위 테스트 (web/ 디렉터리)
cd NewLife.Cube.React/web
pnpm build        # ../wwwroot 출력 (.NET 내장용)
pnpm type-check   # tsc 타입 검사
pnpm test:unit    # Vitest 단위 테스트 (420개)
pnpm test:e2e     # Playwright E2E (124개; 기본 5050, $env:E2E_BASE_URL로 재정의)

# .NET 빌드 (wwwroot를 DLL에 내장)
dotnet build 魔方React.slnx -c Release
```

**공용 패키지 수정**: 공용 로직은 npm 패키지 `@newlifex/cube`로 배포됩니다. 로컬 공동 개발 시 `../NewLife.Cube`에서 빌드(`pnpm --filter @newlifex/cube build`)한 뒤 `web`에서 `pnpm link ../NewLife.Cube/packages/cube`를 실행하세요. 작업 후 링크를 제거하면 게시된 베타로 돌아갑니다.

## 테스트

- **단위 테스트**: Vitest + React Testing Library + jsdom, 420개 사례 모두 통과
- **E2E 테스트**: Playwright 124개 사례(로그인/회원가입/활성화/비밀번호 찾기/보안 센터/목록 CRUD/가져오기·내보내기/레이아웃/업로드/AI), 로그인 세션 재사용
- **.NET 통합**: CubeDemo + `UseReact` 전체 흐름(로그인 → 메뉴 → CRUD → 내보내기 → 새로고침 시 404 없음)

## 릴리스

- **NuGet 패키지**: `NewLife.Cube.React`(버전 `1.0.{yyyy.MMdd}`, snupkg 기호 패키지 포함)
- **CI 자동화**: ⏸ 계획 중 — 공용 패키지의 npm 게시가 준비되면 `.github/workflows/`를 개편(web 사전 빌드 → `dotnet pack` → nuget.org + GitHub Packages 게시), [기능 목록](Doc/功能清单.md) §4 참고

## 관련 저장소

| 저장소 | 설명 |
|--------|------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | 큐브 코어(WebAPI/권한/메뉴/필드 메타데이터) + 프런트엔드 공용 npm 패키지 `@newlifex/cube` |
| [큐브 스킨 디자인 규격](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | 모든 큐브 스킨이 따라야 하는 통합 디자인 규격이며, React 스킨은 이를 준수합니다 |
| NewLife.Cube.Vue | Vue 계열 프런트엔드 스킨(Vue3 + Element Plus) |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | 이 저장소(React 계열 프런트엔드 스킨) |

## 뉴라이프 개발팀

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

뉴라이프 팀(NewLife)은 2002년에 설립되어 20여 년간 .NET과 IoT 기술 생태계에 집중하며 100여 개의 오픈소스 프로젝트를 주도하고(이 중 34개가 핵심 프로젝트), 전력, 물류, 의료, 산업 제어, 인터넷 등 산업에 소프트웨어와 하드웨어를 아우르는 통합 솔루션을 제공해 왔습니다. "학문에는 선후가 없으며, 이룬 사람이 스승이다"라는 신조를 따릅니다.

오픈소스 컴포넌트는 NuGet에서 누적 <!--nuget-total:start-->6.48M<!--nuget-total:end-->회 다운로드되었습니다(생태계 전체 기준, 2026-10).

웹사이트: https://newlifex.com · 오픈소스 조직: https://github.com/NewLifeX

<details>
<summary>위챗 공식 계정: 智能大石头(스캔하여 팔로우)</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## 라이선스

[MIT](LICENSE) © 2002-2026 NewLife 개발팀
