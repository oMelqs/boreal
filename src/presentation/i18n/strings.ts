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
  habits: {
    title: 'Meus hábitos',
    add: 'Adicionar hábito',
    empty: 'Nenhum hábito cadastrado ainda.',
    toggleLabel: (name: string) => `Ativar ou desativar ${name}`,
    editLabel: (name: string) => `Editar ${name}`,
    removeLabel: (name: string) => `Remover ${name}`,
    confirmRemove: 'Excluir este hábito?',
    confirmYes: 'Excluir',
    confirmNo: 'Cancelar',
    disabledTag: 'pausado',
  },
  today: {
    manageHabits: 'Hábitos',
    changeCity: 'Trocar cidade',
    deviceCityName: 'Minha localização',
    themeToLight: 'Mudar para o tema claro',
    themeToDark: 'Mudar para o tema escuro',
    tomorrowBadge: 'amanhã',
    emptyTitle: 'Nenhum hábito por aqui',
    emptyHint: 'Cadastre seus hábitos para receber sugestões de vestimenta e horário todos os dias.',
    emptyCta: 'Cadastrar hábitos',
    searchLink: 'Buscar outra cidade',
    noCityTitle: 'Escolha sua cidade',
    noCityHint: 'As sugestões do dia usam o clima da sua cidade padrão.',
    noCityCta: 'Escolher cidade',
    expandTimeline: 'Ver a linha do tempo do dia',
    collapseTimeline: 'Esconder a linha do tempo',
    useMyLocation: 'Usar minha localização',
    locationDeniedHint:
      'Sem acesso à localização. Ative nas configurações para ver o clima de onde você está, ou escolha uma cidade.',
    weather: {
      cardHint: 'Ver detalhes',
      feelsLike: (temp: string) => `sensação ${temp}`,
      rain: (prob: number) => `${prob}% de chuva`,
      bestWindow: (window: string) => `Melhor horário para sair: ${window}`,
      dayOver: 'O dia já está acabando por aí.',
      noReading: 'Sem leitura para agora.',
      cardLabel: (city: string, description: string, temp: string) =>
        `Clima em ${city}: ${description}, ${temp}. Toque para ver os detalhes.`,
    },
  },
  outfit: {
    'bem-leve': { emoji: '🩳', label: 'Roupa bem leve' },
    leve: { emoji: '👕', label: 'Roupa leve' },
    'camada-leve': { emoji: '🧥', label: 'Jaqueta leve' },
    casaco: { emoji: '🧥', label: 'Casaco' },
    'casaco-pesado': { emoji: '🧥', label: 'Casaco pesado' },
  },
  accessory: {
    'guarda-chuva': { emoji: '☂️', label: 'guarda-chuva' },
    'capa-de-chuva': { emoji: '☔', label: 'capa de chuva' },
    'corta-vento': { emoji: '🌬️', label: 'corta-vento' },
    'protetor-solar': { emoji: '🧴', label: 'protetor solar' },
    bone: { emoji: '🧢', label: 'boné' },
    agua: { emoji: '💧', label: 'água' },
  },
  onboarding: {
    welcomeTitle: 'O clima, do jeito da sua rotina.',
    welcomeHint:
      'Cadastre seus hábitos e o Boreal diz o que vestir e qual o melhor horário para cada um, todo dia.',
    start: 'Começar',
    skip: 'Agora não',
    stepLabel: (step: number, total: number) => `Etapa ${step} de ${total}`,
    back: 'Voltar',
    next: 'Continuar',
    cityTitle: 'Onde você está?',
    cityHint: 'Suas sugestões usam o clima desta cidade.',
    habitsTitle: 'Quais são seus hábitos?',
    habitsHint: 'Toque numa sugestão ou crie o seu.',
    addHabit: 'Adicionar hábito',
    habitCount: (count: number) => (count === 1 ? '1 hábito adicionado' : `${count} hábitos adicionados`),
    nameTitle: 'Como chama esse hábito?',
    namePlaceholder: 'Ex.: Passear com o Thor',
    nameLabel: 'Nome do hábito',
    categoryLabel: 'Categoria',
    category: {
      pet: '🐕 Pet',
      exercicio: '🏃 Exercício',
      estudo: '🎓 Estudo',
      trabalho: '💼 Trabalho',
      lazer: '🌳 Lazer',
      outro: '✨ Outro',
    },
    scheduleTitle: 'Tem horário fixo?',
    scheduleFixed: 'Sim, horário fixo',
    scheduleFlexible: 'Não, horário livre',
    startTimeLabel: 'Começa às',
    endTimeLabel: 'Termina às',
    durationLabel: 'Quanto tempo dura?',
    durationOption: (minutes: number) => (minutes >= 60 ? `${minutes / 60}h` : `${minutes}min`),
    durationOptionLong: (minutes: number) =>
      minutes >= 60 ? `${minutes / 60} hora${minutes > 60 ? 's' : ''}` : `${minutes} minutos`,
    boundsLabel: 'Só num intervalo? (opcional)',
    earliestLabel: 'A partir de',
    latestLabel: 'Até',
    daysTitle: 'Em quais dias?',
    weekdaysShort: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    weekdaysLong: [
      'domingo',
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      'sábado',
    ],
    weekdaysShortcut: 'Seg–Sex',
    everyDay: 'Todos',
    save: 'Salvar hábito',
    reviewTitle: 'Tudo certo?',
    reviewHint: 'Revise seus hábitos antes de concluir.',
    reviewEmpty: 'Nenhum hábito por enquanto — dá para adicionar depois.',
    edit: 'Editar',
    remove: 'Remover',
    finish: 'Concluir',
    fixedSummary: (start: string, end: string) => `${start}–${end}`,
    flexibleSummary: (duration: string) => `horário livre · ${duration}`,
  },
  preferences: {
    openLabel: 'Minhas preferências',
    thermalTitle: 'Como você se sente em relação ao clima?',
    thermalHint: 'Isso ajusta o que contamos como um bom horário para você.',
    preset: {
      friorento: {
        emoji: '🧣',
        label: 'Friorento',
        hint: 'Sinto frio antes dos outros. 20 °C já pede casaco.',
      },
      equilibrado: {
        emoji: '⚖️',
        label: 'Equilibrado',
        hint: 'Nem tanto ao mar, nem tanto à terra.',
      },
      calorento: {
        emoji: '🥵',
        label: 'Calorento',
        hint: 'Qualquer sol vira suadeira. Prefiro friozinho.',
      },
    },
    customLink: 'Prefiro definir na mão',
    tempTitle: 'Qual temperatura é agradável para você?',
    tempHint: 'Vale para a sensação térmica, não para o número do termômetro.',
    tempRangeLabel: 'Faixa de temperatura agradável',
    tempRangeValue: (min: number, max: number) => `de ${min} °C a ${max} °C`,
    /** Leitura em linguagem natural da faixa escolhida (feedback do slider). */
    tempFeeling: (min: number, max: number) => {
      const describe = (value: number) => {
        if (value < 5) return 'frio de rachar';
        if (value < 12) return 'frio';
        if (value < 18) return 'friozinho leve';
        if (value < 24) return 'ameno';
        if (value < 30) return 'calor moderado';
        return 'calor forte';
      };
      return `de ${describe(min)} a ${describe(max)}`;
    },
    humidityTitle: 'A partir de quanto o abafamento te incomoda?',
    humidityHint: 'Umidade alta pesa mais quando está quente.',
    humidityLabel: 'Limite de umidade',
    humidityValue: (value: number) => `${value}%`,
    humidityFeeling: (value: number) => {
      if (value <= 55) return 'sou bem sensível a mormaço';
      if (value <= 70) return 'incomoda no calor úmido';
      if (value <= 85) return 'só em dia bem abafado';
      return 'quase nada me abafa';
    },
    windTitle: 'E o vento?',
    windHint: 'Acima do seu limite, o vento começa a descontar pontos.',
    windLabel: 'Limite de vento',
    windValue: (value: number) => `${value} km/h`,
    windFeeling: (value: number) => {
      if (value <= 12) return 'brisa já incomoda';
      if (value <= 25) return 'aguento um vento moderado';
      if (value <= 40) return 'só vento forte atrapalha';
      return 'só ventania mesmo';
    },
    sleepTitle: 'Quer sugestões também à noite?',
    sleepHint: 'Sugerimos horários dentro da sua rotina acordada.',
    wakeLabel: 'Acordo às',
    sleepLabel: 'Durmo às',
    daylightOnly: 'Usar só horários com luz do dia',
    daylightOnlyActive: 'Só horários com luz do dia',
    useSleepRoutine: 'Definir minha rotina',
    crossMidnightNotice: 'Sua noite vira o dia seguinte — consideramos isso.',
    reviewTitle: 'Tudo certo com seu perfil?',
    reviewHint: 'Dá para mudar quando quiser.',
    profileCardLabel: 'Perfil',
    awakeCardLabel: 'Acordado',
    /** "Calorento · 15–23 °C" / "Personalizado · 24–30 °C". */
    profileSummary: (name: string, min: number, max: number) =>
      `${name} · ${min}–${max} °C`,
    customName: 'Personalizado',
    awakeSummary: (wake: string, sleep: string) => `${wake} às ${sleep}`,
    awakeDaylight: 'Só com luz do dia',
    save: 'Salvar preferências',
  },
  errors: {
    network: 'Sem conexão com a internet. Verifique sua rede e tente de novo.',
    api: 'O serviço de clima está indisponível agora. Tente de novo em instantes.',
    noResults: 'Nada encontrado por aqui.',
    forecastNoData: 'A previsão veio sem dados utilizáveis para hoje. Tente novamente.',
    generic: 'Algo deu errado. Tente novamente.',
  },
} as const;
