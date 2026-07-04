import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import AuthProvider from './components/AuthProvider';
import Navbar from './components/Navbar';
import DashboardBackground from './components/DashboardBackground';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata = {
  title: 'Campus Connect — Academic Communication Platform',
  description:
    'A role-based academic portal for students, faculty, and administrators. Manage calendars, announcements, groups, and clubs with secure, permission-aware interfaces.',
  keywords: 'campus, academic, communication, announcements, groups, clubs, calendar, faculty, students',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <DashboardBackground />
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
