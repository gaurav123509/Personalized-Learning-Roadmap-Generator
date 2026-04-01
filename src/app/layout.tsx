import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personalized Learning Roadmap Generator',
  description: 'Generate a personalized learning roadmap tailored to your goals and preferences',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
