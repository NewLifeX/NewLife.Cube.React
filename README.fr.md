# NewLife.Cube.React – skin React pour NewLife.Cube

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [日本語](README.ja.md) | [Português](README.pt.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [العربية](README.ar.md)
<!-- lang:end -->

Le **skin React** du front-end Web API de troisième génération de Cube (NewLife.Cube), distribué sous forme de package NuGet et de dépôt indépendants. Basé sur **React 19 + Ant Design 6 + Zustand + Vite** et piloté par les métadonnées de champs du backend (`meta`), il affiche dynamiquement des pages génériques de liste et de formulaire, et respecte la [spécification de conception des skins Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md).

Référencez `NewLife.Cube` et `NewLife.Cube.React`, lancez `dotnet run`, puis ouvrez le navigateur pour obtenir une console d'administration complète : connexion, menus dynamiques, listes/formulaires pilotés par les métadonnées, CRUD, import/export, assistant IA, etc., avec **zéro développement front-end**.

> Démo/tutoriel : tutoriel Cube <https://newlifex.com/cube> | Site de démonstration <https://cube.newlifex.com>

> ⚠️ Cette traduction peut être obsolète ; le [README anglais](README.md) fait foi.

---

## Points forts

- **Prêt à l'emploi** : une ligne `app.UseReact(env)` ; la sortie de build est intégrée à la DLL et livrée avec le package NuGet, sans dépendance à des fichiers physiques
- **Piloté par les métadonnées de champs** : listes, formulaires, recherche et détail sont rendus dynamiquement à partir des métadonnées `meta` du backend ; l'ajout d'une entité ne nécessite aucun travail front-end
- **Conforme à la spécification de conception des skins Cube** : parcours d'authentification complet, liste générique, formulaire générique, LOV/téléversement/texte enrichi/assistant IA et autres composants partagés
- **Consomme les packages partagés** : basé sur `@cube/*` (api-core/auth-logic/page-logic/field-mapping/page-utils), avec un cœur indépendant du framework partagé par plusieurs skins
- **Thème unique × clair/sombre** : apparence native pilotée par les tokens antd, bascule clair/sombre en un clic
- **Assistant IA** : chat en streaming SSE + commandes rapides + remplissage intelligent de formulaires + diagnostic système, rendu mermaid intégré
- **Localisation multilingue** : 11 langues d'interface entièrement traduites (liste backend ∩ langues complètes du front-end ; 32 locales de ressources ; même chaîne que NewLife.Core/Cube, nécessite NewLife.Cube ≥ 6.15.2026.1022), avec langue du système ou langue forcée ; les menus, métadonnées de champs et messages d'exécution du serveur sont rechargés au changement de langue
- **Bien testé** : 136 tests unitaires + 48 tests E2E tous réussis, avec réutilisation de session de connexion Playwright

## Carte de l'écosystème

NewLife est un écosystème en couches de projets open source versionnés indépendamment. La carte ci-dessous est reprise à l'identique par tous les dépôts NewLife ; chaque projet renvoie à son dépôt et à son paquet NuGet principal.

| Projet | Rôle | Téléchargements |
| --- | --- | --- |
| **Fondation** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | Journalisation, configuration, cache, réseau, sérialisation, ordonnancement et traçage APM. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | Intergiciel de données : tables uniques à l'échelle de dizaines de milliards, partitionnement automatique, séparation lecture/écriture et plus de 10 bases de données. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | Bibliothèque réseau hautes performances : 1,77 M pps / 14,5 Gbps sur une machine (TCP 1KB, 2026-10), 4 M connexions TCP persistantes. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | Communication protocolaire et framework RPC pour applications client/serveur et appareils IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | Installe des applications .NET comme démons système : services Windows et systemd Linux. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | Modèles de projet `dotnet new` pour console, web, API, service, données et IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **Données et messagerie** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | Client Redis avec une latence en microsecondes, des millions d'opérations/s et des files de messages intégrées. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | Client RocketMQ entièrement managé pour Apache RocketMQ et Alibaba Cloud Message Queue. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | Client et serveur MQTT, y compris la connectivité Alibaba Cloud IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | Base de données hybride en C# : embarquée ou en réseau, relationnelle, séries temporelles, file de messages et KV réunis. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | Pilote et couche d'assistance MySql construits sur la pile de données NewLife. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web, IA et distribué** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Framework rapide de plateforme d'administration : permissions, SSO, serveur OAuth et échafaudage CRUD. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | Plateforme de services distribués : gestion des nœuds, APM, centre de configuration, registre et centre de publication. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | Plateforme de tâches distribuées et d'ordonnancement de données en temps réel avec partitionnement, reprises et backfill. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | Client unifié pour 46 fournisseurs de LLM, plus ChatAI, une application web de chat prête à l'emploi. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **Industriel et IoT** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | Bibliothèque standard IoT définissant les contrats de protocole et les abstractions d'appareils. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | Implémentation Modbus TCP/RTU/ASCII au-dessus de NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | Protocole pour automate Siemens au-dessus de NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | Protocole pour automate Omron au-dessus de NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | Protocole pour automate Mitsubishi Melsec au-dessus de NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | Client OPC pour l'accès aux données industrielles. | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | Pile de protocoles BACnet pour l'automatisation des bâtiments. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | Plateforme IoT open source légère avec gestion des passerelles et des appareils. | — |
| **Télématique embarquée** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | Protocole de positionnement de véhicules JT/T 808 : plus de 70 corps de message, 2011/2013/2019. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | Protocole plateforme à plateforme JT/T 809 pour les autorités de transport. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | Vidéo embarquée JT/T 1078 : analyse RTP, remuxage FLV/fMP4 et diffusion en direct. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **Composants métier** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | Un seul paquet pour Excel, Word, PPT, PDF et plus de 15 formats de documents. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | Audio multiplateforme : codecs, E/S d'appareils, DSP, conteneurs et streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | Codecs vidéo, formats de conteneurs, traitement des images et streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | Interface unifiée pour Baidu, AMap, Tencent et Tianditu avec géocodage et conversion de coordonnées. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | Géolocalisation IPv4 avec une base de données hors ligne mappée en mémoire et une API en ligne en secours. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **Outils et produits** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | Boîte à outils du développeur : réseau, port série, cryptographie, regex, Modbus et MQTT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | Système de gestion de code source Git auto-hébergé. | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | Installe automatiquement le runtime .NET correspondant lorsqu'il est lancé depuis un hôte plus ancien. | — |

> Les badges indiquent le paquet principal de chaque projet ; les paquets de thèmes, d'extensions et satellites sont répertoriés sur leurs pages NuGet. Les plus de 30 paquets non listés ici (FTP, LoRa, extensions Office, pilotes de protocoles, etc.) sont disponibles dans l'[organisation NewLifeX](https://github.com/NewLifeX) et sur [newlifex.com](https://newlifex.com). Ce tableau est maintenu dans le README de NewLife.Core.

## Documentation

- 📋 [Exigences](Doc/需求文档.md) — vision, objectifs principaux, exigences fonctionnelles, éléments différés et non-objectifs
- ✅ [Liste des fonctionnalités](Doc/功能清单.md) — suivi tridimensionnel implémentation/tests/commentaires
- 🏗️ [Architecture](Doc/架构设计.md) — intégration du skin .NET, stratégie des packages partagés, architecture front-end
- 🖥️ [Guide front-end](NewLife.Cube.React/web/README.md) — guide de développement/build/tests du répertoire web

## Démarrage rapide

Prérequis : un monorepo local `../NewLife.Cube` (dépôt partagé des packages front-end de l'équipe, déjà `pnpm install` pour que `packages/*/dist` existe).

```bash
# 1. Démarrer l'API backend (CubeDemo, http://localhost:5050 par défaut, SQLite sans dépendance externe)
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. Démarrer le serveur de développement front-end (port 5188)
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

Ouvrez <http://localhost:5188> dans un navigateur pour voir la page de connexion ; après connexion, vous accédez à la console d'administration complète.

## Développement local

```bash
# Build/vérifications/tests unitaires du front-end (répertoire web/)
cd NewLife.Cube.React/web
pnpm build        # génère ../wwwroot (pour l'intégration .NET)
pnpm type-check   # vérification de types tsc
pnpm test:unit    # tests unitaires Vitest (136)
pnpm test:e2e     # Playwright E2E (48 ; port 5050 par défaut, remplacer avec $env:E2E_BASE_URL)

# Build .NET (intègre wwwroot dans la DLL)
dotnet build 魔方React.slnx -c Release
```

**Modifier les packages partagés** : après modification des sources sous `../NewLife.Cube/packages/*`, exécutez `pnpm build:packages` dans le monorepo (ou `pnpm dev:packages` pour reconstruire en watch) ; les changements prennent effet immédiatement dans le skin via son lien symbolique `file:`.

## Tests

- **Tests unitaires** : Vitest + React Testing Library + jsdom, 136 cas tous réussis
- **Tests E2E** : 48 cas Playwright (connexion/inscription/activation/mot de passe oublié/centre de sécurité/CRUD de liste/import-export/mise en page/téléversement/IA), avec réutilisation de session
- **Intégration .NET** : parcours de bout en bout CubeDemo + `UseReact` (connexion → menus → CRUD → export → actualisation sans 404)

## Publication

- **Package NuGet** : `NewLife.Cube.React` (version `1.0.{yyyy.MMdd}`, avec package de symboles snupkg)
- **Automatisation CI** : ⏸ planifiée — à mettre en œuvre dans `.github/workflows/` une fois les packages partagés publiés sur npm (pré-build front-end → `dotnet pack` → publication sur nuget.org + GitHub Packages) ; voir la [liste des fonctionnalités](Doc/功能清单.md) §4

## Dépôts associés

| Dépôt | Description |
|-------|-------------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Cœur de Cube (Web API/permissions/menus/métadonnées de champs) + packages front-end partagés `packages/@cube/*` |
| [Spécification de conception des skins Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | Spécification de conception unifiée que tous les skins Cube doivent suivre ; le skin React y est conforme |
| NewLife.Cube.Vue | Skin front-end de la famille Vue (Vue 3 + Element Plus) |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | Ce dépôt (skin front-end de la famille React) |

## Équipe

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

NewLife a été fondée en 2002 et œuvre depuis plus de deux décennies dans l'écosystème .NET et IoT, maintient près de 100 projets open source (dont 34 principaux) et fournit des solutions matérielles et logicielles intégrées aux secteurs de l'énergie, de la logistique, de la santé, du contrôle industriel et d'Internet. Notre devise : « l'apprentissage ne connaît pas l'ancienneté — celui qui maîtrise devient maître ».

Les composants open source ont été téléchargés <!--nuget-total:start-->6.48M<!--nuget-total:end--> fois depuis NuGet (à l'échelle de l'écosystème, en date de 2026-10).

Site web : https://newlifex.com · Organisation open source : https://github.com/NewLifeX

<details>
<summary>Compte officiel WeChat : 智能大石头 (scannez pour suivre)</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## Licence

[MIT](LICENSE) © 2002-2026 Équipe de développement NewLife
