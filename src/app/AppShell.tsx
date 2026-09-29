import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
import { Link as RouterLink, NavLink, Outlet } from 'react-router-dom';

// Root layout for every route: the header (later tickets add the session
// controls next to the nav) and the main content column.
export function AppShell() {
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
            <Box component="nav" aria-label="Main" sx={{ mr: -1 }}>
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
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <Outlet />
      </Container>
    </>
  );
}
