import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useSession } from '../hooks/useSession';

export function AccountPage() {
  const { user } = useSession();
  if (!user) return null;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Your account
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 3 }}>
        A mock account: no password is stored.
      </Typography>
      <Typography
        component="dl"
        sx={{
          m: 0,
          '& dd': { m: 0, overflowWrap: 'anywhere' },
          '& dd + dt': { mt: 2 },
        }}
      >
        <Typography component="dt" variant="body2" color="textSecondary">
          Email
        </Typography>
        <dd>{user.email}</dd>
        <Typography component="dt" variant="body2" color="textSecondary">
          User ID
        </Typography>
        <dd>{user.id}</dd>
      </Typography>
    </Paper>
  );
}
