import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  // Middleware handles redirecting authenticated users to /planning
  // Just render the form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}
