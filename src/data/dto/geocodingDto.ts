/**
 * Tipos crus da Geocoding API da Open-Meteo (/v1/search).
 * Declaram apenas os campos que o app usa (§4.1); o restante do JSON é
 * ignorado pela tipagem estrutural.
 */
export type GeocodingCityDto = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  /** Estado/região para desambiguação (ex.: "Santa Catarina"). */
  admin1?: string;
  timezone: string;
};

export type GeocodingResponseDto = {
  /** Ausente quando a busca não encontra nenhuma cidade. */
  results?: GeocodingCityDto[];
};
