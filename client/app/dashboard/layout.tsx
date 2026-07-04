import { Metadata } from 'next';
import DashboardClientLayout from './DashboardClientLayout';

export const metadata: Metadata = {
  title: 'Dashboard | Dooars Tutors',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
