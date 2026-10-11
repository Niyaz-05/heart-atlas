# Этап 2, PR 3. Часы сердца двигают 3D-модель

Статус: черновик · 11.10.2026 · issue #73
План MVP: этап 2 «Часы сердца», PR 3. Опирается на спеку часов сердца ([2026-10-11-stage-2-heart-clock.md](2026-10-11-stage-2-heart-clock.md)), спеку модели ([2026-10-11-stage-1-heart-model.md](2026-10-11-stage-1-heart-model.md)) и пресеты ([2026-10-11-stage-3-presets.md](2026-10-11-stage-3-presets.md)).

## Цель

3D-модель сердца показывает, что происходит в текущий момент цикла: какой участок проводящей системы возбуждён, какие камеры сокращаются, какие клапаны открыты. Источник времени один: те же часы, от которых работают ЭКГ, тоны и диаграмма Виггерса. Пресет болезни меняет картинку сам: при фибрилляции предсердий нет сокращения предсердий и нет вспышки синусового узла.

## Что входит

- Чистая функция `cycleState(clock, t)` в `packages/heart-clock`.
- Событие окна `heart-atlas:cycle` и модуль без зависимостей `@heart-atlas/heart-clock/cycle-event` с константой и типом.
- Остров часов отправляет событие при смене состояния.
- На странице `/<locale>/heart-clock/` под монитором появляется 3D-вьюер (загрузка по кнопке).

## Что не входит

- Деформация сеток (сжатие камер, движение створок). У модели нет морф-таргетов; первая версия только подсвечивает.
- Слой подсветки в `packages/viewer`: его делает тред «3D-модель сердца» отдельным PR. Договорённость о порядке: выделение и изоляция пользователя важнее слоя цикла, слой цикла важнее базового материала. Вьюер рендерит по требованию (`frameloop="demand"`) и вызывает `invalidate()` на каждое событие.
- Отдельные признаки болезней на модели (зона инфаркта, гипертрофия). Это следующий шаг после этого PR.

## Состояние цикла

```ts
interface CycleDetail {
  phase: Phase;
  /** Участки проводящей системы, по которым сейчас идёт возбуждение. */
  excited: string[];
  /** Камеры, которые сейчас сокращаются. */
  contracting: string[];
  /** Открытые клапаны. */
  open: string[];
}
```

Идентификаторы берутся из `assets/models/heart/structures.yaml`. Отрезки задаются только моментами удара из `BeatTiming` (`pDuration`, `qOnset`, `jPoint`, начала фаз), новых чисел нет.

| Поле | Структуры | Когда | Основание |
|---|---|---|---|
| excited | `sa-node` | зубец P: от начала удара до `pDuration`, только при `pAmplitude > 0` | StatPearls ECG: P «represents atrial depolarization». Что возбуждение предсердий начинается в синусовом узле, это схема модели |
| excited | `av-node` | от конца P до `qOnset` | StatPearls ECG: интервал PR «includes the delay at the AV node» |
| excited | `bundle-of-his`, `right-bundle-branch`, `left-bundle-branch`, `purkinje-fibers` | комплекс QRS: от `qOnset` до `jPoint` | StatPearls ECG: QRS «represents ventricular depolarization». Распределение по участкам внутри QRS не показываем: все четыре горят вместе (допущение модели) |
| contracting | `right-atrium`, `left-atrium` | фаза `atrial-systole`, только при `atrialContribution > 0` | StatPearls Cardiac Cycle (источник 2 спеки часов), фазы цикла. При ФП вклад предсердий 0 (пресет) |
| contracting | `right-ventricle`, `left-ventricle` | фазы `isovolumic-contraction` и `ejection` | то же |
| open | `mitral-valve`, `tricuspid-valve` | фазы `filling` и `atrial-systole` | то же: в изоволюмические фазы все клапаны закрыты |
| open | `aortic-valve`, `pulmonary-valve` | фаза `ejection` | то же |

Часы считают только левое сердце. Правые камеры и клапаны идут с тем же временем, что и левые: это допущение модели, на странице оно покрыто общей пометкой «схема, а не физиологическая модель».

Цитаты StatPearls ECG ([statpearls.com/point-of-care/20969](https://www.statpearls.com/point-of-care/20969)) проверены WebFetch 11.10.2026: «It represents atrial depolarization on the ECG», «includes the delay at the AV node», «It represents ventricular depolarization».

## Событие

- Имя `heart-atlas:cycle`, `detail` типа `CycleDetail` или `null` (часы остановлены или убраны со страницы, слой нужно очистить).
- Модуль `packages/heart-clock/src/cycle-event.ts` экспортируется как `@heart-atlas/heart-clock/cycle-event`. В нём `CYCLE_EVENT`, `CycleDetail`, `dispatchCycle(detail)` и `isCycleEvent(event)`. Модуль ничего не импортирует, кроме типа `Phase`, так что вьюер берёт константу без кода часов.
- Остров часов вычисляет состояние в каждом кадре и отправляет событие, только когда оно изменилось: не больше восьми раз за удар (по числу границ отрезков в таблице). На паузе состояние замирает и не отправляется повторно. При размонтировании острова уходит `null`.
- Если на странице несколько часов, слушатели получают события от всех. На страницах MVP часы одни; это ограничение записано в JSDoc.
- `prefers-reduced-motion`: часы и так стартуют на паузе; вьюер при reduced motion показывает состояние без вспышек (это его слой).

## Страница часов сердца

Под монитором секция с h2 «Модель сердца» (`heartClock.model3d`) и `HeartViewer` с `loadOn="click"` и `headingLevel={3}`, чтобы three.js не грузился без запроса и Lighthouse не просел. Данные вьюера берутся так же, как на странице анатомии (`heartModelUrls`, `heartStructures`, `viewerMessages`). Пока слоя во вьюере нет, модель просто показывается; после PR треда «3D-модель сердца» она начинает двигаться без изменений на странице.

## Тесты

- Юнит: `cycleState` по фазам нормального удара; ФП без `sa-node` и без сокращения предсердий; состояние меняется не больше восьми раз за удар; `isCycleEvent` отбрасывает чужой `detail`.
- e2e: на странице часов слушатель на `heart-atlas:cycle` за 3 секунды игры видит и `ejection` с открытым `aortic-valve`, и `filling` с открытым `mitral-valve`; кнопка загрузки 3D есть, three.js без нажатия не загружается; axe без нарушений.

## PR

Один PR: функция, событие, отправка из острова, вьюер на странице, строки en/ru и тестовой RTL-локали, тесты.
