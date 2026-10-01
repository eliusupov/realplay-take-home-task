import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { RegistrationForm } from '../components/RegistrationForm';
import { useSession } from '../hooks/useSession';
import { useShowToast } from '../hooks/useShowToast';
import { paths } from '../routes/paths';
import type { RegisterResponse } from '../types';
import { readModals } from '../utils/modals';
import {
  forgetReturnLocation,
  readRememberedReturnLocation,
  rememberReturnLocation,
  toReturnLocation,
} from '../utils/returnLocation';

function readFrom(state: unknown) {
  return typeof state === 'object' && state !== null && 'from' in state
    ? toReturnLocation(state.from)
    : null;
}

function homeWithOwnQuery({ search, hash }: Location) {
  return { pathname: paths.home, search, hash };
}

function readLinkedLocation(location: Location) {
  const hasModalTriggers = readModals(location.search).length > 0;
  return (
    readFrom(location.state) ??
    (hasModalTriggers ? homeWithOwnQuery(location) : null)
  );
}

export function RegisterPage() {
  const { user, startSession } = useSession();
  const location = useLocation();
  const showToast = useShowToast();
  const [rememberedLocation] = useState(readRememberedReturnLocation);
  const linkedLocation = readLinkedLocation(location);

  useEffect(
    function rememberWhereToReturnUntilRegistered() {
      if (user) forgetReturnLocation();
      else if (linkedLocation) rememberReturnLocation(linkedLocation);
    },
    [user, linkedLocation],
  );

  if (user) {
    const returnLocation =
      linkedLocation ?? rememberedLocation ?? homeWithOwnQuery(location);
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
