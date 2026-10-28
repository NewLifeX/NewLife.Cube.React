# NewLife.Cube.React — React-скин для NewLife.Cube

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [العربية](README.ar.md)
<!-- lang:end -->

**React-скин** для фронтенда Web API третьего поколения Cube (NewLife.Cube), поставляемый как отдельный NuGet-пакет и репозиторий. Построен на **React 19 + Ant Design 6 + Zustand + Vite**; управляясь метаданными полей бэкенда (`meta`), он динамически отрисовывает универсальные страницы списков и форм и соответствует [спецификации дизайна скинов Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md).

Подключите `NewLife.Cube` и `NewLife.Cube.React`, выполните `dotnet run` и откройте браузер — вы получите полноценную административную консоль: вход, динамические меню, списки и формы на основе метаданных, CRUD, импорт/экспорт, AI-ассистент и многое другое, **без единой строки фронтенд-кода**.

> Демо/руководство: руководство по Cube <https://newlifex.com/cube> | Демо-сайт <https://cube.newlifex.com>

> ⚠️ Этот перевод может отставать от оригинала; актуальной считается [английская версия README](README.md).

---

## Основные возможности

- **Готово к работе**: одна строка `app.UseReact(env)`; результат сборки встраивается в DLL и поставляется в NuGet-пакете — без зависимости от физических файлов
- **Управление метаданными полей**: списки, формы, поиск и детали отрисовываются динамически из метаданных `meta` бэкенда; добавление сущности не требует фронтенд-разработки
- **Соответствует спецификации дизайна скинов Cube**: полный поток аутентификации, универсальный список, универсальная форма, LOV/загрузка файлов/форматированный текст/AI-ассистент и другие общие компоненты
- **Использует общие пакеты**: на основе `@newlifex/*` (api-core/auth-logic/page-logic/field-mapping/page-utils), независимое от фреймворка ядро, общее для нескольких скинов
- **Единая тема × светлая/тёмная**: нативный внешний вид на основе токенов antd, переключение светлой/тёмной темы одним щелчком
- **AI-ассистент**: потоковый чат по SSE + быстрые команды + интеллектуальное заполнение форм + диагностика системы, встроенный рендеринг mermaid
- **Мультиязычная локализация**: 11 полностью переведённых языков интерфейса (список бэкенда ∩ полные языки фронтенда; ресурсы для 32 локалей; та же цепочка, что в NewLife.Core/Cube, требуется NewLife.Cube ≥ 6.15.2026.1022), поддержка системного и принудительного языка; серверные меню, метаданные полей и сообщения времени выполнения перезапрашиваются при смене языка
- **Хорошо протестировано**: 420 модульных тестов + 124 E2E-тестов, все проходят, с переиспользованием сессии входа Playwright

## Карта экосистемы

NewLife — это многоуровневая экосистема независимо версионируемых open-source проектов. Карта ниже дословно используется во всех репозиториях NewLife; каждый проект ссылается на свой репозиторий и свой основной пакет NuGet.

| Проект | Что делает | Загрузки |
| --- | --- | --- |
| **Базовый** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | Логирование, конфигурация, кэширование, сеть, сериализация, планирование и APM-трассировка. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | Промежуточное ПО данных: отдельные таблицы масштаба десятков миллиардов строк, автоматическое секционирование, разделение чтения и записи, более 10 баз данных. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | Высокопроизводительная сетевая библиотека: 1,77M pps / 14,5 Гбит/с на машину (TCP 1KB, 2026-10), 4M долгоживущих TCP-соединений. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | Протокольная связь и RPC-фреймворк для клиент-серверных приложений и IoT-устройств. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | Устанавливает .NET-приложения как демоны ОС: службы Windows и systemd в Linux. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | Шаблоны проектов `dotnet new` для консоли, web, API, службы, данных и IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **Данные и обмен сообщениями** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | Клиент Redis с микросекундной задержкой, миллионами операций в секунду и встроенными очередями сообщений. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | Полностью управляемый клиент RocketMQ для Apache RocketMQ и Alibaba Cloud Message Queue. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | Клиент и сервер MQTT, включая подключение к Alibaba Cloud IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | Гибридная база данных на C#: встроенная или сетевая, реляционная, временных рядов, очередь сообщений и KV в одном. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | Драйвер MySql и вспомогательный слой на основе стека данных NewLife. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web, AI и распределённые системы** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Фреймворк быстрой разработки админ-платформ: права, SSO, сервер OAuth и CRUD-скаффолдинг. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | Распределённая сервисная платформа: управление узлами, APM, центр конфигурации, реестр и центр публикации. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | Распределённая платформа задач и планирования данных в реальном времени с секционированием, повторами и дозаполнением. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | Единый клиент для 46 поставщиков LLM плюс ChatAI — готовое веб-приложение для чата. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **Промышленность и IoT** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | Стандартная библиотека IoT, определяющая контракты протоколов и абстракции устройств. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | Реализация Modbus TCP/RTU/ASCII поверх NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | Протокол Siemens PLC поверх NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | Протокол Omron PLC поверх NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | Протокол Mitsubishi Melsec PLC поверх NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | Клиент OPC для доступа к промышленным данным. | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | Стек протокола автоматизации зданий BACnet. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | Лёгкая open-source платформа IoT с управлением шлюзами и устройствами. | — |
| **Телематика транспорта** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | Протокол позиционирования транспорта JT/T 808: более 70 типов сообщений, 2011/2013/2019. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | Межплатформенный протокол JT/T 809 для органов управления транспортом. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | Автомобильное видео JT/T 1078: разбор RTP, ремультиплексирование в FLV/fMP4 и прямая трансляция. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **Прикладные компоненты** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | Один пакет для Excel, Word, PPT, PDF и более 15 форматов документов. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | Кроссплатформенное аудио: кодеки, ввод-вывод устройств, DSP, контейнеры и потоковая передача. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | Видеокодеки, форматы контейнеров, обработка кадров и потоковая передача. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | Единый интерфейс к Baidu, AMap, Tencent и Tianditu с геокодированием и преобразованием координат. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | Геолокация IPv4 с офлайн-базой, отображаемой в память, и онлайн-API как резервом. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **Инструменты и продукты** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | Инструменты разработчика: сеть, последовательный порт, шифрование, регулярные выражения, Modbus и MQTT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | Самостоятельно размещаемая система управления исходным кодом Git. | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | Автоматически устанавливает подходящую среду выполнения .NET при запуске на старом хосте. | — |

> Бейджи показывают основной пакет каждого проекта; пакеты тем, расширений и сателлитов перечислены на соответствующих страницах NuGet. Более 30 пакетов, не перечисленных здесь (FTP, LoRa, расширения Office, драйверы протоколов и другие), доступны в [организации NewLifeX](https://github.com/NewLifeX) и на [newlifex.com](https://newlifex.com). Эта таблица ведётся в README проекта NewLife.Core.

## Документация

- 📋 [Требования](Doc/需求文档.md) — видение, ключевые цели, функциональные требования, отложенные пункты и не-цели
- ✅ [Список функций](Doc/功能清单.md) — трёхмерное отслеживание статуса реализация/тесты/комментарии
- 🏗️ [Архитектура](Doc/架构设计.md) — интеграция .NET-скина, стратегия общих пакетов, архитектура фронтенда
- 🖥️ [Руководство по фронтенду](NewLife.Cube.React/web/README.md) — руководство по разработке/сборке/тестам каталога web

## Быстрый старт

Предварительное условие: локальный monorepo `../NewLife.Cube` (общий репозиторий фронтенд-пакетов команды, уже выполнен `pnpm install`, чтобы существовал `packages/*/dist`).

```bash
# 1. Запустить API бэкенда (CubeDemo, по умолчанию http://localhost:5050, SQLite без внешних зависимостей)
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. Запустить dev-сервер фронтенда (порт 5188)
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

Откройте <http://localhost:5188> в браузере — появится страница входа; после входа вы попадёте в полноценную административную консоль.

## Локальная разработка

```bash
# Сборка/проверки/модульные тесты фронтенда (каталог web/)
cd NewLife.Cube.React/web
pnpm build        # вывод в ../wwwroot (для встраивания в .NET)
pnpm type-check   # проверка типов tsc
pnpm test:unit    # модульные тесты Vitest (420)
pnpm test:e2e     # Playwright E2E (124; по умолчанию 5050, переопределяется через $env:E2E_BASE_URL)

# Сборка .NET (встраивает wwwroot в DLL)
dotnet build 魔方React.slnx -c Release
```

**Изменение общих пакетов**: после правки исходников в `../NewLife.Cube/packages/*` выполните `pnpm build:packages` в monorepo (или `pnpm dev:packages` для пересборки в режиме watch); изменения сразу применяются в скине через символическую ссылку `file:`.

## Тестирование

- **Модульные тесты**: Vitest + React Testing Library + jsdom, все 420 случаев проходят
- **E2E-тесты**: 124 случаев Playwright (вход/регистрация/активация/забыли пароль/центр безопасности/CRUD списков/импорт-экспорт/макет/загрузка файлов/AI), с переиспользованием сессии входа
- **Интеграция .NET**: сквозной сценарий CubeDemo + `UseReact` (вход → меню → CRUD → экспорт → обновление без 404)

## Публикация

- **NuGet-пакет**: `NewLife.Cube.React` (версия `1.0.{yyyy.MMdd}`, с пакетом символов snupkg)
- **Автоматизация CI**: ⏸ запланирована — будет реализована в `.github/workflows/` после публикации общих пакетов в npm (предварительная сборка фронтенда → `dotnet pack` → публикация в nuget.org + GitHub Packages); см. [список функций](Doc/功能清单.md) §4

## Связанные репозитории

| Репозиторий | Описание |
|-------------|----------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Ядро Cube (Web API/права/меню/метаданные полей) + общие фронтенд-пакеты `packages/@newlifex/*` |
| [Спецификация дизайна скинов Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | Единая спецификация дизайна, которой должны следовать все скины Cube; React-скин ей соответствует |
| NewLife.Cube.Vue | Фронтенд-скин семейства Vue (Vue 3 + Element Plus) |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | Этот репозиторий (фронтенд-скин семейства React) |

## Команда

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

Команда NewLife основана в 2002 году и более двух десятилетий работает в экосистеме .NET и IoT, поддерживает около 100 проектов с открытым кодом (34 из них — основные) и предлагает интегрированные программно-аппаратные решения для энергетики, логистики, здравоохранения, промышленной автоматизации и интернет-отрасли. Мы следуем девизу «в учении нет старших — мастерство приносит уважение».

Open-source компоненты скачали <!--nuget-total:start-->6.48M<!--nuget-total:end--> раз с NuGet (по всей экосистеме, по состоянию на 2026-10).

Сайт: https://newlifex.com · Организация open source: https://github.com/NewLifeX

<details>
<summary>Официальный аккаунт WeChat: 智能大石头 (отсканируйте, чтобы подписаться)</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## Лицензия

[MIT](LICENSE) © 2002-2026 Команда разработчиков NewLife
