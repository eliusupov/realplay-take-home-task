import { Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { readModals } from '../utils/modals';
import { RedirectToRegister } from './RequireSession';

export function RequireSessionForModals() {
  const { user } = useSession();
  const { search } = useLocation();
  const hasModalTriggers = readModals(search).length > 0;
  if (!user && hasModalTriggers) return <RedirectToRegister />;
  return <Outlet />;
}
