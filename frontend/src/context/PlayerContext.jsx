import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from './UIContext.jsx';

const PlayerContext = createContext({
  current: null,
  playing: false,
  playTrack: (track) => {},
  togglePlay: () => {},
  pause: () => {},
  resume: () => {},
});

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null); // { id, name/title, artist, audioUrl, image }
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const { toastError } = useUI();

  // Create audio element once
  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress({ currentTime: audio.currentTime, duration: audio.duration || 0 });
    const onEnd = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
      if (current?.audioUrl) toastError('Playback error');
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, [current, toastError]);

  const playTrack = useCallback(async (track) => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = track?.audioUrl || track?.audio || track?.preview_url;
    if (!src) {
      toastError('No preview available for this track');
      return;
    }
    try {
      // Normalize track shape
      const normalized = {
        id: track.id || track.track_id || track.title,
        title: track.title || track.name,
        artist: track.artist || track.artist_name || (Array.isArray(track.artists) ? track.artists[0]?.name : ''),
        image: track.image || track.cover || track.albumImage,
        audioUrl: src,
      };
      setCurrent(normalized);
      if (audio.src !== src) audio.src = src;
      await audio.play();
      setPlaying(true);
    } catch (e) {
      setPlaying(false);
      toastError('Unable to play');
    }
  }, [toastError]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
  }, []);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setPlaying(true);
    } catch (_) {
      // ignore
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) pause(); else resume();
  }, [pause, resume, playing]);

  const value = useMemo(() => ({ current, playing, playTrack, togglePlay, pause, resume, progress }), [current, playing, playTrack, togglePlay, pause, resume, progress]);
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => useContext(PlayerContext);

export default PlayerContext;
