// import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google';
// import './globals.css';
// import Navbar from '@/components/layout/Navbar';
// import { Toaster } from '@/components/ui/sonner';
// import AuthProvider from '@/components/AuthProvider';
// import { ThemeProvider } from '@/components/ThemeProvider';

// const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
// const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// export const metadata: Metadata = {
//   title: 'Dooars Tutors — Find Tutors & Trainers Near You',
//   description: 'Discover private tutors, coaching centers, sports trainers, and more in the Dooars region.',
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
//         <ThemeProvider>
//           <AuthProvider>
//             <Navbar />
//             {children}
//             <Toaster />
//           </AuthProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/sonner';
import AuthProvider from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dooars Tutors — Find Tutors & Trainers Near You',
  description: 'Discover private tutors, coaching centers, sports trainers, and more in the Dooars region.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ✅ Fixed: removed className="dark" — next-themes adds/removes this itself
    // based on the stored preference. Hardcoding it breaks the toggle.
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}