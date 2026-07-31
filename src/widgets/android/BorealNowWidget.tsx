import { FlexWidget, TextWidget } from 'react-native-android-widget';

type BorealNowWidgetProps = {
  /** Placeholder da spike; o payload real chega no PR 3. */
  headline: string;
  theme?: 'light' | 'dark';
};

/** Tokens do tema, copiados de `presentation/theme/tokens.ts`: o widget roda
 *  fora da árvore do app e não tem acesso ao `useTheme`. */
const COLORS = {
  dark: { background: '#121B26', textPrimary: '#E9F1F7', textSecondary: '#8FA6B8' },
  light: { background: '#FFFFFF', textPrimary: '#101D29', textSecondary: '#4E6478' },
} as const;

/**
 * Widget Android (§4 do SPECS-WIDGET). A lib renderiza esta árvore como
 * imagem, então layout tolerante: nada colado na borda e sem texto que dependa
 * de refluxo.
 *
 * `clickAction="OPEN_URI"` abre o app pelo scheme `boreal` — o mesmo caminho de
 * deep link que as telas já usam.
 */
export function BorealNowWidget({ headline, theme = 'dark' }: BorealNowWidgetProps) {
  const colors = COLORS[theme];

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'boreal://' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        backgroundColor: colors.background,
        borderRadius: 16,
      }}
    >
      <TextWidget text={headline} style={{ fontSize: 22, color: colors.textPrimary }} />
      <TextWidget text="Boreal" style={{ fontSize: 12, color: colors.textSecondary }} />
    </FlexWidget>
  );
}
