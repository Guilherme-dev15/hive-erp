import { describe, expect, it } from 'vitest';
import { normalizeApiBaseUrl } from './apiUrl';

describe('normalizeApiBaseUrl', () => {
  it.each([
    ['https://api.example.com', 'https://api.example.com'],
    ['https://api.example.com/', 'https://api.example.com'],
    ['https://api.example.com/api', 'https://api.example.com'],
    ['https://api.example.com/api/', 'https://api.example.com'],
    ['http://localhost:3005', 'http://localhost:3005'],
    ['', ''],
    [undefined, ''],
  ])('normaliza %s para %s', (input, expected) => {
    expect(normalizeApiBaseUrl(input)).toBe(expected);
  });

  it('não duplica o prefixo /api/v2 usado pelos endpoints', () => {
    const baseUrl = normalizeApiBaseUrl('https://api.example.com/api');
    expect(`${baseUrl}/api/v2/products`).toBe(
      'https://api.example.com/api/v2/products'
    );
  });
});
