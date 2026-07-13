export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state">
      <strong>Something went wrong.</strong> {message}
    </div>
  );
}
