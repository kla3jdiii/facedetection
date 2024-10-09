import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Camera, User, Save, Play, Pause, Upload, Plus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

function App() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<blazeface.NormalizedFace[]>([]);
  const [name, setName] = useState('');
  const [savedFaces, setSavedFaces] = useState<{ name: string; imageUrl: string }[]>([]);
  const [customCameras, setCustomCameras] = useState<string[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('user');
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
      toast.success('Face detection model loaded successfully!');
    };
    loadModel();

    // Load saved faces from localStorage
    const storedFaces = localStorage.getItem('savedFaces');
    if (storedFaces) {
      setSavedFaces(JSON.parse(storedFaces));
    }
  }, []);

  useEffect(() => {
    // Save faces to localStorage whenever it changes
    localStorage.setItem('savedFaces', JSON.stringify(savedFaces));
  }, [savedFaces]);

  const detectFaces = async () => {
    if (model && webcamRef.current && canvasRef.current) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video && ctx) {
        const predictions = await model.estimateFaces(video, false);
        setDetectedFaces(predictions);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (predictions.length > 0) {
          // Play notification sound
          audioRef.current?.play();

          // Save screenshot
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const screenshot = canvas.toDataURL('image/png');
          saveScreenshot(screenshot, `detection_${timestamp}.png`);

          // Log detection time
          console.log(`Face detected at: ${new Date().toLocaleString()}`);

          predictions.forEach((pred, index) => {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';
            ctx.rect(
              pred.topLeft[0],
              pred.topLeft[1],
              pred.bottomRight[0] - pred.topLeft[0],
              pred.bottomRight[1] - pred.topLeft[1]
            );
            ctx.stroke();

            // Display face number
            ctx.fillStyle = 'red';
            ctx.font = '16px Arial';
            ctx.fillText(`Face ${index + 1}`, pred.topLeft[0], pred.topLeft[1] - 5);
          });
        }
      }
    }

    if (isDetecting) {
      requestAnimationFrame(detectFaces);
    }
  };

  const saveScreenshot = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
    if (!isDetecting) {
      requestAnimationFrame(detectFaces);
    }
  };

  const saveFace = () => {
    if (detectedFaces.length > 0 && name) {
      const canvas = canvasRef.current;
      if (canvas) {
        const imageUrl = canvas.toDataURL('image/jpeg');
        setSavedFaces([...savedFaces, { name, imageUrl }]);
        toast.success(`Face saved for ${name}`);
        setName('');

        // Save to detect-faces folder
        saveScreenshot(imageUrl, `detect-faces/${name}.jpg`);
      }
    } else {
      toast.error('Please enter a name and ensure a face is detected');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              detectFacesInImage(canvas);
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const detectFacesInImage = async (canvas: HTMLCanvasElement) => {
    if (model) {
      const predictions = await model.estimateFaces(canvas, false);
      setDetectedFaces(predictions);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        predictions.forEach((pred, index) => {
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'red';
          ctx.rect(
            pred.topLeft[0],
            pred.topLeft[1],
            pred.bottomRight[0] - pred.topLeft[0],
            pred.bottomRight[1] - pred.topLeft[1]
          );
          ctx.stroke();

          // Display face number
          ctx.fillStyle = 'red';
          ctx.font = '16px Arial';
          ctx.fillText(`Face ${index + 1}`, pred.topLeft[0], pred.topLeft[1] - 5);
        });
      }
    }
  };

  const addCustomCamera = () => {
    const cameraUrl = prompt('Enter the URL of your camera:');
    if (cameraUrl) {
      setCustomCameras([...customCameras, cameraUrl]);
      toast.success('Custom camera added successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Face Detection App</h1>
      <div className="relative mb-4">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ deviceId: selectedCamera }}
          className="rounded-lg shadow-lg"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 rounded-lg"
          width={640}
          height={480}
        />
      </div>
      <div className="mb-4">
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="user">Default Camera</option>
          {customCameras.map((camera, index) => (
            <option key={index} value={camera}>
              Custom Camera {index + 1}
            </option>
          ))}
        </select>
        <button
          onClick={addCustomCamera}
          className="ml-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300"
        >
          <Plus className="inline-block mr-1" size={16} /> Add Camera
        </button>
      </div>
      <div className="flex space-x-2 mb-4">
        <button
          onClick={toggleDetection}
          className={`flex items-center px-4 py-2 rounded-md ${
            isDetecting ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors duration-300`}
        >
          {isDetecting ? <Pause className="mr-2" /> : <Play className="mr-2" />}
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name for detected face"
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={saveFace}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
        >
          <Save className="mr-2" /> Save Face
        </button>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-300"
        >
          <Upload className="mr-2" /> Upload Image
        </button>
        <Link to="/admin" className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-300">
          <Settings className="mr-2" /> Admin
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {savedFaces.map((face, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md">
            <img src={face.imageUrl} alt={face.name} className="w-full h-32 object-cover rounded-md mb-2" />
            <p className="text-center font-semibold">{face.name}</p>
          </div>
        ))}
      </div>
      <audio ref={audioRef} src="/notification.mp3" />
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;