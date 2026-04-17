"use client";

import React, { useState } from 'react';
import { JsonUploader } from './JsonUploader';
import { brainRingSchema } from '@/lib/validation/brainRingSchema';
import { zakovatSchema } from '@/lib/validation/zakovatSchema';
import { kahootSchema } from '@/lib/validation/kahootSchema';
import { eruditSchema } from '@/lib/validation/eruditSchema';

export function AdminTabs() {
  const [activeTab, setActiveTab] = useState<'brain-ring' | 'zakovat' | 'kahoot' | 'erudit'>('brain-ring');

  const tabs = [
    { id: 'brain-ring', schema: brainRingSchema },
    { id: 'zakovat', schema: zakovatSchema },
    { id: 'kahoot', schema: kahootSchema },
    { id: 'erudit', schema: eruditSchema },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 capitalize font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {tab.id.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs.map((tab) => (
          activeTab === tab.id && (
            <JsonUploader key={tab.id} mode={tab.id} schema={tab.schema} />
          )
        ))}
      </div>
    </div>
  );
}
