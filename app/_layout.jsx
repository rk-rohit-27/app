import { Stack } from 'expo-router';
import React from 'react'; // React needs to be imported for JSX
import AppHeader from './component/AppHeader'; // Make sure the path is correct
import "./globals.css";

export default function RootLayout() {
  return (
    <Stack>
      {/* (tabs) group - headers handled by its internal _layout.js (where AppHeader is already set) */}
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />

      {/* post/[slug] screen - now also configured to use AppHeader */}
      <Stack.Screen
        name='post/[slug]'
        options={{
         
          header: () => (
            // AppHeader will now appear on post detail pages
            <AppHeader onBurgerPress={() => console.log('Burger menu pressed from Post Detail screen!')} />
          ),
        }}
      />

  
    </Stack>
  );
}
