import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from './context/SessionProvider';
import { AppRouter } from './routes/AppRouter';
import { theme } from './theme';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionProvider>
          <AppRouter />
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
