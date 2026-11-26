import { describe, expect, it } from 'vitest';
import { normalizeBrazilPhoneToE164, validateRegistrationEmail } from './authValidation';

describe('authValidation', () => {
  describe('validateRegistrationEmail', () => {
    it('aceita e-mails válidos e permanentes', () => {
      expect(validateRegistrationEmail('guilherme@hiveerp.com.br')).toEqual({ valid: true });
      expect(validateRegistrationEmail(' Loja.Pratas+1@gmail.com ')).toEqual({ valid: true });
    });

    it('rejeita e-mails malformados ou com pontos consecutivos', () => {
      expect(validateRegistrationEmail('sem-arroba')).toMatchObject({ valid: false });
      expect(validateRegistrationEmail('usuario@dominio')).toMatchObject({ valid: false });
      expect(validateRegistrationEmail('a..b@gmail.com')).toMatchObject({ valid: false });
      expect(validateRegistrationEmail('teste@empresa.c')).toMatchObject({ valid: false });
    });

    it('rejeita domínios descartáveis/temporários', () => {
      expect(validateRegistrationEmail('teste@mailinator.com')).toMatchObject({
        valid: false,
        reason: expect.stringMatching(/temporários/i),
      });
      expect(validateRegistrationEmail('loja@YOPMAIL.com')).toMatchObject({
        valid: false,
      });
    });
  });

  describe('normalizeBrazilPhoneToE164', () => {
    it('normaliza números brasileiros com ou sem DDI para E.164', () => {
      expect(normalizeBrazilPhoneToE164('(11) 99999-8888')).toBe('+5511999998888');
      expect(normalizeBrazilPhoneToE164('1133334444')).toBe('+551133334444');
      expect(normalizeBrazilPhoneToE164('5511978399326')).toBe('+5511978399326');
      expect(normalizeBrazilPhoneToE164('+55 (21) 98888-7777')).toBe('+5521988887777');
      expect(normalizeBrazilPhoneToE164('+14155552671')).toBe('+14155552671');
    });

    it('rejeita números inválidos ou DDD inválido', () => {
      expect(normalizeBrazilPhoneToE164('')).toBeNull();
      expect(normalizeBrazilPhoneToE164('12345')).toBeNull();
      expect(normalizeBrazilPhoneToE164('00999998888')).toBeNull();
    });
  });
});
