import React from 'react';
import { createRoot } from 'react-dom/client';
import { PetWidget } from '../components/PetWidget/PetWidget';
import { usePetProgress } from '../hooks/usePetProgress';
import { useTypingTracker } from '../hooks/useTypingTracker';
import { mountWhenBodyReady } from './injectRoot';

console.log('[Typetchi] content script loaded');

function App() {
  const { petState, addTypingExp } = usePetProgress();
  useTypingTracker(addTypingExp);
  return <PetWidget petState={petState} />;
}

mountWhenBodyReady((rootElement) => {
  createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
  console.log('[Typetchi] React app mounted');
});
