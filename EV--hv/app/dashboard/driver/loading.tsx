// A better driver/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      <span className="ml-4 text-lg text-gray-600">Loading...</span>
    </div>
  );
}