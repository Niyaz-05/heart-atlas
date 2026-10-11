# Heart Atlas. Этап 0: фундамент

Дата: 11.10.2026
Статус: согласована

## Цель

Публичный репозиторий с правилами проекта, пустой сайт на двух языках в продакшене и CI, который проверяет каждый PR. После этапа 0 любой контрибьютор (человек или Claude Code) может клонировать репозиторий, запустить сайт одной командой и открыть PR, который пройдёт те же проверки, что и у мейнтейнера.

## Решения, принятые до этапа

| Вопрос | Решение |
|---|---|
| Репозиторий | `w3lld1/heart-atlas`, публичный |
| Лицензия кода | MIT (`LICENSE`) |
| Лицензия контента и моделей | CC BY-SA 4.0 (`LICENSE-CONTENT`), действует для корневых `content/` и `assets/`, кроме исключений, записанных в `assets/models/LICENSES.yaml` |
| Медицинские рецензии | В MVP их нет. Вместо них обязательные проверенные источники и плашка «врачом не проверено» |
| Языки | Стартуем с `ru` и `en`, архитектура позволяет добавить любой язык, включая письмо справа налево |
| Инструменты разработки | Claude Code с плагинами ECC (Everything Claude Code) и ponytail |
| Хостинг | GitHub Pages, адрес `w3lld1.github.io/heart-atlas`. Свой домен позже |

## Что входит

1. Документы проекта: CONTRIBUTING, CODE_OF_CONDUCT (Contributor Covenant 2.1), SECURITY, медицинский дисклеймер `DISCLAIMER.md`. README переходит на схему `README.md` (английский, основной для GitHub) + `README.ru.md` с перекрёстными ссылками.
2. Монорепозиторий на pnpm workspaces: `apps/web` (Astro + React + MDX), `packages/` пока пустой с README.
3. TypeScript strict, ESLint, Prettier, stylelint, Vitest, Playwright.
4. Реестр языков и i18n.
5. Каркас схемы контента и политики источников (без статей).
6. CI в GitHub Actions и деплой.
7. Настройка Claude Code: `CLAUDE.md`, `.claude/settings.json` с ECC и ponytail, SessionStart-хук.
8. Шаблоны issue и PR, метки.

## Что не входит

3D, «часы сердца», статьи, поиск, PWA. Это этапы 1–4.

## Структура репозитория

```
heart-atlas/
├─ apps/web/                  сайт на Astro
│  ├─ src/i18n/               реестр языков и строки интерфейса
│  └─ test/fixtures/          тестовые локали и невалидные статьи для тестов
├─ packages/                  общие пакеты (появятся с этапа 2)
├─ content/<locale>/<type>/   статьи MDX, CC BY-SA 4.0
├─ content/trusted-sources.yaml
├─ assets/                    модели, звуки, иллюстрации, CC BY-SA 4.0
└─ docs/plans/                спеки и планы
```

`content/` и `assets/` лежат в корне, чтобы на них действовал `LICENSE-CONTENT`. Коллекции Astro подключают их через загрузчик `glob({ base: '../../content', pattern: '**/*.mdx' })`.

## Ключевые детали

### Реестр языков

Один источник правды `apps/web/src/i18n/locales.ts`:

```ts
export type LocaleConfig = {
  name: string;
  dir: 'ltr' | 'rtl';
  fallback: string | null;
};

export const locales = {
  ru: { name: 'Русский', dir: 'ltr', fallback: 'en' },
  en: { name: 'English', dir: 'ltr', fallback: null },
} as const satisfies Record<string, LocaleConfig>;

export const defaultLocale = 'ru';
```

- Строки интерфейса лежат в `apps/web/src/i18n/messages/<locale>.json`. Английский файл считается эталонным набором ключей.
- Контент лежит в `content/<locale>/<type>/<slug>.mdx`. Если статьи нет на языке читателя, показывается версия на языке `fallback` с пометкой «перевод ещё не готов» и ссылкой на инструкцию для переводчиков.
- Маршруты `/<locale>/...` генерирует Astro из реестра, жёстко зашитых `ru` и `en` в коде нет. Корень сайта отдаёт страницу с редиректом на `defaultLocale`, потому что статический хостинг не умеет серверных редиректов.
- `<html lang dir>` берутся из реестра. В CSS используются только логические свойства (`margin-inline-start` и т. п.), правило stylelint запрещает физические `left/right`.
- Скрипт `pnpm i18n:check` проверяет, что в каждом файле строк есть все ключи эталона, и в CI падает на отсутствующих ключах. Лишние ключи дают предупреждение.
- Unit-тест реестра проверяет, что каждый `fallback` ссылается на существующую локаль, цепочки fallback не зацикливаются, а `defaultLocale` есть в реестре.
- Добавить язык = одна запись в реестре + файл строк. Это описано в `CONTRIBUTING.md`.
- RTL проверяется на тестовой локали, которая в продакшен не попадает. Она лежит в `apps/web/test/fixtures/i18n/` и подключается к реестру только при `HA_TEST_LOCALES=1`. С этим флагом собирается отдельная e2e-сборка; `i18n:check` проверяет тестовые файлы строк так же, как настоящие.

### Политика источников

Пока рецензентов нет, доверие строится на источниках. В этапе 0 появляется только схема (Zod) и её проверка, статьи придут в этапе 3.

```yaml
sources:
  - tier: guideline        # guideline | review | textbook | reference
    org: esc               # id из content/trusted-sources.yaml
    title: 2024 ESC Guidelines for the management of atrial fibrillation
    year: 2024
    doi: 10.1093/eurheartj/ehae176
    url: https://doi.org/10.1093/eurheartj/ehae176
sources_checked: 2026-10-11
review: null               # необязательное до появления рецензентов
```

`content/trusted-sources.yaml` хранит организации с id и допустимым уровнем:

```yaml
esc:         { name: European Society of Cardiology, tier: guideline }
aha-acc:     { name: AHA / ACC, tier: guideline }
nice:        { name: NICE, tier: guideline }
minzdrav-rf: { name: "Минздрав РФ, рубрикатор клинических рекомендаций", tier: guideline }
who:         { name: ВОЗ, tier: guideline }
statpearls:  { name: StatPearls (NCBI Bookshelf), tier: reference }
msd-manuals: { name: MSD Manuals, tier: reference }
```

Менять этот список можно только через PR с обоснованием.

Правила, которые проверяет схема:

- В статье типа `disease`, `diagnostic` или `treatment` не меньше двух источников, хотя бы один с `tier: guideline`.
- Для `guideline` и `reference` поле `org` обязано быть id из `trusted-sources.yaml`, а `tier` должен совпадать с записанным там.
- Для `review` (статья в рецензируемом журнале) обязателен `doi`, `org` не нужен.
- Для `textbook` обязателен `isbn`.
- `sources_checked` описан как `z.coerce.date()`, потому что YAML превращает дату в объект `Date`. Если дате больше 2 лет, CI выдаёт предупреждение.
- `review` описан как `z.object({...}).nullable().default(null)`.
- Пока `review` равно `null`, страница показывает плашку «Основано на клинических рекомендациях. Врачом не проверено» и кнопку «Сообщить об ошибке», которая открывает issue по шаблону.

Невалидные статьи для тестов лежат в `apps/web/test/fixtures/content/` и проверяются unit-тестами схемы, а не сборкой. Поэтому сборка настоящего `content/` всегда остаётся зелёной.

Еженедельный workflow `links.yml` проверяет ссылки через lychee:

- для doi.org и сайтов издателей ответы 403 и 429 считаются нормой, потому что они блокируют ботов из CI;
- DOI дополнительно проверяется через API Crossref;
- при битых ссылках workflow обновляет одно открытое issue «Битые ссылки», а не заводит новое каждую неделю, поэтому ему выдано `permissions: issues: write`.

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
- `CLAUDE.md` описывает флоу проекта: спека перед кодом, серия маленьких PR, связь PR с issue, проверки перед мерджем, правила медицинского контента и правило «внутренние ссылки строятся только через `import.meta.env.BASE_URL`».
- SessionStart-хук нужен облачным сессиям Claude Code, чтобы тесты и линт запускались сразу. Он срабатывает только при `CLAUDE_CODE_REMOTE=true` и только если в репозитории уже есть `pnpm-lock.yaml`: выполняет `corepack enable && pnpm install --frozen-lockfile`. Так хук из PR 2 не падает до появления `package.json` в PR 3.

### Адрес сайта и base

Сайт живёт в подпапке `/heart-atlas/`, поэтому Astro нужен не только `site`, но и `base`. Оба значения берутся из переменных окружения `SITE_URL` и `BASE_PATH`, которые задаёт workflow деплоя. Все внутренние ссылки и пути к ассетам строятся через `import.meta.env.BASE_URL`.

Свой домен позже подключается без правок кода: меняем `SITE_URL`, ставим `BASE_PATH=/` и добавляем `public/CNAME`.

### CI

Workflow `ci.yml` на каждый PR и push в `main`:

| Джоба | Что делает |
|---|---|
| `lint` | ESLint, Prettier `--check`, stylelint |
| `types` | `astro check` для `apps/web`, `pnpm -r --if-present typecheck` (`tsc -b`) для `packages/*` |
| `unit` | Vitest, включая тесты реестра языков и схемы контента на фикстурах |
| `i18n` | `pnpm i18n:check` |
| `build` | `astro build` с продакшен-значениями `SITE_URL` и `BASE_PATH`, артефакт сборки |
| `e2e` | Playwright через `astro preview` (`webServer`) по адресам вида `http://localhost:4321/heart-atlas/ru/`: главная на `ru` и `en`, редирект с корня, переключение языка, тестовая RTL-локаль (сборка с `HA_TEST_LOCALES=1`), дисклеймер, axe без нарушений |
| `lighthouse` | Lighthouse CI через `astro preview` (`startServerCommand`), а не `staticDistDir`, иначе ассеты под `base` дают 404. Порог 90 по всем категориям на главной |

Node 24 (Active LTS), pnpm 10. Точная версия pnpm задаётся в `packageManager` (`pnpm@10.x.y`), Node в `engines` и `.nvmrc`. В CI `pnpm/action-setup` запускается без параметра `version`, иначе он конфликтует с `packageManager`.

### Деплой

Workflow `deploy.yml` на push в `main`:

- `permissions: pages: write, id-token: write`, окружение `github-pages`;
- шаги `actions/configure-pages`, сборка, `actions/upload-pages-artifact`, `actions/deploy-pages`.

Один ручной шаг владельца репозитория: Settings → Pages → Source: GitHub Actions. Без него деплой не заработает.

Превью на каждый PR добавим позже, если подключим Cloudflare Pages.

## Разбиение на PR

Каждый PR связан со своим issue. Перед мерджем: зелёный CI и независимое ревью ветки субагентом.

| PR | Содержание | Готово, когда |
|---|---|---|
| PR 1 | Эта спека (лицензии и README уже в `main`) | Спека согласована |
| PR 2 | Документы проекта, `README.md` + `README.ru.md`, шаблоны issue и PR, метки, `CLAUDE.md`, `.claude/settings.json` с ECC и ponytail, SessionStart-хук | Claude Code в репозитории видит оба плагина, хук не падает без `pnpm-lock.yaml` |
| PR 3 | Монорепо pnpm, Astro + React + `@astrojs/mdx` + TypeScript strict, ESLint, Prettier, stylelint, Vitest, `SITE_URL`/`BASE_PATH` | `pnpm dev` открывает пустую страницу, `pnpm lint` и `pnpm test` зелёные |
| PR 4 | Реестр языков с тестами, строки `ru`/`en`, маршруты по локалям, редирект с корня, переключатель языка, `i18n:check`, тестовая RTL-локаль под флагом, базовый макет, тёмная тема, дисклеймер в подвале | Сайт открывается на `/heart-atlas/ru/` и `/heart-atlas/en/`, сборка с `HA_TEST_LOCALES=1` проходит, без флага тестовой локали в сборке нет |
| PR 5 | Схема контента и политика источников, `trusted-sources.yaml`, плашка «врачом не проверено», фикстуры и тесты схемы | Тест на невалидной фикстуре ожидает ошибку валидации, `astro build` на настоящем `content/` зелёный |
| PR 6 | CI (`ci.yml`, `links.yml`), Playwright, axe, Lighthouse CI, `deploy.yml` на GitHub Pages | Владелец включил Pages из Actions, сайт открывается на `w3lld1.github.io/heart-atlas`, все джобы зелёные |

## Риски

- Плагины ECC и ponytail могут конфликтовать в инструкциях (ECC склонен к подробным планам, ponytail к минимализму). Если это мешает, переводим ponytail в режим `lite` через `"env": { "PONYTAIL_DEFAULT_MODE": "lite" }` в `.claude/settings.json`. Проверим на PR 3.
- ECC большой (сотни навыков). Если он заметно замедляет сессии, убираем `ecc@ecc` из `enabledPlugins` и описываем в `CONTRIBUTING.md` выборочную установку профилем через `npx ecc-universal install --profile ...`. Совмещать оба способа установки README ECC запрещает.
- GitHub Pages не даёт превью PR. Пока рецензентов нет, это не критично.

## Решено после обсуждения

1. Хостинг на старте: GitHub Pages (решение от 11.10.2026). Cloudflare Pages ради превью PR рассмотрим позже.
2. Свой домен откладываем, сайт живёт на `w3lld1.github.io/heart-atlas`.
