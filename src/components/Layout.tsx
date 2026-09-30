import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import { useLayoutEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ToastContext, type Toast } from '../context/ToastContext';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import {
  captureAttribution,
  isAttributionPersistent,
} from '../utils/attribution';
import { Header } from './Header';
import { ModalRenderer } from './ModalRenderer';
import { ModalUrlSync } from './ModalUrlSync';

const SUCCESS_TOAST_DURATION_MS = 6000;

export function Layout() {
  const { user, endSession } = useSession();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [toast, setToast] = useState<Toast | null>(null);
  const [isToastOpen, setIsToastOpen] = useState(false);

  useLayoutEffect(
    function captureAttributionBeforeRedirect() {
      if (!user) captureAttribution(search);
    },
    [user, search],
  );

  function showToast(nextToast: Toast) {
    setToast(nextToast);
    setIsToastOpen(true);
  }

  function leaveProtectedPageBeforeSessionEnds() {
    void navigate(paths.home, { flushSync: true });
  }

  function logOut() {
    leaveProtectedPageBeforeSessionEnds();
    endSession();
    setIsToastOpen(false);
  }

  const toastAutoHideMs =
    toast?.severity === 'success' ? SUCCESS_TOAST_DURATION_MS : null;

  const renderStorageWarning = () => {
    if (isAttributionPersistent) return null;
    return (
      <Alert severity="warning" role="status" sx={{ mb: 3 }}>
        This browser is not saving site data, so campaign details from this
        visit are kept only until you reload or leave the page.
      </Alert>
    );
  };

  return (
    <>
      <Header onLogOut={logOut} />
      <Container component="main" maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        {renderStorageWarning()}
        <ToastContext.Provider value={showToast}>
          <Outlet />
        </ToastContext.Provider>
      </Container>
      <ModalUrlSync />
      <ModalRenderer />
      <Snackbar
        open={isToastOpen}
        autoHideDuration={toastAutoHideMs}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') setIsToastOpen(false);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.severity}
          variant="filled"
          onClose={() => {
            setIsToastOpen(false);
          }}
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
