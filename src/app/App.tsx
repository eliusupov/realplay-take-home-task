import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ModalProvider } from '../features/modals/ModalProvider';
import { RequireSessionForModals } from '../features/modals/RequireSessionForModals';
import { RequireSession } from '../features/session/RequireSession';
import { SessionProvider } from '../features/session/SessionProvider';
import { AccountPage } from '../pages/AccountPage';
import { HomePage } from '../pages/HomePage';
import { RegisterPage } from '../pages/RegisterPage';
import { AppShell } from './AppShell';
import { theme } from './theme';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    // The modal provider needs the router (closing a modal edits the URL);
    // the shell renders the modal sync and renderer, so it sits inside the provider.
    element: (
      <ModalProvider>
        <AppShell />
      </ModalProvider>
    ),
    children: [
      { path: 'register', element: <RegisterPage /> },
      {
        element: <RequireSessionForModals />,
        children: [
          { index: true, element: <HomePage /> },
          {
            element: <RequireSession />,
            children: [{ path: 'account', element: <AccountPage /> }],
          },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
