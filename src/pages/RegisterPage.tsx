import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Navigate, useLocation, type Path } from 'react-router-dom';
import { RegistrationForm } from '../components/RegistrationForm';
import { useSession } from '../hooks/useSession';
import { useShowToast } from '../hooks/useShowToast';
import { paths } from '../routes/paths';
import type { RegisterResponse } from '../types';

function readReturnLocation(state: unknown): Partial<Path> | null {
  const from: unknown =
    typeof state === 'object' && state !== null && 'from' in state
      ? state.from
      : null;
  if (typeof from !== 'object' || from === null) return null;
  const { pathname, search, hash } = from as Record<string, unknown>;
  return typeof pathname === 'string' &&
    typeof search === 'string' &&
    typeof hash === 'string'
    ? { pathname, search, hash }
    : null;
}

export function RegisterPage() {
  const { user, startSession } = useSession();
  const location = useLocation();
  const showToast = useShowToast();

  if (user) {
    const returnLocation = readReturnLocation(location.state) ?? {
      pathname: paths.home,
      search: location.search,
      hash: location.hash,
    };
    return <Navigate to={returnLocation} replace />;
  }

  function handleRegistered({ user: registeredUser, token }: RegisterResponse) {
    const isPersisted = startSession(registeredUser, token);
    if (isPersisted) {
      showToast({
        severity: 'success',
        message: "You're registered and signed in.",
      });
      return;
    }
    showToast({
      severity: 'warning',
      message:
        "You're registered, but the session cookie couldn't be saved, so reloading will sign you out.",
    });
  }

  return (
    <Container maxWidth="xs" disableGutters>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Create an account
        </Typography>
        <Typography color="textSecondary" sx={{ mb: 3 }}>
          A mock sign-up: no real account is created.
        </Typography>
        <RegistrationForm onRegistered={handleRegistered} />
      </Paper>
    </Container>
  );
}
