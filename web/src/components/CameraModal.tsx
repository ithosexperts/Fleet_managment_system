import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, Check, RefreshCw, Upload, SwitchCamera, AlertCircle, Sparkles } from 'lucide-react';
import { api, getCurrentGpsPosition } from '../services/api';
import { SearchableDropdown } from './common/SearchableDropdown';
import { processAndCompressFile } from '../utils/imageCompressor';

interface Props {
  tripId: string;
  stopId?: string;
  defaultPhotoType?: string;
  onSuccess: (photo: any) => void;
  onClose: () => void;
}

export const CameraModal: React.FC<Props> = ({
  tripId,
  stopId,
  defaultPhotoType = 'Delivery Proof',
  onSuccess,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [photoType, setPhotoType] = useState(defaultPhotoType);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsVideoPlaying(false);
  }, []);

  const getMediaStream = async (targetFacing: 'environment' | 'user', specificDeviceId?: string): Promise<MediaStream> => {
    // Cascade Tier 1: Specific Device ID (if user picked from device list)
    if (specificDeviceId) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: specificDeviceId } },
          audio: false
        });
      } catch (err) {
        console.warn('Exact deviceId selection failed, falling back:', err);
      }
    }

    // Cascade Tier 2: Ideal facing mode with high resolution
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      });
    } catch (err1) {
      console.warn('High-res facing mode request failed, cascading to basic facingMode:', err1);
    }

    // Cascade Tier 3: Ideal facing mode without resolution constraints
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: targetFacing } },
        audio: false
      });
    } catch (err2) {
      console.warn('Ideal facing mode failed, cascading to any video hardware:', err2);
    }

    // Cascade Tier 4: Any available video device (USB camera, integrated laptop cam, etc.)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
  };

  const startCamera = useCallback(async (currentFacing: 'environment' | 'user', deviceId?: string) => {
    stopCamera();
    setIsInitializing(true);
    setCameraError(null);
    setIsVideoPlaying(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Direct in-browser camera stream is not supported in this browser. Please use the button below to take or pick a photo.');
      setIsInitializing(false);
      return;
    }

    try {
      const mediaStream = await getMediaStream(currentFacing, deviceId);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      // Enumerate cameras after permissions are granted
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoInputs);
      } catch {}

    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied in browser permissions. Please allow camera access in your browser bar, or use the Native Phone Camera button below.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera hardware is currently in use by another app or system background task. Please close other camera apps or select a photo below.');
      } else {
        setCameraError('Unable to start live camera: ' + (err.message || 'Device error') + '. Please use the device photo selector below.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera(facingMode, selectedDeviceId);
    return () => {
      stopCamera();
    };
  }, [facingMode, selectedDeviceId, startCamera, stopCamera]);

  // Ensure stream is properly bound to the <video> DOM element and play() is triggered
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');

      const handleReady = () => {
        setIsVideoPlaying(true);
      };

      video.addEventListener('playing', handleReady);
      video.addEventListener('loadeddata', handleReady);
      video.addEventListener('loadedmetadata', handleReady);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch((err) => {
            console.warn('Video autoPlay was prevented by browser policy (awaiting user gesture):', err);
          });
      }

      return () => {
        video.removeEventListener('playing', handleReady);
        video.removeEventListener('loadeddata', handleReady);
        video.removeEventListener('loadedmetadata', handleReady);
      };
    } else {
      video.srcObject = null;
      setIsVideoPlaying(false);
    }
  }, [stream]);

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
  };

  const cycleAvailableCamera = () => {
    if (availableCameras.length <= 1) {
      toggleCameraFacing();
      return;
    }
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedDeviceId(nextCamera.deviceId);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Use high resolution dimensions or fallback
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    // Embed tamper-proof logistics timestamp watermark
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const bannerHeight = Math.max(32, Math.round(height * 0.055));

    ctx.fillStyle = 'rgba(11, 20, 26, 0.78)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    ctx.fillStyle = '#25D366';
    const dotRadius = Math.max(3, Math.round(bannerHeight * 0.12));
    ctx.beginPath();
    ctx.arc(16, height - bannerHeight / 2, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${Math.max(12, Math.round(bannerHeight * 0.38))}px system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(`FLEETTRACKER PROOF  |  ${photoType.toUpperCase()}  |  ${dateStr} ${timeStr}`, 28, height - bannerHeight / 2);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      },
      'image/jpeg',
      0.85
    );
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCameraError(null);
        const processed = await processAndCompressFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
        setCapturedBlob(processed.file);
        setPreviewUrl(processed.dataUrl);
        stopCamera();
      } catch (err: any) {
        setCameraError(err.message || 'Failed to process selected photo.');
      }
    }
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
    startCamera(facingMode, selectedDeviceId);
  };

  const uploadPhoto = async () => {
    if (!capturedBlob) return;
    setUploading(true);

    try {
      const coords = await getCurrentGpsPosition();
      const formData = new FormData();
      formData.append('photo', capturedBlob, `proof_${Date.now()}.jpg`);
      formData.append('trip_id', tripId);
      if (stopId) formData.append('stop_id', stopId);
      formData.append('photo_type', photoType);
      if (coords.latitude) formData.append('latitude', coords.latitude.toString());
      if (coords.longitude) formData.append('longitude', coords.longitude.toString());
      if (coords.gps_accuracy) formData.append('gps_accuracy', coords.gps_accuracy.toString());

      const res = await api.photos.upload(formData);
      onSuccess(res.photo);
      onClose();
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Network error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-whatsapp)'
              }}
            >
              <Camera size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Photo Evidence Capture</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                High-resolution proof with automatic GPS timestamp stamping
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: 'var(--radius-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Proof Category
            </label>
            <SearchableDropdown
              value={photoType}
              onChange={(value) => setPhotoType(value as string)}
              placeholder="Select proof category"
              options={[
                { value: 'Damage', label: 'Damage or Cargo Discrepancy' },
                { value: 'Delay Proof', label: 'Delay Proof (Traffic congestion / Road bottleneck)' },
                { value: 'Delivery Proof', label: 'Delivery Proof (Signed invoice / Goods received)' },
                { value: 'Loading / Unloading', label: 'Loading / Unloading Verification' },
                { value: 'Other', label: 'Other Operational Proof' },
                { value: 'Pickup Proof', label: 'Pickup Proof (Warehouse loading dock)' },
                { value: 'Vehicle Issue', label: 'Vehicle Mechanical / Tire Issue' }
              ]}
            />
          </div>

          {/* Viewfinder or Captured Preview */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '320px',
              backgroundColor: '#050a0e',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-medium)'
            }}
          >
            {/* 1. Captured Photo Preview */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Captured Proof"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {/* 2. Permanent Video Viewfinder (Stream attached via Ref & Effect) */}
            <video
              ref={videoRef}
              className="camera-viewfinder"
              autoPlay
              playsInline
              muted
              controls={false}
              disablePictureInPicture
              onClick={() => {
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(() => {});
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: stream && !previewUrl ? 'block' : 'none',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />

            {/* Tap to Activate Overlay (if browser paused video waiting for interaction) */}
            {stream && !isVideoPlaying && !previewUrl && !isInitializing && (
              <button
                type="button"
                onClick={() => videoRef.current?.play()}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  zIndex: 4
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-whatsapp)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0b141a',
                    boxShadow: '0 0 16px rgba(37, 211, 102, 0.5)'
                  }}
                >
                  <Camera size={24} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tap to Enable Camera Stream</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Browser requires tap to play live feed</div>
              </button>
            )}

            {/* Live Camera Viewfinder Overlay Guides */}
            {stream && !previewUrl && (
              <>
                {/* Viewfinder Target Framing Guidelines */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '20px',
                    border: '1.5px dashed rgba(255, 255, 255, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: isVideoPlaying ? 'var(--accent-whatsapp)' : 'var(--status-delayed)',
                      borderRadius: '50%',
                      boxShadow: isVideoPlaying
                        ? '0 0 10px var(--accent-whatsapp)'
                        : '0 0 10px var(--status-delayed)'
                    }}
                  />
                </div>

                {/* Camera Mode Indicator Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(11, 20, 26, 0.75)',
                    color: '#e9edef',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    pointerEvents: 'none'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isVideoPlaying ? 'var(--accent-whatsapp)' : 'var(--status-delayed)'
                    }}
                  />
                  <span>{facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}</span>
                </div>

                {/* Flip Camera Switch Button */}
                <button
                  type="button"
                  onClick={availableCameras.length > 1 ? cycleAvailableCamera : toggleCameraFacing}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(11, 20, 26, 0.85)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backdropFilter: 'blur(6px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    zIndex: 5
                  }}
                  title="Switch Front / Rear Camera"
                >
                  <SwitchCamera size={15} />
                  <span>Flip</span>
                </button>
              </>
            )}

            {/* Initializing / Error Fallback Screen */}
            {!previewUrl && !stream && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {isInitializing ? (
                  <>
                    <RefreshCw size={36} className="spin-icon" style={{ opacity: 0.7, margin: '0 auto 12px', color: 'var(--accent-whatsapp)' }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                      Connecting to Camera...
                    </p>
                    <p style={{ fontSize: '0.75rem', margin: 0 }}>Starting high-definition video capture</p>
                  </>
                ) : (
                  <>
                    <AlertCircle size={36} color="var(--status-delayed)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                      Camera Stream Unavailable
                    </p>
                    <p style={{ fontSize: '0.76rem', maxWidth: '320px', margin: '0 auto 14px', color: 'var(--text-muted)' }}>
                      {cameraError || 'Camera could not be accessed directly.'}
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => startCamera(facingMode, selectedDeviceId)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <RefreshCw size={13} /> Retry Camera
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Hidden Canvas for High-Res Processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Native Phone Camera / File Gallery Direct Triggers */}
          {!previewUrl && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                <Camera size={15} color="var(--accent-whatsapp)" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                <Upload size={15} />
                <span>Gallery / Files</span>
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
          {previewUrl ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={retake}
                disabled={uploading}
              >
                <RefreshCw size={15} /> Retake
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={uploadPhoto}
                disabled={uploading}
                style={{
                  backgroundColor: 'var(--accent-whatsapp)',
                  borderColor: 'var(--accent-whatsapp)',
                  color: '#0b141a',
                  fontWeight: 600
                }}
              >
                {uploading ? (
                  'Saving...'
                ) : (
                  <>
                    <Check size={18} /> Confirm & Attach Proof
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-large"
              style={{
                width: '100%',
                backgroundColor: stream ? 'var(--accent-whatsapp)' : undefined,
                borderColor: stream ? 'var(--accent-whatsapp)' : undefined,
                color: stream ? '#0b141a' : undefined,
                fontWeight: 600,
                boxShadow: stream ? '0 2px 10px rgba(37, 211, 102, 0.3)' : undefined
              }}
              onClick={takeSnapshot}
              disabled={!stream}
            >
              <Camera size={18} /> Take Snapshot
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
