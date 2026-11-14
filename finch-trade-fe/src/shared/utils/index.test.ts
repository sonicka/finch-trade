import { describe, expect, it } from 'vitest';
import { getColorSwatchStyle } from './index';

describe('getColorSwatchStyle', () => {
  it('uses the named base color as a solid swatch', () => {
    expect(getColorSwatchStyle('Cozy Green')).toEqual({
      backgroundColor: 'green',
    });
  });

  it('uses a rainbow gradient for any color', () => {
    expect(getColorSwatchStyle('any').background).toContain('linear-gradient');
  });

  it('uses a gray gradient when no base color is recognized', () => {
    const style = getColorSwatchStyle('Mysterious Shade');
    expect(style.background).toContain('linear-gradient');
    expect(style.background).toContain('#6b7280');
  });
});
