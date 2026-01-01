export function CharacterCard({ character, voiceActor }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-3">
      <img
        src={character.poster}
        alt={character.name}
        className="w-14 h-14 rounded-full object-cover border-2 border-pink-500"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{character.name}</p>
        <p className="text-zinc-500 text-xs">{character.cast}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-zinc-400 text-sm truncate">{voiceActor.name}</p>
          <p className="text-zinc-500 text-xs">{voiceActor.cast}</p>
        </div>
        <img
          src={voiceActor.poster}
          alt={voiceActor.name}
          className="w-12 h-12 rounded-full object-cover"
        />
      </div>
    </div>
  );
}
