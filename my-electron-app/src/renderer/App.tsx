import React from 'react';

declare global {
  interface Window {
    electronAPI: {
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
    };
  }
}

const App: React.FC = () => {
  const { versions } = window.electronAPI;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Hello from React + TypeScript!</h1>
        
        <div className="space-y-2">
          <p className="text-gray-600">
            We are using Node.js <span className="font-mono text-blue-600">{versions.node}</span>
          </p>
          <p className="text-gray-600">
            Chromium <span className="font-mono text-blue-600">{versions.chrome}</span>
          </p>
          <p className="text-gray-600">
            and Electron <span className="font-mono text-blue-600">{versions.electron}</span>
          </p>
        </div>

        <button className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
          Click me!
        </button>
      </div>
    </div>
  );
};

export default App;