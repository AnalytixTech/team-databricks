import { useEffect } from 'react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import { routeTree } from './routeTree.gen';

// Create router instance
const router = createRouter({
  routeTree,
  context: {
    isAuthenticated: false,
    user: null,
  },
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Scroll to top on route change
  useEffect(() => {
    const unsubscribe = router.subscribe('onResolved', () => {
      window.scrollTo(0, 0);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <RouterProvider
        router={router}
        context={{
          isAuthenticated,
          user,
        }}
      />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;

