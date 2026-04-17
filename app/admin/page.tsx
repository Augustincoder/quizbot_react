"use client";

import React, { useState } from 'react';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminTabs } from '@/components/admin/AdminTabs';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-2">
            Aqliy O'yinlar Dashboard
          </h1>
          <p className="text-lg text-gray-500">Manage questions and configurations</p>
        </div>
        
        {!isAuthenticated ? (
          <AdminLogin onLogin={() => setIsAuthenticated(true)} />
        ) : (
          <div className="bg-white px-6 py-8 rounded-2xl shadow-sm border border-gray-100">
            <AdminTabs />
          </div>
        )}
      </div>
    </div>
  );
}
