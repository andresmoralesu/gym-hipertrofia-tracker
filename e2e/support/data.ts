import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Ejercicio tal como está en scripts/datos/variaciones.json */
export interface Ejercicio {
  id: string;
  nombre: string;
  series: number;
  reps: string;
  descanso: number;
  equipo: string;
}

interface Variacion {
  diaId: string;
  numeroVariacion: number;
  nombre: string;
  ejercicios: Ejercicio[];
}

type DiaId = 'martes' | 'miercoles' | 'viernes';

const catalogo: Record<DiaId, Record<string, Variacion>> = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts/datos/variaciones.json'), 'utf-8'),
);

/** Variación precargada de la app (fuente de verdad para los tests). */
export function variacion(dia: DiaId, numero: number): Variacion {
  return catalogo[dia][`variacion${numero}`];
}

export const DIAS: DiaId[] = ['martes', 'miercoles', 'viernes'];

/**
 * Fechas de referencia (hora de Bogotá, 10:00): SEMANA 3 del programa.
 *   El programa empieza el lunes 2026-10-26 (semana 1), así que lun 2026-11-09 → dom 2026-11-15
 *   es la semana 3 → variación ((3-1) % 5) + 1 = 3. La semana siguiente (lun 16-nov) es la 4.
 * Rutina por día: martes = Pierna, miércoles = Pecho/Tríceps/Hombro, viernes = Espalda/Bíceps.
 */
export const FECHAS = {
  lunes:     new Date('2026-11-09T10:00:00-05:00'),
  martes:    new Date('2026-11-10T10:00:00-05:00'),
  miercoles: new Date('2026-11-11T10:00:00-05:00'),
  jueves:    new Date('2026-11-12T10:00:00-05:00'),
  viernes:   new Date('2026-11-13T10:00:00-05:00'), // fecha por defecto de los tests
  sabado:    new Date('2026-11-14T10:00:00-05:00'),
  domingo:   new Date('2026-11-15T10:00:00-05:00'),
};

export const AHORA_POR_DEFECTO = FECHAS.viernes;
