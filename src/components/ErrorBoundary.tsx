import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export function ErrorBoundary() {
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
