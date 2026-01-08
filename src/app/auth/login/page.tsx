import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  // Middleware handles redirecting authenticated users to /planning
  // Just render the form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
