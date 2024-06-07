"use client";

import React, { useContext, useEffect } from "react";
import { Avatar } from "../ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import Link from "next/link";

import { VolumeSlider, TrackSlider } from "../ui/slider";

import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardFilled,
  StepForwardFilled,
} from "@ant-design/icons";
import { LoopIcon, SpeakerLoudIcon } from "@radix-ui/react-icons";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { PlayerContext } from "./player_context";

function PlayerBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-20 w-screen grid-cols-3 bg-zinc-800 p-4 shadow-3xl shadow-slate-950">
      {children}
    </div>
  );
}

export default function Player() {
  const {
    track,
    playing,
    setPlaying,
    position,
    setPosition,
    maxPosition,
    volume,
    loop,
    setLoop,
    audioRef,
    handlePlayPause,
    handleVolumeChange,
    handleTrackComplete,
    handleLoopBtnClick,
    handleTimeChange,
    setMaxPosition,
  } = useContext(PlayerContext);

  if (track === null) {
    return (
      <div className="select-none">
        <PlayerBody>{null}</PlayerBody>
      </div>
    );
  }

  return (
    <div className="select-none">

      <div className="w-screen">
        <TrackSlider
          defaultValue={position}
          max={maxPosition}
          value={position}
          step={0.1}
          onValueChange={(value) => {
            setPosition(value);
            if (!audioRef.current) return;
            audioRef.current.currentTime = value[0] as number;
          }}
          className="w-screen transition duration-75"
        />
      </div>
      <PlayerBody>
        <div
          className="flex flex-row items-center"
          // Track Info
        >
          <Avatar className="">
            <AvatarImage
              src="https://music.aryankothari.dev/img/covers/d96271a849821b3301316c614285feec6b0d37b6.jpeg"
              loading="lazy"
            />
          </Avatar>
          <div className="hidden pl-3 sm:block">
            <p className="text-sm leading-tight text-white">{track.name}</p>
            {track.artistIds.split(";").map((artistId, index) => (
              <Link
                href={`/artist/${artistId}`}
                className="text-xs text-gray-500 transition-all fade-in-100 fade-out-100 hover:text-orange-400 "
              >
                {track.artistNames.split(";")[index]}
                {index < track.artistIds.split(";").length - 1 ? ", " : ""}
              </Link>
            ))}
          </div>
        </div>
        <div
          className="flex flex-row items-center justify-center space-x-10 align-middle"
          // controls
        >
          <StepBackwardFilled className="text-xl text-white transition duration-100 hover:text-orange-400" />
          <PauseCircleOutlined
            className={`text-4xl text-white transition duration-100 hover:text-orange-400 ${!playing ? "hidden" : null}`}
            onMouseDown={handlePlayPause}
          />
          <PlayCircleOutlined
            className={`text-4xl text-white transition duration-100 hover:text-orange-400 ${!playing ? null : "hidden"}`}
            onMouseDown={handlePlayPause}
          />
          <div className="flex flex-row items-center space-x-5 ">
            <StepForwardFilled className="text-xl text-white transition duration-100 hover:text-orange-400" />
            <LoopIcon
              className={`text-xs text-gray-400 hover:text-orange-400 ${loop ? "text-orange-400" : null}`}
              onMouseDown={handleLoopBtnClick}
            />
          </div>
        </div>
        <div
          className="hidden flex-row items-center justify-end space-x-4 sm:flex"
          // volume
        >
          <SpeakerLoudIcon className="text-white" />
          <VolumeSlider
            defaultValue={[volume]}
            value={[volume]}
            max={100}
            step={1}
            className="w-[30%]"
            onValueChange={handleVolumeChange}
          />
        </div>
      </PlayerBody>
    </div>
  );
}
