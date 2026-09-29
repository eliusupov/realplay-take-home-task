import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from './session';

// Replaces the current location with /register, carrying it as router state
// `from` so registration can return to it.
export function RedirectToRegister() {
  const { pathname, search, hash } = useLocation();
  return (
    <Navigate
      to="/register"
      replace
      state={{ from: { pathname, search, hash } }}
    />
  );
}

// Layout route for protected pages.
export function RequireSession() {
  const { user } = useSession();
  return user ? <Outlet /> : <RedirectToRegister />;
}
