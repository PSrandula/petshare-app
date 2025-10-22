
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';

// A placeholder for your feed page
const FeedPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <h1 className="text-3xl font-bold">Welcome to your Feed!</h1>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/feed" element={<FeedPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
