import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';
import { registerUser } from '../api/register';
import type { RegisterResponse } from '../types';
import {
  MIN_PASSWORD_LENGTH,
  validateRegistration,
  type RegistrationErrors,
} from '../utils/validation';

export function RegistrationForm({
  onRegistered,
}: {
  onRegistered: (response: RegisterResponse) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const registration = useMutation({ mutationFn: registerUser });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (registration.isPending) return;
    const nextErrors = validateRegistration({ email, password });
    setErrors(nextErrors);
    if (nextErrors.email) emailRef.current?.focus();
    else if (nextErrors.password) passwordRef.current?.focus();
    else {
      const callbacksSkippedAfterUnmount = { onSuccess: onRegistered };
      registration.mutate({ email, password }, callbacksSkippedAfterUnmount);
    }
  }

  const renderRequestError = () => {
    if (!registration.isError) return null;
    return <Alert severity="error">{registration.error.message}</Alert>;
  };

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit} spacing={2.5}>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        fullWidth
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setErrors({ ...errors, email: undefined });
        }}
        error={Boolean(errors.email)}
        helperText={errors.email}
        inputRef={emailRef}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        fullWidth
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setErrors({ ...errors, password: undefined });
        }}
        error={Boolean(errors.password)}
        helperText={
          errors.password ??
          `At least ${String(MIN_PASSWORD_LENGTH)} characters.`
        }
        inputRef={passwordRef}
      />
      {renderRequestError()}
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        loading={registration.isPending}
        loadingPosition="start"
      >
        Register
      </Button>
    </Stack>
  );
}
