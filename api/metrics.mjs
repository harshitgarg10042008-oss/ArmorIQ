const counters = new Map();
const durations = new Map();

export function increment(name) {
  counters.set(name, (counters.get(name) || 0) + 1);
}

export function observe(name, milliseconds) {
  const values = durations.get(name) || [];
  values.push(Math.max(0, Math.round(milliseconds)));
  durations.set(name, values.slice(-200));
}

export function snapshot() {
  const latency = {};
  for (const [name, values] of durations) {
    latency[name] = {
      count: values.length,
      averageMs: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
      maxMs: values.length ? Math.max(...values) : 0,
    };
  }
  return { counters: Object.fromEntries(counters), latency, collectedAt: new Date().toISOString() };
}
