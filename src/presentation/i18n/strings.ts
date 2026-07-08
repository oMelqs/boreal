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
    stubHint: 'A recomendação do melhor horário chega aqui em breve.',
    fallbackTitle: 'Cidade',
  },
  errors: {
    network: 'Sem conexão com a internet. Verifique sua rede e tente de novo.',
    api: 'O serviço de clima está indisponível agora. Tente de novo em instantes.',
    noResults: 'Nada encontrado por aqui.',
    generic: 'Algo deu errado. Tente novamente.',
  },
} as const;
