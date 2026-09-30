export const RATE_URL = 'https://api.frankfurter.dev/v2/rate/USD/GEL';
export function parseRate(data, base = 'USD') {
  if (data?.base !== base || data?.quote !== 'GEL' || typeof data.rate !== 'number' || !Number.isFinite(data.rate) || data.rate <= 0 || data.rate > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(Date.parse(data.date))) {
    throw new Error('Некорректный ответ сервиса курсов');
  }
  return {rate: data.rate, date: data.date};
}
export async function fetchRate(fetcher = fetch, base = 'USD') {
  const response = await fetcher(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(base)}/GEL`, {signal: AbortSignal.timeout(8000), credentials: 'omit'});
  if (!response.ok) throw new Error('Сервис курсов недоступен');
  return parseRate(await response.json(), base);
}
