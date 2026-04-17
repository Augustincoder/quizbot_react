"use client";

import React, { useState } from 'react';

export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-8 border rounded-2xl shadow-xl w-full max-w-sm space-y-5 bg-white text-black">
        <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-900">Admin Login</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Username</label>
          <input
            type="text"
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Password</label>
          <input
            type="password"
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-blue-700 transition-colors shadow-sm"
        >
          Login
        </button>
      </form>
    </div>
  );
}
