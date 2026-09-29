import Typography from '@mui/material/Typography';

export function HomePage() {
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
    </>
  );
}
