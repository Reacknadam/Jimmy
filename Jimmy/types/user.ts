export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'formateur' | 'utilisateur';
}