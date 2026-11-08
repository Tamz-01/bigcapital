export type InviteEmailStatus =
  | 'sent'
  | 'offline'
  | 'not_configured'
  | 'failed';

export interface InviteEmailDelivery {
  status: InviteEmailStatus;
  message: string;
}

export interface InvitationAccessDetails {
  email: string;
  acceptUrl: string;
  loginUrl: string;
  expiresInHours: number;
  emailDelivery: InviteEmailDelivery;
}
