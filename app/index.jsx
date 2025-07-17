import React, { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, Animated, Easing, LogBox } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import Icon from 'react-native-vector-icons/Ionicons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Switch } from 'react-native-switch';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as VideoThumbnails from 'expo-video-thumbnails';

LogBox.ignoreLogs([
  "Style property 'width' is not supported by native animated module",
  "Style property 'height' is not supported by native animated module"
]);

const firebaseConfig = {
  apiKey: "AIzaSyDfJxqVElWXx3UNULE1R-2OG1zX4K5lKGo",
  authDomain: "boulder-4d99a.firebaseapp.com",
  projectId: "boulder-4d99a",
  storageBucket: "boulder-4d99a.firebasestorage.app",
};
const app = initializeApp(firebaseConfig);

const Home = () => {
  const [rectSize, setRectSize] = useState({ width: 250, height: 120 });
  const rectBase = useRef({ width: 250, height: 120 });
  const [rectPosition, setRectPosition] = useState({ x: 0, y: 0 });
  const [corners, setCorners] = useState({
    topLeft: { x: 0, y: 0 },
    topRight: { x: 0, y: 0 },
    bottomLeft: { x: 0, y: 0 },
    bottomRight: { x: 0, y: 0 },
  });
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const camRef = useRef(null);
  const [betaUploaded, setBetaUploaded] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [betaFound, setBetaFound] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRecording, setRecording] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const toggleIcon = () => setIsPressed(prev => !prev);
  const photoAnim = useRef(new Animated.Value(1)).current;
  
  const captureInnerAnim = useRef(new Animated.Value(1)).current;
  const captureOpacityAnim = useRef(new Animated.Value(1)).current; 
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [isUploaded, setUploaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const resultFadeInAnim = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const loadingMove = useRef(new Animated.Value(10)).current;
  const bottomCornersAnim = useRef(new Animated.Value(0)).current;
  const toggleSwitch = () => setIsEnabled(s => !s);
  const loadingLoop = useRef(null);
  const resultTranslateY = useRef(new Animated.Value(-20)).current;

  const fadeOutUI = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(captureOpacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  
  const fadeInUI = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(captureOpacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideResultContainer = () => {
    Animated.parallel([
      Animated.timing(resultFadeInAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(resultTranslateY, {
        toValue: 40,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBetaFound(false);
    });
  };

  const startLoading = () => {
    const seq = Animated.sequence([
      Animated.timing(fadeInAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(loadingMove, {
        toValue: rectSize.width - 34,
        duration: 700,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(loadingMove, {
        toValue: 0,
        duration: 700,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]);
    loadingLoop.current = Animated.loop(seq);
    loadingLoop.current.start();
  };

  useEffect(() => {
    (async () => {
      const camStatus = await Camera.requestCameraPermissionsAsync();
      if (camStatus.granted) setHasCameraPermission(true);
    })();
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const { x, y } = rectPosition;
    const { width, height } = rectSize;
    setCorners({
      topLeft: { x, y },
      topRight: { x: x + width, y },
      bottomLeft: { x, y: y + height },
      bottomRight: { x: x + width, y: y + height },
    });
  }, [rectPosition, rectSize]);

  useEffect(() => {
    if (betaFound && loadingLoop.current) {
      loadingLoop.current.stop();

      Animated.parallel([
        Animated.timing(loadingMove, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeInAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
      }),
      ]).start(() => {
        loadingLoop.current = null;
      });
    }
  }, [betaFound]);

  const animatePhoto = () => {
    Animated.sequence([
      Animated.timing(photoAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(photoAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  const fadeIn = () => {
    const seq = Animated.sequence([
      Animated.timing(fadeInAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(loadingMove, {
        toValue: rectSize.width - 34,
        duration: 700,
        easing: Easing.inOut(Easing.sin),  
        useNativeDriver: true,
      }),
      Animated.timing(loadingMove, {
        toValue: 0,
        duration: 700,
        easing: Easing.inOut(Easing.sin),  
        useNativeDriver: true,
      }),
    ]);
    const loop = Animated.loop(seq);
    loadingLoop.current = loop;
    loop.start();
  };

  const resultFadeIn = () => {
  resultTranslateY.setValue(-20);
  Animated.sequence([
    Animated.parallel([
      Animated.timing(resultFadeInAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(resultTranslateY, {
        toValue: -80,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]),
    Animated.delay(150),
  ]).start(() => {
    fadeInUI();
  });
};

const animateInnerToSquare = () => {
  console.log("animateInnerToSquare called, current value:", captureInnerAnim._value);
  return new Promise((resolve, reject) => {
    Animated.timing(captureInnerAnim, { 
      toValue: 0, 
      duration: 300, 
      useNativeDriver: false,  
      easing: Easing.out(Easing.quad)
    }).start(({ finished }) => {
      console.log("Animation to square finished:", finished, "final value:", captureInnerAnim._value);
      if (finished) {
        resolve();
      } else {
        reject(new Error("Animation was cancelled"));
      }
    });
  });
};

const animateInnerToCircle = () => {
  console.log("animateInnerToCircle called, current value:", captureInnerAnim._value);
  return new Promise((resolve, reject) => {
    Animated.timing(captureInnerAnim, { 
      toValue: 1, 
      duration: 300, 
      useNativeDriver: false,  
      easing: Easing.out(Easing.quad)
    }).start(({ finished }) => {
      console.log("Animation to circle finished:", finished, "final value:", captureInnerAnim._value);
      if (finished) {
        resolve();
      } else {
        reject(new Error("Animation was cancelled"));
      }
    });
  });
};

const capturePhoto = async () => {
  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const storage = getStorage(app);
    const ID = `${Date.now()}`;
    
    setRecording(false);
    
    const video = await camRef.current.recordAsync({ maxDuration: 1, mute: true });
    const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(video.uri, { time: 500 });
    const response = await fetch(thumbnailUri);
    const blob = await response.blob();
    const photoRef = ref(storage, `Photos/${ID}.jpg`);
    await uploadBytes(photoRef, blob);
    const photoURL = await getDownloadURL(photoRef);
    
    setBetaFound(false);
    fadeOutUI();
    setTimeout(() => startLoading(), 0);
    setUploaded(true);
    
    await fetch('http://10.72.90.22:5000/save-thumb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thumb_url: photoURL }),
    });
    
    setTimeout(() => resultFadeIn(), 500);
    setBetaFound(true);
  } catch (e) {
    setScanFailed(true);
    setRecording(false); 
  }
};

const onCapturePress = async () => {
  console.log('onCapturePress - isEnabled:', isEnabled, 'isRecording:', isRecording);
  
  if (isEnabled) {
    if (!isRecording) {
      console.log("Starting recording process");
      setRecording(true);
      
      try {
        await animateInnerToSquare();
        console.log("Animation completed, starting recording");
        
        const storage = getStorage(app);
        const ID = `${Date.now()}`;
        
        const video = await camRef.current.recordAsync({ maxDuration: 15, mute: true });
        const videoBlob = await (await fetch(video.uri)).blob();
        const videoRef = ref(storage, `Videos/${ID}.mp4`);
        await uploadBytes(videoRef, videoBlob);
        const videoURL = await getDownloadURL(videoRef);
        
        const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(video.uri, { time: 1000 });
        const thumbResponse = await fetch(thumbnailUri);
        const thumbBlob = await thumbResponse.blob();
        const thumbRef = ref(storage, `Photos/${ID}.jpg`);
        await uploadBytes(thumbRef, thumbBlob);
        const thumbURL = await getDownloadURL(thumbRef);
        
        await fetch('http://10.72.90.22:5000/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ID, thumb_url: thumbURL }),
        });
        
        console.log("Upserted thumbnail from video");
        setBetaUploaded(true);
      } catch (err) {
        console.error("Recording error:", err);
        setScanFailed(true);
      } finally {
        await animateInnerToCircle();
        setRecording(false);
      }
    } else {
      try {
        await camRef.current.stopRecording();
      } catch (err) {
        console.error("Stop recording error:", err);
      }
      await animateInnerToCircle();
      setRecording(false);
    }
  } else {
    animatePhoto();
    await capturePhoto();
  }
};

  const handleGestureBottom = event => {
    const { translationX, translationY, state } = event.nativeEvent;
    if (state === State.BEGAN) rectBase.current = { ...rectSize };
    if (state === State.ACTIVE) {
      setRectSize({
        width: Math.min(250, Math.max(90, rectBase.current.width + translationX)),
        height: Math.min(200, Math.max(90, rectBase.current.height + translationY)),
      });
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={camRef} mode="video">
          <View style={styles.topMenu}>
            <View style={styles.switchContainer}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Switch
                  value={isEnabled}
                  onValueChange={toggleSwitch}
                  circleSize={18}
                  circleBorderWidth={0}
                  barHeight={16}
                  switchWidthMultiplier={2.2}
                  switchBorderRadius={7}
                  backgroundActive="rgba(181,21,57,1)"
                  backgroundInactive="#CCCCCC"
                  circleActiveColor="rgba(181,21,57,0)"
                  circleInActiveColor="rgba(0,0,0,0)"
                  ios_backgroundColor="#E0E0E0"
                  activeText=""
                  inActiveText=""
                  renderInsideCircle={() => (
                    <Image
                      source={isEnabled ? require('RockInactive.png') : require('rockboy.png')}
                      style={isEnabled ? { width: 35, height: 35, borderRadius: 10 } : { width: 40, height: 40, borderRadius: 10 }}
                    />
                  )}
                />
              </Animated.View>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.switchText}>{isEnabled ? 'Beta' : 'Run'}</Text>
              </Animated.View>
            </View>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Icon style={styles.questionIcon} name="help-circle-outline" size={33} />
            </Animated.View>
          </View>
          <View
            onLayout={event => {
              const { x, y } = event.nativeEvent.layout;
              setRectPosition({ x, y });
            }}
            style={[styles.rectangleOverlay, { width: rectSize.width, height: rectSize.height }]}
          >
            <Animated.View
              style={[
                styles.loadingLine,
                {
                  left: 13,
                  transform: [{ translateX: loadingMove }],
                  opacity: fadeInAnim,
                  height: rectSize.height - 25,
                },
              ]}
            />
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <Animated.View style={{ opacity: fadeAnim }}>
              <Icon style={styles.cameraIcon} name="close-outline" size={30} />
            </Animated.View>
            <View style={[styles.corner, styles.bottomLeft]} />
            <PanGestureHandler onGestureEvent={handleGestureBottom} onHandlerStateChange={handleGestureBottom}>
              <View style={[styles.corner, styles.bottomRight]} />
            </PanGestureHandler>
          </View>
          <Animated.View pointerEvents="box-none" style={[styles.resultContainer, { opacity: resultFadeInAnim, transform: [{ translateY: resultTranslateY }], top: rectPosition.y + rectSize.height + 40 }]}>
            <Text style={styles.heading}>Hmmm, that doesn't look right</Text>
            <Text style={styles.subHeading}>Sorry, but we weren't able to find a beta for this route.</Text>
            <Text style={styles.subHeading2}>Maybe, try again? 😞</Text>
            <TouchableOpacity style={styles.button} onPress={hideResultContainer}>
              <Text style={styles.buttonText}>Retake photo</Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.bottomRow}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Icon style={styles.gallery} name="images-outline" />
              </Animated.View>
              <TouchableOpacity onPress={onCapturePress}>
                <Animated.View style={[styles.outerCaptureButton, { opacity: captureOpacityAnim }]}>
                  <Animated.View
                    style={{
                      width: captureInnerAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 54] }),
                      height: captureInnerAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 54] }),
                      borderRadius: captureInnerAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 27] }),
                      backgroundColor: 'rgba(181, 21, 57, 1)',
                    }}
                  />
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleIcon}>
                <Animated.View style={{ opacity: fadeAnim }}>
                  <Icon style={styles.flash} name={isPressed ? 'flash-outline' : 'flash-off-outline'} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </GestureHandlerRootView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1 },
  rectangleOverlay: { position: 'absolute', top: '20%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  corner: { width: 22, height: 22, position: 'absolute', borderColor: 'white' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  cameraIcon: { color: 'rgba(255, 255, 255, 0.8)' },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 60, paddingHorizontal: 60, width: '100%' },
  gallery: { color: 'white', fontSize: 30 },
  outerCaptureButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(181, 21, 57, 0.6)',
    borderWidth: 4,
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flash: { color: 'white', fontSize: 30 },
  switchText: { color: 'rgba(255, 255, 255, 0.8)', top: 7, fontSize: 13 },
  topMenu: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 40, height: 80 },
  switchContainer: { flexDirection: 'column', alignItems: 'center', left: 5 },
  questionIcon: { color: 'rgba(255, 255, 255, 1)' },
  loadingLine: {
    width: 7,
    position: 'absolute',
    backgroundColor: 'white',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 1
  },
  resultContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    alignSelf: 'center',
  },
  heading: { fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center' },
  subHeading: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 5 },
  subHeading2: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 15 },
  button: { backgroundColor: 'black', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20 },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 14 },
});