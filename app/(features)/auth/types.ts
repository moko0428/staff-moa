export type RoleOption = 'member' | 'pending_manager';

export type ActionState = {
  ok: boolean;
  message: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
};
