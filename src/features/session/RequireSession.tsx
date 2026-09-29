import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from './session';

// Layout route for protected pages: unauthenticated visitors go to /register,
// carrying the requested location so registration can return them to it.
export function RequireSession() {
  const { user } = useSession();
  const { pathname, search, hash } = useLocation();
  if (!user) {
    return (
      <Navigate
        to="/register"
        replace
        state={{ from: { pathname, search, hash } }}
      />
    );
  }
  return <Outlet />;
}
