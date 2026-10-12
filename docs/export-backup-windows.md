# Export, backup y empaquetado Windows

Guía rápida para probar Nexus-Edu en Windows (EDU-9 / EDU-11 / EDU-12).

## Estado (2026-10-12)

| Paso | Estado |
|------|--------|
| Build Windows (GitHub Actions / tag `v*`) | OK — release debe incluir `*-setup.exe.blockmap` |
| Canal actualización in-app (EDU-22 / EDU-25) | **OK** — ver [actualizar-app-windows.md](actualizar-app-windows.md) |
| Smoke Win: beta → Actualizar → 1.1.0 | **OK** — BD conservada |
| Smoke Win: 1.1.0 → Actualizar → 1.1.1 | **OK** — BD conservada; icono nuevo (EDU-25) |
| Instalación en PC Windows | En **1.1.1** tras update |

La BD está en `%APPDATA%\nexus-edu\data\` y **no** se borra al actualizar (validado en smoke).

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
