import { ApiError, NetworkError } from '../errors';
import { createOpenMeteoClient } from './openMeteoClient';

function jsonFetch(body: unknown, status = 200): { fetchFn: typeof fetch; calls: string[] } {
  const calls: string[] = [];
  const fetchFn: typeof fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify(body), { status });
  };
  return { fetchFn, calls };
}

describe('openMeteoClient', () => {
  describe('searchCities', () => {
    it('monta a URL do geocoding com name, count=8, language=pt e format=json', async () => {
      const { fetchFn, calls } = jsonFetch({ results: [] });

      await createOpenMeteoClient(fetchFn).searchCities('Joinville');

      const url = new URL(calls[0]);
      expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
      expect(Object.fromEntries(url.searchParams)).toEqual({
        name: 'Joinville',
        count: '8',
        language: 'pt',
        format: 'json',
      });
    });

    it('devolve o payload tipado', async () => {
      const body = { results: [{ id: 1, name: 'Joinville', latitude: -26.3, longitude: -48.8, timezone: 'America/Sao_Paulo' }] };
      const { fetchFn } = jsonFetch(body);

      await expect(createOpenMeteoClient(fetchFn).searchCities('Joinville')).resolves.toEqual(
        body,
      );
    });
  });

  describe('getForecast', () => {
    it('monta a URL do forecast com as variáveis horárias, forecast_days=1 e timezone da cidade', async () => {
      const { fetchFn, calls } = jsonFetch({ timezone: 'America/Sao_Paulo', hourly: { time: [] } });

      await createOpenMeteoClient(fetchFn).getForecast({
        latitude: -26.3,
        longitude: -48.84,
        timezone: 'America/Sao_Paulo',
      });

      const url = new URL(calls[0]);
      expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
      expect(Object.fromEntries(url.searchParams)).toEqual({
        latitude: '-26.3',
        longitude: '-48.84',
        hourly:
          'temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,uv_index,weather_code,is_day',
        forecast_days: '1',
        timezone: 'America/Sao_Paulo',
      });
    });
  });

  describe('taxonomia de erros', () => {
    it('lança ApiError com o status para respostas >= 400', async () => {
      const { fetchFn } = jsonFetch({ error: true }, 500);

      const promise = createOpenMeteoClient(fetchFn).searchCities('x');

      await expect(promise).rejects.toBeInstanceOf(ApiError);
      await expect(promise).rejects.toMatchObject({ status: 500 });
    });

    it('lança NetworkError quando o fetch falha (sem conexão)', async () => {
      const offlineFetch: typeof fetch = async () => {
        throw new TypeError('Network request failed');
      };

      await expect(
        createOpenMeteoClient(offlineFetch).searchCities('x'),
      ).rejects.toBeInstanceOf(NetworkError);
    });

    it('lança NetworkError quando a requisição estoura o timeout de 10 s', async () => {
      jest.useFakeTimers();
      try {
        const hangingFetch: typeof fetch = (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          });

        const promise = createOpenMeteoClient(hangingFetch).searchCities('x');
        const assertion = expect(promise).rejects.toBeInstanceOf(NetworkError);
        jest.advanceTimersByTime(10_000);

        await assertion;
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
