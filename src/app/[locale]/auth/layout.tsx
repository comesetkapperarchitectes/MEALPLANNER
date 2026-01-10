export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple layout for auth pages - no sidebar/nav (handled by AppShell)
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
