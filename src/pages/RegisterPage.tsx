import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Navigate, useLocation, type Path } from 'react-router-dom';
import { RegistrationForm } from '../features/registration/RegistrationForm';
import { useSession } from '../features/session/session';
import { useShowToast } from '../shared/toast';

// Router state is app-owned (set by RequireSession), but still shape-checked.
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

  // Authenticated (just registered or an existing session): go back to where
  // the visitor started, or home with this page's own query and hash.
  if (user) {
    const returnLocation = readReturnLocation(location.state) ?? {
      pathname: '/',
      search: location.search,
      hash: location.hash,
    };
    return <Navigate to={returnLocation} replace />;
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
        <RegistrationForm
          onRegistered={({ user: registeredUser, token }) => {
            const isPersisted = startSession(registeredUser, token);
            showToast(
              isPersisted
                ? {
                    severity: 'success',
                    message: "You're registered and signed in.",
                  }
                : {
                    severity: 'warning',
                    message:
                      "You're registered, but the session cookie couldn't be saved, so reloading will sign you out.",
                  },
            );
          }}
        />
      </Paper>
    </Container>
  );
}
