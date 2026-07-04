import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search | Dooars Tutors',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
