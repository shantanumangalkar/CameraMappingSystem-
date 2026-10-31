import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  LayoutDashboard, 
  Camera, 
  ShieldCheck, 
  Radar, 
  ClipboardList, 
  User 
} from 'lucide-react-native';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CameraListScreen } from '../screens/cameras/CameraListScreen';
import { VerificationQueueScreen } from '../screens/verification/VerificationQueueScreen';
import { InvestigationsScreen } from '../screens/investigations/InvestigationsScreen';
import { MySurveysScreen } from '../screens/surveys/MySurveysScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { isAdmin, isOfficer, isSurveyor } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.signal,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.45)',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? insets.bottom + 8 : 16,
          left: 16,
          right: 16,
          elevation: 12,
          backgroundColor: Colors.ink,
          borderRadius: 32,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Command',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />

      <Tab.Screen
        name="Cameras"
        component={CameraListScreen}
        options={{
          tabBarLabel: 'Cameras',
          tabBarIcon: ({ color, focused }) => (
            <Camera size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />

      {/* Role-Specific Workflows */}
      {isAdmin && (
        <Tab.Screen
          name="Verification"
          component={VerificationQueueScreen}
          options={{
            tabBarLabel: 'Verification',
            tabBarIcon: ({ color, focused }) => (
              <ShieldCheck size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            ),
          }}
        />
      )}

      {isOfficer && (
        <Tab.Screen
          name="Investigations"
          component={InvestigationsScreen}
          options={{
            tabBarLabel: 'Patrol Radar',
            tabBarIcon: ({ color, focused }) => (
              <Radar size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            ),
          }}
        />
      )}

      {isSurveyor && (
        <Tab.Screen
          name="MySurveys"
          component={MySurveysScreen}
          options={{
            tabBarLabel: 'My Surveys',
            tabBarIcon: ({ color, focused }) => (
              <ClipboardList size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
