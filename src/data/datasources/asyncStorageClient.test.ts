import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '../logger';
import { createAsyncStorageClient } from './asyncStorageClient';

describe('asyncStorageClient', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('faz roundtrip de JSON tipado', async () => {
    const client = createAsyncStorageClient();

    await client.setJson('teste:v1', { answer: 42 });

    await expect(client.getJson<{ answer: number }>('teste:v1')).resolves.toEqual({
      answer: 42,
    });
  });

  it('chave ausente resolve null', async () => {
    const client = createAsyncStorageClient();

    await expect(client.getJson('nada:v1')).resolves.toBeNull();
  });

  it('JSON inválido gravado vira null com aviso, nunca crash', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    await AsyncStorage.setItem('podre:v1', '{quebrado');
    const client = createAsyncStorageClient();

    await expect(client.getJson('podre:v1')).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('remove apaga a chave', async () => {
    const client = createAsyncStorageClient();
    await client.setJson('temp:v1', 1);

    await client.remove('temp:v1');

    await expect(client.getJson('temp:v1')).resolves.toBeNull();
  });
});
