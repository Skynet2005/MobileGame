import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ChatProvider } from '@/chat/ChatProvider';
import TopBar from '@/ui/TopBar';
import BottomBar from '@/ui/BottomBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Game Project',
  description: 'A multiplayer game project',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ChatProvider>
        <body className={inter.className}>
          {/* Full height flex container */}
          <div className="flex flex-col h-screen">
            {/* Top Bar */}
            <TopBar />
            {/* Main content */}
            <div className="flex flex-1">
              <main className="flex-1 relative">
                {children}
              </main>
            </div>

            {/* Bottom Bar */}
            <BottomBar />
          </div>
        </body>
      </ChatProvider>
    </html>
  );
}
