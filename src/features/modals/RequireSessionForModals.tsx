import { Outlet, useLocation } from 'react-router-dom';
import { RedirectToRegister } from '../session/RequireSession';
import { useSession } from '../session/session';
import { readModals } from './modals';

// Layout route for every page except /register: a modal link opened while
// signed out goes to registration first, then returns here.
export function RequireSessionForModals() {
  const { user } = useSession();
  const { search } = useLocation();
  if (!user && readModals(search).length > 0) return <RedirectToRegister />;
  return <Outlet />;
}
