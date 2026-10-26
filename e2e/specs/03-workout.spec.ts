import { test, expect } from '../fixtures/test';
import { idb } from '../support/idb';
import { variacion } from '../support/data';

// Viernes 13-nov → rutina de viernes (Espalda/Bíceps), variación 3 (8 ejercicios × 3 series)
const ejercicios = variacion('viernes', 3).ejercicios;
const [ej1, ej2] = ejercicios;

test.describe('Workout: contador de series', () => {
  test.beforeEach(async ({ app }) => {
    await app.open();
    await app.startWorkout();
  });

  test('avanza 1 → 2 → 3 y al registrar la tercera abre "Ejercicio Completado"', async ({ app }) => {
    await expect(app.workout.counter).toHaveText('1 / 3');

    await app.workout.completeSet(40);
    await expect(app.workout.counter).toHaveText('2 / 3');

    await app.workout.completeSet(40);
    await expect(app.workout.counter).toHaveText('3 / 3');
    await expect(app.workout.modal).toBeHidden();

    await app.workout.completeSet(40);
    await expect(app.workout.modal).toBeVisible();
    await expect(app.workout.modal).toContainText('Ejercicio Completado');
    await expect(app.workout.modal).toContainText(ej1.nombre);
  });

  test('"Siguiente Ejercicio" pasa al siguiente en serie 1 y actualiza el "Próximo ejercicio"', async ({ app }) => {
    await expect(app.workout.currentExercise).toHaveText(ej1.nombre);
    await expect(app.workout.nextExercise).toHaveText(ej2.nombre);

    await app.workout.completeExercise(3);
    await app.workout.modalNextButton.click();

    await expect(app.workout.modal).toBeHidden();
    await expect(app.workout.currentExercise).toHaveText(ej2.nombre);
    await expect(app.workout.counter).toHaveText('1 / 3');
    await expect(app.workout.nextExercise).toHaveText(ejercicios[2].nombre);
  });

  test('cada serie guarda un registro con ejercicio, peso, nota y fecha', async ({ app, page }) => {
    await app.workout.completeSet(42.5, 'buena técnica');
    await expect(app.workout.counter).toHaveText('2 / 3');
    await app.workout.completeSet(45);
    await expect(app.workout.counter).toHaveText('3 / 3');

    const registros = await idb.getAll(page, 'historialPesos');
    expect(registros).toHaveLength(2);
    expect(registros.map((r) => r.peso).sort()).toEqual([42.5, 45]);
    expect(registros.every((r) => r.ejercicio === ej1.nombre)).toBe(true);
    expect(registros.find((r) => r.peso === 42.5).notas).toBe('buena técnica');
    expect(registros.every((r) => r.series === 3)).toBe(true);
    expect(new Set(registros.map((r) => r.id)).size, 'ids únicos').toBe(2);
    // La fecha viene del reloj controlado (viernes 13-nov-2026)
    expect(registros[0].fecha.startsWith('2026-11-13')).toBe(true);
  });

  test('después de "Serie OK" se limpian el peso y la nota', async ({ app }) => {
    await app.workout.completeSet(40, 'nota');

    await expect(app.workout.weightInput).toHaveValue('');
    await expect(app.workout.notesInput).toHaveValue('');
  });

  test('el temporizador de descanso se reinicia con el descanso del ejercicio', async ({ app }) => {
    // 75 s → 01:15 (puede haber avanzado un segundo)
    await expect(app.workout.timer).toHaveText(/^01:1[45]$/);
    await app.workout.completeSet(40);
    await expect(app.workout.timer).toHaveText(/^01:1[45]$/);
  });

  for (const valor of ['', '0', '-5']) {
    test(`rechaza peso inválido (${JSON.stringify(valor)}): avisa y no avanza ni guarda`, async ({ app, page }) => {
      await app.workout.completeSet(valor);

      await app.expectDialog(/peso válido/);
      await expect(app.workout.counter).toHaveText('1 / 3');
      expect(await idb.getAll(page, 'historialPesos')).toHaveLength(0);
    });
  }

  test('"Saltar" (aceptando) avanza el contador sin guardar registros', async ({ app, page }) => {
    await app.workout.skipButton.click();

    await expect(app.workout.counter).toHaveText('2 / 3');
    expect(await idb.getAll(page, 'historialPesos')).toHaveLength(0);
  });

  test('"Saltar" (cancelando) no cambia nada', async ({ app }) => {
    app.confirmAnswer = false;
    await app.workout.skipButton.click();

    await expect(app.workout.counter).toHaveText('1 / 3');
  });

  test('saltar la última serie abre "Ejercicio Completado"', async ({ app }) => {
    await app.workout.skipButton.click();
    await expect(app.workout.counter).toHaveText('2 / 3');
    await app.workout.skipButton.click();
    await expect(app.workout.counter).toHaveText('3 / 3');
    await app.workout.skipButton.click();

    await expect(app.workout.modal).toBeVisible();
  });

  test('cerrar el modal con ✕ deja el ejercicio como estaba', async ({ app, page }) => {
    await app.workout.completeExercise(3);
    await page.locator('#btn-close-modal').click();

    await expect(app.workout.modal).toBeHidden();
    await expect(app.workout.currentExercise).toHaveText(ej1.nombre);
  });
});

test.describe('Workout: sesión completa y persistencia del avance', () => {
  test('completar los 8 ejercicios × 3 series guarda 24 registros y termina el entrenamiento', async ({ app, page }) => {
    await app.open();
    await app.startWorkout();

    for (const [i, ej] of ejercicios.entries()) {
      await expect(app.workout.currentExercise).toHaveText(ej.nombre);
      await app.workout.completeExercise(ej.series);
      await app.workout.modalNextButton.click();
      if (i < ejercicios.length - 1) await expect(app.workout.modal).toBeHidden();
    }

    await app.expectDialog(/Entrenamiento completado/);
    const registros = await idb.getAll(page, 'historialPesos');
    expect(registros).toHaveLength(ejercicios.length * 3);
  });

  test('recargar la app el mismo día conserva la serie en la que ibas', async ({ app }) => {
    await app.open();
    await app.startWorkout();
    await app.workout.completeSet(40);
    await expect(app.workout.counter).toHaveText('2 / 3'); // esperar a que termine de guardar antes de la siguiente
    await app.workout.completeSet(40);
    await expect(app.workout.counter).toHaveText('3 / 3');

    await app.reload();
    await app.startWorkout();

    await expect(app.workout.currentExercise).toHaveText(ej1.nombre);
    await expect(app.workout.counter).toHaveText('3 / 3');
  });

  test('recargar conserva el ejercicio actual tras "Siguiente Ejercicio"', async ({ app }) => {
    await app.open();
    await app.startWorkout();
    await app.workout.completeExercise(3);
    await app.workout.modalNextButton.click();
    await expect(app.workout.currentExercise).toHaveText(ej2.nombre);

    await app.reload();
    await app.startWorkout();

    await expect(app.workout.currentExercise).toHaveText(ej2.nombre);
    await expect(app.workout.counter).toHaveText('1 / 3');
  });

  test('un avance guardado de OTRO día se descarta y se empieza de cero', async ({ app, page }) => {
    await app.open();
    await app.startWorkout();
    await app.workout.completeSet(40);
    await expect(app.workout.counter).toHaveText('2 / 3');

    const estado = await idb.get(page, 'entrenamientos', 'actual');
    await idb.put(page, 'entrenamientos', { ...estado, fechaEntreno: '2000-01-01' });
    await app.reload();
    await app.startWorkout();

    await expect(app.workout.currentExercise).toHaveText(ej1.nombre);
    await expect(app.workout.counter).toHaveText('1 / 3');
  });
});

test.describe('Workout: pestaña de la barra inferior, modal y encabezado', () => {
  test('la pestaña Workout de la barra inferior muestra el entrenamiento sin pasar por "Comenzar"', async ({ app }) => {
    await app.open();
    const primero = variacion('viernes', 3).ejercicios[0];

    await app.goTo('workout');

    await expect(app.workout.currentExercise).toHaveText(primero.nombre);
    await expect(app.workout.counter).toHaveText(`1 / ${primero.series}`);
  });

  test('volver a la pestaña Workout no reinicia lo que estabas haciendo (peso escrito y serie)', async ({ app }) => {
    await app.open();
    await app.startWorkout();
    await app.workout.completeSet(50);
    await expect(app.workout.counter).toHaveText('2 / 3');
    await app.goTo('home');

    await app.goTo('workout');

    await expect(app.workout.counter).toHaveText('2 / 3');
  });

  test('"Volver a Home" del modal cierra el modal y lleva a la pestaña Home', async ({ app }) => {
    await app.open();
    await app.startWorkout();
    await app.workout.completeExercise(3);

    await app.workout.modalHomeButton.click();

    await expect(app.workout.modal).toBeHidden();
    await expect(app.nav('home')).toHaveClass(/active/);
    await expect(app.screen('home')).toHaveClass(/active/);
    await expect(app.screen('workout')).not.toHaveClass(/active/);
  });

  test('"Volver a Home" se lee: texto con contraste suficiente sobre el fondo del modal', async ({ app, page }) => {
    await app.open();
    await app.startWorkout();
    await app.workout.completeExercise(3);

    const contraste = await page.evaluate(() => {
      const btn = document.querySelector('#btn-home') as HTMLElement;
      const estilo = getComputedStyle(btn);
      const rgb = (c: string) => (c.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
      const luminancia = ([r, g, b]: number[]) => {
        const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const texto = rgb(estilo.color);
      // Fondo efectivo: el del botón si es opaco; si es transparente, el del modal (blanco)
      const fondoBtn = rgb(estilo.backgroundColor);
      const fondo = fondoBtn.length === 4 && fondoBtn[3] < 1 ? rgb(getComputedStyle(btn.closest('.modal-content')!).backgroundColor) : fondoBtn;
      const [l1, l2] = [luminancia(texto), luminancia(fondo)].sort((x, y) => y - x);
      return (l1 + 0.05) / (l2 + 0.05);
    });

    expect(contraste).toBeGreaterThanOrEqual(4.5); // WCAG AA para texto normal
  });

  test('el encabezado muestra día y grupo muscular reales', async ({ app, page }) => {
    await app.open();
    await app.startWorkout();

    await expect(page.locator('.workout-header .day')).toHaveText('Viernes • Espalda/Bíceps');
  });
});
