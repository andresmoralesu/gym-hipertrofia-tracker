import type { Page, Route } from '@playwright/test';

/**
 * Doble del Google Apps Script desplegado.
 *
 * Los tests NUNCA llaman al Apps Script real ni a la API de Claude (costo, límite de
 * 10 generaciones/día, datos reales en tu Sheet). Este mock imita su contrato:
 *   - GET  ?action=obtenerHistorial                 → JSONP { success, registros }
 *   - GET  ?action=generarVariacionesConClaude ...  → JSONP { success, ejercicios }
 *   - POST (multipart, fecha/ejercicio/peso/...)    → agrega una fila a la "hoja"
 * Igual que el servidor real, solo responde JSONP si el callback pasa la validación.
 */
export interface SheetRow {
  fecha: string;
  ejercicio: string;
  peso: number;
  series: number;
  reps: number;
  notas: string;
}

export interface GetCall {
  action: string;
  params: Record<string, string>;
}

type Json = Record<string, unknown>;

const CALLBACK_SEGURO = /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/;

export class AppsScriptMock {
  /** Filas que la "hoja" recibió por POST (incluye duplicados, igual que la real). */
  sheet: SheetRow[] = [];
  getCalls: GetCall[] = [];
  postCount = 0;

  /** Respuesta de generarVariacionesConClaude; por defecto devuelve N ejercicios nuevos. */
  generar: (p: Record<string, string>) => Json = (p) => {
    const cantidad = JSON.parse(p.ejerciciosJSON).length;
    return {
      success: true,
      ejercicios: Array.from({ length: cantidad }, (_, i) => ({
        nombre: `Ejercicio IA ${i + 1}`,
        series: 3,
        reps: '10-12',
        descanso: 60,
        equipo: 'Mancuernas',
      })),
    };
  };
  generarDelayMs = 0;
  /** Si es true, el endpoint de historial falla a nivel de red (script onerror). */
  historialCaido = false;

  async install(page: Page) {
    await page.route(/^https:\/\/script\.google\.com\/macros\//, (route) => this.handle(route));
  }

  generarCalls() {
    return this.getCalls.filter((c) => c.action === 'generarVariacionesConClaude');
  }

  private async handle(route: Route) {
    const request = route.request();

    if (request.method() === 'POST') {
      this.postCount++;
      const f = parseMultipart(request.postData() ?? '');
      // Igual que doPost(): parseFloat en peso/series/reps ("8-10" → 8)
      this.sheet.push({
        fecha: f.fecha ?? '',
        ejercicio: f.ejercicio ?? '',
        peso: parseFloat(f.peso) || 0,
        series: parseFloat(f.series) || 0,
        reps: parseFloat(f.reps) || 0,
        notas: f.notas ?? '',
      });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    }

    const url = new URL(request.url());
    const params = Object.fromEntries(url.searchParams.entries());
    const action = params.action ?? '';
    this.getCalls.push({ action, params });

    let payload: Json;
    if (action === 'obtenerHistorial') {
      if (this.historialCaido) return route.abort('failed');
      payload = { success: true, registros: this.sheet };
    } else if (action === 'generarVariacionesConClaude') {
      if (this.generarDelayMs) await new Promise((r) => setTimeout(r, this.generarDelayMs));
      payload = this.generar(params);
    } else {
      payload = { success: false, error: 'Acción no reconocida' };
    }

    const cb = params.callback;
    if (cb && CALLBACK_SEGURO.test(cb)) {
      return route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: `${cb}(${JSON.stringify(payload)});`,
      });
    }
    // Sin callback válido el servidor real responde JSON plano → el <script> fallaría.
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  }
}

function parseMultipart(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const re = /name="([^"]+)"\r?\n\r?\n([\s\S]*?)\r?\n--/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) fields[m[1]] = m[2];
  return fields;
}
