import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppHeader from '../component/AppHeader'; // Adjust path if your components folder is different

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 90,
          paddingBottom: 15,
          paddingTop: 10,
        },
        tabBarShowLabel: false, // Ensures only icons are shown, no labels
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        // This is where your custom AppHeader is integrated for all tab screens
        header: () => (
          <AppHeader  />
        ),
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name='search'
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name='compare'
        options={{
          title: 'Compare',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scale-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name='mobile'
        options={{
          title: 'Mobiles',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="phone-portrait-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name='technews'
        options={{
          title: 'Tech News',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Hide 'gadgets' from the tab bar */}
      <Tabs.Screen
        name='gadgets' // Assumes your file is app/(tabs)/gadgets.js
        options={{
          href: null, // This hides the tab button from the footer
          title: 'Gadgets', // Still provides a title for internal navigation/accessibility
          
        }}
      />
       <Tabs.Screen
        name='howto' // Assumes your file is app/(tabs)/gadgets.js
        options={{
          href: null, // This hides the tab button from the footer
          title: 'How To"s', // Still provides a title for internal navigation/accessibility
          
        }}
      />
       <Tabs.Screen
        name='reviews' // Assumes your file is app/(tabs)/gadgets.js
        options={{
          href: null, // This hides the tab button from the footer
          title: 'Reviews', // Still provides a title for internal navigation/accessibility
          
        }}
      />
    </Tabs>
  );
};

export default _layout;
