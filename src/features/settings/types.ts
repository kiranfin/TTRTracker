export type MyttStatusView = {
  hasSession: boolean;
  expired: boolean;
  label: string;
  detail: string;
};

export type MyttGrant = {
  id: string;
  granteeUserId?: string;
  granteeUsername?: string;
  scopes?: string[];
  createdAt?: string;
  expiresAt?: string | null;
};
