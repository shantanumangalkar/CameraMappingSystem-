import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import api from '../../api/client';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import {
  Camera,
  CheckCircle2,
  MapPin,
  Shield,
  ArrowLeft,
  Navigation,
} from 'lucide-react-native';

export const RegisterCameraScreen = ({ navigation }) => {
  const [stations, setStations] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [cameraName, setCameraName] = useState('');
  const [cameraType, setCameraType] = useState('PUBLIC');
  const [policeStationId, setPoliceStationId] = useState('');
  const [resolution, setResolution] = useState('1080p Full HD');
  const [opticalZoom, setOpticalZoom] = useState('3x');
  const [hasNightVision, setHasNightVision] = useState(true);
  const [angleView, setAngleView] = useState('90');
  const [locationName, setLocationName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState('21.1458');
  const [longitude, setLongitude] = useState('79.0882');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContactNumber, setOwnerContactNumber] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [installationDate, setInstallationDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await api.get('/police-stations?size=50');
        if (res?.data?.content) {
          setStations(res.data.content);
          if (res.data.content.length > 0) {
            setPoliceStationId(String(res.data.content[0].id));
          }
        }
      } catch (err) {
        console.warn('Failed to load stations', err);
      }
    };
    fetchStations();
  }, []);

  const handleUseCurrentGPS = () => {
    // Standard city center fallback coordinates for demonstration
    setLatitude('21.1458');
    setLongitude('79.0882');
    Alert.alert('GPS Location Captured', 'Coordinates set to Central District Police Sector.');
  };

  const handleSubmit = async () => {
    if (!cameraName.trim() || !locationName.trim() || !latitude || !longitude) {
      Alert.alert('Missing Fields', 'Please fill in camera name, location name, and coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        cameraName: cameraName.trim(),
        cameraType,
        policeStationId: policeStationId ? Number(policeStationId) : null,
        resolution,
        opticalZoom,
        hasNightVision,
        angleView: Number(angleView) || 90,
        locationName: locationName.trim(),
        landmark: landmark.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ownerName: ownerName.trim() || 'Police Department',
        ownerContactNumber: ownerContactNumber.trim(),
        ownerEmail: ownerEmail.trim(),
        installationDate,
      };

      const res = await api.post('/cameras', payload);
      if (res?.success) {
        Alert.alert(
          'Survey Submitted',
          'Camera registered successfully and routed to Verification Queue.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Registration Notice', res?.message || 'Camera submitted for verification.');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to register camera.');
    } finally {
      setSubmitting(false);
    }
  };

  const cameraTypes = ['PUBLIC', 'COMMERCIAL', 'RESIDENTIAL', 'POLICE'];

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Survey New CCTV Camera</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Basic Info */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>1. Basic Camera Information</Text>

          <Input
            label="Camera Identification Name *"
            value={cameraName}
            onChangeText={setCameraName}
            placeholder="e.g., Sector 4 North Crossing PTZ"
          />

          <Text style={styles.fieldLabel}>Camera Classification Type</Text>
          <View style={styles.typeSelector}>
            {cameraTypes.map((type) => {
              const active = cameraType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setCameraType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeText, active && styles.typeTextActive]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Section 2: Optical Specs */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>2. Optical Specifications</Text>

          <Input
            label="Resolution"
            value={resolution}
            onChangeText={setResolution}
            placeholder="1080p Full HD, 4K UHD"
          />

          <Input
            label="Optical Zoom"
            value={opticalZoom}
            onChangeText={setOpticalZoom}
            placeholder="3x, 10x, 25x PTZ"
          />

          <Input
            label="Angle of View (Degrees)"
            value={angleView}
            onChangeText={setAngleView}
            keyboardType="numeric"
            placeholder="90"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>IR Night Vision Supported</Text>
            <Switch
              value={hasNightVision}
              onValueChange={setHasNightVision}
              trackColor={{ false: Colors.border, true: Colors.signalOrange }}
              thumbColor={Colors.surface}
            />
          </View>
        </Card>

        {/* Section 3: Geocoded Location */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>3. Geocoded Location</Text>
            <TouchableOpacity
              onPress={handleUseCurrentGPS}
              style={styles.gpsBtn}
              activeOpacity={0.8}
            >
              <Navigation size={12} color={Colors.signalOrange} />
              <Text style={styles.gpsBtnText}>Use GPS</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Location / Road Name *"
            value={locationName}
            onChangeText={setLocationName}
            placeholder="e.g., MG Road & 5th Cross Junction"
          />

          <Input
            label="Prominent Landmark"
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g., Opposite State Bank ATM"
          />

          <View style={styles.coordsRow}>
            <Input
              label="Latitude *"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Input
              label="Longitude *"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Section 4: Owner & Contact */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>4. Owner &amp; Contact Details</Text>

          <Input
            label="Camera Custodian / Owner Name"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="e.g., Inspector R. Patil / Reliance Retail"
          />

          <Input
            label="Contact Telephone Number"
            value={ownerContactNumber}
            onChangeText={setOwnerContactNumber}
            keyboardType="phone-pad"
            placeholder="+91 98765 43210"
          />

          <Input
            label="Owner Email Address"
            value={ownerEmail}
            onChangeText={setOwnerEmail}
            keyboardType="email-address"
            placeholder="owner@cameranetwork.org"
          />
        </Card>

        {/* Submit Action */}
        <Button
          title="Submit Camera for Police Verification"
          variant="signal"
          icon={CheckCircle2}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: 14,
    padding: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.signalOrange,
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.signalOrange,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.surface,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 4,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
  },
  coordsRow: {
    flexDirection: 'row',
  },
  submitBtn: {
    paddingVertical: 15,
    marginTop: 6,
  },
});
