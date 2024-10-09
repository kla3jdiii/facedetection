import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function AdminPage() {
  const [cameras, setCameras] = useState<string[]>([]);
  const [newCameraUrl, setNewCameraUrl] = useState('');

  useEffect(() => {
    // Load cameras from localStorage
    const storedCameras = localStorage.getItem('cameras');
    if (storedCameras) {
      setCameras(JSON.parse(storedCameras));
    }
  }, []);

  useEffect(() => {
    // Save cameras to localStorage whenever it changes
    localStorage.setItem('cameras', JSON.stringify(cameras));
  }, [cameras]);

  const addCamera = () => {
    if (newCameraUrl) {
      setCameras([...cameras, newCameraUrl]);
      setNewCameraUrl('');
    }
  };

  const removeCamera = (index: number) => {
    const updatedCameras = cameras.filter((_, i) => i !== index);
    setCameras(updatedCameras);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Admin Page</h1>
      <Link to="/" className="mb-4 flex items-center text-blue-500 hover:text-blue-600">
        <ArrowLeft className="mr-2" /> Back to Main Page
      </Link>
      <div className="w-full max-w-md">
        <div className="mb-4 flex">
          <input
            type="text"
            value={newCameraUrl}
            onChange={(e) => setNewCameraUrl(e.target.value)}
            placeholder="Enter camera URL"
            className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addCamera}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors duration-300"
          >
            Add Camera
          </button>
        </div>
        <ul className="bg-white rounded-lg shadow-md overflow-hidden">
          {cameras.map((camera, index) => (
            <li key={index} className="flex justify-between items-center p-4 border-b last:border-b-0">
              <span className="truncate flex-grow mr-4">{camera}</span>
              <button
                onClick={() => removeCamera(index)}
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AdminPage;