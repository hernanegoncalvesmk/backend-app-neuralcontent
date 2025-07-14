/**
 * Setup global para testes unitários
 * Configurações globais aplicadas antes de cada teste
 */

// Configuração de timezone
process.env.TZ = 'UTC';

// Configuração de environment para testes
process.env.NODE_ENV = 'test';

// Mock de console para testes mais limpos (opcional)
global.console = {
  ...console,
  // Mantém log e error para debugging
  log: jest.fn(console.log),
  error: jest.fn(console.error),
  warn: jest.fn(console.warn),
  info: jest.fn(console.info),
  debug: jest.fn(),
};

// Configurações globais de timeout
jest.setTimeout(30000);

// Extensões globais para matchers do Jest
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
});
