import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Download, X } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AC from '@bacons/apple-colors';
import { transformToImpressionistPainting, mockTransformation, isApiConfigured } from '@/services/ai-transform';

export default function ResultScreen() {
  const { photoUri, base64 } = useLocalSearchParams<{
    photoUri: string;
    base64: string;
  }>();

  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (photoUri) {
      transformImage();
    }
  }, [photoUri]);

  const transformImage = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let result;

      if (isApiConfigured()) {
        // Use real OpenAI API if configured
        result = await transformToImpressionistPainting(base64);
      } else {
        // Use mock transformation for demo - simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2500));
        result = await mockTransformation();
      }

      if (result.success && result.imageUrl) {
        setTransformedImage(result.imageUrl);
        // Save the transformed image URL for thumbnail display
        try {
          await AsyncStorage.setItem('lastTransformedImage', result.imageUrl);
        } catch (error) {
          console.log('Error saving last photo:', error);
        }
      } else {
        setError(result.error || 'Failed to transform your photo. Please try again.');
      }

    } catch (err) {
      setError('Failed to transform your photo. Please try again.');
      console.error('Transformation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToPhotos = async () => {
    if (!transformedImage || isSaving) return;

    setIsSaving(true);

    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Pocket Monet needs access to your photo library to save your masterpiece.',
          [{ text: 'OK' }]
        );
        setIsSaving(false);
        return;
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `pocket_monet_${timestamp}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Download the transformed image to device
      const downloadResult = await FileSystem.downloadAsync(transformedImage, fileUri);

      if (!downloadResult.uri) {
        throw new Error('Failed to download image');
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

      // Try to create/add to Pocket Monet album
      try {
        const albums = await MediaLibrary.getAlbumsAsync();
        const existingAlbum = albums.find(album => album.title === 'Pocket Monet');

        if (existingAlbum) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], existingAlbum, false);
        } else {
          await MediaLibrary.createAlbumAsync('Pocket Monet', asset, false);
        }
      } catch (albumError) {
        console.log('Album creation failed, but image was saved:', albumError);
      }

      // Clean up the temporary file
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });

      Alert.alert(
        'Masterpiece Saved! 🎨',
        'Your Impressionist painting has been saved to your Photos.',
        [
          {
            text: 'Take Another',
            onPress: () => router.back(),
          },
        ]
      );

    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(
        'Save Failed',
        'Could not save your masterpiece. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const discardAndRetake = () => {
    router.back();
  };

  const backgroundColor = colorScheme === 'dark' ? 'black' : 'white';
  const textColor = colorScheme === 'dark' ? 'white' : 'black';

  if (isProcessing) {
    // Processing State - Show original photo with overlay
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.processingContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUri }} style={styles.image} />
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.processingText}>
                Transforming into an Impressionist masterpiece...
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    // Error State
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={transformImage}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: textColor }]}>Back to Camera</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Success State - Match the design from picture.png
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Transformed Image - Centered with same layout as camera */}
      <View style={styles.resultContainer}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: transformedImage }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Bottom Action Buttons - Match design exactly */}
      <View style={styles.actionContainer}>
        <View style={styles.actionRow}>
          {/* Save Button */}
          <Pressable
            style={[styles.actionButton, isSaving && styles.actionButtonDisabled]}
            onPress={saveToPhotos}
            disabled={isSaving}
          >
            <View style={[styles.actionButtonCircle, { backgroundColor: textColor }]}>
              {isSaving ? (
                <ActivityIndicator size="small" color={backgroundColor} />
              ) : (
                <Download color={backgroundColor} size={20} />
              )}
            </View>
            <Text style={[styles.actionText, { color: textColor }]}>
              {isSaving ? 'Saving...' : 'Save to photos'}
            </Text>
          </Pressable>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Discard Button */}
          <Pressable style={styles.actionButton} onPress={discardAndRetake}>
            <View style={[styles.actionButtonCircle, { backgroundColor: textColor }]}>
              <X color={backgroundColor} size={20} />
            </View>
            <Text style={[styles.actionText, { color: textColor }]}>Discard</Text>
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
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 140,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 140,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderCurve: 'continuous',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '400',
  },
  retryButton: {
    backgroundColor: AC.systemBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '400',
  },
  actionContainer: {
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});