import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import HazardDetailScreen from '../screens/HazardDetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  HazardDetail: { hazardId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="HazardDetail"
          component={HazardDetailScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#0A0A0A' },
            headerTintColor: '#F97316',
            headerTitle: 'Hazard Details',
            headerTitleStyle: { fontFamily: 'monospace', letterSpacing: 2 },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
