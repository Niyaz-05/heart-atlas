# Heart Atlas. Этап 0: фундамент

Дата: 11.10.2026
Статус: черновик, ждёт согласования
План MVP: https://claude.ai/artifact/R7gkXCnjqbrPEfC56gcA3U

## Цель

Публичный репозиторий с правилами проекта, пустой сайт на двух языках в продакшене и CI, который проверяет каждый PR. После этапа 0 любой контрибьютор (человек или Claude Code) может клонировать репозиторий, запустить сайт одной командой и открыть PR, который пройдёт те же проверки, что и у мейнтейнера.

## Решения, принятые до этапа

| Вопрос | Решение |
|---|---|
| Репозиторий | `w3lld1/heart-atlas`, публичный |
| Лицензия кода | MIT (`LICENSE`) |
| Лицензия контента и моделей | CC BY-SA 4.0 (`LICENSE-CONTENT`), действует для `content/` и `assets/` |
| Медицинские рецензии | В MVP их нет. Вместо них обязательные проверенные источники и плашка «врачом не проверено» |
| Языки | Стартуем с `ru` и `en`, архитектура позволяет добавить любой язык, включая письмо справа налево |
| Инструменты разработки | Claude Code с плагинами ECC (Everything Claude Code) и ponytail |

## Что входит

1. Документы проекта: README на двух языках, CONTRIBUTING, CODE_OF_CONDUCT (Contributor Covenant 2.1), SECURITY, медицинский дисклеймер `DISCLAIMER.md`.
2. Монорепозиторий на pnpm workspaces: `apps/web` (Astro + React), `packages/` пока пустой с README.
3. TypeScript strict, ESLint, Prettier, Vitest, Playwright.
4. Реестр языков и i18n.
5. Каркас схемы контента и политики источников (без статей).
6. CI в GitHub Actions и деплой.
7. Настройка Claude Code: `CLAUDE.md`, `.claude/settings.json` с ECC и ponytail.
8. Шаблоны issue и PR, метки.

## Что не входит

3D, «часы сердца», статьи, поиск, PWA. Это этапы 1–4.

## Ключевые детали

### Реестр языков

Один источник правды `i18n/locales.ts`:

```ts
export const locales = {
  ru: { name: 'Русский', dir: 'ltr', fallback: 'en' },
  en: { name: 'English', dir: 'ltr', fallback: null },
} as const satisfies Record<string, LocaleConfig>;
export const defaultLocale = 'ru';
```

- Строки интерфейса лежат в `i18n/messages/<locale>.json`. Английский файл считается эталонным набором ключей.
- Контент лежит в `content/<locale>/<type>/<slug>.mdx`. Если статьи нет на языке читателя, показывается версия на языке `fallback` с пометкой «перевод ещё не готов» и ссылкой на инструкцию для переводчиков.
- Маршруты `/<locale>/...` генерирует Astro из реестра, жёстко зашитых `ru` и `en` в коде нет.
- `<html lang dir>` берутся из реестра. В CSS используются только логические свойства (`margin-inline-start` и т. п.), правило stylelint запрещает физические `left/right`.
- Скрипт `pnpm i18n:check` проверяет, что в каждом файле строк есть все ключи эталона, и в CI падает на отсутствующих ключах. Лишние ключи дают предупреждение.
- Добавить язык = одна запись в реестре + файл строк. Это описано в `CONTRIBUTING.md`, и e2e-тест проверяет это на фиктивной локали с `dir: 'rtl'`.

### Политика источников

Пока рецензентов нет, доверие строится на источниках. В этапе 0 появляется только схема (Zod) и проверка, статьи придут в этапе 3.

```yaml
sources:
  - tier: guideline        # guideline | review | textbook | reference
    org: ESC
    title: 2024 ESC Guidelines for the management of atrial fibrillation
    year: 2024
    doi: 10.1093/eurheartj/ehae176
    url: https://doi.org/10.1093/eurheartj/ehae176
sources_checked: 2026-10-11
review: null               # необязательное до появления рецензентов
```

Правила, которые проверяет сборка:

- В статье типа `disease`, `diagnostic` или `treatment` не меньше двух источников, хотя бы один с `tier: guideline`.
- `guideline`: ESC, AHA/ACC, NICE, Минздрав РФ (рубрикатор клинических рекомендаций), ВОЗ. Список хранится в `content/trusted-sources.yaml`, менять его можно только PR с обоснованием.
- `review`: статья в рецензируемом журнале, обязательно с DOI.
- `textbook` и `reference`: StatPearls (NCBI Bookshelf), MSD Manuals, открытые учебники с ISBN.
- `sources_checked` не старше 2 лет, иначе предупреждение в CI.
- Еженедельный workflow `links.yml` проверяет, что ссылки живые, и открывает issue на битые.
- Пока `review: null`, страница показывает плашку «Основано на клинических рекомендациях. Врачом не проверено» и кнопку «Сообщить об ошибке», которая открывает issue по шаблону.

### Claude Code: ECC и ponytail

`.claude/settings.json` в репозитории, чтобы плагины включались у каждого, кто открывает проект в Claude Code:

```json
{
  "extraKnownMarketplaces": {
    "ecc": { "source": { "source": "github", "repo": "affaan-m/ECC" } },
    "ponytail": { "source": { "source": "github", "repo": "DietrichGebert/ponytail" } }
  },
  "enabledPlugins": {
    "ecc@ecc": true,
    "ponytail@ponytail": true
  }
}
```

- ECC (MIT) даёт агентов и навыки для планирования, TDD, ревью кода и проверки безопасности. Его хуки грузятся из плагина автоматически, копировать их в `settings.json` нельзя, иначе они сработают дважды.
- ponytail (MIT) держит агента на минимальном решении и даёт команду `/ponytail-review` для поиска переусложнения в диффе. Хукам ponytail нужен `node` в PATH, он уже есть по требованиям проекта.
- `CLAUDE.md` описывает флоу проекта: спека перед кодом, серия маленьких PR, связь PR с issue, проверки перед мерджем, правила медицинского контента.
- Хук SessionStart для облачных сессий Claude Code ставит зависимости (`pnpm install --frozen-lockfile`), чтобы тесты и линт запускались сразу.

### CI

Workflow `ci.yml` на каждый PR и push в `main`:

| Джоба | Что делает |
|---|---|
| `lint` | ESLint, Prettier `--check`, stylelint |
| `types` | `astro check` и `tsc --noEmit` |
| `unit` | Vitest |
| `i18n` | `pnpm i18n:check` |
| `build` | `astro build`, артефакт сборки |
| `e2e` | Playwright на собранном сайте: главная на `ru` и `en`, переключение языка, фиктивная RTL-локаль, дисклеймер, axe без нарушений |
| `lighthouse` | Lighthouse CI, порог 90 по всем категориям на главной |

Node 22 LTS, pnpm 10, версии зафиксированы в `package.json` (`engines`, `packageManager`) и `.nvmrc`.

### Деплой

По умолчанию GitHub Pages через Actions: не нужно заводить аккаунты и секреты, сайт будет на `w3lld1.github.io/heart-atlas`. Превью на каждый PR добавим, когда подключим Cloudflare Pages (нужен аккаунт Cloudflare владельца). Свой домен добавляется позже без изменений в коде, через `site` в конфиге Astro.

## Разбиение на PR

Каждый PR связан со своим issue. Перед мерджем: зелёный CI и независимое ревью ветки субагентом.

| PR | Содержание | Готово, когда |
|---|---|---|
| PR 1 | Эта спека (лицензии и README уже в `main`) | Спека согласована |
| PR 2 | Документы проекта, шаблоны issue и PR, метки, `CLAUDE.md`, `.claude/settings.json` с ECC и ponytail, SessionStart-хук | Claude Code в репозитории видит оба плагина |
| PR 3 | Монорепо pnpm, Astro + React + TypeScript strict, ESLint, Prettier, stylelint, Vitest | `pnpm dev` открывает пустую страницу, `pnpm lint` и `pnpm test` зелёные |
| PR 4 | Реестр языков, строки `ru`/`en`, маршруты по локалям, переключатель языка, `i18n:check`, базовый макет, тёмная тема, дисклеймер в подвале | Сайт открывается на `/ru/` и `/en/`, фиктивная RTL-локаль собирается |
| PR 5 | Схема контента и политика источников, `trusted-sources.yaml`, плашка «врачом не проверено», тесты схемы | Тестовая статья без guideline-источника валит сборку |
| PR 6 | CI (`ci.yml`, `links.yml`), Playwright, axe, Lighthouse CI, деплой на GitHub Pages | Сайт доступен по публичному адресу, все джобы зелёные |

## Риски

- Плагины ECC и ponytail могут конфликтовать в инструкциях (ECC склонен к подробным планам, ponytail к минимализму). Если это мешает, оставляем ponytail в режиме `lite`. Проверим на PR 3.
- ECC большой (сотни навыков). Если он заметно замедляет сессии, перейдём на выборочную установку профилем.
- GitHub Pages не даёт превью PR. Пока рецензентов нет, это не критично.

## Открытые вопросы

1. Подходит ли GitHub Pages на старте, или сразу заводим Cloudflare Pages ради превью PR?
2. Нужен ли свой домен уже сейчас?
