import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function that includes providers
 * 
 * Use this instead of the default render from @testing-library/react
 * to include any global providers (e.g., theme, context providers)
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, {
    ...options,
  });
};

export * from '@testing-library/react';
export { customRender as render };
