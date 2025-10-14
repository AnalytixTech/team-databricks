import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.tsx'
import LoginPage from './pages/LoginPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import Dashboard from './pages/Dashboard.tsx'
import SignUpPage from './pages/SignUp.tsx'
import CreateAcc from './pages/CreateAcc.tsx'
import UserDash from './pages/UserDash.tsx'


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/login',
    element: <LoginPage />
  }, 
  {
    path: "/signup",
    element: <SignUpPage />
  },
  {
    path:'/signup/create',
    element: <CreateAcc />
  },
  {
    path: '/rides',
    element: <UserDash />
  },
  {
    path: '/dashboard',
    element: <Dashboard />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  </StrictMode>,
)