import { Metadata } from 'next';
import AdminClientLayout from './AdminClientLayout';

export const metadata: Metadata = {
  title: 'Admin Panel | Dooars Tutors',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
