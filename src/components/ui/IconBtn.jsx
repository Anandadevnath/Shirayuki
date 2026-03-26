/**
 * Reusable icon button component with glass-morphism styling
 */
const IconBtn = ({ icon, onClick, disabled = false, tooltip }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-2.5 rounded-xl backdrop-blur-xl transition-all duration-300 ${
      disabled
        ? "bg-white/5 text-zinc-600 cursor-not-allowed"
        : "glass-button hover:scale-110 hover:shadow-lg"
    }`}
  >
    {icon}
  </button>
);

export default IconBtn;
