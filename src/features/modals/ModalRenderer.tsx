import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useSession } from '../session/session';
import { useModals, type Modal } from './modals';

// A value from the link, shown as plain text; long values wrap.
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

function describeModal(modal: Modal): { title: string; content: ReactNode } {
  switch (modal.type) {
    case 'welcome':
      return {
        title: 'Welcome',
        content: (
          <DialogContentText>
            Welcome to Realplay. You&apos;re signed in to this demo.
          </DialogContentText>
        ),
      };
    case 'promo':
      return {
        title: 'Promo code',
        content: (
          <>
            <DialogContentText>Your link included this code:</DialogContentText>
            <LinkValue>{modal.params.code}</LinkValue>
            <DialogContentText>
              This is demo content: no promotion is applied.
            </DialogContentText>
          </>
        ),
      };
    case 'invite':
      return {
        title: 'Invitation',
        content: (
          <>
            <DialogContentText>You were invited by:</DialogContentText>
            <LinkValue>{modal.params.friendId}</LinkValue>
            <DialogContentText>
              This is demo content: the ID comes from your link.
            </DialogContentText>
          </>
        ),
      };
    case 'registration':
      return {
        title: 'Registration',
        content: (
          <DialogContentText>
            This is a placeholder. Its content has not been defined yet.
          </DialogContentText>
        ),
      };
  }
}

// The one modal renderer: signed-in visitors see the first entry only, so there
// is one dialog, one backdrop and one focus trap. Closing reveals the next.
export function ModalRenderer() {
  const { user } = useSession();
  const { modals, closeModal } = useModals();
  const modal = modals[0];
  if (!user || !modal) return null;

  const { title, content } = describeModal(modal);
  const close = () => {
    closeModal(modal.type);
  };

  // Keyed by type: the next modal mounts as a new dialog, so it is announced
  // and focused on its own.
  return (
    <Dialog key={modal.type} open onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
