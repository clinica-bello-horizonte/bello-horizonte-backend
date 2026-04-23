---
name: Reporte de bug
about: Comportamiento incorrecto de un endpoint o la API
title: "BUG: "
labels: bug
assignees: ''
---

## Descripción del problema

## Endpoint afectado

`METHOD /api/v1/...`

## Cómo reproducirlo

```bash
curl -X POST http://localhost:3000/api/v1/... \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "campo": "valor" }'
```

## Respuesta actual

```json
{  }
```

## Respuesta esperada

```json
{  }
```
