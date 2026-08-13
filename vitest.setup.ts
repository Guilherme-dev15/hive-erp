// importa os matchers do jest-dom, como toBeInTheDocument()
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock para o método scrollTo que não existe no JSDOM
window.scrollTo = vi.fn();

