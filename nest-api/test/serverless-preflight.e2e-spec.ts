import { IncomingMessage, ServerResponse } from 'node:http';
import { createCorsPreflightHandler } from '../src/serverless-cors';

describe('serverless explicit CORS preflight', () => {
  it('writes a 204 response for an allowed origin', () => {
    const headers: Record<string, string> = {};
    const end = jest.fn();
    const response = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name.toLowerCase()] = value;
      }),
      statusCode: 200,
      end,
    } as unknown as ServerResponse;
    const request = {
      method: 'OPTIONS',
      headers: {
        origin: 'https://catalog.preview.example',
        'access-control-request-method': 'GET',
      },
    } as unknown as IncomingMessage;

    const handled = createCorsPreflightHandler([
      'https://catalog.preview.example',
    ])(request, response);

    expect(handled).toBe(true);
    expect(response.statusCode).toBe(204);
    expect(headers['access-control-allow-origin']).toBe('https://catalog.preview.example');
    expect(headers['access-control-allow-credentials']).toBe('true');
    expect(headers['access-control-allow-methods']).toContain('GET');
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('does not handle an unapproved origin', () => {
    const response = {
      setHeader: jest.fn(),
      statusCode: 200,
      end: jest.fn(),
    } as unknown as ServerResponse;
    const request = {
      method: 'OPTIONS',
      headers: {
        origin: 'https://not-allowed.example',
        'access-control-request-method': 'GET',
      },
    } as unknown as IncomingMessage;

    const handled = createCorsPreflightHandler([
      'https://catalog.preview.example',
    ])(request, response);

    expect(handled).toBe(false);
    expect(response.setHeader).not.toHaveBeenCalled();
    expect(response.end).not.toHaveBeenCalled();
  });
});
