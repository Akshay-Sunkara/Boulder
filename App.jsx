import React from 'react';
import { NativeRouter, Routes, Route } from 'react-router-native';
import {Text} from 'react-native'
import Home from './Home';
import { GlobalArrayProvider } from './Home';
import Gallery from './Gallery';
import { useFonts } from 'expo-font';

export default function App() {

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter_18pt-Bold.ttf'),
    'Inter-Semi-Bold': require('./assets/fonts/Inter_18pt-SemiBold.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter_18pt-Medium.ttf'),
    'Cal-Sans': require('./assets/fonts/CalSans-Regular.ttf')
  });

  if (!fontsLoaded) {
    return (
      <Text>Hello</Text>
    );
  }
  
  return (
    <GlobalArrayProvider>

    <NativeRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="gallery" element={<Gallery />} />
      </Routes>
    </NativeRouter>

    </GlobalArrayProvider>

  );
}
