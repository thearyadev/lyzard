"use client";
import React, { useEffect } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "~/server/api/root";
import { useHotkeys } from "@mantine/hooks";

type RouterOutput = inferRouterOutputs<AppRouter>;

type TrackQuery = RouterOutput["library"]["getTrack"];

type PlayerContextType = ReturnType<typeof usePlayerState>;

type ResumeData = {
  track: TrackQuery | null;
  position: number | null;
  volume: number | null;
};

function usePlayerState() {
  const [trackData, setTrackData] = React.useState<TrackQuery>(null);
  const [playing, setPlaying] = React.useState(false);
  const [position, setPosition] = React.useState([0]);
  const [maxPosition, setMaxPosition] = React.useState(0);
  const [volume, setVolume] = React.useState(0);
  const [loop, setLoop] = React.useState(false);
  const [queue, setQueue] = React.useState<TrackQuery[]>([]);
  const [queuePlayed, setQueuePlayed] = React.useState<TrackQuery[]>([]);

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const changeTrack = async (trackData: TrackQuery, play: boolean) => {
    setTrackData(trackData);
    writeTrackToLocalStorage(trackData);
    setPlaying(false);
    setPosition([0]);

    if (play) {
      setTimeout(() => {
        if (!audioRef.current) return;
        audioRef.current.play();
        audioRef.current.currentTime = 0;
        setPlaying(true);
      }, 10);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] as number);
    if (!audioRef.current) return;
    audioRef.current.volume = (value[0] as number) / 100;
    localStorage.setItem("volume", (value[0] as number).toString());
  };

  const handlePlayPause = () => {
    setPlaying((prevPlaying) => !prevPlaying);

    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();

      if (trackData)
        document.title = `${trackData.name} - ${trackData.artistNames}`;
    } else {
      audioRef.current.pause();
      document.title = "Muze";
    }
  };

  const handleTrackComplete = () => {
    setPlaying(false);
    if (loop) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setPlaying(true);
      }
    }
    handleNext();
  };
  const handleTimeChange = () => {
    //
    if (!audioRef.current) return;

    setPosition([audioRef.current.currentTime]);
    writePositionToLocalStorage(audioRef.current.currentTime);
  };
  const handleLoopBtnClick = () => {
    setLoop((prevLoop) => !prevLoop);
    localStorage.setItem("loop", loop ? "false" : "true");
  };

  const addToQueue = (track: TrackQuery) => {
    setQueue([...queue, track]);
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const nextTrack = queue.shift();
    if (nextTrack) {
      setQueuePlayed([...queuePlayed, trackData]);
      changeTrack(nextTrack, true);
    }
  };

  const handlePrevious = () => {
    if (queuePlayed.length === 0) return;
    const prevTrack = queuePlayed.pop();
    if (prevTrack) {
      setQueue([trackData, ...queue]);
      changeTrack(prevTrack, true);
    }
  };

  const handleSkipBackward = () => {
    setPosition((prevPosition) => {
      return [(prevPosition[0] as number) - 5];
    });

    if (!audioRef.current) return;
    audioRef.current.currentTime -= 5;
  };

  const handleSkipForward = () => {
    setPosition((prevPosition) => {
      return [(prevPosition[0] as number) + 5];
    });

    if (!audioRef.current) return;
    audioRef.current.currentTime += 5;
  };
  useHotkeys(
    [
      ["space", handlePlayPause],
      ["ArrowLeft", handleSkipBackward],
      ["ArrowRight", handleSkipForward],
    ],
    ["INPUT", "TEXTAREA"],
  );

  useEffect(() => {
    const { track, position, volume } = readTrackFromLocalStorage();
    if (track) {
      changeTrack(track, false);
      setPosition([position ? position : 0]);
      if (audioRef.current) {
        audioRef.current.currentTime = position ? position : 0;
      }
      setPlaying(false);
      setVolume(volume !== null ? volume : 50); // 0 is falsey ...
    }
    if (navigator) {
      navigator.mediaSession.setActionHandler("play", handlePlayPause);
      navigator.mediaSession.setActionHandler("pause", handlePlayPause);
    }

    if (trackData) {
    }

    return () => {
      if (navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      }
    };
  }, []);
  return {
    track: trackData,
    playing: playing,
    setPlaying: setPlaying,
    changeTrack: changeTrack,
    position: position,
    setPosition: setPosition,
    maxPosition: maxPosition,
    setMaxPosition: setMaxPosition,
    volume: volume,
    setVolume: setVolume,
    loop: loop,
    setLoop: setLoop,
    writePositionToLocalStorage: writePositionToLocalStorage,
    audioRef: audioRef,
    handleVolumeChange: handleVolumeChange,
    handlePlayPause: handlePlayPause,
    handleTrackComplete: handleTrackComplete,
    handleLoopBtnClick: handleLoopBtnClick,
    handleTimeChange: handleTimeChange,
    queue: queue,
    addToQueue: addToQueue,
    queuePlayed: queuePlayed,
    handleNext: handleNext,
    handlePrevious: handlePrevious,
  };
}

export const PlayerContext = React.createContext<PlayerContextType>(
  {} as PlayerContextType,
);


function writeTrackToLocalStorage(track: TrackQuery) {
  localStorage.setItem("track", JSON.stringify(track));
}
function writePositionToLocalStorage(position: number) {
  localStorage.setItem("position", position.toString());
}
function readTrackFromLocalStorage(): ResumeData {
  const track = localStorage.getItem("track");
  const position = localStorage.getItem("position");





  const volume = localStorage.getItem("volume");
  return {
    track: track ? JSON.parse(track) : null,
    position: position ? parseInt(position) : null,
    volume: volume ? parseInt(volume) : null,
  };
}

export default function PlayerContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = usePlayerState();
  return (
    <>
      <audio
        id={"audo"}
        ref={value.audioRef}
        src={value.track ? `/api/track_data?id=${value.track?.id}` : undefined}
        onTimeUpdate={value.handleTimeChange}
        onCanPlay={() => {
          if (!value.audioRef.current) return;
          value.setMaxPosition(value.audioRef.current.duration);
          value.audioRef.current.volume = value.volume / 100;
        }}
        onEnded={value.handleTrackComplete}
      />
      <div
        className="z-10000 pointer-events-none fixed left-0 top-0 h-full w-full overflow-hidden bg-cover bg-center bg-no-repeat opacity-10 blur-xl"
        style={{
          backgroundImage: `url('/api/covers/?id=${value.track?.id})`,
        }}
      ></div>
      <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
    </>
  );
}
