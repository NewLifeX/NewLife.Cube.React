# NewLife.Cube.React – React-Skin für NewLife.Cube

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Português](README.pt.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [العربية](README.ar.md)
<!-- lang:end -->

Der **React-Skin** für das Web-API-Frontend der dritten Generation von Cube (NewLife.Cube), ausgeliefert als eigenständiges NuGet-Paket und Repository. Basierend auf **React 19 + Ant Design 6 + Zustand + Vite**, gesteuert durch Feldmetadaten des Backends (`meta`), rendert er generische Listen- und Formularseiten dynamisch und entspricht der [Cube-Skin-Designspezifikation](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md).

Referenziere `NewLife.Cube` und `NewLife.Cube.React`, führe `dotnet run` aus und öffne den Browser – schon steht eine vollständige Administrationskonsole bereit: Anmeldung, dynamische Menüs, metadatengesteuerte Listen/Formulare, CRUD, Import/Export, KI-Assistent und mehr, mit **null Frontend-Entwicklung**.

> Demo/Tutorial: Cube-Tutorial <https://newlifex.com/cube> | Demo-Website <https://cube.newlifex.com>

> ⚠️ Diese Übersetzung kann veraltet sein; maßgeblich ist das [englische README](README.md).

---

## Highlights

- **Sofort einsatzbereit**: eine Zeile `app.UseReact(env)`; das Build-Ergebnis wird in die DLL eingebettet und mit dem NuGet-Paket verteilt – ohne Abhängigkeit von physischen Dateien
- **Feldmetadaten-getrieben**: Listen, Formulare, Suche und Detailansicht werden vollständig aus den `meta`-Metadaten des Backends gerendert; neue Entitäten erfordern keine Frontend-Arbeit
- **Entspricht der Cube-Skin-Designspezifikation**: vollständiger Authentifizierungsablauf, generische Liste, generisches Formular, LOV/Upload/Rich-Text/KI-Assistent und weitere gemeinsame Komponenten
- **Nutzt die gemeinsamen Pakete**: basiert auf `@newlifex/*` (api-core/auth-logic/page-logic/field-mapping/page-utils), frameworkunabhängiger Kern für mehrere Skins
- **Ein Theme × hell/dunkel**: natives Erscheinungsbild über antd-Token, Umschalten zwischen hell und dunkel mit einem Klick
- **KI-Assistent**: SSE-Streaming-Chat + Schnellbefehle + intelligentes Formularausfüllen + Systemdiagnose, integrierte mermaid-Darstellung
- **Mehrsprachige Lokalisierung**: 11 vollständig übersetzte UI-Sprachen (Backend-Liste ∩ vollständige Frontend-Sprachen; 32 Ressourcen-Locales; gleiche Kette wie NewLife.Core/Cube, erfordert NewLife.Cube ≥ 6.15.2026.1022), Systemsprache oder erzwungene Sprache; Servermenüs, Feldmetadaten und Laufzeitmeldungen werden beim Sprachwechsel neu geladen
- **Gut getestet**: 420 Unit-Tests + 124 E2E-Tests, alle bestanden, mit Wiederverwendung der Playwright-Login-Sitzung

## Ökosystem-Karte

NewLife ist ein geschichtetes Ökosystem unabhängig versionierter Open-Source-Projekte. Die folgende Karte wird wortgleich in allen NewLife-Repositories verwendet; jedes Projekt verlinkt auf sein Repository und sein primäres NuGet-Paket.

| Projekt | Funktion | Downloads |
| --- | --- | --- |
| **Grundlage** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | Protokollierung, Konfiguration, Caching, Netzwerk, Serialisierung, Zeitplanung und APM-Tracing. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | Daten-Middleware: einzelne Tabellen in der Größenordnung von zig Milliarden Zeilen, automatisches Sharding, Lese-/Schreibtrennung, über 10 Datenbanken. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | Hochperformante Netzwerkbibliothek: 1,77 Mio. pps / 14,5 Gbps auf einer Maschine (TCP 1KB, 2026-10), 4 Mio. langlebige TCP-Verbindungen. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | Protokollkommunikation und RPC-Framework für Client/Server-Anwendungen und IoT-Geräte. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | Installiert .NET-Anwendungen als Betriebssystem-Dienste: Windows-Dienste und Linux-systemd. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | `dotnet new`-Projektvorlagen für Konsole, Web, API, Dienst, Daten und IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **Daten & Messaging** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | Redis-Client mit Mikrosekunden-Latenz, Millionen Operationen pro Sekunde und integrierten Nachrichtenwarteschlangen. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | Vollständig verwalteter RocketMQ-Client für Apache RocketMQ und Alibaba Cloud Message Queue. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | MQTT-Client und -Server, einschließlich Alibaba Cloud IoT-Anbindung. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | Hybriddatenbank in C#: eingebettet oder im Netzwerk, relational, Zeitreihen, Nachrichtenwarteschlange und KV in einem. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | MySql-Treiber und Hilfsschicht auf Basis des NewLife-Datenstacks. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web, KI & verteilt** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Schnelles Framework für Administrationsplattformen: Berechtigungen, SSO, OAuth-Server und CRUD-Gerüst. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | Verteilte Dienstplattform: Knotenverwaltung, APM, Konfigurationszentrum, Registry und Release-Center. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | Plattform für verteilte Aufgaben und Echtzeit-Datenplanung mit Sharding, Wiederholungen und Backfill. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | Einheitlicher Client für 46 LLM-Anbieter plus ChatAI, eine sofort einsatzbereite Web-Chat-Anwendung. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **Industrie & IoT** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | IoT-Standardbibliothek mit Protokollverträgen und Geräteabstraktionen. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | Modbus-TCP/RTU/ASCII-Implementierung auf Basis von NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | Siemens-SPS-Protokoll auf Basis von NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | Omron-SPS-Protokoll auf Basis von NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | Mitsubishi-Melsec-SPS-Protokoll auf Basis von NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | OPC-Client für industriellen Datenzugriff. | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | BACnet-Protokollstack für die Gebäudeautomation. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | Leichtgewichtige Open-Source-IoT-Plattform mit Gateway- und Geräteverwaltung. | — |
| **Fahrzeugtelematik** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | JT/T-808-Fahrzeugortungsprotokoll: über 70 Nachrichtenkörper, 2011/2013/2019. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | JT/T-809-Plattform-zu-Plattform-Protokoll für Verkehrsbehörden. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | JT/T-1078-Fahrzeugvideo: RTP-Parsing, FLV/fMP4-Remuxing und Live-Streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **Domänenkomponenten** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | Ein Paket für Excel, Word, PPT, PDF und über 15 Dokumentformate. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | Plattformübergreifendes Audio: Codecs, Geräte-I/O, DSP, Container und Streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | Videocodecs, Containerformate, Frame-Verarbeitung und Streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | Einheitliche Schnittstelle für Baidu, AMap, Tencent und Tianditu mit Geokodierung und Koordinatenumrechnung. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | IPv4-Geolokalisierung mit einer offline speichergemappten Datenbank und einer Online-API als Fallback. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **Werkzeuge & Produkte** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | Entwickler-Toolbox: Netzwerk, serielle Schnittstelle, Krypto, Regex, Modbus und MQTT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | Selbst gehostetes Git-Quellcode-Verwaltungssystem. | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | Installiert automatisch die passende .NET-Laufzeit, wenn es von einem älteren Host gestartet wird. | — |

> Die Badges zeigen das primäre Paket jedes Projekts; Theme-, Erweiterungs- und Satellitenpakete sind auf den jeweiligen NuGet-Seiten aufgeführt. Die hier nicht aufgeführten über 30 Pakete (FTP, LoRa, Office-Erweiterungen, Protokolltreiber und mehr) sind in der [NewLifeX-Organisation](https://github.com/NewLifeX) und auf [newlifex.com](https://newlifex.com) verfügbar. Diese Tabelle wird im NewLife.Core-README gepflegt.

## Dokumentation

- 📋 [Anforderungen](Doc/需求文档.md) — Vision, Kernziele, funktionale Anforderungen, zurückgestellte Punkte und Nicht-Ziele
- ✅ [Funktionsliste](Doc/功能清单.md) — dreidimensionale Statusverfolgung von Implementierung/Tests/Kommentaren
- 🏗️ [Architektur](Doc/架构设计.md) — .NET-Skin-Integration, Strategie für gemeinsame Pakete, Frontend-Architektur
- 🖥️ [Frontend-Leitfaden](NewLife.Cube.React/web/README.md) — Leitfaden für Entwicklung/Build/Tests im web-Verzeichnis

## Schnellstart

Voraussetzung: ein lokales `../NewLife.Cube`-Monorepo (gemeinsames Frontend-Paket-Repository des Teams, bereits mit `pnpm install` versehen, sodass `packages/*/dist` existiert).

```bash
# 1. Backend-API starten (CubeDemo, standardmäßig http://localhost:5050, SQLite ohne externe Abhängigkeiten)
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. Frontend-Dev-Server starten (Port 5188)
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

Öffne <http://localhost:5188> im Browser, um die Anmeldeseite zu sehen; nach der Anmeldung gelangst du zur vollständigen Administrationskonsole.

## Lokale Entwicklung

```bash
# Frontend-Build/Prüfungen/Unit-Tests (Verzeichnis web/)
cd NewLife.Cube.React/web
pnpm build        # schreibt nach ../wwwroot (für das Einbetten in .NET)
pnpm type-check   # tsc-Typprüfung
pnpm test:unit    # Vitest-Unit-Tests (420)
pnpm test:e2e     # Playwright-E2E (124; standardmäßig Port 5050, überschreibbar mit $env:E2E_BASE_URL)

# .NET-Build (bettet wwwroot in die DLL ein)
dotnet build 魔方React.slnx -c Release
```

**Gemeinsame Pakete ändern**: Nach Änderungen an den Quellen unter `../NewLife.Cube/packages/*` führe im Monorepo `pnpm build:packages` aus (oder `pnpm dev:packages` für Watch-Neubuild); die Änderungen werden im Skin über den `file:`-Symlink sofort wirksam.

## Tests

- **Unit-Tests**: Vitest + React Testing Library + jsdom, 420 Fälle, alle bestanden
- **E2E-Tests**: 124 Playwright-Fälle (Anmeldung/Registrierung/Aktivierung/Passwort vergessen/Sicherheitszentrum/Listen-CRUD/Import-Export/Layout/Upload/KI), Wiederverwendung der Login-Sitzung
- **.NET-Integration**: CubeDemo + `UseReact` End-to-End-Ablauf (Anmeldung → Menüs → CRUD → Export → Aktualisieren ohne 404)

## Veröffentlichung

- **NuGet-Paket**: `NewLife.Cube.React` (Version `1.0.{yyyy.MMdd}`, mit snupkg-Symbolpaket)
- **CI-Automatisierung**: ⏸ geplant — wird in `.github/workflows/` umgesetzt, sobald die gemeinsamen Pakete auf npm veröffentlicht sind (Frontend-Vorbuild → `dotnet pack` → Veröffentlichung auf nuget.org + GitHub Packages); siehe [Funktionsliste](Doc/功能清单.md) §4

## Verwandte Repositories

| Repository | Beschreibung |
|------------|--------------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Cube-Kern (Web-API/Berechtigungen/Menüs/Feldmetadaten) + gemeinsame Frontend-Pakete `packages/@newlifex/*` |
| [Cube-Skin-Designspezifikation](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | Einheitliche Designspezifikation für alle Cube-Skins; der React-Skin entspricht ihr |
| NewLife.Cube.Vue | Frontend-Skin der Vue-Familie (Vue 3 + Element Plus) |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | Dieses Repository (Frontend-Skin der React-Familie) |

## Team

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

NewLife wurde 2002 gegründet und widmet sich seit mehr als zwei Jahrzehnten dem .NET- und IoT-Ökosystem, betreut fast 100 Open-Source-Projekte (34 davon Hauptprojekte) und liefert integrierte Hard- und Softwarelösungen für die Bereiche Energie, Logistik, Gesundheitswesen, Industrieautomation und Internet. Unser Leitspruch lautet „Lernen kennt kein Dienstalter – wer es beherrscht, wird zum Lehrmeister“.

Die Open-Source-Komponenten wurden <!--nuget-total:start-->6.48M<!--nuget-total:end--> Mal von NuGet heruntergeladen (ökosystemweit, Stand 2026-10).

Website: https://newlifex.com · Open-Source-Organisation: https://github.com/NewLifeX

<details>
<summary>WeChat-Offizieller Account: 智能大石头 (zum Folgen scannen)</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## Lizenz

[MIT](LICENSE) © 2002-2026 NewLife-Entwicklungsteam
