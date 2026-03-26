import { Captions, Mic } from "lucide-react";
import ServerRow from "./ServerRow";

const SUB = "sub";
const DUB = "dub";

/**
 * Full server selection UI with SUB/DUB rows and "Now Watching" info card
 */
const ServerSelection = ({
  servers,
  selectedServer,
  selectedCategory,
  serverLoading,
  handleServerSelect,
  currentEpisode,
}) => (
  <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5 backdrop-blur-xl border-t border-white/10">
    {/* Server Selection Rows */}
    <div className="flex-1 flex flex-col gap-3 md:gap-4 justify-center order-1 md:order-2">
      <ServerRow
        icon={<Captions className="h-4 w-4 text-purple-300" />}
        label="SUB"
        servers={servers.sub}
        category={SUB}
        selectedServer={selectedServer}
        selectedCategory={selectedCategory}
        serverLoading={serverLoading}
        handleServerSelect={handleServerSelect}
        colorScheme="purple"
      />
      <ServerRow
        icon={<Mic className="h-4 w-4 text-pink-300" />}
        label="DUB"
        servers={servers.dub}
        category={DUB}
        selectedServer={selectedServer}
        selectedCategory={selectedCategory}
        serverLoading={serverLoading}
        handleServerSelect={handleServerSelect}
        colorScheme="pink"
      />
    </div>

    {/* Now Watching Info Card */}
    <div className="glass-container-dark rounded-xl px-5 md:px-6 py-4 md:min-w-[240px] border border-purple-500/30 shadow-lg order-2 md:order-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <p className="font-bold text-sm md:text-base text-purple-200">
          Now Watching
        </p>
      </div>
      <p className="text-white font-semibold text-base md:text-lg mb-2">
        Episode {currentEpisode?.number}
      </p>
      <p className="text-purple-200 text-xs leading-relaxed">
        If current server doesn't work, try another server from the options
        beside.
      </p>
    </div>
  </div>
);

export default ServerSelection;
