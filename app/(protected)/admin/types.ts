export type AdminTab =
  | 'members'
  | 'posts'
  | 'reports'
  | 'reviews'
  | 'manager-approval'
  | 'system-notification'
  | 'popup';

export interface PopupFormState {
  title: string;
  content: string;
  image_url: string;
  link_url: string;
  link_text: string;
  is_active: boolean;
}
