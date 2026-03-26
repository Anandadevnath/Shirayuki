import { Button } from "@/components/ui/button";

/**
 * Single row of server buttons for a category (SUB or DUB)
 * Handles active state styling and disabled state
 */
const ServerRow = ({
  icon,
  label,
  servers,
  category,
  selectedServer,
  selectedCategory,
  serverLoading,
  handleServerSelect,
  colorScheme,
}) => (
  <div className="flex items-start gap-3 md:gap-4 flex-wrap">
    <div className="flex items-center gap-2 min-w-[65px] pt-1">
      <div
        className={`p-1.5 rounded-lg bg-${colorScheme}-500/20 backdrop-blur-sm`}
      >
        {icon}
      </div>
      <span className="text-white font-bold text-sm">{label}</span>
    </div>
    <div className="flex gap-2 flex-wrap flex-1">
      {servers.length > 0 ? (
        servers.map((server) => {
          const isActive =
            selectedServer?.serverId === server.serverId &&
            selectedCategory === category;
          return (
            <Button
              key={server.serverId}
              onClick={() => handleServerSelect(server, category)}
              disabled={serverLoading}
              className={`rounded-xl px-4 md:px-6 py-2 text-sm font-bold transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r from-${colorScheme}-600 to-${colorScheme}-500 hover:from-${colorScheme}-500 hover:to-${colorScheme}-400 text-white shadow-lg shadow-${colorScheme}-500/50 scale-105`
                  : `glass-button text-${colorScheme}-200 hover:text-white hover:scale-105`
              } ${serverLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {server.serverName.toUpperCase()}
            </Button>
          );
        })
      ) : (
        <span className="text-zinc-400 text-sm italic py-2">
          Not available
        </span>
      )}
    </div>
  </div>
);

export default ServerRow;
