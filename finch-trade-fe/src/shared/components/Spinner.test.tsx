import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Spinner from './Spinner';

describe('Spinner', () => {
  it('fills its available width as a square by default', () => {
    render(<Spinner />);

    const spinner = screen.getByRole('status', { name: 'Loading' });
    expect(spinner).toHaveStyle({
      width: '100%',
      height: '100%',
      aspectRatio: '1 / 1',
      flex: 'none',
    });
  });

  it('accepts a programmatically specified numeric size in pixels', () => {
    render(<Spinner size={32} label="Loading items" />);

    expect(screen.getByRole('status', { name: 'Loading items' })).toHaveStyle({
      width: '32px',
      height: '32px',
      aspectRatio: '1 / 1',
      flex: 'none',
    });
  });

  it('accepts a CSS size string', () => {
    render(<Spinner size="3rem" />);

    expect(screen.getByRole('status', { name: 'Loading' })).toHaveStyle({
      width: '3rem',
      height: '3rem',
    });
  });
});
