import { describe, it, expect } from 'vitest';
import { render, screen } from '../tests/utils/test-utils';
import { Button } from './ui/button';

/**
 * Example unit test
 * 
 * This is a placeholder test to verify Vitest and React Testing Library setup.
 * Replace with actual tests based on plan-testow.md
 */

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });
});
