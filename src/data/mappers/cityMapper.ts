import type { City } from '@/domain/entities/city';

import type { GeocodingResponseDto } from '../dto/geocodingDto';

/** Única fronteira de conversão geocoding → domain: DTO nunca sai da camada data. */
export function mapGeocodingResponseToCities(dto: GeocodingResponseDto): City[] {
  return (dto.results ?? []).map((result) => ({
    id: result.id,
    name: result.name,
    ...(result.admin1 !== undefined ? { admin1: result.admin1 } : {}),
    country: result.country ?? '',
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  }));
}
