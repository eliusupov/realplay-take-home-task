import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { paths } from './paths';

export function RedirectToRegister() {
  const { pathname, search, hash } = useLocation();
  return (
    <Navigate
      to={{ pathname: paths.register, search }}
      replace
      state={{ from: { pathname, search, hash } }}
    />
  );
}

export function RequireSession() {
  const { user } = useSession();
  if (!user) return <RedirectToRegister />;
  return <Outlet />;
}
