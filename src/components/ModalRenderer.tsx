import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useModals } from '../hooks/useModals';
import { useSession } from '../hooks/useSession';
import type { ModalType } from '../types';

function LinkValue({ children }: { children: string }) {
  return (
    <Typography
      variant="h6"
      component="p"
      sx={{ my: 1, overflowWrap: 'anywhere' }}
    >
      {children}
    </Typography>
  );
}

const MODAL_TITLES = {
  welcome: 'Welcome',
  promo: 'Promo code',
  invite: 'Invitation',
  registration: 'Registration',
} as const satisfies Record<ModalType, string>;

export function ModalRenderer() {
  const { user } = useSession();
  const { modals, closeModal } = useModals();
  const modal = modals[0];
  if (!user || !modal) return null;

  const close = () => {
    closeModal(modal.type);
  };

  const renderModalContent = () => {
    switch (modal.type) {
      case 'welcome':
        return (
          <DialogContentText>
            Welcome to Realplay. You&apos;re signed in to this demo.
          </DialogContentText>
        );
      case 'promo':
        return (
          <>
            <DialogContentText>Your link included this code:</DialogContentText>
            <LinkValue>{modal.params.code}</LinkValue>
            <DialogContentText>
              This is demo content: no promotion is applied.
            </DialogContentText>
          </>
        );
      case 'invite':
        return (
          <>
            <DialogContentText>You were invited by:</DialogContentText>
            <LinkValue>{modal.params.friendId}</LinkValue>
            <DialogContentText>
              This is demo content: the ID comes from your link.
            </DialogContentText>
          </>
        );
      case 'registration':
        return (
          <DialogContentText>
            This is a placeholder. Its content has not been defined yet.
          </DialogContentText>
        );
    }
  };

  return (
    <Dialog key={modal.type} open onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>{MODAL_TITLES[modal.type]}</DialogTitle>
      <DialogContent>{renderModalContent()}</DialogContent>
      <DialogActions>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
