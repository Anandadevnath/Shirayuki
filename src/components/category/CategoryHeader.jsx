export default function CategoryHeader({ title, description }) {
  return (
    <div className="border-b border-white/5 backdrop-blur-md bg-gradient-to-b from-black/30 via-black/20 to-transparent">
      <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-6 sm:py-8 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base">{description}</p>
      </div>
    </div>
  );
}
