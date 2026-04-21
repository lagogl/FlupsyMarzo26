import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requiredRole?: 'admin' | 'user' | 'visitor';
  requiredUsername?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  path,
  component: Component,
  requiredRole,
  requiredUsername,
}) => {
  const { user, isLoading } = useAuth();

  // Se l'autenticazione è in corso, mostra un loader
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Se l'utente non è autenticato, reindirizza alla pagina di login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Se è richiesto un ruolo specifico e l'utente non ha quel ruolo, reindirizza
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Se è richiesto uno username specifico e l'utente non corrisponde, reindirizza
  if (requiredUsername && user.username?.toLowerCase() !== requiredUsername.toLowerCase()) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
};