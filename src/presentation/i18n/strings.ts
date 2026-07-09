export const strings = {
  home: {
    title: 'Boreal',
    subtitle: 'O melhor horário do dia para sair, direto ao ponto.',
  },
  search: {
    placeholder: 'Buscar cidade…',
    inputLabel: 'Buscar cidade',
    inputHint: 'Digite pelo menos duas letras para buscar',
    loading: 'Buscando cidades…',
    recentTitle: 'Buscas recentes',
    clearRecents: 'Limpar',
    clearRecentsLabel: 'Limpar buscas recentes',
    emptyTitle: 'Para onde vamos hoje?',
    emptyHint: 'Busque uma cidade e descubra o melhor horário para sair.',
    noResults: (query: string) => `Nenhuma cidade encontrada para "${query}".`,
    retry: 'Tentar novamente',
  },
  city: {
    fallbackTitle: 'Cidade',
    backLabel: 'Voltar para a busca',
    missingCity: 'Não encontramos essa cidade por aqui. Volte e busque de novo.',
  },
  recommendation: {
    heroLabel: 'Melhor horário para sair hoje',
    loadingForecast: 'Carregando previsão…',
    windowA11y: (startHour: number, endHour: number) =>
      `melhor horário: das ${startHour} às ${endHour} horas`,
    dayOverTitle: 'O dia já está acabando por aí.',
    dayOverHint: 'Amanhã tem mais!',
    caveat: (reason: string) =>
      `Hoje não está ideal. Se precisar sair, o horário menos ruim é este — ${reason}.`,
    badge: {
      otimo: 'Ótimo',
      bom: 'Bom',
      razoavel: 'Razoável',
      ruim: 'Ruim',
    },
    timelineTitle: 'Restante do dia',
    detailsTitle: 'Na janela recomendada',
    details: {
      apparentTemp: 'Sensação',
      precipitationProb: 'Chuva',
      wind: 'Vento',
      uv: 'UV',
    },
    timeline: {
      now: 'agora',
      night: 'noite',
      noData: 'sem dados',
      hourA11y: (hour: string, temp: string, scoreLabel: string) =>
        `${hour}, ${temp} graus, score ${scoreLabel}`,
      nightA11y: (hour: string) => `${hour}, noite`,
      noDataA11y: (hour: string) => `${hour}, sem dados`,
    },
  },
  errors: {
    network: 'Sem conexão com a internet. Verifique sua rede e tente de novo.',
    api: 'O serviço de clima está indisponível agora. Tente de novo em instantes.',
    noResults: 'Nada encontrado por aqui.',
    forecastNoData: 'A previsão veio sem dados utilizáveis para hoje. Tente novamente.',
    generic: 'Algo deu errado. Tente novamente.',
  },
} as const;
