import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';

export function HomePage() {
  const { user } = useSession();
  const { search } = useLocation();

  const renderRegisterButton = () => {
    if (user) return null;
    return (
      <Button
        component={RouterLink}
        to={{ pathname: paths.register, search }}
        variant="contained"
        size="large"
        sx={{ mt: 4 }}
      >
        Register
      </Button>
    );
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Registration with attribution and redirect
      </Typography>
      <Typography color="textSecondary" sx={{ maxWidth: '65ch' }}>
        This demo keeps the campaign tags from your first visit for 30 days,
        sends them with sign-up, and returns you to the page you started from.
        The backend is a mock, so no real accounts are created.
      </Typography>
      {renderRegisterButton()}
    </>
  );
}
