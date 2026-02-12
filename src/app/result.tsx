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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Download, X } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
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
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (base64) {
      transformImage(base64);
    }
  }, [base64]);

  const transformImage = async (imageBase64: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      let result;

      if (isApiConfigured()) {
        // Use real OpenAI API if configured
        result = await transformToImpressionistPainting(imageBase64);
      } else {
        // Use mock transformation for demo
        result = await mockTransformation();
      }

      if (result.success && result.imageUrl) {
        setTransformedImage(result.imageUrl);
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
    if (!transformedImage) return;

    try {
      if (!mediaLibraryPermission?.granted) {
        const permission = await requestMediaLibraryPermission();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Please grant access to save photos to your gallery.');
          return;
        }
      }

      // Download the image
      const fileUri = FileSystem.documentDirectory + 'pocket_monet_' + Date.now() + '.jpg';
      const downloadResult = await FileSystem.downloadAsync(transformedImage, fileUri);

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync('Pocket Monet', asset, false);

      Alert.alert(
        'Masterpiece Saved!',
        'Your Impressionist painting has been saved to your photos.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save your masterpiece. Please try again.');
      console.error('Save error:', error);
    }
  };

  const discardAndRetake = () => {
    Alert.alert(
      'Discard This Painting?',
      'Are you sure you want to discard this transformation and return to the camera?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const backgroundColor = colorScheme === 'dark' ? 'black' : 'white';
  const textColor = colorScheme === 'dark' ? 'white' : 'black';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isProcessing ? (
        // Processing State
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
      ) : error ? (
        // Error State
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => transformImage(base64)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        // Success State
        <View style={styles.resultContainer}>
          {/* Transformed Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: transformedImage }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <Pressable style={styles.actionButton} onPress={saveToPhotos}>
              <Download color={textColor} size={24} />
              <Text style={[styles.actionText, { color: textColor }]}>Save to Photos</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={discardAndRetake}>
              <X color={textColor} size={24} />
              <Text style={[styles.actionText, { color: textColor }]}>Discard</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 60,
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
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 40,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});