// 'use client';

// import { ThemeProvider as NextThemeProvider } from 'next-themes';

// export function ThemeProvider({ children }: { children: React.ReactNode }) {
//   return (
//     <NextThemeProvider
//       attribute="class"
//       defaultTheme="system"
//       enableSystem
//       storageKey="dooars-theme"
//       disableTransitionOnChange
//     >
//       {children}
//     </NextThemeProvider>
//   );
// }




'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"          // ✅ Kept: dark as default (your new design choice)
      enableSystem={true}          // ✅ Restored: respects OS dark/light preference
      storageKey="dooars-theme"
      disableTransitionOnChange    // ✅ Restored: prevents the flash/flicker on theme switch
    >
      {children}
    </NextThemeProvider>
  );
}