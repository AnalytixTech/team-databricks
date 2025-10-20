import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router';

// Create a custom render function that includes providers
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options });
}

// Render with router for components that need routing context
export function renderWithRouter(ui: ReactElement, options?: { initialEntries?: string[] }) {
  const rootRoute = createRootRoute({
    component: () => ui,
  });

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({
      initialEntries: options?.initialEntries || ['/'],
    }),
  });

  return render(<RouterProvider router={router} />);
}

export * from '@testing-library/react';
export { customRender as render };

