import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { paths } from '../routes/paths';

export function NotFoundPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Page not found
      </Typography>
      <Button component={RouterLink} to={paths.home} variant="contained">
        Go to home
      </Button>
    </>
  );
}
