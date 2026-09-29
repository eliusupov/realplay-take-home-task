import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { useSession } from '../features/session/session';

export function HomePage() {
  const { user } = useSession();

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
      {!user && (
        <Button
          component={RouterLink}
          to="/register"
          variant="contained"
          size="large"
          sx={{ mt: 4 }}
        >
          Register
        </Button>
      )}
    </>
  );
}
