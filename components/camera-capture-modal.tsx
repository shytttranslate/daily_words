import {
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemedText } from './themed-text';

const ZOOM_STEP = 0.15;
const MIN_CROP = 0.08;
const CROP_HANDLE_SIZE = 40;
const CROP_HANDLE_HALF = CROP_HANDLE_SIZE / 2;

type CameraCaptureModalProps = {
  visible: boolean;
  onCapture: (uri: string) => void;
  onCancel: () => void;
};

type ImageLayout = {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  scale: number;
};

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}

export function CameraCaptureModal({
  visible,
  onCapture,
  onCancel,
}: CameraCaptureModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [zoom, setZoom] = useState(0);
  const zoomRef = useRef(0);
  const zoomStart = useRef(0);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const viewSizeRef = useRef({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const cropBoxStart = useRef({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const cornerStartRef = useRef({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const cropBoxRef = useRef(cropBox);
  const cameraRef = useRef<CameraView>(null);
  useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);
  useEffect(() => {
    viewSizeRef.current = viewSize;
  }, [viewSize]);

  const getImageLayout = useCallback((): ImageLayout | null => {
    if (!imgSize || !viewSize.width || !viewSize.height) return null;
    const scale = Math.min(viewSize.width / imgSize.width, viewSize.height / imgSize.height);
    return {
      width: imgSize.width * scale,
      height: imgSize.height * scale,
      offsetX: (viewSize.width - imgSize.width * scale) / 2,
      offsetY: (viewSize.height - imgSize.height * scale) / 2,
      scale,
    };
  }, [imgSize, viewSize]);

  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        Image.getSize(photo.uri, (w, h) => setImgSize({ width: w, height: h }));
      }
    } finally {
      setCapturing(false);
    }
  };

  const handleConfirmPhoto = useCallback(() => {
    if (capturedUri) onCapture(capturedUri);
    setCapturedUri(null);
    setCropMode(false);
  }, [capturedUri, onCapture]);

  const handleRetake = useCallback(() => {
    setCapturedUri(null);
    setCropMode(false);
    setImgSize(null);
  }, []);

  const handleResize = useCallback(async () => {
    if (!capturedUri) return;
    const currentWidth = imgSize?.width ?? 800;
    setProcessing(true);
    try {
      const result = await manipulateAsync(
        capturedUri,
        [{ resize: { width: Math.round(currentWidth * 0.5) } }],
        { compress: 1, format: SaveFormat.JPEG }
      );
      setCapturedUri(result.uri);
      setImgSize({ width: result.width, height: result.height });
    } catch {
      // ignore
    } finally {
      setProcessing(false);
    }
  }, [capturedUri, imgSize?.width]);

  const handleApplyCrop = useCallback(async () => {
    if (!capturedUri || !imgSize) return;
    const layout = getImageLayout();
    if (!layout) return;
    const { offsetX, offsetY, scale } = layout;
    const boxW = viewSize.width * cropBox.w;
    const boxH = viewSize.height * cropBox.h;
    const boxX = viewSize.width * cropBox.x;
    const boxY = viewSize.height * cropBox.y;
    const originX = clamp(0, imgSize.width, Math.round((boxX - offsetX) / scale));
    const originY = clamp(0, imgSize.height, Math.round((boxY - offsetY) / scale));
    const width = clamp(1, imgSize.width - originX, Math.round(boxW / scale));
    const height = clamp(1, imgSize.height - originY, Math.round(boxH / scale));
    setProcessing(true);
    try {
      const result = await manipulateAsync(
        capturedUri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 1, format: SaveFormat.JPEG }
      );
      setCapturedUri(result.uri);
      setImgSize({ width: result.width, height: result.height });
      setCropMode(false);
      setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    } catch {
      // ignore
    } finally {
      setProcessing(false);
    }
  }, [capturedUri, imgSize, getImageLayout, viewSize, cropBox]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      zoomStart.current = zoomRef.current;
    })
    .onUpdate((e) => {
      runOnJS(setZoom)(clamp(0, 1, zoomStart.current * e.scale));
    });

  const syncCropBoxStart = useCallback(() => {
    cropBoxStart.current = { ...cropBoxRef.current };
  }, []);
  const applyCropBox = useCallback((translationX: number, translationY: number) => {
    const v = viewSizeRef.current;
    if (v.width <= 0 || v.height <= 0) return;
    const start = cropBoxStart.current;
    const dx = translationX / v.width;
    const dy = translationY / v.height;
    setCropBox({
      ...start,
      x: clamp(0, 1 - start.w, start.x + dx),
      y: clamp(0, 1 - start.h, start.y + dy),
    });
  }, []);
  const panCropGesture = Gesture.Pan()
    .minDistance(0)
    .onStart(() => {
      runOnJS(syncCropBoxStart)();
    })
    .onUpdate((e) => {
      runOnJS(applyCropBox)(e.translationX, e.translationY);
    });

  const applyCornerTL = useCallback((translationX: number, translationY: number) => {
    const v = viewSizeRef.current;
    if (v.width <= 0 || v.height <= 0) return;
    const dx = translationX / v.width;
    const dy = translationY / v.height;
    const s = cornerStartRef.current;
    const x2 = s.x + s.w;
    const y2 = s.y + s.h;
    let x1 = clamp(0, x2 - MIN_CROP, s.x + dx);
    let y1 = clamp(0, y2 - MIN_CROP, s.y + dy);
    let w = x2 - x1;
    let h = y2 - y1;
    if (w < MIN_CROP) {
      x1 = x2 - MIN_CROP;
      w = MIN_CROP;
    }
    if (h < MIN_CROP) {
      y1 = y2 - MIN_CROP;
      h = MIN_CROP;
    }
    setCropBox({ x: x1, y: y1, w, h });
  }, []);
  const applyCornerTR = useCallback((translationX: number, translationY: number) => {
    const v = viewSizeRef.current;
    if (v.width <= 0 || v.height <= 0) return;
    const dx = translationX / v.width;
    const dy = translationY / v.height;
    const s = cornerStartRef.current;
    const x1 = s.x;
    const y2 = s.y + s.h;
    let x2 = clamp(x1 + MIN_CROP, 1, s.x + s.w + dx);
    let y1 = clamp(0, y2 - MIN_CROP, s.y + dy);
    let w = x2 - x1;
    let h = y2 - y1;
    if (w < MIN_CROP) {
      x2 = x1 + MIN_CROP;
      w = MIN_CROP;
    }
    if (h < MIN_CROP) {
      y1 = y2 - MIN_CROP;
      h = MIN_CROP;
    }
    setCropBox({ x: x1, y: y1, w, h });
  }, []);
  const applyCornerBL = useCallback((translationX: number, translationY: number) => {
    const v = viewSizeRef.current;
    if (v.width <= 0 || v.height <= 0) return;
    const dx = translationX / v.width;
    const dy = translationY / v.height;
    const s = cornerStartRef.current;
    const x2 = s.x + s.w;
    const y1 = s.y;
    let x1 = clamp(0, x2 - MIN_CROP, s.x + dx);
    let y2 = clamp(y1 + MIN_CROP, 1, s.y + s.h + dy);
    let w = x2 - x1;
    let h = y2 - y1;
    if (w < MIN_CROP) {
      x1 = x2 - MIN_CROP;
      w = MIN_CROP;
    }
    if (h < MIN_CROP) {
      y2 = y1 + MIN_CROP;
      h = MIN_CROP;
    }
    setCropBox({ x: x1, y: y1, w, h });
  }, []);
  const applyCornerBR = useCallback((translationX: number, translationY: number) => {
    const v = viewSizeRef.current;
    if (v.width <= 0 || v.height <= 0) return;
    const dx = translationX / v.width;
    const dy = translationY / v.height;
    const s = cornerStartRef.current;
    const x1 = s.x;
    const y1 = s.y;
    let x2 = clamp(x1 + MIN_CROP, 1, s.x + s.w + dx);
    let y2 = clamp(y1 + MIN_CROP, 1, s.y + s.h + dy);
    let w = x2 - x1;
    let h = y2 - y1;
    if (w < MIN_CROP) {
      x2 = x1 + MIN_CROP;
      w = MIN_CROP;
    }
    if (h < MIN_CROP) {
      y2 = y1 + MIN_CROP;
      h = MIN_CROP;
    }
    setCropBox({ x: x1, y: y1, w, h });
  }, []);

  const syncCornerStart = useCallback(() => {
    cornerStartRef.current = { ...cropBoxRef.current };
  }, []);
  const makeCornerGesture = (apply: (tx: number, ty: number) => void) =>
    Gesture.Pan()
      .minDistance(0)
      .onStart(() => {
        runOnJS(syncCornerStart)();
      })
      .onUpdate((e) => {
        runOnJS(apply)(e.translationX, e.translationY);
      });

  const panCornerTL = useMemo(() => makeCornerGesture(applyCornerTL), [applyCornerTL]);
  const panCornerTR = useMemo(() => makeCornerGesture(applyCornerTR), [applyCornerTR]);
  const panCornerBL = useMemo(() => makeCornerGesture(applyCornerBL), [applyCornerBL]);
  const panCornerBR = useMemo(() => makeCornerGesture(applyCornerBR), [applyCornerBR]);

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible animationType="slide" onRequestClose={onCancel}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.message}>Đang kiểm tra quyền camera...</ThemedText>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onCancel}>
        <View style={styles.centered}>
          <ThemedText style={styles.message}>
            Ứng dụng cần quyền camera để chụp ảnh quét chữ.
          </ThemedText>
          <Pressable style={styles.btn} onPress={requestPermission}>
            <ThemedText type="defaultSemiBold" style={styles.btnText}>
              Cho phép
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onCancel}>
            <ThemedText type="defaultSemiBold" style={styles.btnTextSecondary}>
              Hủy
            </ThemedText>
          </Pressable>
        </View>
      </Modal>
    );
  }

  // Preview step: after capture, show image with edit options
  if (capturedUri) {
    return (
      <Modal visible animationType="slide" onRequestClose={handleRetake}>
        <GestureHandlerRootView style={{ flex: 1 }} unstable_forceActive>
          <View style={styles.previewContainer}>
          <View
            style={styles.previewImageWrap}
            onLayout={(e) =>
              setViewSize({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              })
            }
          >
            <Image
              source={{ uri: capturedUri }}
              style={styles.previewImage}
              resizeMode="contain"
              onLoad={() => {
                Image.getSize(capturedUri, (w, h) => setImgSize({ width: w, height: h }));
              }}
            />
            {cropMode && viewSize.width > 0 && (() => {
              const boxLeft = viewSize.width * cropBox.x;
              const boxTop = viewSize.height * cropBox.y;
              const boxW = viewSize.width * cropBox.w;
              const boxH = viewSize.height * cropBox.h;
              return (
                <>
                  <View style={styles.cropOverlay} pointerEvents="none">
                    <View style={[styles.cropShade, { top: 0, left: 0, right: 0, height: viewSize.height * cropBox.y }]} />
                    <View style={[styles.cropShade, { top: viewSize.height * (cropBox.y + cropBox.h), left: 0, right: 0, bottom: 0 }]} />
                    <View style={[styles.cropShade, { top: viewSize.height * cropBox.y, left: 0, width: viewSize.width * cropBox.x, height: viewSize.height * cropBox.h }]} />
                    <View style={[styles.cropShade, { top: viewSize.height * cropBox.y, left: viewSize.width * (cropBox.x + cropBox.w), width: viewSize.width * (1 - cropBox.x - cropBox.w), height: viewSize.height * cropBox.h }]} />
                  </View>
                  <GestureDetector gesture={panCropGesture}>
                    <View
                      style={[
                        styles.cropBox,
                        {
                          left: boxLeft,
                          top: boxTop,
                          width: boxW,
                          height: boxH,
                        },
                      ]}
                      pointerEvents="auto"
                    />
                  </GestureDetector>
                  <GestureDetector gesture={panCornerTL}>
                    <View style={[styles.cropHandle, { left: boxLeft - CROP_HANDLE_HALF, top: boxTop - CROP_HANDLE_HALF }]} />
                  </GestureDetector>
                  <GestureDetector gesture={panCornerTR}>
                    <View style={[styles.cropHandle, { left: boxLeft + boxW - CROP_HANDLE_HALF, top: boxTop - CROP_HANDLE_HALF }]} />
                  </GestureDetector>
                  <GestureDetector gesture={panCornerBL}>
                    <View style={[styles.cropHandle, { left: boxLeft - CROP_HANDLE_HALF, top: boxTop + boxH - CROP_HANDLE_HALF }]} />
                  </GestureDetector>
                  <GestureDetector gesture={panCornerBR}>
                    <View style={[styles.cropHandle, { left: boxLeft + boxW - CROP_HANDLE_HALF, top: boxTop + boxH - CROP_HANDLE_HALF }]} />
                  </GestureDetector>
                </>
              );
            })()}
          </View>
          <View style={styles.previewControls}>
            {cropMode ? (
              <>
                <Pressable
                  style={[styles.previewBtn, styles.previewBtnPrimary]}
                  onPress={handleApplyCrop}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText type="defaultSemiBold" style={styles.previewBtnText}>
                      Áp dụng
                    </ThemedText>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.previewBtn, styles.previewBtnSecondary]}
                  onPress={() => setCropMode(false)}
                >
                  <ThemedText type="defaultSemiBold" style={styles.previewBtnTextSecondary}>
                    Hủy crop
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.previewBtn, styles.previewBtnSecondary]}
                  onPress={() => setCropMode(true)}
                  disabled={processing}
                >
                  <ThemedText type="defaultSemiBold" style={styles.previewBtnTextSecondary}>
                    Crop
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.previewBtn, styles.previewBtnSecondary]}
                  onPress={handleResize}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText type="defaultSemiBold" style={styles.previewBtnTextSecondary}>
                      Thu nhỏ
                    </ThemedText>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.previewBtn, styles.previewBtnPrimary]}
                  onPress={handleConfirmPhoto}
                >
                  <ThemedText type="defaultSemiBold" style={styles.previewBtnText}>
                    Xong
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.previewBtn, styles.previewBtnSecondary]}
                  onPress={handleRetake}
                >
                  <ThemedText type="defaultSemiBold" style={styles.previewBtnTextSecondary}>
                    Chụp lại
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
        </GestureHandlerRootView>
      </Modal>
    );
  }

  // Camera step with zoom
  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <GestureDetector gesture={pinchGesture}>
          <View style={styles.cameraWrap}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              zoom={zoom}
              onCameraReady={() => setCameraReady(true)}
            />
          </View>
        </GestureDetector>
        <View style={styles.zoomRow}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setZoom((z) => clamp(0, 1, z - ZOOM_STEP))}
          >
            <ThemedText type="defaultSemiBold" style={styles.zoomBtnText}>
              −
            </ThemedText>
          </Pressable>
          <ThemedText style={styles.zoomLabel}>
            {Math.round(zoom * 100)}%
          </ThemedText>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setZoom((z) => clamp(0, 1, z + ZOOM_STEP))}
          >
            <ThemedText type="defaultSemiBold" style={styles.zoomBtnText}>
              +
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.controls}>
          <Pressable
            style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
            onPress={handleCapture}
            disabled={!cameraReady || capturing}
          >
            {capturing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.captureBtnText}>
                Chụp
              </ThemedText>
            )}
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onCancel}>
            <ThemedText type="defaultSemiBold" style={styles.cancelBtnText}>
              Hủy
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraWrap: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    color: '#fff',
    fontSize: 24,
  },
  zoomLabel: {
    color: '#fff',
    fontSize: 14,
    minWidth: 48,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  captureBtn: {
    backgroundColor: '#0a0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.7,
  },
  captureBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#111',
  },
  previewImageWrap: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  cropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cropShade: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  cropHandle: {
    position: 'absolute',
    width: CROP_HANDLE_SIZE,
    height: CROP_HANDLE_SIZE,
    borderRadius: CROP_HANDLE_HALF,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  previewControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  previewBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  previewBtnPrimary: {
    backgroundColor: '#0a0',
  },
  previewBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  previewBtnText: {
    color: '#fff',
  },
  previewBtnTextSecondary: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#fff',
  },
  btn: {
    backgroundColor: '#0a0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  btnText: {
    color: '#fff',
  },
  btnTextSecondary: {
    color: '#999',
  },
});
