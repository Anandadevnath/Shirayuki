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
  <footer className="mt-12 border-t border-white/5 footer-blend py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-6">
        <div className="az-list-section mb-4">
          <div className="font-bold text-white text-2xl mb-2 ml-2">A-Z LIST</div>
          <div className="text-gray-400 mb-5 ml-2">Searching anime order by alphabet name A to Z.</div>
          <div className="flex flex-wrap gap-2">
            {azOptions.map((option) => (
              <button
                key={option}
                className="az-btn px-3 py-1 rounded text-[17px]  text-white hover:bg-white hover:text-black transition"
                onClick={() => handleAZClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {/* Removed misplaced Shirayuki title here */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-10">
          <div className="flex items-center gap-3">
            <img src="../../public/shirayuki.png" alt="Shirayuki Logo" className="w-20 h-20 object-contain" />
            <div>
              <div className="text-white text-2xl font-semibold">🇸🇭🇮🇷🇦🇾🇺🇰🇮</div>
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
    </div>
    </footer>
  );
}
