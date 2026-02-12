import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as AC from '@bacons/apple-colors';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(1.0);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        Alert.alert('Photo taken!', `Photo saved: ${photo.uri}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Zoom Controls */}
      <View style={styles.zoomContainer}>
        <View style={styles.zoomRow}>
          <Pressable
            style={[styles.zoomButton, zoom === 0.5 && styles.zoomButtonActive]}
            onPress={() => setZoom(0.5)}
          >
            <View style={styles.zoomLine} />
            <Text style={[styles.zoomText, zoom === 0.5 && styles.zoomTextActive]}>0.5x</Text>
          </Pressable>

          <Pressable
            style={[styles.zoomButton, zoom === 1.0 && styles.zoomButtonActive]}
            onPress={() => setZoom(1.0)}
          >
            <View style={styles.zoomLine} />
            <Text style={[styles.zoomText, zoom === 1.0 && styles.zoomTextActive]}>1x</Text>
          </Pressable>

          <Pressable
            style={[styles.zoomButton, zoom === 2.0 && styles.zoomButtonActive]}
            onPress={() => setZoom(2.0)}
          >
            <View style={styles.zoomLine} />
            <Text style={[styles.zoomText, zoom === 2.0 && styles.zoomTextActive]}>2x</Text>
          </Pressable>
        </View>

        {/* Record Button */}
        <View style={styles.recordButtonContainer}>
          <View style={styles.recordButton} />
        </View>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          zoom={zoom}
          ref={cameraRef}
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          {/* Photo Thumbnail */}
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop' }}
              style={styles.thumbnail}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton}>
              <MaterialIcons name="file-download" size={24} color={AC.label} />
            </Pressable>

            <Pressable style={styles.actionButton}>
              <MaterialIcons name="close" size={24} color={AC.label} />
            </Pressable>
          </View>

          {/* Capture Button */}
          <Pressable style={styles.captureButtonOuter} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  permissionButton: {
    backgroundColor: AC.systemBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionText: {
    color: 'white',
    fontWeight: '600',
  },

  // Zoom Controls
  zoomContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  zoomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    paddingHorizontal: 40,
  },
  zoomButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  zoomButtonActive: {
    // Active state styling handled by text color
  },
  zoomLine: {
    width: 1,
    height: 16,
    backgroundColor: AC.quaternaryLabel,
    marginBottom: 4,
  },
  zoomText: {
    color: AC.quaternaryLabel,
    fontSize: 12,
    fontWeight: '400',
  },
  zoomTextActive: {
    color: AC.label,
    fontWeight: '600',
  },
  recordButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  recordButton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AC.label,
  },

  // Camera
  cameraContainer: {
    flex: 1,
    margin: 20,
    marginTop: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  camera: {
    flex: 1,
  },

  // Bottom Controls
  bottomControls: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AC.tertiarySystemBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AC.tertiarySystemBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AC.label,
  },
});
