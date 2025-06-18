import type { Metadata } from 'next'
import './globals.css'
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'Sentiment Analyzer',
  description: 'Analyze message sentiments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}