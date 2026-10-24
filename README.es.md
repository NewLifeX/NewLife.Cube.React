# NewLife.Cube.React: skin React para NewLife.Cube

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Deutsch](README.de.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Português](README.pt.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [العربية](README.ar.md)
<!-- lang:end -->

El **skin React** del front-end Web API de tercera generación de Cube (NewLife.Cube), distribuido como paquete NuGet y repositorio independientes. Construido con **React 19 + Ant Design 6 + Zustand + Vite** y guiado por los metadatos de campos del backend (`meta`), renderiza dinámicamente páginas genéricas de lista y formulario, y cumple la [especificación de diseño de skins de Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md).

Agrega referencias a `NewLife.Cube` y `NewLife.Cube.React`, ejecuta `dotnet run` y abre el navegador para obtener una consola de administración completa: inicio de sesión, menús dinámicos, listas y formularios basados en metadatos, CRUD, importación/exportación, asistente de IA y más, con **cero desarrollo front-end**.

> Demostración/tutorial: tutorial de Cube <https://newlifex.com/cube> | Sitio de demostración <https://cube.newlifex.com>

> ⚠️ Esta traducción puede estar desactualizada; la referencia es el [README en inglés](README.md).

---

## Puntos destacados

- **Listo para usar**: una línea `app.UseReact(env)`; la salida de compilación se incrusta en la DLL y se distribuye con el paquete NuGet, sin depender de archivos físicos
- **Guiado por metadatos de campos**: listas, formularios, búsqueda y detalle se renderizan dinámicamente desde los metadatos `meta` del backend; añadir una entidad no requiere trabajo front-end
- **Cumple la especificación de diseño de skins de Cube**: flujo completo de autenticación, lista genérica, formulario genérico, LOV/carga de archivos/editor de texto enriquecido/asistente de IA y otros componentes compartidos
- **Consume los paquetes compartidos**: basado en `@newlifex/*` (api-core/auth-logic/page-logic/field-mapping/page-utils), con un núcleo agnóstico de framework compartido por varios skins
- **Tema único × claro/oscuro**: apariencia nativa impulsada por tokens de antd, con cambio claro/oscuro en un clic
- **Asistente de IA**: chat en streaming SSE + comandos rápidos + relleno inteligente de formularios + diagnóstico del sistema, con renderizado mermaid integrado
- **Localización multilingüe**: 11 idiomas de interfaz totalmente traducidos (lista del backend ∩ idiomas completos del front-end; el backend expone 32 idiomas y los otros 21 vuelven al inglés; misma cadena que NewLife.Core/Cube, requiere NewLife.Cube ≥ 6.15.2026.1022), con idioma del sistema o forzado; los menús, metadatos de campos y mensajes de ejecución del servidor se vuelven a solicitar al cambiar de idioma
- **Bien probado**: 416 pruebas unitarias + 121 pruebas E2E, todas superadas, con reutilización de sesión de inicio de sesión en Playwright

## Mapa del ecosistema

NewLife es un ecosistema por capas de proyectos de código abierto con versionado independiente. El mapa siguiente se comparte literalmente en todos los repositorios de NewLife; cada proyecto enlaza a su repositorio y a su paquete principal de NuGet.

| Proyecto | Qué hace | Descargas |
| --- | --- | --- |
| **Fundación** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | Registro de logs, configuración, caché, red, serialización, programación de tareas y seguimiento APM. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | Middleware de datos: tablas únicas a escala de decenas de miles de millones, particionado automático, separación lectura/escritura y más de 10 bases de datos. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | Biblioteca de red de alto rendimiento: 1,77 M pps / 14,5 Gbps en una máquina (TCP 1KB, 2026-10), 4 M conexiones TCP persistentes. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | Framework de comunicación por protocolo y RPC para aplicaciones cliente/servidor y dispositivos IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | Instala aplicaciones .NET como demonios del sistema operativo: servicios de Windows y systemd de Linux. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | Plantillas de proyecto `dotnet new` para consola, web, API, servicio, datos e IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **Datos y mensajería** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | Cliente Redis con latencia de microsegundos, millones de operaciones por segundo y colas de mensajes integradas. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | Cliente RocketMQ totalmente administrado para Apache RocketMQ y Alibaba Cloud Message Queue. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | Cliente y servidor MQTT, incluida la conectividad con Alibaba Cloud IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | Base de datos híbrida en C#: embebida o en red, relacional, series temporales, cola de mensajes y KV en una sola. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | Controlador y capa de ayuda de MySql construidos sobre la pila de datos de NewLife. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web, IA y distribuido** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Framework rápido para plataformas de administración: permisos, SSO, servidor OAuth y andamiaje CRUD. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | Plataforma distribuida de servicios: gestión de nodos, APM, centro de configuración, registro y centro de despliegues. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | Plataforma de tareas distribuidas y programación de datos en tiempo real con particionado, reintentos y relleno histórico. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | Cliente unificado para 46 proveedores de LLM más ChatAI, una aplicación web de chat lista para usar. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **Industrial e IoT** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | Biblioteca estándar de IoT que define contratos de protocolo y abstracciones de dispositivos. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | Implementación de Modbus TCP/RTU/ASCII sobre NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | Protocolo para PLC Siemens sobre NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | Protocolo para PLC Omron sobre NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | Protocolo para PLC Mitsubishi Melsec sobre NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | Cliente OPC para el acceso a datos industriales. | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | Pila de protocolo BACnet para la automatización de edificios. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | Plataforma IoT de código abierto y ligera con gestión de pasarelas y dispositivos. | — |
| **Telemática vehicular** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | Protocolo de posicionamiento vehicular JT/T 808: más de 70 cuerpos de mensaje, 2011/2013/2019. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | Protocolo plataforma a plataforma JT/T 809 para autoridades de transporte. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | Vídeo a bordo JT/T 1078: análisis RTP, remultiplexado FLV/fMP4 y transmisión en directo. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **Componentes de dominio** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | Un solo paquete para Excel, Word, PPT, PDF y más de 15 formatos de documento. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | Audio multiplataforma: códecs, E/S de dispositivos, DSP, contenedores y streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | Códecs de vídeo, formatos de contenedor, procesamiento de fotogramas y streaming. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | Interfaz unificada sobre Baidu, AMap, Tencent y Tianditu con geocodificación y conversión de coordenadas. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | Geolocalización IPv4 con una base de datos offline mapeada en memoria y una API en línea de respaldo. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **Herramientas y productos** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | Caja de herramientas del desarrollador: red, puerto serie, criptografía, expresiones regulares, Modbus y MQTT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | Sistema de gestión de código fuente Git autoalojado. | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | Instala automáticamente el runtime de .NET correspondiente cuando se ejecuta desde un host más antiguo. | — |

> Las insignias muestran el paquete principal de cada proyecto; los paquetes de temas, extensiones y satélites figuran en sus páginas de NuGet. Los más de 30 paquetes no listados aquí (FTP, LoRa, extensiones de Office, controladores de protocolo, etc.) están disponibles en la [organización NewLifeX](https://github.com/NewLifeX) y en [newlifex.com](https://newlifex.com). Esta tabla se mantiene en el README de NewLife.Core.

## Documentación

- 📋 [Requisitos](Doc/需求文档.md) — visión, objetivos principales, requisitos funcionales, aplazados y no objetivos
- ✅ [Lista de funciones](Doc/功能清单.md) — seguimiento tridimensional de implementación/pruebas/comentarios
- 🏗️ [Arquitectura](Doc/架构设计.md) — integración del skin .NET, estrategia de paquetes compartidos, arquitectura front-end
- 🖥️ [Guía del front-end](NewLife.Cube.React/web/README.md) — guía de desarrollo/compilación/pruebas del directorio web

## Inicio rápido

Requisito previo: un monorepo local `../NewLife.Cube` (repositorio compartido de paquetes front-end del equipo, con `pnpm install` ejecutado para que exista `packages/*/dist`).

```bash
# 1. Iniciar la API del backend (CubeDemo, http://localhost:5050 por defecto, SQLite sin dependencias externas)
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. Iniciar el servidor de desarrollo front-end (puerto 5188)
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

Abre <http://localhost:5188> en el navegador para ver la página de inicio de sesión; tras iniciar sesión accedes a la consola de administración completa.

## Desarrollo local

```bash
# Compilación/verificación/pruebas unitarias del front-end (directorio web/)
cd NewLife.Cube.React/web
pnpm build        # genera ../wwwroot (para la incrustación en .NET)
pnpm type-check   # verificación de tipos con tsc
pnpm test:unit    # pruebas unitarias Vitest (416)
pnpm test:e2e     # Playwright E2E (121; por defecto 5050, se puede sobrescribir con $env:E2E_BASE_URL)

# Compilación .NET (incrusta wwwroot en la DLL)
dotnet build 魔方React.slnx -c Release
```

**Modificar paquetes compartidos**: tras editar las fuentes en `../NewLife.Cube/packages/*`, ejecuta `pnpm build:packages` en el monorepo (o `pnpm dev:packages` para recompilar en modo watch); los cambios se aplican de inmediato en el skin mediante su enlace simbólico `file:`.

## Pruebas

- **Pruebas unitarias**: Vitest + React Testing Library + jsdom, 416 casos superados
- **Pruebas E2E**: 121 casos de Playwright (inicio de sesión/registro/activación/contraseña olvidada/centro de seguridad/crear-modificar-eliminar en listas/importación-exportación/diseño/carga de archivos/IA), con reutilización de sesión
- **Integración .NET**: flujo de extremo a extremo con CubeDemo + `UseReact` (inicio de sesión → menús → CRUD → exportación → actualización sin 404)

## Publicación

- **Paquete NuGet**: `NewLife.Cube.React` (versión `1.0.{yyyy.MMdd}`, con paquete de símbolos snupkg)
- **Automatización CI**: ⏸ planificada — se implementará en `.github/workflows/` cuando los paquetes compartidos estén publicados en npm (compilación previa del front-end → `dotnet pack` → publicación en nuget.org + GitHub Packages); consulta la [lista de funciones](Doc/功能清单.md) §4

## Repositorios relacionados

| Repositorio | Descripción |
|-------------|-------------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | Núcleo de Cube (Web API/permisos/menús/metadatos de campos) + paquetes front-end compartidos `packages/@newlifex/*` |
| [Especificación de diseño de skins de Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | Especificación de diseño unificada que todos los skins de Cube deben seguir; el skin React la cumple |
| NewLife.Cube.Vue | Skin front-end de la familia Vue (Vue 3 + Element Plus) |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | Este repositorio (skin front-end de la familia React) |

## Equipo

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

NewLife se fundó en 2002 y lleva más de dos décadas dedicado al ecosistema .NET e IoT, mantiene cerca de 100 proyectos de código abierto (34 de ellos principales) y ofrece soluciones integradas de software y hardware para los sectores de energía, logística, salud, control industrial e Internet. Nos guía el lema «en el aprendizaje no hay antigüedad: quien domina es maestro».

Los componentes de código abierto acumulan <!--nuget-total:start-->6.48M<!--nuget-total:end--> descargas en NuGet (todo el ecosistema, a fecha de 2026-10).

Sitio web: https://newlifex.com · Organización de código abierto: https://github.com/NewLifeX

<details>
<summary>Cuenta oficial de WeChat: 智能大石头 (escanea para seguir)</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## Licencia

[MIT](LICENSE) © 2002-2026 Equipo de desarrollo NewLife
