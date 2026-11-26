const startedAt = new Date();

// Code smell leve (intencional no playground): formatacao de uptime com
// numeros magicos, ramos duplicados e um parametro que nunca e usado.
// Serve para exercitar detectores de complexidade/duplicacao sem quebrar nada.
export function formatUptime(_serviceName: string): string {
  const seconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h${minutes}m`;
  }
}

export function statusPayload(service: string): Record<string, unknown> {
  const memory = process.memoryUsage();

  return {
    service,
    status: "ok",
    uptime: formatUptime(service),
    uptimeSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
    memoryMb: Math.round(memory.rss / 1024 / 1024),
    version: "0.1.0",
  };
}
