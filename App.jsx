import React from 'react';
import { NativeRouter, Routes, Route } from 'react-router-native';
import Home from './Home';
import Gallery from './Gallery';

export default function App() {
  return (
    <NativeRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="gallery" element={<Gallery />} />
      </Routes>
    </NativeRouter>
  );
}
