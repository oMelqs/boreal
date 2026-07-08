/**
 * Mapeamento dos códigos WMO da Open-Meteo para ícone (emoji, sem lib) e
 * descrição em pt-BR (usada em acessibilidade). Grupos conforme a tabela da
 * documentação (https://open-meteo.com/en/docs — WMO Weather interpretation
 * codes). Código desconhecido cai em fallback neutro.
 */

type WeatherGroup = {
  codes: number[];
  dayIcon: string;
  nightIcon: string;
  description: string;
};

const GROUPS: WeatherGroup[] = [
  { codes: [0], dayIcon: '☀️', nightIcon: '🌙', description: 'céu limpo' },
  { codes: [1, 2], dayIcon: '🌤️', nightIcon: '☁️', description: 'parcialmente nublado' },
  { codes: [3], dayIcon: '☁️', nightIcon: '☁️', description: 'nublado' },
  { codes: [45, 48], dayIcon: '🌫️', nightIcon: '🌫️', description: 'nevoeiro' },
  { codes: [51, 53, 55, 56, 57], dayIcon: '🌦️', nightIcon: '🌧️', description: 'garoa' },
  { codes: [61, 63, 65, 66, 67], dayIcon: '🌧️', nightIcon: '🌧️', description: 'chuva' },
  { codes: [71, 73, 75, 77], dayIcon: '🌨️', nightIcon: '🌨️', description: 'neve' },
  { codes: [80, 81, 82], dayIcon: '🌦️', nightIcon: '🌧️', description: 'pancadas de chuva' },
  { codes: [85, 86], dayIcon: '🌨️', nightIcon: '🌨️', description: 'pancadas de neve' },
  { codes: [95, 96, 99], dayIcon: '⛈️', nightIcon: '⛈️', description: 'trovoada' },
];

const FALLBACK = { dayIcon: '🌡️', nightIcon: '🌡️', description: 'tempo indefinido' };

function groupFor(code: number | null) {
  if (code === null) return FALLBACK;
  return GROUPS.find((group) => group.codes.includes(code)) ?? FALLBACK;
}

export function weatherCodeIcon(code: number | null, isDay: boolean): string {
  const group = groupFor(code);
  return isDay ? group.dayIcon : group.nightIcon;
}

export function weatherCodeDescription(code: number | null): string {
  return groupFor(code).description;
}
