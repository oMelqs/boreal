/**
 * Cidade retornada pela busca por nome (Geocoding).
 * `timezone` é o fuso da cidade — a recomendação é sempre sobre o dia local
 * da cidade consultada, não o do device.
 */
export type City = {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
};
