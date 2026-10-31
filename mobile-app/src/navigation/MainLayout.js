import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CameraListScreen } from '../screens/cameras/CameraListScreen';
import { InvestigationsScreen } from '../screens/investigations/InvestigationsScreen';
import { VerificationQueueScreen } from '../screens/verification/VerificationQueueScreen';
import { MySurveysScreen } from '../screens/surveys/MySurveysScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { Colors } from '../theme/colors';

export const MainLayout = () => {
  const insets = useSafeAreaInsets();
  const [currentRoute, setCurrentRoute] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case 'Dashboard':
        return <DashboardScreen onNavigate={(route) => setCurrentRoute(route)} />;
      case 'Investigations':
        return <InvestigationsScreen />;
      case 'Cameras':
        return <CameraListScreen />;
      case 'Verification':
        return <VerificationQueueScreen />;
      case 'MySurveys':
        return <MySurveysScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen onNavigate={(route) => setCurrentRoute(route)} />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Police Command Navbar with Logo & Hamburger Menu */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Screen Content */}
      <View style={styles.screenWrapper}>
        {renderCurrentScreen()}
      </View>

      {/* Slide-out Sidebar Drawer (matching website screenshot 2) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
      />

      {/* Floating Bottom Pill Navbar (matching website screenshots 1, 3, 4, 5) */}
      <BottomNav
        activeRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        onOpenProfile={() => setIsSidebarOpen(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  screenWrapper: {
    flex: 1,
  },
});
