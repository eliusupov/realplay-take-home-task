export interface RegisteredUser {
  id: string;
  email: string;
}

export interface Attribution {
  params: Record<string, string>;
  capturedAt: string;
}

export type Modal =
  | { type: 'welcome' }
  | { type: 'promo'; params: { code: string } }
  | { type: 'invite'; params: { friendId: string } }
  | { type: 'registration' };

export type ModalType = Modal['type'];

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: RegisteredUser;
  token: string;
}
