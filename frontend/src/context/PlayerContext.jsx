import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from './UIContext.jsx';
import api from '../../client.js';

const PlayerContext = createContext({
  current: null,
  playing: false,
  progress: { currentTime: 0, duration: 0 },
  // queue state
  queue: [],
  index: -1,
  // playback controls
  playTrack: (track) => {},
  playQueue: (tracks, startIndex = 0) => {},
  enqueue: (tracks) => {},
  removeAt: (idx) => {},
  move: (from, to) => {},
  clearQueue: () => {},
  playAt: (idx) => {},
  playNow: (tracks) => {},
  shuffleUpcoming: () => {},
  next: () => {},
  prev: () => {},
  seekTo: (seconds) => {},
  togglePlay: () => {},
  pause: () => {},
  resume: () => {},
  // volume
  volume: 1,
  muted: false,
  setVolume: (v) => {},
  toggleMute: () => {},
});

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null); // { id, name/title, artist, audioUrl, image }
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const [queue, setQueue] = useState([]); // normalized tracks
  const [index, setIndex] = useState(-1);
  const [volume, setVolumeState] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('player.volume') : null;
    const v = saved != null ? parseFloat(saved) : 0.8;
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.8;
  });
  const [muted, setMuted] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('player.muted') : null;
    return saved === 'true' ? true : false;
  });
  const { toastError } = useUI();

  // Create audio element once
  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
    audioRef.current.crossOrigin = 'anonymous';
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress({ currentTime: audio.currentTime, duration: audio.duration || 0 });
    const onEnd = () => {
      // auto advance if queue has next
      if (index >= 0 && index < queue.length - 1) {
        playAtIndex(index + 1);
      } else {
        setPlaying(false);
      }
    };
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
  }, [current, toastError, index, queue]);

  // keep audio volume/mute in sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (typeof localStorage !== 'undefined') localStorage.setItem('player.volume', String(volume));
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    if (typeof localStorage !== 'undefined') localStorage.setItem('player.muted', String(muted));
  }, [muted]);

  const toPlayableSrc = useCallback((src) => {
    if (!src) return src;
    const base = (api?.defaults?.baseURL || '').replace(/\/+$/, '');
    if (base && src.startsWith(base)) return src; // already proxied
    try {
      const u = new URL(src);
      const host = u.hostname.toLowerCase();
      if (host.endsWith('.jamendo.com') || host === 'jamendo.com') {
        return `${base}/music/stream?src=${encodeURIComponent(src)}`;
      }
    } catch {}
    return src;
  }, []);

  const normalizeTrack = useCallback((track) => ({
    id: track.id || track.track_id || track.title,
    title: track.title || track.name,
    artist: track.artist || track.artist_name || (Array.isArray(track.artists) ? track.artists[0]?.name : ''),
    image: track.image || track.cover || track.albumImage,
    audioUrl: toPlayableSrc(track.audioUrl || track.audio || track.preview_url),
    duration: track.duration,
  }), [toPlayableSrc]);

  const playAtIndex = useCallback(async (i) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!queue.length || i < 0 || i >= queue.length) return;
    const tr = queue[i];
    if (!tr?.audioUrl) {
      toastError('No preview available for this track');
      return;
    }
    try {
      setIndex(i);
      setCurrent(tr);
      if (audio.src !== tr.audioUrl) audio.src = tr.audioUrl;
      await audio.play();
      setPlaying(true);
    } catch (e) {
      setPlaying(false);
      toastError('Unable to play');
    }
  }, [queue, toastError]);

  const playTrack = useCallback(async (track) => {
    const normalized = normalizeTrack(track);
    if (!normalized.audioUrl) {
      toastError('No preview available for this track');
      return;
    }
    setQueue([normalized]);
    await playAtIndex(0);
  }, [normalizeTrack, playAtIndex, toastError]);

  const playQueue = useCallback(async (tracks, startIndex = 0) => {
    const arr = Array.isArray(tracks) ? tracks : [tracks];
    const list = arr.map(normalizeTrack).filter(t => t.audioUrl);
    if (!list.length) {
      toastError('Nothing to play');
      return;
    }
    // Map the requested startIndex to the filtered normalized list
    let start = 0;
    if (typeof startIndex === 'number' && startIndex >= 0 && startIndex < arr.length) {
      const target = normalizeTrack(arr[startIndex]);
      const found = list.findIndex(t => (t.id && target.id && t.id === target.id) || t.audioUrl === target.audioUrl || (t.title === target.title && t.artist === target.artist));
      start = found >= 0 ? found : Math.max(0, Math.min(startIndex, list.length - 1));
    }
    setQueue(list);
    await playAtIndex(start);
  }, [normalizeTrack, playAtIndex, toastError]);

  const enqueue = useCallback((tracks) => {
    const list = (Array.isArray(tracks) ? tracks : [tracks]).map(normalizeTrack).filter(t => t.audioUrl);
    if (!list.length) return;
    setQueue((q) => {
      const nq = [...q, ...list];
      // if nothing is playing, start with the first newly enqueued track
      if (index === -1) {
        setTimeout(() => playAtIndex(0), 0);
      }
      return nq;
    });
  }, [normalizeTrack, index, playAtIndex]);

  const removeAt = useCallback((idx) => {
    setQueue((q) => {
      if (idx < 0 || idx >= q.length) return q;
      const newQ = q.slice(0, idx).concat(q.slice(idx + 1));
      setIndex((curIdx) => {
        if (curIdx === idx) {
          if (newQ.length === 0) {
            // stop playback
            const audio = audioRef.current; if (audio) { audio.pause(); audio.src = ''; }
            setCurrent(null);
            setPlaying(false);
            return -1;
          }
          // try to play the item now at this index (the next item), or fallback to last
          const nextIdx = Math.min(idx, newQ.length - 1);
          // fire and forget
          setTimeout(() => { playAtIndex(nextIdx); }, 0);
          return nextIdx;
        } else if (curIdx > idx) {
          return curIdx - 1;
        }
        return curIdx;
      });
      return newQ;
    });
  }, [playAtIndex]);

  const move = useCallback((from, to) => {
    setQueue((q) => {
      if (from === to || from < 0 || to < 0 || from >= q.length || to >= q.length) return q;
      const newQ = q.slice();
      const [item] = newQ.splice(from, 1);
      newQ.splice(to, 0, item);
      setIndex((curIdx) => {
        if (curIdx === from) return to;
        if (curIdx > from && curIdx <= to) return curIdx - 1;
        if (curIdx < from && curIdx >= to) return curIdx + 1;
        return curIdx;
      });
      return newQ;
    });
  }, []);

  const clearQueue = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ''; }
    setQueue([]);
    setIndex(-1);
    setCurrent(null);
    setPlaying(false);
  }, []);

  const playAt = useCallback((i) => {
    playAtIndex(i);
  }, [playAtIndex]);

  const playNow = useCallback((tracks) => {
    const list = (Array.isArray(tracks) ? tracks : [tracks]).map(normalizeTrack).filter(t => t.audioUrl);
    if (!list.length) {
      toastError('Nothing to play');
      return;
    }
    if (index === -1) {
      setQueue(list);
      setTimeout(() => playAtIndex(0), 0);
      return;
    }
    setQueue((q) => {
      const rest = q.slice(index + 1);
      const newQ = [...list, ...rest];
      // start playing first of the new list
      setTimeout(() => playAtIndex(0), 0);
      return newQ;
    });
  }, [normalizeTrack, index, playAtIndex, toastError]);

  const next = useCallback(() => {
    if (index >= 0 && index < queue.length - 1) {
      playAtIndex(index + 1);
    }
  }, [index, queue.length, playAtIndex]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress((p) => ({ ...p, currentTime: 0 }));
      return;
    }
    if (index > 0) playAtIndex(index - 1);
  }, [index, playAtIndex]);

  const seekTo = useCallback((seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    const s = Math.max(0, Math.min(seconds, audio.duration || seconds));
    audio.currentTime = s;
    setProgress((p) => ({ ...p, currentTime: s, duration: audio.duration || p.duration }));
  }, []);

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
    if (playing) {
      pause();
    } else if (index === -1 && queue.length > 0) {
      // start the queue
      playAtIndex(0);
    } else {
      resume();
    }
  }, [pause, resume, playing, index, queue.length, playAtIndex]);

  const setVolume = useCallback((v) => {
    const val = Math.max(0, Math.min(1, v));
    setVolumeState(val);
    if (val > 0 && muted) setMuted(false);
  }, [muted]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const shuffleUpcoming = useCallback(() => {
    setQueue((q) => {
      if (!q || q.length <= 2) return q; // nothing meaningful to shuffle
      const start = Math.max(0, index);
      const head = q.slice(0, start + 1);
      const rest = q.slice(start + 1);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      return [...head, ...rest];
    });
  }, [index]);

  const value = useMemo(() => ({
    current,
    playing,
    progress,
    queue,
    index,
    playTrack,
    playQueue,
    enqueue,
  removeAt,
  move,
  clearQueue,
  playAt,
  playNow,
  shuffleUpcoming,
    next,
    prev,
    seekTo,
    togglePlay,
    pause,
    resume,
    volume,
    muted,
    setVolume,
    toggleMute,
  }), [current, playing, progress, queue, index, playTrack, playQueue, enqueue, next, prev, seekTo, togglePlay, pause, resume, volume, muted, setVolume, toggleMute]);
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => useContext(PlayerContext);

export default PlayerContext;
