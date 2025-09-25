import { useNavigate, Link } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const azOptions = [
    "All", "#", "0-9",
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
  ];

  const handleAZClick = (option) => {
    navigate(`/a-zlist?sort=${encodeURIComponent(option)}`);
  };

  return (
    <footer className="mt-12 border-t border-white/5 bg-gradient-to-t from-black/30 to-transparent py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-6">
        <div className="az-list-section mb-4">
          <div className="font-bold text-white text-lg mb-2">A-Z LIST</div>
          <div className="text-gray-400 mb-2">Searching anime order by alphabet name A to Z.</div>
          <div className="flex flex-wrap gap-2">
            {azOptions.map((option) => (
              <button
                key={option}
                className="az-btn px-3 py-1 rounded bg-gray-700 text-white hover:bg-pink-500 transition"
                onClick={() => handleAZClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">HA</div>
            <div>
              <div className="text-white font-semibold">Hi-Anime</div>
              <div className="text-xs text-gray-400">Built with ❤️ for anime lovers</div>
            </div>
          </div>

          <div className="flex gap-6 text-sm text-gray-300">
            <Link to="#" className="hover:text-white">Privacy</Link>
            <Link to="#" className="hover:text-white">Terms</Link>
            <Link to="#" className="hover:text-white">Contact</Link>
          </div>

          <div className="text-sm text-gray-400">© {new Date().getFullYear()} Hi-Anime. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
