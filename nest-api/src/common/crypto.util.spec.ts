import { decryptSecret, encryptSecret } from './crypto.util';

describe('crypto.util (AES-256-GCM)', () => {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevKey = process.env.GATEWAY_TOKEN_ENCRYPTION_KEY;

  afterEach(() => {
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;

    if (prevKey === undefined) delete process.env.GATEWAY_TOKEN_ENCRYPTION_KEY;
    else process.env.GATEWAY_TOKEN_ENCRYPTION_KEY = prevKey;
  });

  it('criptografa e descriptografa um token com IV aleatório', () => {
    process.env.NODE_ENV = 'test';
    process.env.GATEWAY_TOKEN_ENCRYPTION_KEY = 'chave-secreta-teste-32bytes-seguros';

    const secret = 'APP_USR-1234567890-token-mp';
    const enc1 = encryptSecret(secret);
    const enc2 = encryptSecret(secret);

    expect(enc1).toMatch(/^v1:/);
    expect(enc1).not.toEqual(enc2);
    expect(enc1).not.toContain(secret);
    expect(decryptSecret(enc1)).toBe(secret);
    expect(decryptSecret(enc2)).toBe(secret);
  });

  it('falha fechado em produção se GATEWAY_TOKEN_ENCRYPTION_KEY não estiver definida', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.GATEWAY_TOKEN_ENCRYPTION_KEY;

    expect(() => encryptSecret('APP_USR-123')).toThrow(
      'GATEWAY_TOKEN_ENCRYPTION_KEY não configurada em produção',
    );
  });

  it('rejeita ciphertext adulterado ou malformado', () => {
    process.env.NODE_ENV = 'test';
    process.env.GATEWAY_TOKEN_ENCRYPTION_KEY = 'chave-secreta-teste-32bytes-seguros';

    const enc = encryptSecret('APP_USR-segredo');
    const parts = enc.split(':');
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:AAAA`;

    expect(() => decryptSecret(tampered)).toThrow();
    expect(() => decryptSecret('formato-invalido')).toThrow('Formato de segredo criptografado inválido');
  });
});
