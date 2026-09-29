import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import Toolbar from '@mui/material/Toolbar';
import { useState } from 'react';
import {
  Link as RouterLink,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import { useSession } from '../features/session/session';
import { ToastContext, type Toast } from '../shared/toast';

// Root layout for every route: the header and the main content column. It
// also owns the toast, so a toast shown by a page survives that page unmounting.
export function AppShell() {
  const { user, endSession } = useSession();
  const navigate = useNavigate();
  const [toast, setToast] = useState<Toast | null>(null);
  const [isToastOpen, setIsToastOpen] = useState(false);

  function showToast(nextToast: Toast) {
    setToast(nextToast);
    setIsToastOpen(true);
  }

  function logOut() {
    // Leave the protected page first, so its guard never sees the signed-out state.
    void navigate('/', { flushSync: true });
    endSession();
    setIsToastOpen(false); // A toast about the ended session is stale.
  }

  return (
    <>
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Container maxWidth="md">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Link
              component={RouterLink}
              to="/"
              variant="h6"
              color="inherit"
              underline="none"
            >
              Realplay
            </Link>
            {/* Negative margin aligns the button text, not its padding, with the content edge. */}
            <Box
              component="nav"
              aria-label="Main"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: -1 }}
            >
              <Button
                component={NavLink}
                to="/"
                end
                sx={{
                  "&[aria-current='page']": { bgcolor: 'action.selected' },
                }}
              >
                Home
              </Button>
              {user && (
                <>
                  <Button onClick={logOut}>Log out</Button>
                  <IconButton
                    component={RouterLink}
                    to="/account"
                    aria-label={`Account (${user.email})`}
                    size="small"
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'primary.main',
                        fontSize: '1rem',
                      }}
                    >
                      {user.email.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <ToastContext.Provider value={showToast}>
          <Outlet />
        </ToastContext.Provider>
      </Container>
      <Snackbar
        open={isToastOpen}
        autoHideDuration={toast?.severity === 'success' ? 6000 : null}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') setIsToastOpen(false);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.severity}
          variant="filled"
          onClose={() => {
            setIsToastOpen(false);
          }}
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
