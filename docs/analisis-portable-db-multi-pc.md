# Análisis: base de datos al cambiar de PC Windows (hogar ↔ colegio)

Fecha: 2026-10-12  
Fuentes: repo (`backup.ts`, `connection.ts`, `export-backup-windows.md`, `actualizar-app-windows.md`) + consulta NotebookLM (cuaderno Nexus-Educación) + [EDU-12](https://nexus-educacion.atlassian.net/browse/EDU-12) / [EDU-22](https://nexus-educacion.atlassian.net/browse/EDU-22).

## Decisión de producto (acordada 2026-10-12)

**Flujo canónico — puente USB entre escritorio y portable** (sin GitHub para datos):

```
Casa (NSIS)  --Enviar base-->  USB (portable.exe + data/)  --colegio-->  editar en portable
     ^                                                                    |
     +---------------- Traer base del USB --------------------------------+
```

| Paso | Dónde | Acción |
|------|--------|--------|
| 1 | Casa | App **instalada** + USB con `*-portable.exe` conectado |
| 2 | Escritorio | **Admin usuarios** + **Enviar base al USB** (carpeta-paquete: EXE + `data/` + LEEME; descarga EXE si falta) |
| 3 | Colegio | Abrir **portable** → **login obligatorio** → editar (sin auto-update del EXE) |
| 4 | Casa | **Traer base del USB** |
| 5 | UI | Badge **Instalada** vs **Portable** |

Reglas: sin merge (gana Enviar o Traer); sin `.sqlite` en GitHub; NSIS = **Actualizar app** (EDU-22); portable EXE se actualiza **solo desde escritorio en casa**; hash de contraseñas.

**Auth (decidido):** instalada = solo admin usuarios (**sin** login); portable = login obligatorio. Reset clave = editar en casa + Enviar USB. Ticket: [EDU-27](https://nexus-educacion.atlassian.net/browse/EDU-27).

## Problema

La docente quiere llevar Nexus-Edu en un pendrive con el portable de una PC Windows a otra, completar evaluaciones en el colegio y al volver **actualizar la base del escritorio**, viendo claro qué modo está usando.

## Qué hay hoy (hecho)

| Pieza | Estado | Qué resuelve | Qué no resuelve |
|-------|--------|--------------|-----------------|
| **EDU-12** Backup/restore | Finalizada | Sidebar → Respaldar / Restaurar `.sqlite` (con `wal_checkpoint(FULL)`) | Hay que exportar e importar a mano en cada viaje |
| **EDU-22** Actualizar app | Finalizada | Update in-app sin borrar SQLite **en la misma PC** | No mueve datos entre máquinas |
| Artefacto `*-portable.exe` | Se publica en Releases | Corre sin instalar | La BD **sigue en** `%APPDATA%\nexus-edu\data\` de **esa** PC |

Ruta real (instalada o portable actual):

`%APPDATA%\nexus-edu\data\nexus-edu.sqlite`

El ejecutable portable **no es portable de datos**: cada PC tiene su propia carpeta AppData.

## Hallazgo NotebookLM (2026-10-12)

Consulta grounded al cuaderno [Nexus-Educación](https://notebook.google.com/notebook/d3b34e36-c736-483b-89e4-0e57eb06e7dc).

**Coincide con el repo:**

- SQLite vive en `userData`, no junto al binario instalado.
- Copiar a mano con la app abierta + modo WAL puede perder escrituras recientes.
- Opción portable “de verdad”: redirigir `userData` a la carpeta del EXE vía `process.env.PORTABLE_EXECUTABLE_DIR` (variable que setea electron-builder en builds `portable`).
- No apuntar la BD viva a Drive/OneDrive (locks / sync parcial del `-wal` → corrupción).

**Desfasado en el cuaderno (corregir fuentes):** NotebookLM aún describe EDU-12 como “backlog futuro”. En Jira/repo ya está **Finalizada** (checkpoint + diálogos). Conviene re-subir `docs/export-backup-windows.md` y este análisis al cuaderno.

## Opciones comparadas

| # | Enfoque | Esfuerzo | UX docente | Riesgos | Veredicto |
|---|---------|----------|------------|---------|-----------|
| **A** | **Portable con `userData` junto al EXE** (`PORTABLE_EXECUTABLE_DIR` → `…/data`) | Bajo–medio | Pendrive = app + BD; abrir y listo | Eyectar USB con app abierta; wear del USB; updater in-app no es el canal (NSIS sí) | **Recomendado** para colegio |
| **B** | Flujo actual EDU-12 (Respaldar → USB → Restaurar) | Cero código | 2 clics por viaje + cuidado de no mezclar versiones | Olvidar backup; restaurar encima por error | OK como interim |
| **C** | Sync auto a carpeta USB al abrir/cerrar | Medio–alto | Casi invisible | Conflictos si 2 PCs editan sin unir; detectar letra de unidad | Solo si A no alcanza |
| **D** | Cloud (Drive/OneDrive) como BD viva | — | — | Corrupción + PII en nube | **Descartado** |
| **E** | Solo NSIS en casa + restore en colegio | Bajo (doc) | Frágil en PCs compartidas del aula | AppData de la PC del colegio queda con datos | Evitar si no es PC propia |

## Recomendación → decisión

Implementar el flujo USB acordado ([EDU-27](https://nexus-educacion.atlassian.net/browse/EDU-27)):

1. Portable: `PORTABLE_EXECUTABLE_DIR` → `data/` + **login gate**.
2. Escritorio: **Admin usuarios** + **Enviar** / **Traer** + **Actualizar portable en USB** (Releases → EXE, no toca `data/`).
3. UI: badge **Instalada** vs **Portable**.
4. NSIS = **Actualizar app** (EDU-22). Sin GitHub para datos de alumnos.

### Fuera de alcance

- Merge automático; auto-update del portable **en el colegio**; cloud sync.

## Historia Jira

**[EDU-27](https://nexus-educacion.atlassian.net/browse/EDU-27)** — Sync USB + login + admin users + actualizar EXE portable en casa · Por hacer · H20.

## Relación con tickets existentes

| Ticket | Relación |
|--------|----------|
| EDU-12 | Prerrequisito checkpoint/restore |
| EDU-22 | Update app solo NSIS |
| EDU-27 | Historia de este flujo |
| EDU-26 | Android pausado; no aplica |

---

## Foco: ¿actualizar la base del portable vía GitHub? (solo portable)

Consulta NotebookLM 2026-10-12: el cuaderno **no** documenta sync de `.sqlite` por GitHub; sí `electron-updater` + Releases. Regla de proyecto: **no** subir PII de alumnos a repos/servicios públicos.

Hay que separar dos “bases”:

| Qué | Significado | ¿GitHub ayuda? |
|-----|-------------|----------------|
| **Base de datos** (evaluaciones del docente) | Archivo `.sqlite` con alumnos/notas | Solo como *transporte* de backup (y con muchas restricciones) |
| **App / esquema** | Nuevo `.exe` + migraciones SQL locales | Sí: Releases ya publican el portable |

### Opción G1 — Sync del `.sqlite` por GitHub (datos del docente)

Ideas típicas: asset en Release, gist, o repo privado con token en la app.

| | |
|--|--|
| Flujo | En casa “Subir respaldo” → GitHub; en colegio “Bajar” → reemplaza BD local |
| Pros | Funciona con internet; no hace falta USB de datos |
| Contras | Repo **público** (GyGSol/Nexus-Edu) = **PII prohibida**. Haría falta repo/gist **privado** + auth en la app. Conflictos si se edita en 2 PCs sin merge. Colegio a menudo sin red fiable. |
| Veredicto | **No recomendado** como diseño principal. Solo spike si el cliente exige nube y acepta privado + cifrado. |

### Opción G2 — Actualizar el **EXE portable** desde GitHub Releases (sin tocar datos)

EDU-22 hoy está orientado a **NSIS** (`latest.yml` + `.blockmap` del setup). El portable ya se publica en el mismo Release, pero no es canal de auto-update.

| | |
|--|--|
| Flujo | Portable detecta versión nueva → descarga `*-portable.exe` → reemplazo al reiniciar (o aviso “descargá el nuevo portable”). La BD local **no se sube** a GitHub; las migraciones de esquema corren al abrir (`connection.ts`). |
| Pros | Alineado a Releases actuales; sin PII; “actualiza” esquema/features del portable |
| Contras | **No** mueve evaluaciones entre PCs. Self-replace del EXE en USB es frágil (archivo en uso). `electron-updater` no trata portable como NSIS. |
| Veredicto | **Viable** si el pedido es “que el portable se actualice solo desde GitHub” (app), no sync de notas. |

### Opción G3 — GitHub solo para **plantilla/seed** (sin notas reales)

Publicar en Releases un seed anonimizado o SQL de migración; el portable lo baja y aplica.

| | |
|--|--|
| Pros | Sin PII; útil para curso nuevo / reset |
| Contras | No lleva el trabajo del día a día entre casa y colegio |
| Veredicto | Complemento menor; no resuelve multi-PC |

### Opción G4 — Híbrido portable-datos + aviso GitHub

BD en carpeta del USB (`PORTABLE_EXECUTABLE_DIR`) + botón “Hay nuevo portable en GitHub” (descarga manual o asistida).

| | |
|--|--|
| Pros | Datos viajan en el stick; GitHub solo actualiza el binario |
| Contras | Hace falta internet solo para update de app |
| Veredicto | **Mejor encaje** si se quiere “portable + GitHub” sin mezclar PII en el repo |

### Conclusión GitHub-only

1. **No** usar GitHub Releases/repo público para sincronizar la base de evaluaciones.
2. Si “actualizar la base del portable con GitHub” = **actualizar la app portable** → G2 (o G4): canal portable en Releases + conservar SQLite local (idealmente junto al EXE).
3. Si = **llevar notas casa↔colegio por GitHub** → G1 es posible solo con almacenamiento **privado** + auth; costo/riesgo altos; peor que USB para aula offline.

NotebookLM: coincidente (sin diseño de `.sqlite` en Releases; PII local).
