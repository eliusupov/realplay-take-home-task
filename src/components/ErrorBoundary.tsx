import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import {
  isRouteErrorResponse,
  Link as RouterLink,
  useRouteError,
} from 'react-router-dom';
import { paths } from '../routes/paths';

export function ErrorBoundary() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  if (isNotFound) {
    return (
      <Container component="main" maxWidth="sm" sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Page not found
        </Typography>
        <Button component={RouterLink} to={paths.home} variant="contained">
          Go to home
        </Button>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Something went wrong
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          location.reload();
        }}
      >
        Reload
      </Button>
    </Container>
  );
}
