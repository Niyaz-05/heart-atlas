# Heart Atlas

[Русская версия](README.ru.md)

An open-source interactive web app about the heart and heart disease: 3D anatomy, a live cardiac cycle with a synchronized ECG and heart sounds, and articles on heart conditions in "normal / disease" mode. Every article cites verified sources. Free, runs in the browser, and built so any language can be added.

> **Status:** stage 0 (foundation). Nothing to try yet. See the [stage 0 spec](docs/plans/2026-10-11-stage-0-foundation.md).
>
> Heart Atlas is an educational resource. It does not replace a consultation with a doctor. See [DISCLAIMER.md](DISCLAIMER.md).

## What it will include

- A 3D heart model: chambers, valves, great vessels, coronary arteries, conduction system.
- A "heart clock": one cardiac-cycle timer drives the 3D animation, ECG trace and heart sounds. A disease is a set of parameters applied to that cycle.
- Articles at two levels, for patients and for students, each linked to the structures it describes.
- Russian and English first; any other language can be added with one registry entry and a strings file.

## Medical content

Articles are not yet reviewed by physicians. Until reviewers join, articles about diseases, diagnostics and treatment cite at least two sources, at least one of them a clinical guideline (ESC, AHA/ACC, NICE, the Russian Ministry of Health, WHO). Other sources are peer-reviewed papers with a DOI, textbooks with an ISBN, or trusted references such as StatPearls. Every article is labelled "not reviewed by a physician". Found a mistake? [Report it](https://github.com/w3lld1/heart-atlas/issues/new?template=content-error.yml).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Physicians, medical students, translators and developers are all welcome.

## License

- Code: [MIT](LICENSE)
- Content, 3D models and other assets: [CC BY-SA 4.0](LICENSE-CONTENT)
