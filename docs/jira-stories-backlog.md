# Backlog Jira EDU — Nexus-Edu

Historias de producto para el board [EDU](https://nexus-educacion.atlassian.net/jira/software/projects/EDU/boards/1).  
Crear en Jira como **Story** (o **Task** si Story no existe). Cada descripción incluye bloque `## AGNT`.

Estado de creación en Jira: ver sección **Claves creadas** al final (se completa tras MCP).

### Cierre AGNT 2026-10-11 (sync board)

**Finalizada (23):** EDU-3 (obsoleta), EDU-4…EDU-25 — incluye MVP, NotebookLM, frases/dimensiones, bugs (EDU-21/23), UX alumnos (EDU-24), auto-update (EDU-22), icono+banner+1.1.1 (EDU-25). **RESPUESTA AGNT** = id **10004**.

**Windows:** EDU-9 instalador + **EDU-22** / **EDU-25** auto-update validado (→ 1.1.0 / → 1.1.1, BD conservada; Release debe incluir `.blockmap`). Ver `docs/actualizar-app-windows.md`.

**Abiertas:** EDU-1 (ancla producto) + **EDU-2 En curso intencional** = runbook vivo Cursor ↔ Jira. Cola **Lista AGNT** vacía.

**Cierre 2026-10-12:** **EDU-25** Finalizada — icono C, banner update, smoke Win 1.1.0→1.1.1 (blockmap obligatorio en Release).

**EDU-26 (2026-10-12):** spike/PoC Android **pausado por cliente** → **Por hacer**. Docs: `viabilidad-android-apk.md`, `poc-capacitor-android.md`. WIP branch `poc/capacitor-android` (no merge).

**Limpieza opcional:** borrar EDU-3 en UI.

---

## EDU-SETUP — Configurar estados AGNT y workflow Cursor

**Tipo:** Task  
**Labels:** `agnt`, `setup`

### Descripción humana

Alinear workflow AGNT: disparo **Lista AGNT** (10002), respuesta **RESPUESTA AGNT** (10004), skills/docs con JQL correcto, MCP `atlassian-nexus-edu`.

Criterios (cumplidos 2026-10-11):

- Skills usan `status = "Lista AGNT"`
- Estado **RESPUESTA AGNT** en board (id 10004) + columna visible
- Doc `docs/jira-workflow-edu.md` con IDs reales

```markdown
## AGNT
schema: agnt-v1
OBJ: estados AGNT operativos en EDU
CTX: team-managed; Lista AGNT=10002; RESPUESTA AGNT=10004; Por hacer=10000; En curso=10001; Finalizada=10003
EVOL: columna RESPUESTA AGNT creada en UI; docs/skills/IDs actualizados
ACT:
- agente smoke transition + Finalizada EDU-4
DEPS: —
NEXT: ciclo AGNT operativo (Lista → Resultado → RESPUESTA → Finalizada)
SIG: setup-ok
PUERTA: repo:no
```

---

## H1 — Dashboard de métricas de evaluación

**Tipo:** Story  
**Labels:** `mvp`, `dashboard`

### Descripción humana

Como docente, quiero ver en el dashboard resumenes de calificaciones (distribución D/AV/AL/EP/NO, PPI, totales) para orientar el seguimiento del grupo 1°C.

Criterios:

- Métricas desde SQLite local
- Escala D > AV > AL > EP > NO (D = mejor)
- UI paleta Tierra

```markdown
## AGNT
schema: agnt-v1
OBJ: dashboard metricas grupo
CTX: DashboardPage + MetricCard; SQLite
EVOL: MVP Electron ya tiene dashboard base
ACT:
- validar metricas vs seed
- completar gaps UX si faltan
DEPS: ok
NEXT: En curso o Finalizada si MVP ok
SIG: feature-existente
PUERTA: repo:pendiente-aprobacion
```

---

## H2 — Gestión de alumnos y seed desde Excel

**Tipo:** Story  
**Labels:** `mvp`, `alumnos`, `seed`

### Descripción humana

Como docente, quiero listar, crear y editar alumnos cargados desde la planilla Excel de 1°C, persistidos en SQLite embebida.

Criterios:

- Seed desde `resources/planilla_base__datos_alumnos.xlsx`
- CRUD listado + formulario
- Sin filtrar PII a Jira/docs públicos

```markdown
## AGNT
schema: agnt-v1
OBJ: CRUD alumnos + seed Excel
CTX: StudentsPage, StudentFormPage, excel-parser, seed
EVOL: seed ~32 alumnos en MVP
ACT:
- smoke CRUD
- documentar path userData SQLite
DEPS: ok
NEXT: Finalizada si smoke ok
SIG: feature-existente
PUERTA: repo:pendiente-aprobacion
```

---

## H3 — Evaluación cualitativa por área y bimestre

**Tipo:** Story  
**Labels:** `mvp`, `evaluacion`

### Descripción humana

Como docente, quiero registrar calificaciones por área (Quehaceres, Convivencia, Lengua, Matemática, etc.) y bimestre, con escala D/AV/AL/EP/NO y marcas de detalle.

Criterios:

- Áreas canónicas del dominio
- Grade + detailMarks por assessment
- Validación Zod / RHF

```markdown
## AGNT
schema: agnt-v1
OBJ: assessments por area/bimestre
CTX: shared/types GRADES AREAS; StudentForm
EVOL: modelo Assessment en SQLite
ACT:
- verificar persistencia IPC
- e2e flujo carga nota
DEPS: ok
NEXT: En curso
SIG: feature-existente
PUERTA: repo:pendiente-aprobacion
```

---

## H4 — Flag PPI (Proyecto Pedagógico Individual)

**Tipo:** Story  
**Labels:** `mvp`, `ppi`

### Descripción humana

Como docente, quiero marcar alumnos con PPI (adaptaciones por CUD), default No, y verlo reflejado en listados/métricas.

Criterios:

- Campo boolean `ppi` default false
- Visible en formulario y métricas

```markdown
## AGNT
schema: agnt-v1
OBJ: PPI default false visible
CTX: Student.ppi; MetricCard
EVOL: MVP implementado
ACT:
- confirmar default y filtros
DEPS: ok
NEXT: Finalizada si ok
SIG: feature-existente
PUERTA: repo:pendiente-aprobacion
```

---

## H5 — Empaquetado instalable Linux

**Tipo:** Story  
**Labels:** `release`, `electron-builder`

### Descripción humana

Como usuario, quiero instalar Nexus-Edu en Linux (AppImage/deb) generado con electron-builder.

Criterios:

- `pnpm dist` produce artefactos en `dist/`
- Scripts sin `ELECTRON_RUN_AS_NODE` residual

```markdown
## AGNT
schema: agnt-v1
OBJ: build Linux instalable
CTX: electron-builder.yml; scripts dist
EVOL: pipeline local existe
ACT:
- verificar dist en CI o local
DEPS: ok
NEXT: En curso
SIG: release
PUERTA: repo:pendiente-aprobacion
```

---

## H6 — Tests Vitest + Playwright

**Tipo:** Story  
**Labels:** `qa`, `tests`

### Descripción humana

Como equipo, quiero cobertura unitaria (escala, parsers) y e2e del dashboard/alumnos para no regresionar el MVP.

Criterios:

- `pnpm test:unit` y `pnpm test:e2e` verdes
- Specs bajo `e2e/` y `*.test.ts`

```markdown
## AGNT
schema: agnt-v1
OBJ: suite unit+e2e verde
CTX: vitest, playwright, grades.test, excel-parser.test
EVOL: base de tests en repo
ACT:
- ampliar e2e criticos si faltan
DEPS: ok
NEXT: En curso
SIG: qa
PUERTA: repo:pendiente-aprobacion
```

---

## H7 — Exportación de boletines / reportes

**Tipo:** Story  
**Labels:** `next`, `export`

### Descripción humana

Como docente, quiero exportar un resumen imprimible o archivo (PDF/Excel) del boletín por alumno o grupo.

Criterios:

- Formato acordado (definir)
- Sin PII en tickets de diseño; datos solo en app local

```markdown
## AGNT
schema: agnt-v1
OBJ: export boletin
CTX: no implementado en MVP
EVOL: backlog futuro
ACT:
- definir formato con docente
- puerta de codigo tras aprobacion
DEPS: faltante:formato-export
NEXT: Lista para AGNT cuando haya formato
SIG: futuro
PUERTA: repo:pendiente-aprobacion
```

---

## H8 — Backup y restauración de SQLite

**Tipo:** Story  
**Labels:** `next`, `datos`

### Descripción humana

Como docente, quiero respaldar y restaurar la base local SQLite para no perder evaluaciones.

Criterios:

- Acción export/import del archivo DB en userData
- Documentar ruta en README

```markdown
## AGNT
schema: agnt-v1
OBJ: backup/restore SQLite
CTX: better-sqlite3 userData
EVOL: backlog futuro
ACT:
- disenar UX copia de archivo
DEPS: faltante:ux-backup
NEXT: Lista para AGNT
SIG: futuro
PUERTA: repo:pendiente-aprobacion
```

---

## H9 — Conectar Cursor IA con NotebookLM

**Tipo:** Story  
**Labels:** `agnt`, `notebooklm`, `cursor`, `docs`  
**Clave:** [EDU-13](https://nexus-educacion.atlassian.net/browse/EDU-13)

### Descripción humana

Como equipo de desarrollo, quiero que Cursor IA consulte y sincronice documentación del proyecto vía el cuaderno NotebookLM **Nexus-Educación**, para usar una fuente grounded exclusiva de Nexus-Edu.

Criterios:

- MCP `notebooklm-nexus-edu` + auth aislada (perfil `nexus-edu`)
- Config `.notebooklm/config.json` → cuaderno `d3b34e36-c736-483b-89e4-0e57eb06e7dc`
- Skills/docs: `notebooklm-nexus-edu`, `nlm-skill`, `docs/notebooklm.md`
- Sync `.md` del avance; consultas grounded; sin PII/secretos

```markdown
## AGNT
schema: agnt-v1
OBJ: Cursor↔NotebookLM operativo solo para Nexus-Edu
CTX: MCP notebooklm-nexus-edu; nlm; cuaderno d3b34e36-…; perfil nexus-edu
EVOL: conexion+sync+informe en repo; ticket EDU-13 creado
ACT:
- verificar MCP habilitado en Cursor Settings
- smoke notebook_query
DEPS: ok-auth; opcional:MCP-UI
NEXT: Finalizada tras smoke
SIG: tooling-docs
PUERTA: repo:no
```

---

## H10 — Catálogo de frases finales (hoja Excel FRASE FINAL)

**Tipo:** Story  
**Labels:** `mvp`, `frases`, `seed`  
**Clave:** [EDU-14](https://nexus-educacion.atlassian.net/browse/EDU-14)

### Descripción humana

Como docente/equipo, quiero importar el catálogo de frases finales desde la hoja Excel **FRASE FINAL** para resolver los códigos usados en cada bimestre.

Criterios:

- Parsear hoja `FRASE FINAL` (pares código/texto)
- Tabla SQLite `phrase_catalog` + seed/`importFromExcel`
- Tests unitarios del parser (sin PII)

```markdown
## AGNT
schema: agnt-v1
OBJ: importar catalogo frases finales desde Excel
CTX: excel-parser + schema + seed; hoja FRASE FINAL
EVOL: phrase_code ya se guarda por bimestre; falta catalogo
ACT:
- parsear hoja FRASE FINAL
- tabla phrase_catalog + seed
- tests unitarios parser catalogo
DEPS: ok
NEXT: Lista AGNT o En curso tras aprobacion
SIG: seed-frases
PUERTA: repo:pendiente-aprobacion
```

---

## H11 — Frase final por alumno (join + UI)

**Tipo:** Story  
**Labels:** `mvp`, `frases`, `ui`  
**Clave:** [EDU-15](https://nexus-educacion.atlassian.net/browse/EDU-15)  
**Bloqueada por:** EDU-14

### Descripción humana

Como docente, quiero ver la frase final de cada alumno por bimestre, resolviendo `phrase_code` contra el catálogo.

Criterios:

- Join código → texto; IPC/tipos con texto legible
- UI en listado y ficha/formulario por bimestre
- Componente de la valoración final (H12)

```markdown
## AGNT
schema: agnt-v1
OBJ: join+UI frase final por alumno/bimestre
CTX: final_phrases + phrase_catalog + StudentsPage/StudentFormPage
EVOL: catalogo EDU-14; frase como pieza de valoracion final
ACT:
- resolver phraseText en repo/IPC
- UI listado + formulario por bimestre
DEPS: EDU-14
NEXT: Lista AGNT tras EDU-14
SIG: ui-frases
PUERTA: repo:pendiente-aprobacion
```

---

## H12 — Valoración final por bimestre

**Tipo:** Story  
**Labels:** `mvp`, `frases`, `valoracion`, `ui`  
**Clave:** [EDU-16](https://nexus-educacion.atlassian.net/browse/EDU-16)  
**Bloqueada por:** EDU-14, EDU-15 · **Relacionada:** EDU-7

### Descripción humana

Como docente, quiero ver/editar la valoración final del bimestre: valoraciones por área + frase final.

Criterios:

- Composición (sin promedio): `assessments` + frase resuelta
- Regla de cierre: áreas completas → frase obligatoria; indicador `completa`/`incompleta`
- Seed parcial no falla; validación al editar/guardar
- Export boletín sigue en EDU-11

```markdown
## AGNT
schema: agnt-v1
OBJ: valoracion-final bimestre + regla cierre
CTX: assessments + frase + StudentForm Zod; EDU-7
EVOL: frases EDU-14/15 + valoraciones existentes
ACT:
- bloque UI Valoracion final por bimestre
- validar frase si areas completas
- indicador completa/incompleta
DEPS: EDU-14 EDU-15; EDU-7
NEXT: Lista AGNT tras EDU-14/15
SIG: valoracion-final
PUERTA: repo:pendiente-aprobacion
```

---

## H15 — Nota agregada por área desde dimensiones

**Tipo:** Story  
**Labels:** `mvp`, `evaluacion`, `dimensiones`, `valoracion`  
**Clave:** [EDU-17](https://nexus-educacion.atlassian.net/browse/EDU-17)  
**Relacionada:** EDU-16, H13, H14  
**Estado:** Finalizada (validado en app 2026-10-11)

### Descripción humana

Como docente, quiero ver y editar la **nota agregada por concepto/área** del bimestre a partir del trabajo con dimensiones, sin que el sistema imponga un promedio.

Criterios:

- Sugerencia por área (moda de dimensiones escala D/AV/AL/EP/NO; excl. PPI/`NC`; empate → más baja), no vinculante
- Selector editable D/AV/AL/EP/NO; persistir `dimension_key = ''`
- Seed Excel: conservar `NOTA`; no pisar salvo “Aplicar sugerencia”
- Cierre valoración final sigue siendo 30 dims + frase (EDU-16)
- Tests + doc `valoracion-dimensiones.md` (regla NotebookLM/REDE: juicio docente, sin promedio)

**Estado repo (2026-10-11):** implementado y validado en Electron (`pnpm dev`).

```markdown
## AGNT
schema: agnt-v1
OBJ: nota agregada por area desde dimensiones; sugerencia moda + override docente
CTX: phrase-grade suggestedAreaGrade/aggregatedAreaGrade; StudentFormPage; valoracion-dimensiones.md
EVOL: implementado + validado en app; Finalizada
ACT:
- ok
DEPS: ok
NEXT: —
SIG: nota-agregada-dimensiones
PUERTA: repo:si-aprobado
```

---

## H14 — Import Excel: notas por dimensión (NO → NC)

**Tipo:** Story  
**Labels:** `mvp`, `evaluacion`, `dimensiones`, `seed`, `excel`  
**Relacionada:** H13  
**Clave:** [EDU-20](https://nexus-educacion.atlassian.net/browse/EDU-20)  
**Estado:** Finalizada (2026-10-11)

### Descripción humana

Como docente/equipo, quiero que el import del Excel cargue las **notas por dimensión** desde las cadenas de detalle (`AV - AL - …`), mapeando el token **`NO`** a **No corresponde a la clasificación del bimestre** (`NC`), no a “No alcanzó los objetivos”.

Criterios:

- `NO` en cadena de detalle → `NC`
- Expandir a `dimension_key` (Quehaceres, Convivencia, Lengua, Matemática, Conoc. del Mundo)
- Tutoría / T. Literario → Extraprogramáticas
- PPI default `PPI_NO` al importar materias con fila PPI
- Tests unitarios + reimport `replace`

```markdown
## AGNT
schema: agnt-v1
OBJ: import Excel dimensiones; NO-en-cadena→NC
CTX: excel-parser parseDimensionDetailChain; seed importExcel
EVOL: EDU-20 Finalizada; NO→NC + match tokens (fix PPI sin dims); PPI alumno se conserva
ACT:
- ninguno (cerrado)
DEPS: EDU-19
NEXT: done
SIG: excel-dimensiones-nc;Finalizada
PUERTA: repo:si-aprobado
```

**Estado repo (2026-10-11):** implementado; clave EDU-20 Finalizada.

---

## H13 — Dimensiones de valoración por concepto/materia

**Tipo:** Story  
**Labels:** `mvp`, `evaluacion`, `dimensiones`, `ui`  
**Clave:** [EDU-19](https://nexus-educacion.atlassian.net/browse/EDU-19)  
**Relacionada:** EDU-7, EDU-16  
**Estado:** Finalizada (2026-10-11)

### Descripción humana

Como docente, quiero cargar la valoración del alumno por **dimensiones** dentro de cada concepto/materia (como en el sistema origen), con un selector de pautas por ítem.

Conceptos:

- Trabajo en el aula / Quehaceres del/a estudiante (5 dimensiones)
- Convivencia / Convivencia (5)
- Lengua / Lengua (PPI + 5)
- Matemática / Matemática (PPI + 5)
- Conocimiento del Mundo / Conocimiento del mundo (PPI + 5)
- ÁREAS EXTRAPROGRAMÁTICAS / Tutorías (Tutoría; Taller Literario y Dramatización)

Selector por ítem (en orden): Destacado, Avanzado, Alcanzado, En Proceso, No alcanzó los objetivos, No corresponde a la clasificación del bimestre, PPI - NO, PPI - SI.

Criterios:

- Catálogo canónico en `src/shared/dimensiones.ts`
- Persistencia por `(alumno, bimestre, área, dimension_key)`
- UI en ficha Alumno con bloques Concepto → tabla Dimensiones / Pautas
- Cierre de valoración final exige todas las dimensiones del catálogo
- Doc: `docs/valoracion-dimensiones.md`

**Estado repo (2026-10-11):** implementado y validado; clave EDU-19 Finalizada.

```markdown
## AGNT
schema: agnt-v1
OBJ: valoracion por dimensiones talcual captura origen
CTX: dimensiones.ts; Assessment.dimensionKey; StudentFormPage; ASSESSMENT_MARKS
EVOL: EDU-19 Finalizada; UI+modelo+migración OK
ACT:
- ninguno (cerrado)
DEPS: EDU-7; EDU-20 import
NEXT: done
SIG: dimensiones-ui;Finalizada
PUERTA: repo:si-aprobado
```

---

## H16 — Sugerir frase final + CRUD catálogo/asignación

**Tipo:** Story  
**Labels:** `frases`, `valoracion`, `ui`  
**Clave:** [EDU-18](https://nexus-educacion.atlassian.net/browse/EDU-18)  
**Relacionada:** EDU-14, EDU-15, EDU-16, EDU-17  
**Estado:** Finalizada (validado 2026-10-11)

### Descripción humana

Como docente, quiero un botón **Sugerir frase final** (reglas locales; solo área **General**) y CRUD del catálogo y de la asignación por alumno/bimestre. Sin LLM en runtime; NotebookLM para ampliar el banco (92–141).

Criterios (entregados):

- Botón Sugerir / Otra / Aplicar / Limpiar; top-5; **solo General** (materias en select manual)
- Asignación CRUD + regla de cierre; catálogo CRUD en `/frases`
- Heurística + tests; catálogo 128 frases (`phrase-catalog-extra.ts` 92–141)
- Docs: [frase-catalog-combinaciones-generales.md](frase-catalog-combinaciones-generales.md)

```markdown
## AGNT
schema: agnt-v1
OBJ: boton sugerir frase final (General) + CRUD catalogo y asignacion
CTX: suggestFinalPhrase solo General; PhraseCatalogPage /frases; extra 92-141
EVOL: validado Electron; Finalizada
ACT:
- —
DEPS: ok
NEXT: cerrado
SIG: sugerir-frase-crud
PUERTA: repo:si-aprobado
```

---

## H17 — Actualizar app desde el menú (GitHub Releases)

**Tipo:** Story  
**Labels:** `release`, `windows`, `electron-updater`  
**Clave:** [EDU-22](https://nexus-educacion.atlassian.net/browse/EDU-22)  
**Estado:** Finalizada (smoke Win 2026-10-11: BD conservada)

### Descripción humana

Como docente en Windows, quiero actualizar Nexus-Edu desde el sidebar sin reinstalar a mano y sin perder evaluaciones; la app descarga la release publicada en GitHub.

Criterios (entregados y validados):

- Acción **Actualizar app** en sidebar (`AppShell.tsx`)
- Canal: GitHub Releases [GyGSol/Nexus-Edu](https://github.com/GyGSol/Nexus-Edu) + `electron-updater` + workflow tag `v*`
- Smoke: beta `1.1.0-beta.1` → Actualizar → `1.1.0`; SQLite en `userData` intacta
- Instructivo: [actualizar-app-windows.md](actualizar-app-windows.md)

```markdown
## AGNT
schema: agnt-v1
OBJ: menu Actualizar via electron-updater + GitHub Releases; preservar SQLite userData
CTX: repo GyGSol/Nexus-Edu; NSIS; AppShell; updater.ts; workflow gh release create
EVOL: smoke Win OK 2026-10-11; BD conservada; EDU-22 Finalizada
ACT:
- ninguno (cerrado)
DEPS: ok
NEXT: done
SIG: release;windows;electron-updater;Finalizada
PUERTA: repo:si-aprobado
```

---

## H18 — Icono Windows + aviso de versión + release 1.1.1

**Tipo:** Story  
**Labels:** `ui`, `release`, `windows`, `polish`  
**Clave:** [EDU-25](https://nexus-educacion.atlassian.net/browse/EDU-25)  
**Relacionada:** EDU-22, EDU-24, EDU-9  
**Estado:** Finalizada (smoke Win OK 2026-10-12)

### Descripción humana

Como docente, quiero un icono de escritorio acorde a evaluación, ver la versión instalada y enterarme si hay update, y poder pasar de **1.1.0** a **1.1.1** sin perder datos.

Criterios (entregados y validados):

- Icono C en `build/icon.ico` / PNG
- Sidebar `vX.Y.Z`; cartel **Nueva versión disponible** al arrancar
- Release `v1.1.1` con **`.blockmap`** (sin blockmap el update Win falla)
- Smoke Win OK: 1.1.0 → Actualizar → 1.1.1; BD intacta
- Docs: `actualizar-app-windows.md`, `export-backup-windows.md`

```markdown
## AGNT
schema: agnt-v1
OBJ: icono Win C + banner update + release 1.1.1
CTX: AppShell; build/icon.ico; workflow blockmap; electron-updater
EVOL: smoke Win OK 2026-10-12; blockmap fix bea93d2; Finalizada
ACT:
- ninguno (cerrado)
DEPS: ok
NEXT: done
SIG: icon-C;update-banner;blockmap;Finalizada
PUERTA: repo:si-aprobado
```

---

## H19 — Viabilidad Android .apk

**Tipo:** Story  
**Labels:** `spike`, `android`, `mobile`, `plataforma`  
**Clave:** [EDU-26](https://nexus-educacion.atlassian.net/browse/EDU-26)  
**Estado:** Por hacer — **pausado por cliente** (2026-10-12); no implementar

### Descripción humana

Determinar si es viable llevar Nexus-Edu (Electron desktop) a un Android `.apk`, con qué enfoque y con qué bloqueantes del stack actual. Spike de investigación (no implementación APK).

Criterios:

- Doc corto de viabilidad en `docs/`
- Resumen + fuentes NotebookLM en comentario Jira
- Decisión: no viable | viable con rewrite parcial | viable con wrapper | aplazar

```markdown
## AGNT
schema: agnt-v1
OBJ: spike Android APK — pausado por cliente
CTX: docs viabilidad+PoC; WIP branch poc/capacitor-android
EVOL: 2026-10-12 cliente corta; Por hacer; no implementar
ACT:
- ninguno hasta reactivación explícita
DEPS: decisión cliente
NEXT: Por hacer
SIG: pausa-cliente
PUERTA: repo:no
```

---

## H20 — Sync USB + login portable + admin users + actualizar EXE portable

**Tipo:** Story  
**Labels:** `datos`, `windows`, `portable`, `usb`, `auth`  
**Clave:** [EDU-27](https://nexus-educacion.atlassian.net/browse/EDU-27)  
**Estado:** RESPUESTA AGNT — implementado en repo; falta smoke Win  
**Relacionada:** EDU-12, EDU-22

### Descripción humana

Como docente, quiero sync USB escritorio↔portable, **admin usuarios** en instalada, **login** en portable, y en casa **actualizar el EXE portable del USB** desde GitHub sin perder `data/`.

Criterios:

- Portable: BD junto al EXE + **login obligatorio** (sin auto-update en colegio)
- Escritorio: CRUD usuarios (**sin** login) + **Enviar** / **Traer** + **Actualizar portable en USB**
- Reset clave: instalada → Enviar USB
- UI: badge `Instalada` vs `Portable`
- Doc; sin `.sqlite` en GitHub; hash de contraseñas

```markdown
## AGNT
schema: agnt-v1
OBJ: sync USB; login portable; admin users instalada; update EXE portable desde casa; badge
CTX: PORTABLE_EXECUTABLE_DIR; WAL; EDU-12; users+hash; Releases *-portable.exe
EVOL: Lista AGNT→Plan+Puerta; RESPUESTA AGNT
TIPO: feature
PLAN: data+login; Enviar/Traer; CRUD users; download portable→USB; badge; doc
ACT:
- esperar aprobación Puerta de código
DEPS: ok
NEXT: RESPUESTA AGNT — aprobar o repreguntar
SIG: hogar-colegio-usb-auth-portable-update
PUERTA: repo:pendiente-aprobacion
```

---

## Claves creadas

Board: https://nexus-educacion.atlassian.net/jira/software/projects/EDU/boards/1  
Creado 2026-10-11 vía MCP OAuth `atlassian-nexus-edu` (`gonzalomlopolito@gmail.com`).

| ID local | Clave Jira | Enlace |
|----------|------------|--------|
| EDU-SETUP | EDU-4 | https://nexus-educacion.atlassian.net/browse/EDU-4 · Finalizada |
| H1 | EDU-5 | https://nexus-educacion.atlassian.net/browse/EDU-5 · Finalizada |
| H2 | EDU-6 | https://nexus-educacion.atlassian.net/browse/EDU-6 · Finalizada |
| H3 | EDU-7 | https://nexus-educacion.atlassian.net/browse/EDU-7 · Finalizada |
| H4 | EDU-8 | https://nexus-educacion.atlassian.net/browse/EDU-8 · Finalizada |
| H5 | EDU-9 | https://nexus-educacion.atlassian.net/browse/EDU-9 · Finalizada |
| H6 | EDU-10 | https://nexus-educacion.atlassian.net/browse/EDU-10 · Finalizada |
| H7 | EDU-11 | https://nexus-educacion.atlassian.net/browse/EDU-11 · Finalizada |
| H8 | EDU-12 | https://nexus-educacion.atlassian.net/browse/EDU-12 · Finalizada |
| H9 | EDU-13 | https://nexus-educacion.atlassian.net/browse/EDU-13 · Finalizada |
| H10 | EDU-14 | https://nexus-educacion.atlassian.net/browse/EDU-14 · Finalizada |
| H11 | EDU-15 | https://nexus-educacion.atlassian.net/browse/EDU-15 · Finalizada |
| H12 | EDU-16 | https://nexus-educacion.atlassian.net/browse/EDU-16 · Finalizada |
| H13 | EDU-19 | https://nexus-educacion.atlassian.net/browse/EDU-19 · Finalizada |
| H14 | EDU-20 | https://nexus-educacion.atlassian.net/browse/EDU-20 · Finalizada |
| H15 | EDU-17 | https://nexus-educacion.atlassian.net/browse/EDU-17 · Finalizada |
| H16 | EDU-18 | https://nexus-educacion.atlassian.net/browse/EDU-18 · Finalizada |
| H17 | EDU-22 | https://nexus-educacion.atlassian.net/browse/EDU-22 · Finalizada |
| bug frase | EDU-21 | https://nexus-educacion.atlassian.net/browse/EDU-21 · Finalizada |
| bug bimestre | EDU-23 | https://nexus-educacion.atlassian.net/browse/EDU-23 · Finalizada |
| UX alumnos | EDU-24 | https://nexus-educacion.atlassian.net/browse/EDU-24 · Finalizada |
| H18 | EDU-25 | https://nexus-educacion.atlassian.net/browse/EDU-25 · Finalizada |
| H19 | EDU-26 | https://nexus-educacion.atlassian.net/browse/EDU-26 · Por hacer (pausado cliente) |
| H20 | EDU-27 | https://nexus-educacion.atlassian.net/browse/EDU-27 · RESPUESTA AGNT (puerta) |

Anclas del board:

| Clave | Rol |
|-------|-----|
| [EDU-1](https://nexus-educacion.atlassian.net/browse/EDU-1) | Historia principal (En curso — ancla producto) |
| [EDU-2](https://nexus-educacion.atlassian.net/browse/EDU-2) | Runbook vivo Cursor ↔ Jira (**En curso** intencional; no cerrar) |
| EDU-3 | [OBSOLETO] Finalizada — borrar en UI si molesta |
