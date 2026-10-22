# NewLife.Cube.React - واجهة React لـ NewLife.Cube

![GitHub top language](https://img.shields.io/github/languages/top/NewLifeX/NewLife.Cube.React?logo=github)
![GitHub License](https://img.shields.io/github/license/NewLifeX/NewLife.Cube.React?logo=github)
![Nuget](https://img.shields.io/nuget/v/newlife.cube.react?logo=nuget)
![Nuget (with prereleases)](https://img.shields.io/nuget/vpre/newlife.cube.react?label=dev%20nuget&logo=nuget)

<!-- lang:start -->
🌐 [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Português](README.pt.md) | [Русский](README.ru.md) | [한국어](README.ko.md)
<!-- lang:end -->

**واجهة React** لواجهة الويب الأمامية للجيل الثالث من Web API في Cube (NewLife.Cube)، تُقدَّم كحزمة NuGet ومستودع مستقلين. مبنية على **React 19 + Ant Design 6 + Zustand + Vite**، وتُقاد ببيانات وصفية للحقول من الخادم الخلفي (`meta`)، فتعرض ديناميكيًا صفحات عامة للقوائم والنماذج، وتتوافق مع [مواصفة تصميم واجهات Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md).

أضف مراجع إلى `NewLife.Cube` و`NewLife.Cube.React`، ثم شغّل `dotnet run` وافتح المتصفح لتحصل على لوحة إدارة كاملة — تسجيل الدخول، والقوائم الديناميكية، والقوائم/النماذج المدفوعة بالبيانات الوصفية، وعمليات CRUD، والاستيراد/التصدير، ومساعد الذكاء الاصطناعي وغيرها، **دون أي تطوير للواجهة الأمامية**.

> العرض/البرنامج التعليمي: برنامج تعليم Cube <https://newlifex.com/cube> | موقع العرض <https://cube.newlifex.com>

> ⚠️ قد تكون هذه الترجمة متأخرة عن الأصل؛ المرجع هو [README بالإنجليزية](README.md).

---

## أبرز المزايا

- **جاهز للاستخدام**: سطر واحد `app.UseReact(env)`؛ تُضمَّن مخرجات البناء في DLL وتُوزَّع مع حزمة NuGet، دون الاعتماد على ملفات فعلية
- **مدفوع بالبيانات الوصفية للحقول**: تُعرض القوائم والنماذج والبحث والتفاصيل ديناميكيًا من بيانات `meta` الوصفية الخلفية؛ وإضافة كيان جديد لا تتطلب أي عمل على الواجهة الأمامية
- **متوافق مع مواصفة تصميم واجهات Cube**: تدفق مصادقة كامل، قائمة عامة، نموذج عام، ومكوّنات مشتركة مثل LOV/الرفع/النص الغني/مساعد الذكاء الاصطناعي
- **يستهلك الحزم المشتركة**: مبني على `@cube/*` (api-core/auth-logic/page-logic/field-mapping/page-utils)، بنواة مستقلة عن الإطار مشتركة بين عدة واجهات
- **سمة واحدة × فاتح/داكن**: مظهر أصلي مدفوع برموز antd، وتبديل فاتح/داكن بنقرة واحدة
- **مساعد الذكاء الاصطناعي**: محادثة متدفقة عبر SSE + أوامر سريعة + تعبئة ذكية للنماذج + تشخيص النظام، مع عرض mermaid مضمّن
- **تعدد اللغات**: 11 لغة واجهة مترجمة بالكامل (قائمة الخادم ∩ لغات الواجهة الأمامية الكاملة؛ موارد بـ 32 لغة؛ نفس المسار المستخدم في NewLife.Core/Cube، ويتطلب NewLife.Cube ≥ 6.15.2026.1022)، مع دعم اتباع لغة النظام أو فرض لغة؛ وتُعاد جلب قوائم الخادم والبيانات الوصفية للحقول ورسائل وقت التشغيل عند تغيير اللغة
- **اختبارات شاملة**: 136 اختبار وحدة + 48 اختبار E2E، جميعها ناجحة، مع إعادة استخدام جلسة تسجيل الدخول في Playwright

## خريطة المنظومة

NewLife منظومة متعدّدة الطبقات من مشاريع مفتوحة المصدر تُصدَر بإصدارات مستقلة. الخريطة أدناه مشتركة حرفيًا بين جميع مستودعات NewLife؛ وكل مشروع يرتبط بمستودعه وبحزمته الرئيسية على NuGet.

| المشروع | الوظيفة | التنزيلات |
| --- | --- | --- |
| **الأساس** | | |
| [NewLife.Core](https://github.com/NewLifeX/X) | التسجيل والتهيئة والتخزين المؤقت والشبكات والتسلسل والجدولة وتتبّع أداء APM. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Core?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Core) |
| [NewLife.XCode](https://github.com/NewLifeX/NewLife.XCode) | وسيط بيانات: جداول واحدة بمستوى عشرات المليارات من الصفوف، تقسيم تلقائي للجداول، فصل القراءة عن الكتابة، وأكثر من 10 قواعد بيانات. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCode?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCode) |
| [NewLife.Net](https://github.com/NewLifeX/NewLife.Net) | مكتبة شبكات عالية الأداء: 1.77 مليون pps / 14.5 Gbps على جهاز واحد (TCP 1KB، 2026-10)، و4 ملايين اتصال TCP طويل الأمد. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Net?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Net) |
| [NewLife.Remoting](https://github.com/NewLifeX/NewLife.Remoting) | إطار اتصال بروتوكولي وRPC لتطبيقات العميل/الخادم وأجهزة إنترنت الأشياء. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Remoting?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Remoting) |
| [NewLife.Agent](https://github.com/NewLifeX/NewLife.Agent) | يثبّت تطبيقات .NET كخدمات حارسة لنظام التشغيل: خدمات Windows وsystemd في Linux. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Agent?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Agent) |
| [NewLife.Templates](https://github.com/NewLifeX/NewLife.Zero) | قوالب مشاريع `dotnet new` للطرفية وweb وAPI والخدمات والبيانات وإنترنت الأشياء. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Templates?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Templates) |
| **البيانات والمراسلة** | | |
| [NewLife.Redis](https://github.com/NewLifeX/NewLife.Redis) | عميل Redis بزمن استجابة بالميكروثانية، وملايين العمليات في الثانية، وقوائم رسائل مدمجة. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Redis?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Redis) |
| [NewLife.RocketMQ](https://github.com/NewLifeX/NewLife.RocketMQ) | عميل RocketMQ مُدار بالكامل لـ Apache RocketMQ وخدمة رسائل Alibaba Cloud. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.RocketMQ?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.RocketMQ) |
| [NewLife.MQTT](https://github.com/NewLifeX/NewLife.MQTT) | عميل وخادم MQTT، بما في ذلك الاتصال بـ Alibaba Cloud IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MQTT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MQTT) |
| [NewLife.NovaDb](https://github.com/NewLifeX/NewLife.NovaDb) | قاعدة بيانات هجينة بلغة C#: مدمجة أو شبكية، وعلائقية، وسلاسل زمنية، وقائمة رسائل، وKV في واحد. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.NovaDb?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.NovaDb) |
| [NewLife.MySql](https://github.com/NewLifeX/NewLife.MySql) | برنامج تشغيل MySql وطبقة مساعدة مبنية على مكدّس بيانات NewLife. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.MySql?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.MySql) |
| **Web والذكاء الاصطناعي والأنظمة الموزّعة** | | |
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | إطار منصة إدارة سريعة: الصلاحيات، والدخول الموحّد SSO، وخادم OAuth، وتوليد واجهات CRUD. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Cube?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Cube) |
| [Stardust](https://github.com/NewLifeX/Stardust) | منصة خدمات موزّعة: إدارة العقد، وAPM، ومركز الإعدادات، ومركز التسجيل، ومركز النشر. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Stardust?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Stardust) |
| [AntJob](https://github.com/NewLifeX/AntJob) | منصة موزّعة للمهام وجدولة البيانات الفورية، مع التقسيم وإعادة المحاولة وإعادة التعبئة. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AntJob?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AntJob) |
| [NewLife.AI](https://github.com/NewLifeX/NewLife.AI) | عميل موحّد لـ 46 مزوّد LLM بالإضافة إلى ChatAI، تطبيق ويب جاهز للمحادثة. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.AI?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.AI) |
| **الصناعة وإنترنت الأشياء** | | |
| [NewLife.IoT](https://github.com/NewLifeX/NewLife.IoT) | مكتبة معايير إنترنت الأشياء التي تعرّف عقود البروتوكولات وتجريدات الأجهزة. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IoT?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IoT) |
| [NewLife.Modbus](https://github.com/NewLifeX/NewLife.Modbus) | تنفيذ Modbus TCP/RTU/ASCII فوق NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Modbus?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Modbus) |
| [NewLife.Siemens](https://github.com/NewLifeX/NewLife.Siemens) | بروتوكول Siemens PLC فوق NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Siemens?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Siemens) |
| [NewLife.Omron](https://github.com/NewLifeX/NewLife.Omron) | بروتوكول Omron PLC فوق NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Omron?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Omron) |
| [NewLife.Melsec](https://github.com/NewLifeX/NewLife.Melsec) | بروتوكول Mitsubishi Melsec PLC فوق NewLife.IoT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Melsec?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Melsec) |
| [NewLife.OPC](https://github.com/NewLifeX/NewLife.OPC) | عميل OPC للوصول إلى البيانات الصناعية. | — |
| [NewLife.BACnet](https://github.com/NewLifeX/NewLife.BACnet) | مكدّس بروتوكول BACnet لأتمتة المباني. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.BACnet?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.BACnet) |
| [ZeroIoT](https://github.com/NewLifeX/ZeroIoT) | منصة إنترنت أشياء مفتوحة المصدر وخفيفة، مع إدارة البوابات والأجهزة. | — |
| **تليماتيكا المركبات** | | |
| [NewLife.JT808](https://github.com/NewLifeX/NewLife.JT808) | بروتوكول تحديد مواقع المركبات JT/T 808: أكثر من 70 جسم رسالة، 2011/2013/2019. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT808?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT808) |
| [NewLife.JT809](https://github.com/NewLifeX/NewLife.JT809) | بروتوكول JT/T 809 بين المنصات لجهات إدارة النقل. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT809?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT809) |
| [NewLife.JT1078](https://github.com/NewLifeX/NewLife.JT1078) | فيديو داخل المركبة JT/T 1078: تحليل RTP وإعادة التجميع إلى FLV/fMP4 والبث المباشر. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.JT1078?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.JT1078) |
| **مكوّنات المجال** | | |
| [NewLife.Office](https://github.com/NewLifeX/NewLife.Office) | حزمة واحدة لـ Excel وWord وPPT وPDF وأكثر من 15 صيغة مستندات. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Office?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Office) |
| [NewLife.Audio](https://github.com/NewLifeX/NewLife.Audio) | صوت عبر المنصات: مرمّزات، وإدخال/إخراج الأجهزة، وDSP، وحاويات، وبث. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Audio?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Audio) |
| [NewLife.Video](https://github.com/NewLifeX/NewLife.Video) | مرمّزات الفيديو وصيغ الحاويات ومعالجة الإطارات والبث. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Video?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Video) |
| [NewLife.Map](https://github.com/NewLifeX/NewLife.Map) | واجهة موحّدة فوق Baidu وAMap وTencent وTianditu مع الترميز الجغرافي وتحويل الإحداثيات. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.Map?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.Map) |
| [NewLife.IP](https://github.com/NewLifeX/NewLife.IP) | تحديد الموقع الجغرافي لعناوين IPv4 بقاعدة بيانات غير متصلة مُعيّنة في الذاكرة، وواجهة API عبر الإنترنت كبديل. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.IP?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.IP) |
| **الأدوات والمنتجات** | | |
| [CrazyCoder](https://github.com/NewLifeX/XCoder) | صندوق أدوات المطوّر: الشبكات والمنفذ التسلسلي والتشفير والتعبيرات النمطية وModbus وMQTT. | [![NuGet](https://img.shields.io/nuget/dt/NewLife.XCoder?style=flat-square&logo=nuget&label=downloads)](https://www.nuget.org/packages/NewLife.XCoder) |
| [GitCandy](https://github.com/NewLifeX/GitCandy) | نظام استضافة ذاتية لإدارة الشيفرة المصدرية Git. | — |
| [LuckyClover](https://github.com/NewLifeX/LuckyClover) | يثبّت بيئة تشغيل .NET المطابقة تلقائيًا عند التشغيل من مضيف أقدم. | — |

> تعرض الشارات الحزمة الرئيسية لكل مشروع؛ أما حزم السمات والإضافات والحزم التابعة فمذكورة في صفحاتها على NuGet. الحزم التي تتجاوز 30 حزمة وغير المذكورة هنا (FTP وLoRa وإضافات Office وبرامج تشغيل البروتوكولات وغيرها) متاحة في [منظمة NewLifeX](https://github.com/NewLifeX) وعلى [newlifex.com](https://newlifex.com). يُصان هذا الجدول في README الخاص بـ NewLife.Core.

## الوثائق

- 📋 [المتطلبات](Doc/需求文档.md) — الرؤية، الأهداف الأساسية، المتطلبات الوظيفية، البنود المؤجلة وغير المستهدفة
- ✅ [قائمة الميزات](Doc/功能清单.md) — تتبع ثلاثي الأبعاد للتنفيذ/الاختبارات/التعليقات
- 🏗️ [تصميم البنية](Doc/架构设计.md) — تكامل واجهة .NET، استراتيجية الحزم المشتركة، بنية الواجهة الأمامية
- 🖥️ [دليل الواجهة الأمامية](NewLife.Cube.React/web/README.md) — دليل التطوير/البناء/الاختبار لمجلد web

## البدء السريع

المتطلب المسبق: وجود monorepo محلي `../NewLife.Cube` (مستودع حزم الواجهة الأمامية المشترك للفريق، مع تنفيذ `pnpm install` لضمان وجود `packages/*/dist`).

```bash
# 1. تشغيل API الخلفي (CubeDemo، افتراضيًا http://localhost:5050، وSQLite دون تبعيات خارجية)
dotnet run --project CubeDemo/CubeDemo.csproj

# 2. تشغيل خادم تطوير الواجهة الأمامية (المنفذ 5188)
cd NewLife.Cube.React/web
pnpm install
pnpm dev
```

افتح <http://localhost:5188> في المتصفح لرؤية صفحة تسجيل الدخول؛ وبعد تسجيل الدخول تصل إلى لوحة الإدارة الكاملة.

## التطوير المحلي

```bash
# بناء/فحص/اختبارات وحدة للواجهة الأمامية (مجلد web/)
cd NewLife.Cube.React/web
pnpm build        # الإخراج إلى ../wwwroot (للتضمين في .NET)
pnpm type-check   # فحص الأنواع بواسطة tsc
pnpm test:unit    # اختبارات وحدة Vitest (136)
pnpm test:e2e     # Playwright E2E (48؛ افتراضيًا 5050، ويمكن تجاوزه عبر $env:E2E_BASE_URL)

# بناء .NET (يضمّن wwwroot في DLL)
dotnet build 魔方React.slnx -c Release
```

**تعديل الحزم المشتركة**: بعد تعديل المصادر ضمن `../NewLife.Cube/packages/*`، نفّذ `pnpm build:packages` في monorepo (أو `pnpm dev:packages` لإعادة البناء في وضع المراقبة)؛ وتصبح التغييرات سارية فورًا في الواجهة عبر رابط `file:` الرمزي.

## الاختبارات

- **اختبارات الوحدة**: Vitest + React Testing Library + jsdom، و136 حالة ناجحة
- **اختبارات E2E**: 48 حالة Playwright (تسجيل الدخول/التسجيل/التنشيط/نسيان كلمة المرور/مركز الأمان/إنشاء وتعديل وحذف القوائم/الاستيراد والتصدير/التخطيط/الرفع/الذكاء الاصطناعي)، مع إعادة استخدام جلسة تسجيل الدخول
- **تكامل .NET**: تدفق شامل باستخدام CubeDemo + `UseReact` (تسجيل الدخول → القوائم → CRUD → التصدير → التحديث دون 404)

## الإصدار

- **حزمة NuGet**: `NewLife.Cube.React` (الإصدار `1.0.{yyyy.MMdd}`، مع حزمة رموز snupkg)
- **أتمتة CI**: ⏸ مخطط لها — ستُنفَّذ في `.github/workflows/` بعد جاهزية نشر الحزم المشتركة على npm (بناء مسبق للواجهة الأمامية → `dotnet pack` → النشر إلى nuget.org + GitHub Packages)؛ راجع [قائمة الميزات](Doc/功能清单.md) §4

## المستودعات ذات الصلة

| المستودع | الوصف |
|----------|-------|
| [NewLife.Cube](https://github.com/NewLifeX/NewLife.Cube) | نواة Cube (WebAPI/الأذونات/القوائم/البيانات الوصفية للحقول) + حزم الواجهة الأمامية المشتركة `packages/@cube/*` |
| [مواصفة تصميم واجهات Cube](https://github.com/NewLifeX/NewLife.Cube/blob/master/Doc/UI设计/皮肤设计规范.md) | مواصفة التصميم الموحدة التي يجب أن تتبعها جميع واجهات Cube؛ وواجهة React متوافقة معها |
| NewLife.Cube.Vue | واجهة أمامية من عائلة Vue (Vue 3 + Element Plus) |
| [NewLife.Cube.React](https://github.com/NewLifeX/NewLife.Cube.React) | هذا المستودع (واجهة أمامية من عائلة React) |

## الفريق

<img src="https://newlifex.com/logo.png" width="48" align="right" alt="NewLife" />

تأسّست NewLife في عام 2002، وأمضت أكثر من عقدين في منظومة .NET وإنترنت الأشياء، وتدير ما يقارب 100 مشروع مفتوح المصدر (34 منها مشاريع رئيسية)، وتقدّم حلولًا متكاملة للبرمجيات والأجهزة لقطاعات الكهرباء والخدمات اللوجستية والرعاية الصحية والتحكّم الصناعي والإنترنت. ونلتزم بمبدأ "لا أسبقية في التعلّم — الإتقان يكسب الاحترام".

نُزّلت المكوّنات مفتوحة المصدر <!--nuget-total:start-->6.48M<!--nuget-total:end--> مرة من NuGet (على مستوى المنظومة بأكملها، حتى 2026-10).

الموقع: https://newlifex.com · المنظمة مفتوحة المصدر: https://github.com/NewLifeX

<details>
<summary>حساب WeChat الرسمي: 智能大石头 (امسح للاشتراك)</summary>

![智能大石头](https://newlifex.com/stone.jpg)

</details>

## الترخيص

[MIT](LICENSE) © 2002-2026 فريق تطوير NewLife
