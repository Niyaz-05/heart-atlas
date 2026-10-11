# Этап 3. Проверенные источники для статей о болезнях

Статус: черновик на согласование · 11.10.2026 · issue #10

## Зачем

В MVP нет врачей-рецензентов, поэтому доверие к статьям строится на источниках (спека этапа 0, раздел «Политика источников»). Эта спека заранее собирает актуальные клинические рекомендации по шести болезням MVP, чтобы авторы статей этапа 3 брали источники из проверенного списка, а не искали их заново.

Шесть болезней из плана MVP:

1. Ишемическая болезнь сердца и инфаркт миокарда
2. Фибрилляция предсердий
3. Сердечная недостаточность
4. Артериальная гипертензия
5. Аортальный стеноз
6. Дефект межпредсердной перегородки

## Что входит

- `content/trusted-sources.yaml` в формате спеки этапа 0: список организаций без изменений. Новые организации не понадобились. Если PR 5 этапа 0 приходит раньше, этот файл из PR убираем.
- Таблицы источников по болезням (ниже). Для каждой болезни есть рекомендации ESC, AHA/ACC, NICE, Минздрава РФ и глава StatPearls.
- Список устаревших документов, которые нельзя цитировать.

Сами статьи и Zod-схема в этот PR не входят.

## Как проверяли

- Все DOI открыты через Crossref (`api.crossref.org/works/<DOI>`): совпали название, журнал, год, том и страницы. Если Crossref не даёт страниц, в таблице стоят только том и выпуск.
- NICE: страницы `/resources` и PDF рекомендаций, оттуда даты публикации и последнего обновления.
- Минздрав РФ: `cr.minzdrav.gov.ru` отдаёт страницу только через JavaScript. Номер версии сверяли через API рубрикатора (`apicr.minzdrav.gov.ru`) и зеркала (pravo.ppt.ru, medvestnik.ru, base.garant.ru). DOI взят из публикации тех же рекомендаций в «Российском кардиологическом журнале» и проверен через Crossref. Поле «год утверждения» в API ненадёжно: в нём часто стоит 2016 год даже у новых версий.
- StatPearls: страница главы на NCBI Bookshelf. NCBI часто показывает проверку reCAPTCHA. Где страница не открылась, это отмечено.
- Актуальность: проверены списки рекомендаций ESC (включая выпуск конгресса ESC 2026) и ACC/AHA на 11.10.2026.

В `sources_checked` статьи ставится дата, когда автор сам открыл каждую ссылку, а не дата этой спеки.

## Источники по болезням

Колонка `org` содержит id из `content/trusted-sources.yaml`. Колонка `tier` показывает, как источник записывается в frontmatter статьи.

### 1. ИБС и инфаркт миокарда

| org | tier | Документ | DOI / ссылка | Проверено |
|---|---|---|---|---|
| esc | guideline | 2024 ESC Guidelines for the management of chronic coronary syndromes | [10.1093/eurheartj/ehae177](https://doi.org/10.1093/eurheartj/ehae177) | Crossref: Eur Heart J 45(36):3415–3537 |
| esc | guideline | 2023 ESC Guidelines for the management of acute coronary syndromes | [10.1093/eurheartj/ehad191](https://doi.org/10.1093/eurheartj/ehad191) | Crossref: Eur Heart J 44(38):3720–3826 |
| aha-acc | guideline | 2023 AHA/ACC/ACCP/ASPC/NLA/PCNA Guideline for the Management of Patients With Chronic Coronary Disease | [10.1161/CIR.0000000000001168](https://doi.org/10.1161/CIR.0000000000001168) | Crossref: Circulation 148(9), 2023 |
| aha-acc | guideline | 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes | [10.1161/CIR.0000000000001309](https://doi.org/10.1161/CIR.0000000000001309) | Crossref: Circulation 151(13), 2025 |
| nice | guideline | Acute coronary syndromes (NG185) | [nice.org.uk/guidance/ng185](https://www.nice.org.uk/guidance/ng185) | Опубликовано 18.11.2020 |
| nice | guideline | Stable angina: management (CG126) | [nice.org.uk/guidance/cg126](https://www.nice.org.uk/guidance/cg126) | 2011, обновлено 25.08.2016 |
| minzdrav-rf | guideline | Стабильная ишемическая болезнь сердца, 2024 (ID 155_2) | [cr.minzdrav.gov.ru/view-cr/155_2](https://cr.minzdrav.gov.ru/view-cr/155_2), DOI [10.15829/1560-4071-2024-6110](https://doi.org/10.15829/1560-4071-2024-6110) | API рубрикатора; Crossref: Рос кардиол журн 29(9):6110 |
| minzdrav-rf | guideline | Острый коронарный синдром без подъёма сегмента ST электрокардиограммы, 2024 (ID 154_4) | [cr.minzdrav.gov.ru/view-cr/154_4](https://cr.minzdrav.gov.ru/view-cr/154_4), DOI [10.15829/1560-4071-2025-6319](https://doi.org/10.15829/1560-4071-2025-6319) | API рубрикатора; Crossref: Рос кардиол журн 30(5):6319 |
| minzdrav-rf | guideline | Острый инфаркт миокарда с подъёмом сегмента ST электрокардиограммы, 2024 (ID 157_5) | [cr.minzdrav.gov.ru/view-cr/157_5](https://cr.minzdrav.gov.ru/view-cr/157_5), DOI [10.15829/1560-4071-2025-6306](https://doi.org/10.15829/1560-4071-2025-6306) | API рубрикатора; Crossref: Рос кардиол журн 30(3):6306 |
| statpearls | reference | Coronary Artery Disease | [NBK564304](https://www.ncbi.nlm.nih.gov/books/NBK564304/) | Обновлено 09.10.2024 |
| statpearls | reference | Acute Coronary Syndrome | [NBK459157](https://www.ncbi.nlm.nih.gov/books/NBK459157/) | Обновлено 05.07.2026 |

Дополнительно:

- Fifth Universal Definition of Myocardial Infarction (ESC/ACC/AHA/WHF, 2026), DOI [10.1093/eurheartj/ehag101](https://doi.org/10.1093/eurheartj/ehag101). Это согласительный документ об определении инфаркта, а не рекомендации по лечению. В статье записывается как `tier: review` с DOI. Том и страницы ещё не присвоены.
- 2021 AHA/ACC Guideline for the Evaluation and Diagnosis of Chest Pain, DOI [10.1161/CIR.0000000000001029](https://doi.org/10.1161/CIR.0000000000001029). Пригодится для раздела о диагностике.
- NICE CG126 старый (последний пересмотр 2016), поэтому для стабильной ИБС опираемся на ESC 2024 и Минздрав 2024.

### 2. Фибрилляция предсердий

| org | tier | Документ | DOI / ссылка | Проверено |
|---|---|---|---|---|
| esc | guideline | 2024 ESC Guidelines for the management of atrial fibrillation developed in collaboration with EACTS | [10.1093/eurheartj/ehae176](https://doi.org/10.1093/eurheartj/ehae176) | Crossref: Eur Heart J 45(36):3314–3414 |
| aha-acc | guideline | 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation | [10.1161/CIR.0000000000001193](https://doi.org/10.1161/CIR.0000000000001193) | Crossref: Circulation 149(1), 2024 |
| nice | guideline | Atrial fibrillation: diagnosis and management (NG196) | [nice.org.uk/guidance/ng196](https://www.nice.org.uk/guidance/ng196) | 27.04.2021, обновлено 30.06.2021 |
| minzdrav-rf | guideline | Фибрилляция и трепетание предсердий, 2025 (ID 382_2) | [cr.minzdrav.gov.ru/view-cr/382_2](https://cr.minzdrav.gov.ru/view-cr/382_2), DOI [10.15829/1560-4071-2025-6668](https://doi.org/10.15829/1560-4071-2025-6668) | API рубрикатора; Crossref: Рос кардиол журн 30(11):6668 |
| statpearls | reference | Atrial Fibrillation | [PubMed 30252328](https://pubmed.ncbi.nlm.nih.gov/30252328/) | Глава найдена в PubMed (Gopal S, Goyal A, Ahmed I). Страница NCBI Bookshelf не открылась, номер NBK не подтверждён |

### 3. Сердечная недостаточность

| org | tier | Документ | DOI / ссылка | Проверено |
|---|---|---|---|---|
| esc | guideline | 2026 ESC Guidelines for the management of heart failure | [10.1093/eurheartj/ehag100](https://doi.org/10.1093/eurheartj/ehag100) | Crossref: опубликовано онлайн 28.08.2026, том и страницы ещё не присвоены |
| aha-acc | guideline | 2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure | [10.1161/CIR.0000000000001063](https://doi.org/10.1161/CIR.0000000000001063) | Crossref: Circulation 145(18), 2022 |
| nice | guideline | Chronic heart failure in adults: diagnosis and management (NG106) | [nice.org.uk/guidance/ng106](https://www.nice.org.uk/guidance/ng106) | 2018, обновлено 03.09.2025 |
| nice | guideline | Acute heart failure: diagnosis and management (CG187) | [nice.org.uk/guidance/cg187](https://www.nice.org.uk/guidance/cg187) | 2014, обновлено 17.11.2021 |
| minzdrav-rf | guideline | Хроническая сердечная недостаточность, 2024 (ID 156) | DOI [10.15829/1560-4071-2024-6162](https://doi.org/10.15829/1560-4071-2024-6162) | Crossref: Рос кардиол журн 29(11):6162. Номер версии в рубрикаторе не подтверждён |
| statpearls | reference | Heart Failure (Congestive Heart Failure) | [NBK430873](https://www.ncbi.nlm.nih.gov/books/NBK430873/) | Обновлено 26.02.2025 |

Заметки:

- ESC 2026 заменяет рекомендации ESC 2021 и их обновление 2023 года. Острую сердечную недостаточность ESC 2026 называет «декомпенсированной».
- Отдельных рекомендаций Минздрава по острой сердечной недостаточности у взрослых нет. Для этого раздела опираемся на ESC 2026 и NICE CG187.

### 4. Артериальная гипертензия

| org | tier | Документ | DOI / ссылка | Проверено |
|---|---|---|---|---|
| esc | guideline | 2024 ESC Guidelines for the management of elevated blood pressure and hypertension | [10.1093/eurheartj/ehae178](https://doi.org/10.1093/eurheartj/ehae178) | Crossref: Eur Heart J 45(38):3912–4018 |
| aha-acc | guideline | 2025 AHA/ACC/AANP/AAPA/ABC/ACCP/ACPM/AGS/AMA/ASPC/NMA/PCNA/SGIM Guideline for the Prevention, Detection, Evaluation and Management of High Blood Pressure in Adults | [10.1161/CIR.0000000000001356](https://doi.org/10.1161/CIR.0000000000001356) | Crossref: Circulation 152(11), 2025 |
| nice | guideline | Hypertension in adults: diagnosis and management (NG136) | [nice.org.uk/guidance/ng136](https://www.nice.org.uk/guidance/ng136) | 2019, обновлено 21.11.2023 |
| minzdrav-rf | guideline | Артериальная гипертензия у взрослых, 2024 (ID 62_3) | [cr.minzdrav.gov.ru/preview-cr/62_3](https://cr.minzdrav.gov.ru/preview-cr/62_3), DOI [10.15829/1560-4071-2024-6117](https://doi.org/10.15829/1560-4071-2024-6117) | API рубрикатора; Crossref: Рос кардиол журн 29(9):6117 |
| statpearls | reference | Essential Hypertension | [NBK539859](https://www.ncbi.nlm.nih.gov/books/NBK539859/) | Обновлено 20.07.2023 |

Заметки:

- Рекомендации AHA/ACC 2025 опубликованы сразу в трёх журналах (Circulation, Hypertension, JACC). Цитируем один вариант, Circulation.
- Глава StatPearls обновлена в 2023 году, раньше ESC 2024 и AHA/ACC 2025. Пороги давления и цели лечения берём только из рекомендаций.
- Рекомендации ESH 2023 изданы Европейским обществом гипертензии, а не ESC. Организации ESH нет в `trusted-sources.yaml`, и пока она не нужна.

### 5. Аортальный стеноз

| org | tier | Документ | DOI / ссылка | Проверено |
|---|---|---|---|---|
| esc | guideline | 2025 ESC/EACTS Guidelines for the management of valvular heart disease | [10.1093/eurheartj/ehaf194](https://doi.org/10.1093/eurheartj/ehaf194) | Crossref: Eur Heart J 46(44):4635–4736 |
| aha-acc | guideline | 2020 ACC/AHA Guideline for the Management of Patients With Valvular Heart Disease | [10.1161/CIR.0000000000000923](https://doi.org/10.1161/CIR.0000000000000923) | Crossref: Circulation 143(5), 2021 |
| nice | guideline | Heart valve disease presenting in adults: investigation and management (NG208) | [nice.org.uk/guidance/ng208](https://www.nice.org.uk/guidance/ng208) | PDF, опубликовано 17.11.2021 |
| minzdrav-rf | guideline | Аортальный стеноз, 2025 (ID 37_2) | [cr.minzdrav.gov.ru/preview-cr/37_2](https://cr.minzdrav.gov.ru/preview-cr/37_2) | Через зеркала medvestnik.ru и pravo.ppt.ru. Публикации с DOI нет |
| statpearls | reference | Aortic Stenosis | [NBK557628](https://www.ncbi.nlm.nih.gov/books/NBK557628/) | Через снимок страницы, обновлено 16.04.2023. Живая страница NCBI не открылась |

Заметки:

- NICE пересматривает в NG208 рекомендации по TAVI (проект GID-NG10457, срок не объявлен). Перед публикацией статьи проверить, не вышло ли обновление.
- Для рекомендаций Минздрава по аортальному стенозу DOI нет, и придумывать его нельзя. В frontmatter указывается только `url`.

### 6. Дефект межпредсердной перегородки

| org | tier | Документ | DOI / ссылка | Проверено |
|---|---|---|---|---|
| esc | guideline | 2020 ESC Guidelines for the management of adult congenital heart disease | [10.1093/eurheartj/ehaa554](https://doi.org/10.1093/eurheartj/ehaa554) | Crossref: Eur Heart J 42(6):563–645 |
| aha-acc | guideline | 2025 ACC/AHA/HRS/ISACHD/SCAI Guideline for the Management of Adults With Congenital Heart Disease | [10.1161/CIR.0000000000001402](https://doi.org/10.1161/CIR.0000000000001402) | Crossref: Circulation 153(8), 2026 |
| minzdrav-rf | guideline | Дефект межпредсердной перегородки, 2023 (ID 46_2, взрослые и дети) | [cr.minzdrav.gov.ru/preview-cr/46_2](https://cr.minzdrav.gov.ru/preview-cr/46_2), DOI [10.15829/1560-4071-2023-5588](https://doi.org/10.15829/1560-4071-2023-5588) | Crossref: Рос кардиол журн 28(8):5588; ID через base.garant.ru и medvestnik.ru |
| statpearls | reference | Atrial Septal Defect | [NBK535440](https://www.ncbi.nlm.nih.gov/books/NBK535440/) | Обновлено 21.01.2025 (снимок страницы и statpearls.com совпадают) |

Заметки:

- У NICE нет клинических рекомендаций по ДМПП. Есть только руководство по процедуре «Endovascular closure of atrial septal defect» ([HTG58](https://www.nice.org.uk/guidance/htg58), бывшее IPG96, 2004). Оно не считается клинической рекомендацией, поэтому его можно цитировать только как дополнительный источник.
- ESC и AHA/ACC описывают взрослых. Детский раздел статьи опирается на рекомендации Минздрава, которые охватывают и детей.
- Срок пересмотра рекомендаций Минздрава (2025) прошёл, новая версия не найдена. Перед публикацией проверить рубрикатор.

## Устаревшие документы

Эти документы заменены, в статьях их не цитируем:

- ESC: CCS 2019, NSTE-ACS 2020, STEMI 2017, AF 2020, HF 2021 и обновление HF 2023, ESC/ESH 2018 по гипертензии, VHD 2021 и 2017, Fourth Universal Definition of MI 2018.
- ACC/AHA: STEMI 2013, NSTE-ACS 2014, SIHD 2012 и обновление 2014, AF 2014 и обновление 2019, High Blood Pressure 2017, ACHD 2018.
- NICE: CG180 (AF), CG167, CG172, CG94 (заменены NG185), CG108 и CG5 (ХСН), CG127 (гипертензия), IPG96 (теперь HTG58).
- Минздрав: версии 2020 года по стабильной ИБС, ОКС без подъёма ST, инфаркту с подъёмом ST, ФП, ХСН и АГ; версии 155_1 и 382_1; «Аортальный стеноз» 2016 года.

## Что не удалось подтвердить

- StatPearls «Atrial Fibrillation»: номер NBK и дата обновления. NCBI показал reCAPTCHA.
- StatPearls «Aortic Stenosis»: дата обновления на живой странице.
- Минздрав «Хроническая сердечная недостаточность» 2024: номер версии в рубрикаторе. API под ID 156_2 возвращает текст 2016 года.
- Точные даты утверждения рекомендаций Минздрава по АГ 2024 и ФП 2025.
- Страницы в Circulation для ряда рекомендаций AHA/ACC и том ESC HF 2026: Crossref их не содержит. Цитируем по DOI.

Автор статьи открывает такие ссылки сам перед публикацией и только после этого ставит `sources_checked`.

## Пример frontmatter

```yaml
sources:
  - tier: guideline
    org: esc
    title: 2024 ESC Guidelines for the management of atrial fibrillation
    year: 2024
    doi: 10.1093/eurheartj/ehae176
    url: https://doi.org/10.1093/eurheartj/ehae176
  - tier: guideline
    org: minzdrav-rf
    title: Фибрилляция и трепетание предсердий
    year: 2025
    doi: 10.15829/1560-4071-2025-6668
    url: https://cr.minzdrav.gov.ru/view-cr/382_2
sources_checked: 2026-10-11
review: null
```

## Что дальше

- Рекомендации Минздрава по стабильной ИБС, ОКС без подъёма ST, ХСН и АГ должны пересматриваться не позже 2026 года. Перед публикацией каждой статьи проверить, не вышла ли новая версия.
- Когда у ESC HF 2026 и Fifth UDMI появятся том и страницы, дополнить таблицы.
