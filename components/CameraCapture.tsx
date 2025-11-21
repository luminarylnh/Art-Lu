import React, { useRef, useState } from 'react';
import { Camera, RefreshCcw, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Cannot access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const image = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImage(image);
        // Need to remove the data prefix for Gemini
        // but passing full string to parent is fine, let parent handle it
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      // Extract base64 data
      const base64 = capturedImage.split(',')[1];
      onCapture(base64);
      stopCamera();
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-black relative h-full flex flex-col">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
           {!capturedImage ? (
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               className="w-full h-full object-cover"
             />
           ) : (
             <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
           )}
           
           <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-8 bg-slate-900 flex justify-between items-center">
          {!capturedImage ? (
             <>
                <button onClick={onCancel} className="text-white p-4">取消</button>
                <button 
                  onClick={takePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  <div className="w-12 h-12 bg-white rounded-full"></div>
                </button>
                <div className="w-12"></div> 
             </>
           ) : (
             <>
               <button onClick={retake} className="flex flex-col items-center text-white gap-2">
                 <RefreshCcw />
                 <span className="text-xs">重拍</span>
               </button>
               <button 
                  onClick={confirmPhoto}
                  className="flex flex-col items-center text-green-400 gap-2"
                >
                 <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <Check size={32} />
                 </div>
                 <span className="text-xs">確認</span>
               </button>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
