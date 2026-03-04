import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, description, message, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const text = description || message;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {text && <p className="mt-1 text-sm text-gray-500 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-red-500 mb-2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">Tentar novamente</button>
      )}
    </div>
  );
}
