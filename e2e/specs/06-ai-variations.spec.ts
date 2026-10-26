import { test, expect } from '../fixtures/test';
import { idb } from '../support/idb';
import { FECHAS, variacion } from '../support/data';

/**
 * Generación de variaciones con IA. El Apps Script/Claude están simulados (AppsScriptMock):
 * se verifica el CONTRATO (qué envía la app) y qué hace la app con la respuesta.
 */
test.describe('Variaciones con IA', () => {
  test('envía el enfoque, la semana y los ejercicios actuales al Apps Script', async ({ app, appsScript }) => {
    await app.open();
    await app.goTo('settings');

    await app.settings.generateButton.click();
    await app.expectDialog(/Variación generada/);

    const [llamada] = appsScript.generarCalls();
    expect(llamada.params.foco).toBe('Espalda/Bíceps');
    expect(llamada.params.semanaActual).toBe('3');
    const enviados = JSON.parse(llamada.params.ejerciciosJSON);
    const actuales = variacion('viernes', 3).ejercicios;
    expect(enviados).toHaveLength(actuales.length);
    expect(enviados[0]).toEqual({
      nombre: actuales[0].nombre, series: actuales[0].series, reps: actuales[0].reps, equipo: actuales[0].equipo,
    });
  });

  test('el nombre del callback JSONP cumple la validación del servidor (/^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/)', async ({ app, appsScript }) => {
    await app.open();
    await app.goTo('settings');

    await app.settings.generateButton.click();
    await app.expectDialog(/Variación generada/);

    expect(appsScript.generarCalls()[0].params.callback).toMatch(/^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/);
  });

  test('guarda la variación de la SEMANA SIGUIENTE (viernes, variación 4) y no toca la actual', async ({ app, page }) => {
    await app.open();
    await app.goTo('settings');

    await app.settings.generateButton.click();

    await app.expectDialog(/semana 4 \(viernes, variación 4\)/);
    await app.expectDialog(/• Ejercicio IA 1 \(3x10-12\)/);

    const nueva = await idb.get(page, 'variaciones', ['viernes', 4]);
    expect(nueva).toMatchObject({
      diaId: 'viernes',
      numeroVariacion: 4,
      nombre: 'Espalda/Bíceps - Variación 4 (IA)',
      generadaConIA: true,
      semanaGenerada: 4,
    });
    expect(nueva.ejercicios).toHaveLength(8);
    expect(nueva.ejercicios[0]).toEqual({
      id: 'viernes_var4_1', nombre: 'Ejercicio IA 1', series: 3, reps: '10-12', descanso: 60, equipo: 'Mancuernas',
    });

    const actual = await idb.get(page, 'variaciones', ['viernes', 3]);
    expect(actual.generadaConIA).toBeUndefined();
    expect(actual.ejercicios.map((e: any) => e.nombre)).toEqual(variacion('viernes', 3).ejercicios.map((e) => e.nombre));
  });

  test('mientras genera, el botón se deshabilita y luego se restablece', async ({ app, appsScript }) => {
    appsScript.generarDelayMs = 800;
    await app.open();
    await app.goTo('settings');

    await app.settings.generateButton.click();

    await expect(app.settings.generateButton).toBeDisabled();
    await expect(app.settings.generateButton).toHaveText('⏳ Generando con IA...');
    await app.expectDialog(/Variación generada/);
    await expect(app.settings.generateButton).toBeEnabled();
    await expect(app.settings.generateButton).toHaveText('🤖 Generar Variaciones (IA)');
  });

  test('si el servidor rechaza (límite de uso), muestra el error y no guarda nada', async ({ app, page, appsScript }) => {
    appsScript.generar = () => ({ success: false, error: 'Espera 60 segundos entre generaciones' });
    await app.open();
    await app.goTo('settings');

    await app.settings.generateButton.click();

    await app.expectDialog(/Error: Espera 60 segundos entre generaciones/);
    expect((await idb.get(page, 'variaciones', ['viernes', 4])).generadaConIA).toBeUndefined();
    await expect(app.settings.generateButton).toBeEnabled();
  });

  test('si Claude no devuelve ejercicios, avisa y no sobrescribe la variación', async ({ app, page, appsScript }) => {
    appsScript.generar = () => ({ success: true, ejercicios: [] });
    await app.open();
    await app.goTo('settings');

    await app.settings.generateButton.click();

    await app.expectDialog(/no devolvió ejercicios/);
    expect((await idb.get(page, 'variaciones', ['viernes', 4])).generadaConIA).toBeUndefined();
  });

  test('normaliza datos incompletos de la IA (series y reps por defecto)', async ({ app, page, appsScript }) => {
    appsScript.generar = () => ({ success: true, ejercicios: [{ nombre: 'Solo nombre' }] });
    await app.open();
    await app.goTo('settings');

    await app.settings.generateButton.click();
    await app.expectDialog(/Variación generada/);

    const nueva = await idb.get(page, 'variaciones', ['viernes', 4]);
    expect(nueva.ejercicios).toEqual([
      { id: 'viernes_var4_1', nombre: 'Solo nombre', series: 3, reps: '8-10', descanso: 60, equipo: '' },
    ]);
  });

  test('la variación generada se usa cuando llega esa semana (Home la muestra)', async ({ app, page }) => {
    await app.open();
    await app.goTo('settings');
    await app.settings.generateButton.click();
    await app.expectDialog(/Variación generada/);

    // Pasa una semana: viernes 20-nov (semana 4) → su rutina es la variación 4
    await page.clock.setSystemTime(new Date('2026-11-20T10:00:00-05:00'));
    await app.reload();

    await expect(app.home.week).toHaveText('Semana 4');
    await expect(app.home.exerciseName(0)).toHaveText('Ejercicio IA 1');
  });
});

test.describe('Variaciones con IA: el ciclo da la vuelta (semana 5 → variación 1)', () => {
  test.use({ ahora: new Date('2026-11-27T10:00:00-05:00') }); // viernes, semana 5 → variación 5

  test('desde la variación 5 genera la variación 1', async ({ app, page, appsScript }) => {
    await app.open();
    await app.goTo('settings');

    await app.settings.generateButton.click();

    await app.expectDialog(/semana 6 \(viernes, variación 1\)/);
    expect(appsScript.generarCalls()[0].params.semanaActual).toBe('5');
    const nueva = await idb.get(page, 'variaciones', ['viernes', 1]);
    expect(nueva).toMatchObject({ generadaConIA: true, semanaGenerada: 6 });
  });
});

/** Cada día usa su propio enfoque muscular (y los días de descanso, el del siguiente entrenamiento). */
const POR_DIA = [
  { nombre: 'lunes (descanso → martes)',      fecha: FECHAS.lunes,     dia: 'martes',    foco: 'Pierna' },
  { nombre: 'martes',                         fecha: FECHAS.martes,    dia: 'martes',    foco: 'Pierna' },
  { nombre: 'miércoles',                      fecha: FECHAS.miercoles, dia: 'miercoles', foco: 'Pecho/Tríceps/Hombro' },
  { nombre: 'jueves (descanso → viernes)',    fecha: FECHAS.jueves,    dia: 'viernes',   foco: 'Espalda/Bíceps' },
] as const;

for (const c of POR_DIA) {
  test.describe(`Variaciones con IA: ${c.nombre}`, () => {
    test.use({ ahora: c.fecha });

    test(`envía el enfoque "${c.foco}" y guarda la variación 4 de ${c.dia}`, async ({ app, page, appsScript }) => {
      await app.open();
      await app.goTo('settings');

      await app.settings.generateButton.click();
      await app.expectDialog(new RegExp(`${c.dia}, variación 4`));

      expect(appsScript.generarCalls()[0].params.foco).toBe(c.foco);
      expect(await idb.get(page, 'variaciones', [c.dia, 4])).toMatchObject({
        generadaConIA: true,
        nombre: `${c.foco} - Variación 4 (IA)`,
      });
    });
  });
}
