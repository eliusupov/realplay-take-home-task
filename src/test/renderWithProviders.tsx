import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
  createMemoryRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';
import { SessionProvider } from '../context/SessionProvider';
import { appRoutes } from '../routes/appRoutes';
import { theme } from '../theme';
import type { RegisteredUser } from '../types';
import { writeSessionCookie } from '../utils/session';

interface RenderOptions {
  url?: string;
  routes?: ReactNode;
  signedInAs?: RegisteredUser;
}

export function renderWithProviders({
  url = '/',
  routes,
  signedInAs,
}: RenderOptions = {}) {
  if (signedInAs) writeSessionCookie(signedInAs);
  const router = createMemoryRouter(
    routes ? createRoutesFromElements(routes) : appRoutes,
    { initialEntries: [url] },
  );
  return {
    user: userEvent.setup(),
    router,
    ...render(
      <QueryClientProvider client={new QueryClient()}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SessionProvider>
            <RouterProvider router={router} />
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    ),
  };
}
