import { goalProgress, weeklyAverage, computeStreak, trendSeries } from './steps';

describe('goalProgress', () => {
  it('0 si la meta es 0', () => expect(goalProgress(5000, 0)).toBe(0));
  it('clamp a 100', () => expect(goalProgress(12000, 8000)).toBe(100));
  it('proporcional', () => expect(goalProgress(4000, 8000)).toBe(50));
});

describe('weeklyAverage', () => {
  it('0 sin datos', () => expect(weeklyAverage([])).toBe(0));
  it('media de los últimos 7', () => {
    const days = Array.from({ length: 9 }, (_, i) => ({ date: `2026-06-${10 + i}`, steps: 1000 * (i + 1) }));
    // últimos 7 = días con steps 3000..9000 → media 6000
    expect(weeklyAverage(days)).toBe(6000);
  });
});

describe('computeStreak', () => {
  const goal = 8000;
  it('vacío → 0', () => expect(computeStreak([], goal, '2026-06-29')).toBe(0));
  it('hoy cumplido + 2 días previos', () => {
    const days = [
      { date: '2026-06-27', steps: 9000 },
      { date: '2026-06-28', steps: 8000 },
      { date: '2026-06-29', steps: 8500 },
    ];
    expect(computeStreak(days, goal, '2026-06-29')).toBe(3);
  });
  it('hoy aún no cumplido → cuenta desde ayer', () => {
    const days = [
      { date: '2026-06-28', steps: 8200 },
      { date: '2026-06-29', steps: 1200 },
    ];
    expect(computeStreak(days, goal, '2026-06-29')).toBe(1);
  });
  it('hueco corta la racha', () => {
    const days = [
      { date: '2026-06-27', steps: 9000 },
      { date: '2026-06-29', steps: 9000 },
    ];
    expect(computeStreak(days, goal, '2026-06-29')).toBe(1);
  });
});

describe('trendSeries', () => {
  it('rellena huecos con 0', () => {
    const out = trendSeries([{ date: '2026-06-28', steps: 5000 }], '2026-06-27', '2026-06-29');
    expect(out).toEqual([
      { date: '2026-06-27', steps: 0 },
      { date: '2026-06-28', steps: 5000 },
      { date: '2026-06-29', steps: 0 },
    ]);
  });
});
