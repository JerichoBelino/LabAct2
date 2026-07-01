import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from '../screens/CameraScreen';
import PreviewScreen from '../screens/PreviewScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { COLORS } from '../styles/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Camera"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Preview" 
        component={PreviewScreen} 
        options={{ 
          title: 'Analysis Setup',
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Result" 
        component={ResultScreen} 
        options={{ 
          title: 'VisionAI Insights',
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ 
          title: 'Scan Logs',
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
