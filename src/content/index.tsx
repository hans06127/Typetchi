import React from 'react';
import { createRoot } from 'react-dom/client';
import { PetWidget } from '../components/PetWidget/PetWidget';
import { usePetProgress } from '../hooks/usePetProgress';
import { useTypingTracker } from '../hooks/useTypingTracker';
import { injectRoot } from './inject-root';

function App() {
  const { petState, addTypingExp } = usePetProgress();
  useTypingTracker(addTypingExp);
  return <PetWidget petState={petState} />;
}

createRoot(injectRoot()).render(<React.StrictMode><App /></React.StrictMode>);
