import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import {
  HUMIDITY_MAX,
  HUMIDITY_MIN,
  TEMP_MAX_C,
  TEMP_MIN_C,
} from '@/domain/usecases/validateComfortPreferences';
import { strings } from '@/presentation/i18n/strings';

import { NumericRangeInput } from './NumericRangeInput';
import { NumericStepperInput } from './NumericStepperInput';

/**
 * Digita um valor inteiro no campo e sai dele. Usa `changeText` porque no app
 * o foco seleciona o texto e a digitação substitui o conteúdo — o `type` do
 * userEvent não simula seleção e acabaria concatenando no valor existente.
 */
async function typeAndLeave(field: ReturnType<typeof screen.getByLabelText>, text: string) {
  await act(async () => {
    fireEvent(field, 'focus');
    fireEvent.changeText(field, text);
  });
  await act(async () => {
    fireEvent(field, 'blur');
  });
}

const humidity = {
  accessibilityLabel: 'Limite de umidade, em porcentagem',
  fieldName: strings.preferences.numeric.humidityField,
  label: strings.preferences.humidityLabel,
  min: HUMIDITY_MIN,
  max: HUMIDITY_MAX,
  step: 5,
  unit: '%',
};

describe('NumericStepperInput', () => {
  it('anuncia o valor com a unidade', async () => {
    await render(<NumericStepperInput {...humidity} value={70} onChange={jest.fn()} />);

    const field = await screen.findByLabelText(humidity.accessibilityLabel);
    expect(field.props.accessibilityValue.text).toBe('70%');
  });

  it('os botões andam um passo', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<NumericStepperInput {...humidity} value={70} onChange={onChange} />);

    await user.press(
      await screen.findByRole('button', {
        name: strings.preferences.numeric.increase(humidity.fieldName),
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith(75);

    await user.press(
      screen.getByRole('button', {
        name: strings.preferences.numeric.decrease(humidity.fieldName),
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith(65);
  });

  it('no limite, o botão correspondente fica desabilitado', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<NumericStepperInput {...humidity} value={HUMIDITY_MAX} onChange={onChange} />);

    const increase = await screen.findByRole('button', {
      name: strings.preferences.numeric.increase(humidity.fieldName),
    });
    expect(increase.props.accessibilityState.disabled).toBe(true);

    await user.press(increase);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('valor digitado fora dos limites é ajustado ao sair do campo, com aviso', async () => {
    const onChange = jest.fn();
    await render(<NumericStepperInput {...humidity} value={70} onChange={onChange} />);

    await typeAndLeave(await screen.findByLabelText(humidity.accessibilityLabel), '120');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(HUMIDITY_MAX);
    expect(
      screen.getByText(strings.preferences.numeric.clamped(`${HUMIDITY_MAX}%`)),
    ).toBeOnTheScreen();
  });

  it('texto não numérico volta ao último valor válido', async () => {
    const onChange = jest.fn();
    await render(<NumericStepperInput {...humidity} value={70} onChange={onChange} />);

    await typeAndLeave(await screen.findByLabelText(humidity.accessibilityLabel), 'abc');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText(humidity.accessibilityLabel).props.value).toBe('70');
  });

  it('digitar "-1" a caminho de "-10" não vira valor nem erro (§10)', async () => {
    const onChange = jest.fn();
    await render(
      <NumericStepperInput
        accessibilityLabel={strings.preferences.numeric.tempMinLabel}
        fieldName={strings.preferences.numeric.tempMinField}
        label={strings.preferences.numeric.from}
        max={TEMP_MAX_C}
        min={TEMP_MIN_C}
        onChange={onChange}
        unit="°C"
        value={18}
      />,
    );

    const field = await screen.findByLabelText(strings.preferences.numeric.tempMinLabel);

    // Enquanto digita, o texto é preservado como está e nada é reportado.
    await act(async () => {
      fireEvent(field, 'focus');
      for (const partial of ['', '-', '-1']) {
        fireEvent.changeText(field, partial);
      }
    });
    expect(screen.getByLabelText(strings.preferences.numeric.tempMinLabel).props.value).toBe('-1');
    expect(onChange).not.toHaveBeenCalled();

    // Só ao completar e sair o valor final é reportado, sem aviso de ajuste.
    await act(async () => {
      fireEvent.changeText(field, '-10');
    });
    await act(async () => {
      fireEvent(field, 'blur');
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(-10);
    expect(
      screen.queryByText(strings.preferences.numeric.clamped(`${TEMP_MIN_C}°C`)),
    ).not.toBeOnTheScreen();
  });

  it('o aviso de ajuste desaparece depois de um instante', async () => {
    await render(<NumericStepperInput {...humidity} value={70} onChange={jest.fn()} />);

    await typeAndLeave(await screen.findByLabelText(humidity.accessibilityLabel), '5');

    const notice = strings.preferences.numeric.clamped(`${HUMIDITY_MIN}%`);
    expect(screen.getByText(notice)).toBeOnTheScreen();

    await waitFor(() => expect(screen.queryByText(notice)).not.toBeOnTheScreen(), {
      timeout: 2500,
    });
  });
});

describe('NumericRangeInput', () => {
  const range = {
    min: TEMP_MIN_C,
    max: TEMP_MAX_C,
    unit: '°C',
    hint: strings.preferences.tempFeeling(18, 26),
  };

  it('cada ponta move só o seu valor', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<NumericRangeInput {...range} value={[18, 26]} onChange={onChange} />);

    await user.press(
      await screen.findByRole('button', {
        name: strings.preferences.numeric.increase(strings.preferences.numeric.tempMaxField),
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith([18, 27]);

    await user.press(
      screen.getByRole('button', {
        name: strings.preferences.numeric.decrease(strings.preferences.numeric.tempMinField),
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith([17, 26]);
  });

  it('sem erro mostra a leitura natural da faixa', async () => {
    await render(<NumericRangeInput {...range} value={[18, 26]} onChange={jest.fn()} />);

    expect(await screen.findByText(strings.preferences.tempFeeling(18, 26))).toBeOnTheScreen();
  });

  it('erro da validação substitui a leitura e aparece uma vez', async () => {
    const message = 'A faixa precisa ter pelo menos 4 °C de amplitude.';
    await render(
      <NumericRangeInput {...range} error={message} value={[20, 22]} onChange={jest.fn()} />,
    );

    expect(await screen.findAllByText(message)).toHaveLength(1);
    expect(screen.queryByText(range.hint)).not.toBeOnTheScreen();
  });
});
