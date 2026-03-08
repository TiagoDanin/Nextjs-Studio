export default function Loading() {
  return (
    <div className="studio-main">
      <div className="studio-topbar px-6">
        <span className="text-[13px] font-medium text-muted-foreground tracking-wide">
          Loading
        </span>
      </div>
      <div className="studio-canvas flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Loading collection...</p>
      </div>
    </div>
  );
}
