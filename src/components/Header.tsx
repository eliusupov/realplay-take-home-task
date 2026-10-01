import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import { readModals } from '../utils/modals';

const alignButtonTextWithContentEdge = { mr: -1 };

export function Header({ onLogOut }: { onLogOut: () => void }) {
  const { user } = useSession();
  const { search } = useLocation();
  const canLeaveRegistration = Boolean(user) || readModals(search).length === 0;

  const renderLogo = () => {
    if (!canLeaveRegistration)
      return (
        <Typography variant="h6" component="span">
          Realplay
        </Typography>
      );
    return (
      <Link
        component={RouterLink}
        to={{ pathname: paths.home, search }}
        variant="h6"
        color="inherit"
        underline="none"
      >
        Realplay
      </Link>
    );
  };

  const renderHomeButton = () => {
    if (!canLeaveRegistration) return null;
    return (
      <Button
        component={NavLink}
        to={{ pathname: paths.home, search }}
        end
        sx={{
          "&[aria-current='page']": { bgcolor: 'action.selected' },
        }}
      >
        Home
      </Button>
    );
  };

  const renderSignedInActions = () => {
    if (!user) return null;
    return (
      <>
        <Button onClick={onLogOut}>Log out</Button>
        <IconButton
          component={RouterLink}
          to={{ pathname: paths.account, search }}
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
    );
  };

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Container maxWidth="md">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {renderLogo()}
          <Box
            component="nav"
            aria-label="Main"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ...alignButtonTextWithContentEdge,
            }}
          >
            {renderHomeButton()}
            {renderSignedInActions()}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
