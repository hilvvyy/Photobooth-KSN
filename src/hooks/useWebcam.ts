import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  facingMode: 'user' | 'environment';
  isMirrored: boolean;
  startStream: () => Promise<void>;
  stopStream: () => void;
  switchCamera: () => void;
  toggleMirror: () => void;
  captureFrame: () => HTMLCanvasElement | null;
  clearError: () => void;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);

  // List available camera devices
  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
    } catch (err) {
      console.warn('Unable to enumerate media devices:', err);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Browser Anda tidak mendukung akses kamera WebRTC.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;

        await videoRef.current.play();
        setIsStreaming(true);
      }

      await enumerateDevices();
    } catch (err: unknown) {
      console.error('Kamera gagal diakses:', err);
      let message = 'Gagal mengakses kamera.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'Kamera tidak ditemukan pada perangkat Anda.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Kamera sedang digunakan oleh aplikasi lain.';
        } else {
          message = `Error kamera: ${err.message}`;
        }
      }
      setError(message);
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceId, facingMode, enumerateDevices]);

  // Switch facing mode (depan <-> belakang)
  const switchCamera = useCallback(() => {
    if (devices.length > 1) {
      // Find next camera device
      const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDeviceId(devices[nextIndex].deviceId);
    } else {
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
      // Environment camera should not be mirrored by default
      setIsMirrored((prev) => !prev);
    }
  }, [devices, selectedDeviceId]);

  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Capture current video frame to canvas
  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || !isStreaming || video.videoWidth === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, [isStreaming, isMirrored]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isStreaming,
    isLoading,
    error,
    devices,
    selectedDeviceId,
    facingMode,
    isMirrored,
    startStream,
    stopStream,
    switchCamera,
    toggleMirror,
    captureFrame,
    clearError,
  };
}
