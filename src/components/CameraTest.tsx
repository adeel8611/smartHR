import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Camera, 
  Mic, 
  Video,
  MicOff,
  VideoOff,
  CheckCircle,
  AlertCircle,
  Settings
} from "lucide-react";

interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput';
}

const CameraTest = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [testingAudio, setTestingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false
  });

  useEffect(() => {
    checkPermissions();
    getDevices();
    
    return () => {
      stopStream();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      setPermissions({
        camera: cameraPermission.state === 'granted',
        microphone: microphonePermission.state === 'granted'
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const getDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const cameras = deviceList.filter(device => device.kind === 'videoinput');
      const microphones = deviceList.filter(device => device.kind === 'audioinput');
      
      setDevices([...cameras, ...microphones] as DeviceInfo[]);
      
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  };

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: selectedCamera } : true,
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }
      
      setStream(mediaStream);
      setIsVideoEnabled(true);
      setPermissions(prev => ({ ...prev, camera: true }));
      
      toast({
        title: "Camera Started",
        description: "Your camera is working properly!",
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoEnabled(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startMicrophone = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedMicrophone ? { deviceId: selectedMicrophone } : true,
        video: false
      };

      const audioStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set up audio level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(audioStream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        if (isAudioEnabled) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      
      setIsAudioEnabled(true);
      setPermissions(prev => ({ ...prev, microphone: true }));
      
      toast({
        title: "Microphone Started",
        description: "Your microphone is working properly!",
      });
      
      // Stop the test stream after verification
      setTimeout(() => {
        audioStream.getTracks().forEach(track => track.stop());
        audioContext.close();
      }, 1000);
      
    } catch (error) {
      console.error('Error starting microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const testMicrophone = async () => {
    setTestingAudio(true);
    await startMicrophone();
    setTimeout(() => setTestingAudio(false), 2000);
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
  };

  const cameras = devices.filter(device => device.kind === 'videoinput');
  const microphones = devices.filter(device => device.kind === 'audioinput');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Camera & Microphone Setup
        </CardTitle>
        <CardDescription>
          Test your devices before starting the interview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-2">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              permissions.camera ? 'bg-success/20' : 'bg-muted'
            }`}>
              {permissions.camera ? (
                <CheckCircle className="h-6 w-6 text-success" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium">Camera</p>
            <Badge variant={permissions.camera ? "default" : "secondary"}>
              {permissions.camera ? "Ready" : "Not Tested"}
            </Badge>
          </div>
          
          <div className="text-center space-y-2">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              permissions.microphone ? 'bg-success/20' : 'bg-muted'
            }`}>
              {permissions.microphone ? (
                <CheckCircle className="h-6 w-6 text-success" />
              ) : (
                <Mic className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium">Microphone</p>
            <Badge variant={permissions.microphone ? "default" : "secondary"}>
              {permissions.microphone ? "Ready" : "Not Tested"}
            </Badge>
          </div>
        </div>

        {/* Camera Preview */}
        <div className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative border-2 border-dashed border-muted-foreground/20">
            {isVideoEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <VideoOff className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Camera preview will appear here</p>
                  <p className="text-xs text-muted-foreground">Click "Test Camera" to see your video feed</p>
                </div>
              </div>
            )}
            {isVideoEnabled && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-green-500/90 text-white">
                  <div className="w-2 h-2 rounded-full bg-white mr-1 animate-pulse" />
                  Live
                </Badge>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="space-y-3">
            {cameras.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Camera:</label>
                <select 
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {cameras.map((camera) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              {!isVideoEnabled ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Test Camera
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="flex-1">
                  <VideoOff className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Microphone Test */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Microphone Level:</span>
              <Badge variant="outline">
                {testingAudio ? "Testing..." : "Ready to test"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                />
              </div>
              
              {microphones.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Microphone:</label>
                  <select 
                    value={selectedMicrophone}
                    onChange={(e) => setSelectedMicrophone(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {microphones.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={testMicrophone} 
            variant="outline" 
            className="w-full"
            disabled={testingAudio}
          >
            {testingAudio ? (
              <MicOff className="h-4 w-4 mr-2" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            {testingAudio ? "Testing Microphone..." : "Test Microphone"}
          </Button>
        </div>

        {/* Instructions */}
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Camera Test:</strong> Click "Test Camera" to verify your camera is working properly.</p>
              <p><strong>Microphone Test:</strong> Click "Test Microphone" and speak. The level bar should move.</p>
              <p><strong>Tip:</strong> Ensure you're in a well-lit, quiet environment for the best interview experience.</p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CameraTest;