import { describe, it, expect } from 'vitest';
import { toMinutes, fromMinutes, addMinutes, buildTimeOptions, toIsoLocal } from '../CrearReserva';

describe('Utilidades de tiempo en CrearReserva', () => {
  it('convierte de HH:MM a minutos correctamente (toMinutes)', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('01:30')).toBe(90);
    expect(toMinutes('23:30')).toBe(23 * 60 + 30);
  });

  it('convierte de minutos a HH:MM correctamente (fromMinutes)', () => {
    expect(fromMinutes(0)).toBe('00:00');
    expect(fromMinutes(23 * 60 + 30)).toBe('23:30');
  });

  it('suma minutos y devuelve null si se pasa del día (addMinutes)', () => {
    expect(addMinutes('10:00', 60)).toBe('11:00');
    expect(addMinutes('23:00', 30)).toBe('23:30');
    expect(addMinutes('23:30', 30)).toBeNull();
  });

  it('genera opciones de tiempo con un step dado (buildTimeOptions)', () => {
    const opts60 = buildTimeOptions(60);
    expect(opts60[0]).toBe('00:00');
    expect(opts60[opts60.length - 1]).toBe('23:00');
  });

	it('crea un ISO coherente a partir de fecha y hora (toIsoLocal)', () => {
		const iso = toIsoLocal('2025-03-10', '10:30');
		const expected = new Date('2025-03-10T10:30');
		expect(new Date(iso).getTime()).toBe(expected.getTime());
	});
});

