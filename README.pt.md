# NewLife.Cube.React: skin React para o NewLife.Cube

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [العربية](README.ar.md)
<!-- lang:end -->

O **skin React** do front-end Web API de terceira geração do Cube (NewLife.Cube), distribuído como pacote NuGet e repositório independentes. Construído com **React 19 + Ant Design 6 + Zustand + Vite** e orientado pelos metadados de campos do backend (`meta`), renderiza dinamicamente páginas genéricas de lista e formulário, seguindo a [especificação de design de skins do Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md).

Adicione referências a `NewLife.Cube` e `NewLife.Cube.React`, execute `dotnet run` e abra o navegador para ter um console de administração completo — login, menus dinâmicos, listas/formulários orientados por metadados, CRUD, importação/exportação, assistente de IA e mais, com **zero desenvolvimento front-end**.

> Demonstração/tutorial: tutorial do Cube <https://newlifex.com/cube> | Site de demonstração <https://cube.newlifex.com>

> ⚠️ Esta tradução pode estar desatualizada; a referência é o [README em inglês](README.md).

---

## Destaques

- **Pronto para usar**: uma linha `app.UseReact(env)`; a saída de build é incorporada à DLL e distribuída com o pacote NuGet, sem dependência de arquivos físicos
- **Orientado por metadados de campos**: listas, formulários, busca e detalhes são renderizados dinamicamente a partir dos metadados `meta` do backend; adicionar uma entidade não exige trabalho front-end
- **Segue a especificação de design de skins do Cube**: fluxo completo de autenticação, lista genérica, formulário genérico, LOV/upload/texto rico/assistente de IA e outros componentes compartilhados
- **Consome os pacotes compartilhados**: baseado em `@newlifex/*` (api-core/auth-logic/page-logic/field-mapping/page-utils), com núcleo independente de framework compartilhado entre skins
- **Tema único × claro/escuro**: aparência nativa orientada por tokens do antd, alternância claro/escuro com um clique
- **Assistente de IA**: chat em streaming SSE + comandos rápidos + preenchimento inteligente de formulários + diagnóstico do sistema, com renderização mermaid integrada
- **Localização multilíngue**: 11 idiomas de interface totalmente traduzidos (lista do backend ∩ idiomas completos do front-end; o backend expõe 32 idiomas e os outros 21 voltam ao inglês; mesma cadeia do NewLife.Core/Cube, requer NewLife.Cube ≥ 6.15.2026.1022), com idioma do sistema ou forçado; menus, metadados de campos e mensagens de execução do servidor são recarregados ao trocar de idioma
- **Bem testado**: 416 testes unitários + 119 testes E2E, todos aprovados, com reutilização de sessão de login no Playwright

## Mapa do ecossistema

NewLife é um ecossistema em camadas de projetos open source versionados de forma independente. O mapa abaixo é compartilhado literalmente por todos os repositórios NewLife; cada projeto tem links para o seu repositório e para o seu pacote principal no NuGet.

| Projeto | O que faz | Downloads |
| --- | --- | --- |
| **Base** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | Log, configuração, cache, rede, serialização, agendamento e rastreamento APM. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | Middleware de dados: tabelas únicas na escala de dezenas de bilhões de linhas, particionamento automático, separação de leitura e escrita, mais de 10 bancos de dados. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | Biblioteca de rede de alto desempenho: 1,77M pps / 14,5 Gbps em uma máquina (TCP 1KB, 2026-10), 4M de conexões TCP persistentes. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | Framework de comunicação por protocolo e RPC para aplicações cliente/servidor e dispositivos IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | Instala aplicações .NET como daemons do sistema operacional: serviços do Windows e systemd do Linux. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | Modelos de projeto `dotnet new` para console, web, API, serviço, dados e IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **Dados e mensagens** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | Cliente Redis com latência em microssegundos, milhões de operações por segundo e filas de mensagens integradas. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | Cliente RocketMQ totalmente gerenciado para Apache RocketMQ e Alibaba Cloud Message Queue. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | Cliente e servidor MQTT, incluindo conectividade com o Alibaba Cloud IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | Banco de dados híbrido em C#: embarcado ou em rede, relacional, séries temporais, fila de mensagens e KV em um só. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | Driver MySql e camada auxiliar construídos sobre a pilha de dados NewLife. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web, IA e distribuído** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Framework de plataforma administrativa rápida: permissões, SSO, servidor OAuth e scaffolding CRUD. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | Plataforma de serviços distribuídos: gestão de nós, APM, centro de configuração, registro e centro de publicação. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | Plataforma distribuída de tarefas e agendamento de dados em tempo real, com particionamento, repetição e reprocessamento. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | Cliente unificado para 46 provedores de LLM, além do ChatAI, uma aplicação web de chat pronta para uso. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **Industrial e IoT** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | Biblioteca padrão de IoT que define contratos de protocolo e abstrações de dispositivos. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | Implementação Modbus TCP/RTU/ASCII sobre NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | Protocolo Siemens PLC sobre NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | Protocolo Omron PLC sobre NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | Protocolo Mitsubishi Melsec PLC sobre NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | Cliente OPC para acesso a dados industriais. | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | Pilha do protocolo de automação predial BACnet. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | Plataforma IoT de código aberto leve, com gestão de gateways e dispositivos. | — |
| **Telemática veicular** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | Protocolo de posicionamento veicular JT/T 808: mais de 70 corpos de mensagem, 2011/2013/2019. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | Protocolo plataforma-a-plataforma JT/T 809 para autoridades de transporte. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | Vídeo veicular JT/T 1078: análise RTP, remux para FLV/fMP4 e transmissão ao vivo. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **Componentes de domínio** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | Um pacote para Excel, Word, PPT, PDF e mais de 15 formatos de documento. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | Áudio multiplataforma: codecs, E/S de dispositivos, DSP, contêineres e streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | Codecs de vídeo, formatos de contêiner, processamento de frames e streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | Interface unificada sobre Baidu, AMap, Tencent e Tianditu, com geocodificação e conversão de coordenadas. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | Geolocalização IPv4 com banco de dados offline mapeado em memória e API online como alternativa. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **Ferramentas e produtos** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | Caixa de ferramentas do desenvolvedor: rede, porta serial, criptografia, regex, Modbus e MQTT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | Sistema auto-hospedado de gerenciamento de código-fonte Git. | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | Instala automaticamente o runtime .NET correspondente quando iniciado em um host mais antigo. | — |

> Os badges mostram o pacote principal de cada projeto; pacotes de tema, extensão e satélites estão listados nas respectivas páginas do NuGet. Os mais de 30 pacotes não listados aqui (FTP, LoRa, extensões do Office, drivers de protocolo e outros) estão disponíveis na [organização NewLifeX](https://github.com/NewLifeX) e em [newlifex.com](https://newlifex.com). Esta tabela é mantida no README do NewLife.Core.

## Documentação

- 📋 [Requisitos](Doc/需求文档.md) — visão, objetivos principais, requisitos funcionais, itens adiados e não objetivos
- ✅ [Lista de funcionalidades](Doc/功能清单.md) — acompanhamento tridimensional de implementação/testes/comentários
- 🏗️ [Arquitetura](Doc/架构设计.md) — integração do skin .NET, estratégia de pacotes compartilhados, arquitetura front-end
- 🖥️ [Guia do front-end](NewLife.Cube.React/web/README.md) — guia de desenvolvimento/build/testes do diretório web

## Início rápido

Pré-requisito: um monorepo local `../NewLife.Cube` (repositório compartilhado de pacotes front-end da equipe, com `pnpm install` já executado para que `packages/*/dist` exista).

```bash
# 1. Iniciar a API do backend (CubeDemo, http://localhost:5050 por padrão, SQLite sem dependências externas)
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. Iniciar o servidor de desenvolvimento front-end (porta 5188)
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

Abra <http://localhost:5188> no navegador para ver a página de login; após entrar, você acessa o console de administração completo.

## Desenvolvimento local

```bash
# Build/verificações/testes unitários do front-end (diretório web/)
cd NewLife.Cube.React/web
pnpm build        # gera ../wwwroot (para incorporação no .NET)
pnpm type-check   # verificação de tipos com tsc
pnpm test:unit    # testes unitários Vitest (416)
pnpm test:e2e     # Playwright E2E (119; padrão 5050, substitua com $env:E2E_BASE_URL)

# Build .NET (incorpora wwwroot na DLL)
dotnet build 魔方React.slnx -c Release
```

**Alterar pacotes compartilhados**: após editar as fontes em `../NewLife.Cube/packages/*`, execute `pnpm build:packages` no monorepo (ou `pnpm dev:packages` para reconstruir em watch); as alterações entram em vigor imediatamente no skin por meio do link simbólico `file:`.

## Testes

- **Testes unitários**: Vitest + React Testing Library + jsdom, 416 casos aprovados
- **Testes E2E**: 119 casos Playwright (login/cadastro/ativação/esqueci a senha/central de segurança/CRUD de lista/importação-exportação/layout/upload/IA), com reutilização de sessão de login
- **Integração .NET**: fluxo ponta a ponta com CubeDemo + `UseReact` (login → menus → CRUD → exportação → atualização sem 404)

## Publicação

- **Pacote NuGet**: `NewLife.Cube.React` (versão `1.0.{yyyy.MMdd}`, com pacote de símbolos snupkg)
- **Automação de CI**: ⏸ planejada — será implementada em `.github/workflows/` quando os pacotes compartilhados estiverem publicados no npm (build prévio do front-end → `dotnet pack` → publicação no nuget.org + GitHub Packages); veja a [lista de funcionalidades](Doc/功能清单.md) §4

## Repositórios relacionados

| Repositório | Descrição |
|-------------|-----------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Núcleo do Cube (Web API/permissões/menus/metadados de campos) + pacotes front-end compartilhados `packages/@newlifex/*` |
| [Especificação de design de skins do Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | Especificação de design unificada que todos os skins do Cube devem seguir; o skin React está em conformidade |
| NewLife.Cube.Vue | Skin front-end da família Vue (Vue 3 + Element Plus) |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | Este repositório (skin front-end da família React) |

## Equipe

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

Fundada em 2002, a equipe NewLife dedica-se há mais de duas décadas ao ecossistema .NET e de IoT, mantém cerca de 100 projetos de código aberto (34 deles principais) e oferece soluções integradas de software e hardware para os setores de energia, logística, saúde, controle industrial e internet. Seguimos o lema "não há hierarquia no aprendizado — o domínio conquista o respeito".

Os componentes de código aberto já foram baixados <!--nuget-total:start-->6.48M<!--nuget-total:end--> vezes no NuGet (todo o ecossistema, até 2026-10).

Website: https://newlifex.com · Organização de código aberto: https://github.com/NewLifeX

<details>
<summary>Conta oficial no WeChat: 智能大石头 (escaneie para seguir)</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## Licença

[MIT](LICENSE) © 2002-2026 Equipe de desenvolvimento NewLife
