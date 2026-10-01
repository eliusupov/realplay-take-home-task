import { createRoutesFromElements, Route } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Layout } from '../components/Layout';
import { ModalProvider } from '../context/ModalProvider';
import { AccountPage } from '../pages/AccountPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RegisterPage } from '../pages/RegisterPage';
import { paths } from './paths';
import { RequireSession } from './RequireSession';
import { RequireSessionForModals } from './RequireSessionForModals';

export const appRoutes = createRoutesFromElements(
  <Route
    element={
      <ModalProvider>
        <Layout />
      </ModalProvider>
    }
    errorElement={<ErrorBoundary />}
  >
    <Route path={paths.register} element={<RegisterPage />} />
    <Route element={<RequireSessionForModals />}>
      <Route index element={<HomePage />} />
      <Route element={<RequireSession />}>
        <Route path={paths.account} element={<AccountPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Route>,
);
