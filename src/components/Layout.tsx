import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import { useLayoutEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ToastContext } from '../context/ToastContext';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import {
  captureAttribution,
  pauseCaptureUntilReload,
} from '../utils/attribution';
import { Header } from './Header';
import { ModalRenderer } from './ModalRenderer';
import { ModalUrlSync } from './ModalUrlSync';

const SUCCESS_TOAST_DURATION_MS = 6000;

export function Layout() {
  const { user, endSession } = useSession();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  useLayoutEffect(
    function captureAttributionBeforeRedirect() {
      if (!user) captureAttribution(search);
    },
    [user, search],
  );

  function showToast(message: string) {
    setToastMessage(message);
    setIsToastOpen(true);
  }

  function leaveProtectedPageBeforeSessionEnds() {
    void navigate({ pathname: paths.home, search }, { flushSync: true });
  }

  function logOut() {
    pauseCaptureUntilReload();
    leaveProtectedPageBeforeSessionEnds();
    endSession();
    setIsToastOpen(false);
  }

  return (
    <>
      <Header onLogOut={logOut} />
      <Container component="main" maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <ToastContext.Provider value={showToast}>
          <Outlet />
        </ToastContext.Provider>
      </Container>
      <ModalUrlSync />
      <ModalRenderer />
      <Snackbar
        open={isToastOpen}
        autoHideDuration={SUCCESS_TOAST_DURATION_MS}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') setIsToastOpen(false);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => {
            setIsToastOpen(false);
          }}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
