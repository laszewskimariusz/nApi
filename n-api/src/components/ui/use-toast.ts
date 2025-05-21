// Simple toast utility for notifications
type ToastOptions = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

// Simple console-based implementation without UI - this can be enhanced later
export function toast(options: ToastOptions) {
  const { title, description, variant = 'default' } = options;
  
  if (variant === 'destructive') {
    console.error(`[TOAST] ${title}${description ? `: ${description}` : ''}`);
  } else {
    console.log(`[TOAST] ${title}${description ? `: ${description}` : ''}`);
  }
  
  // In a real implementation, this would display a toast notification UI
  // For now, we'll just use browser alerts
  const message = `${title}\n${description || ''}`;
  if (typeof window !== 'undefined') {
    if (variant === 'destructive') {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  }
} 