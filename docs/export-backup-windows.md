# Export, backup y empaquetado Windows

Guía rápida para probar Nexus-Edu en Windows (EDU-9 / EDU-11 / EDU-12).

## Estado

| Paso | Estado |
|------|--------|
| Build Windows (local o GitHub Actions) | OK |
| Canal de actualización in-app (EDU-22 / v1.1.0+) | Ver [actualizar-app-windows.md](actualizar-app-windows.md) |
| Instalación en PC Windows (prueba) | Hecha (1.0.0); pasar a 1.1.0 vía setup o Actualizar |
| Smoke funcional (abrir, alumnos, export, backup) | Pendiente en PC |

**Actualizaciones:** ver [actualizar-app-windows.md](actualizar-app-windows.md). Para **probar** el botón: instalar a mano [v1.1.0-beta.1](https://github.com/GyGSol/Nexus-Edu/releases/tag/v1.1.0-beta.1) y luego **Actualizar app** → estable [v1.1.0](https://github.com/GyGSol/Nexus-Edu/releases/latest).

La BD está en `%APPDATA%\nexus-edu\data\` y **no** se borra al actualizar.

## Build instalable (Windows)

```bash
pnpm install
pnpm dist:win
```

Funciona en Windows nativo o **cross-build desde Linux** (electron-builder + Wine para NSIS; verificado 2026-10-11).

Artefactos en `dist/`:

| Archivo | Uso |
|---------|-----|
| `nexus-edu-*-setup.exe` | Instalador NSIS (recomendado para la PC de prueba) |
| `nexus-edu-*-portable.exe` | Portable (sin instalar) |

Nota: `electron-builder.yml` usa `linux.desktop.entry` (schema v26).

Scripts cross-platform (sin `env -u`): `pnpm dev`, `pnpm start`, `pnpm test:e2e` vía `scripts/run-with-clean-env.mjs`.

Linux: `pnpm dist` / `pnpm dist:linux` → AppImage + deb.

## Export boletín (EDU-11)

Formato acordado para MVP:

1. **HTML imprimible** — ficha alumno → Exportar HTML / Imprimir boletín  
2. **Excel (.xlsx)** — ficha (un alumno) o listado Alumnos → Exportar grupo Excel  

Incluye dimensiones, nota agregada por área y frase final. **No** incluye domicilio/teléfono/DNI en el HTML.

## Backup / restore (EDU-12)

Sidebar:

- **Respaldar base** → guarda copia `.sqlite` (checkpoint WAL)
- **Restaurar base** → elige `.sqlite`, confirma y **reinicia** la app

Ruta local típica:

| SO | `userData` |
|----|------------|
| Linux | `~/.config/nexus-edu/data/nexus-edu.sqlite` |
| Windows | `%APPDATA%\nexus-edu\data\nexus-edu.sqlite` |

Ver también en app: IPC `getAppInfo().dbPath`.

## Tests

```bash
pnpm test:unit
pnpm build && pnpm test:e2e
```
