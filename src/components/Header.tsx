import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';

const alignButtonTextWithContentEdge = { mr: -1 };

export function Header({ onLogOut }: { onLogOut: () => void }) {
  const { user } = useSession();
  const { search } = useLocation();

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
          <Link
            component={RouterLink}
            to={{ pathname: paths.home, search }}
            variant="h6"
            color="inherit"
            underline="none"
          >
            Realplay
          </Link>
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
            {renderSignedInActions()}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
