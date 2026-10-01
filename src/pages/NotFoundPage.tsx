import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { paths } from '../routes/paths';

export function NotFoundPage() {
  const { search } = useLocation();

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Page not found
      </Typography>
      <Button
        component={RouterLink}
        to={{ pathname: paths.home, search }}
        variant="contained"
      >
        Go to home
      </Button>
    </>
  );
}
