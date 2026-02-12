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
  useColorScheme,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AC from '@bacons/apple-colors';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(1); // Start with 1x (index 1)
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const colorScheme = useColorScheme();

  // Zoom levels that correspond to camera zoom values
  const zoomLevels = [0.5, 1.0, 2.0];
  const currentZoomValue = zoomLevels[zoom];

  // Load last photo when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadLastPhoto = async () => {
        try {
          const savedPhoto = await AsyncStorage.getItem('lastTransformedImage');
          if (savedPhoto) {
            setLastPhoto(savedPhoto);
          }
        } catch (error) {
          console.log('Error loading last photo:', error);
        }
      };
      loadLastPhoto();
    }, [])
  );

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }]} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={[styles.container, styles.permissionContainer, { backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }]}>
        <Text style={[styles.message, { color: colorScheme === 'dark' ? 'white' : 'black' }]}>
          Pocket Monet needs camera access to transform your photos into beautiful Impressionist paintings
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: true,
        });

        // Navigate to result screen immediately with photo data
        router.push({
          pathname: '/result',
          params: {
            photoUri: photo.uri,
            base64: photo.base64
          }
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    }
  };

  const backgroundColor = colorScheme === 'dark' ? 'black' : 'white';
  const textColor = colorScheme === 'dark' ? 'white' : 'black';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Top Zoom Controls - Match design exactly */}
      <View style={styles.zoomContainer}>
        <View style={styles.zoomRow}>
          <Pressable
            style={styles.zoomButton}
            onPress={() => setZoom(0)}
          >
            <View style={styles.zoomLines}>
              <View style={[styles.zoomLine, { backgroundColor: zoom === 0 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 0 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 0 ? textColor : AC.quaternaryLabel }]} />
            </View>
            <Text style={[styles.zoomText, {
              color: zoom === 0 ? textColor : AC.quaternaryLabel,
              fontWeight: zoom === 0 ? '600' : '400'
            }]}>0.5x</Text>
          </Pressable>

          <Pressable
            style={styles.zoomButton}
            onPress={() => setZoom(1)}
          >
            <View style={styles.zoomLines}>
              <View style={[styles.zoomLine, { backgroundColor: zoom === 1 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 1 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 1 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 1 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 1 ? textColor : AC.quaternaryLabel }]} />
            </View>
            <Text style={[styles.zoomText, {
              color: zoom === 1 ? textColor : AC.quaternaryLabel,
              fontWeight: zoom === 1 ? '600' : '400'
            }]}>1x</Text>
          </Pressable>

          <Pressable
            style={styles.zoomButton}
            onPress={() => setZoom(2)}
          >
            <View style={styles.zoomLines}>
              <View style={[styles.zoomLine, { backgroundColor: zoom === 2 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 2 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 2 ? textColor : AC.quaternaryLabel }]} />
              <View style={[styles.zoomLine, { backgroundColor: zoom === 2 ? textColor : AC.quaternaryLabel }]} />
            </View>
            <Text style={[styles.zoomText, {
              color: zoom === 2 ? textColor : AC.quaternaryLabel,
              fontWeight: zoom === 2 ? '600' : '400'
            }]}>2x</Text>
          </Pressable>
        </View>

        {/* Small indicator dot */}
        <View style={styles.recordButtonContainer}>
          <View style={[styles.recordButton, { backgroundColor: textColor }]} />
        </View>
      </View>

      {/* Camera View - Centered with rounded corners */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          zoom={currentZoomValue}
          ref={cameraRef}
          enableTorch={false}
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          {/* Photo Thumbnail - Shows last transformation result */}
          <View style={styles.thumbnailContainer}>
            {lastPhoto ? (
              <Image source={{ uri: lastPhoto }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: AC.systemGray5 }]} />
            )}
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Large White Shutter Button */}
          <Pressable style={styles.shutterButton} onPress={takePicture}>
            <View style={styles.shutterButtonInner} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 30,
  },
  message: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
  },
  permissionButton: {
    backgroundColor: AC.systemBlue,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  permissionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Zoom Controls
  zoomContainer: {
    paddingTop: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  zoomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 40,
  },
  zoomButton: {
    alignItems: 'center',
    paddingVertical: 12,
    minWidth: 50,
  },
  zoomLines: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
    height: 20,
    alignItems: 'flex-end',
  },
  zoomLine: {
    width: 1.5,
    height: '100%',
  },
  zoomText: {
    fontSize: 13,
  },
  recordButtonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  recordButton: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Camera - Centered with lots of whitespace
  cameraContainer: {
    flex: 1,
    marginHorizontal: 32,
    marginTop: 50,
    marginBottom: 50,
    borderRadius: 24,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  camera: {
    flex: 1,
  },

  // Bottom Controls - Minimalist layout
  bottomControls: {
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
  },
  spacer: {
    flex: 1,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shutterButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
  },
});
