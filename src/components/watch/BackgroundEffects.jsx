const BackgroundEffects = () => (
  <>
    <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none" />
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
    </div>
  </>
);

export default BackgroundEffects;
