export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-white/55">
        <span className="relative inline-flex h-3 w-3">
          <span className="absolute inset-0 animate-ping rounded-full bg-eco-400/60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-eco-400" />
        </span>
        Loading EcoOracle network…
      </div>
    </div>
  );
}
