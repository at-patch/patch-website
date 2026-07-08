export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}
