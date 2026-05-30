import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, BarChart3, Camera, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FieldLayoutProps {
  children: ReactNode;
}

export default function FieldLayout({ children }: FieldLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Field Monitor</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Link href="/field">
            <Button
              variant="ghost"
              className="w-full flex flex-col items-center gap-1 h-auto py-3"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Monitor</span>
            </Button>
          </Link>

          <Link href="/field/capture">
            <Button
              variant="ghost"
              className="w-full flex flex-col items-center gap-1 h-auto py-3"
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs">Capture</span>
            </Button>
          </Link>

          <Link href="/field/diagnostics">
            <Button
              variant="ghost"
              className="w-full flex flex-col items-center gap-1 h-auto py-3"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Diagnose</span>
            </Button>
          </Link>

          <Link href="/field/history">
            <Button
              variant="ghost"
              className="w-full flex flex-col items-center gap-1 h-auto py-3"
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs">History</span>
            </Button>
          </Link>
        </div>
      </nav>

      {/* Spacer for fixed bottom nav */}
      <div className="h-[80px]" />
    </div>
  );
}
