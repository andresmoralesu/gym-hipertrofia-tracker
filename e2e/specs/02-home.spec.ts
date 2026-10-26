import { test, expect } from '../fixtures/test';
import { idb } from '../support/idb';
import { FECHAS, variacion } from '../support/data';

test.describe('Home: variación del día', () => {
  test('muestra fecha, semana del programa y los ejercicios de la rutina de hoy (viernes 13-nov, semana 3 → Espalda/Bíceps, variación 3)', async ({ app }) => {
    await app.open();

    await expect(app.home.dateLabel).toHaveText('Viernes, 13 de Nov');
    await expect(app.home.week).toHaveText('Semana 3');

    const esperados = variacion('viernes', 3).ejercicios;
    await expect(app.home.exercises).toHaveCount(esperados.length);
    for (const [i, ej] of esperados.entries()) {
      await expect(app.home.exerciseName(i)).toHaveText(ej.nombre);
      await expect(app.home.exerciseDetails(i)).toHaveText(`${ej.series} × ${ej.reps} reps • ${ej.descanso}s descanso`);
    }
  });

  test('todos los ejercicios precargados tienen 3 series', async ({ app }) => {
    await app.open();

    const n = await app.home.exercises.count();
    for (let i = 0; i < n; i++) {
      await expect(app.home.exerciseDetails(i)).toContainText('3 ×');
    }
  });

  test('"Comenzar Entrenamiento" abre Workout con el primer ejercicio en serie 1', async ({ app }) => {
    await app.open();
    const primero = variacion('viernes', 3).ejercicios[0];

    await app.startWorkout();

    await expect(app.screen('workout')).toHaveClass(/active/);
    await expect(app.workout.currentExercise).toHaveText(primero.nombre);
    await expect(app.workout.counter).toHaveText(`1 / ${primero.series}`);
  });

  test('el badge muestra el grupo muscular y el día de la rutina (viernes → "Espalda/Bíceps • Viernes")', async ({ app }) => {
    await app.open();

    await expect(app.home.badge).toHaveText('Espalda/Bíceps • Viernes');
  });
});

/**
 * Qué rutina ofrece la app según el día de la semana (hora de Bogotá, 10:00).
 * Un día de entrenamiento (martes, miércoles, viernes) muestra SU rutina todo el día;
 * los días de descanso muestran la siguiente. Semana 3 del programa = lun 9 → dom 15 nov 2026;
 * variación = ((semana-1) % 5) + 1.
 */
const CASOS = [
  { nombre: 'lunes (descanso)',    fecha: FECHAS.lunes,     dia: 'martes',    semana: 3, variacion: 3 },
  { nombre: 'martes',              fecha: FECHAS.martes,    dia: 'martes',    semana: 3, variacion: 3 },
  { nombre: 'miércoles',           fecha: FECHAS.miercoles, dia: 'miercoles', semana: 3, variacion: 3 },
  { nombre: 'jueves (descanso)',   fecha: FECHAS.jueves,    dia: 'viernes',   semana: 3, variacion: 3 },
  { nombre: 'viernes',             fecha: FECHAS.viernes,   dia: 'viernes',   semana: 3, variacion: 3 },
  { nombre: 'sábado (descanso)',   fecha: FECHAS.sabado,    dia: 'martes',    semana: 4, variacion: 4 },
  { nombre: 'domingo (descanso)',  fecha: FECHAS.domingo,   dia: 'martes',    semana: 4, variacion: 4 },
] as const;

for (const c of CASOS) {
  test.describe(`Home en ${c.nombre}`, () => {
    test.use({ ahora: c.fecha });

    test(`ofrece ${c.dia}, semana ${c.semana}, variación ${c.variacion}`, async ({ app, page }) => {
      await app.open();

      const config = (await idb.get(page, 'config', 'variacionActual')).value;
      expect({ dia: config.diaId, semana: config.numeroSemana, variacion: config.numeroVariacion }).toEqual({
        dia: c.dia,
        semana: c.semana,
        variacion: c.variacion,
      });

      await expect(app.home.week).toHaveText(`Semana ${c.semana}`);
      const esperados = variacion(c.dia, c.variacion).ejercicios;
      await expect(app.home.exercises).toHaveCount(esperados.length);
      await expect(app.home.exerciseName(0)).toHaveText(esperados[0].nombre);
    });
  });
}

test.describe('Home: badge de la rutina según el día', () => {
  const BADGES = [
    { nombre: 'martes',    fecha: FECHAS.martes,    texto: 'Pierna • Martes' },
    { nombre: 'miércoles', fecha: FECHAS.miercoles, texto: 'Pecho/Tríceps/Hombro • Miércoles' },
    { nombre: 'jueves (descanso → viernes)', fecha: FECHAS.jueves, texto: 'Espalda/Bíceps • Viernes' },
  ] as const;

  for (const c of BADGES) {
    test.describe(c.nombre, () => {
      test.use({ ahora: c.fecha });
      test(`muestra "${c.texto}"`, async ({ app }) => {
        await app.open();
        await expect(app.home.badge).toHaveText(c.texto);
      });
    });
  }
});
