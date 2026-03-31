import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'قوام - Qwaam',
  description: 'منظومة قوام الرياضية - Qwaam Fitness Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}