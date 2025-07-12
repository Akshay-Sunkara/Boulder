import React, { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import Icon from 'react-native-vector-icons/Ionicons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Switch } from 'react-native-switch';
import { initializeApp } from 'firebase/app';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDfJxqVElWXx3UNULE1R-2OG1zX4K5lKGo",
  authDomain: "boulder-4d99a.firebaseapp.com",
  projectId: "boulder-4d99a",
  storageBucket: "boulder-4d99a.firebasestorage.app",
  messagingSenderId: "550532324788",
  appId: "1:550532324788:web:694144de1c8dc6d4dc66e1",
  measurementId: "G-BMSX4CZ68K"
};
const app = initializeApp(firebaseConfig);

const Home = () => {
  const [rectSize, setRectSize] = useState({ width: 250, height: 120 });
  const rectBase = useRef({ width: 250, height: 120 });
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);

  const [isPressed, setIsPressed] = useState(false);
  const toggleIcon = () => setIsPressed(prev => !prev);

  const camRef = useRef(null);
  const [isUploaded, setUploaded] = useState(false);
  const [betaUploaded, setBetaUploaded] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [betaFound, setBetaFound] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRecording, setRecording] = useState(false);

  const runContainerAnim = useRef(new Animated.Value(0)).current;
  const runTextAnim = useRef(new Animated.Value(0)).current;
  const betaContainerAnim = useRef(new Animated.Value(0)).current;
  const betaTextAnim = useRef(new Animated.Value(0)).current;
  const photoAnim = useRef(new Animated.Value(1)).current;

  const [resultText, setResultText] = useState('Uploaded Video! Finding Beta...');
  const [betaResultText, setBetaResultText] = useState('Thank you! Uploaded Beta.');

  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(s => !s);

  useEffect(() => {
    (async () => {
      const camStatus = await Camera.requestCameraPermissionsAsync();
      if (camStatus.granted) setHasCameraPermission(true);
      const micStatus = await Camera.requestMicrophonePermissionsAsync();
      if (micStatus.granted) setHasMicPermission(true);
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (isUploaded) {
      Animated.timing(runContainerAnim, {
        toValue: 1,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
      }).start();

      setResultText('Uploaded Photo! Finding Beta...');
      runTextAnim.setValue(0);
      Animated.timing(runTextAnim, {
        toValue: 1,
        duration: 800,
        delay: 1200,
        useNativeDriver: true,
      }).start();
    } else {
      runContainerAnim.setValue(0);
      runTextAnim.setValue(0);
    }
  }, [isUploaded]);

  useEffect(() => {
    if (betaFound) {
      Animated.timing(runTextAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setResultText('Beta Found! 🎉');
        runTextAnim.setValue(0);

        Animated.timing(runTextAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          setShowConfetti(true);

          setTimeout(() => {
            Animated.timing(runTextAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }).start();
          }, 2000);

          setTimeout(() => {
            Animated.timing(runContainerAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }).start();
          }, 2000);
        });
      });
    }
  }, [betaFound]);

  useEffect(() => {
    if (scanFailed) {
      Animated.timing(runTextAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setResultText('Beta Not Found 😔 Try again?');
        runTextAnim.setValue(0);
        Animated.timing(runTextAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [scanFailed]);

  useEffect(() => {
    if (betaUploaded) {
      betaContainerAnim.setValue(0);
      betaTextAnim.setValue(0);

      Animated.timing(betaContainerAnim, {
        toValue: 1,
        duration: 500,
        delay: 500,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(betaTextAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            Animated.timing(betaContainerAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start();
            Animated.timing(betaTextAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start();
          }, 5000);
        });
      });
    } else {
      betaContainerAnim.setValue(0);
      betaTextAnim.setValue(0);
    }
  }, [betaUploaded]);

  const animatePhoto = () => {
    Animated.sequence([
      Animated.timing(photoAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(photoAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const capturePhoto = async () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setRecording(true);

      const photo = await camRef.current.takePictureAsync({ quality: 0.8 });
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      const storage = getStorage(app);

      const ID = `${Date.now()}`;
      const photoRef = ref(storage, `Photos/${ID}.jpg`);
      await uploadBytes(photoRef, blob);
      const photoURL = await getDownloadURL(photoRef);

      console.log("Uploaded picture")

      if (isEnabled) {
        await fetch('http://10.14.175.22:5000/upsert', {
          method: 'POST',
          body: JSON.stringify({ ID: ID, thumb_url: photoURL }),
        });
        setBetaUploaded(true);
      } else {
        setUploaded(true);
        const output = await fetch('http://10.14.175.22:5000/save-thumb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thumb_url: photoURL }),
        });
        const data = await output.json();
        const beta = data.id;
        const storageRef = ref(storage, `Thumbnails/${beta}.jpg`);
        await getDownloadURL(storageRef);

        setTimeout(() => setBetaFound(true), 4000);
      }
    } catch (e) {
      console.warn('Failed to take photo', e);
      setScanFailed(true);
    } finally {
      setRecording(false);
    }
  };

  const onCapturePress = async () => {
    animatePhoto();
    await capturePhoto();
  };

  const handleGestureBottom = event => {
    const { translationX, translationY, state } = event.nativeEvent;
    if (state === State.BEGAN) rectBase.current = { ...rectSize };
    if (state === State.ACTIVE) {
      const newWidth = Math.max(150, rectBase.current.width + translationX);
      const newHeight = Math.max(80, rectBase.current.height + translationY);
      setRectSize({ width: newWidth, height: newHeight });
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={camRef}>
          <View style={styles.topMenu}>
            <View style={styles.switchContainer}>
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
                    style={
                      isEnabled
                        ? { width: 35, height: 35, borderRadius: 10 }
                        : { width: 40, height: 40, borderRadius: 10 }
                    }
                  />
                )}
              />
              <Text style={styles.switchText}>{isEnabled ? 'Beta' : 'Run'}</Text>
            </View>
            <View style={styles.questionContainer}>
              <Icon style={styles.questionIcon} name="help-circle-outline" size={33} />
            </View>
          </View>

          <View style={[styles.rectangleOverlay, { width: rectSize.width, height: rectSize.height }]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <Icon style={styles.cameraIcon} name="close-outline" size={30} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <PanGestureHandler onGestureEvent={handleGestureBottom} onHandlerStateChange={handleGestureBottom}>
              <View style={[styles.corner, styles.bottomRight]} />
            </PanGestureHandler>
          </View>

          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.bottomRow}>
              <View style={styles.iconContainer}>
                <View style={styles.statsContainer}>
                  <Icon style={styles.gallery} name="images-outline" />
                </View>
              </View>
              <TouchableOpacity onPress={onCapturePress}>
                <Animated.View style={[styles.circleContainer, { transform: [{ scale: photoAnim }] }]}>
                  <View style={{
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(181, 21, 57, 0.6)',
                    borderWidth: 4,
                    width: 66,
                    height: 66,
                    borderRadius: 33,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      width: 54,
                      height: 54,
                      backgroundColor: 'rgba(181, 21, 57, 1)',
                      borderRadius: 33,
                    }} />
                  </View>
                </Animated.View>
              </TouchableOpacity>
              <View style={styles.icon2Container}>
                <TouchableOpacity onPress={toggleIcon}>
                  <Icon style={styles.flash} name={isPressed ? 'flash-outline' : 'flash-off-outline'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      </View>

      <View style={styles.resultsContainer}>
        <Animated.View style={[styles.resultsDisplay, { opacity: runContainerAnim }]}>
          <Animated.Text style={[styles.resultText, { opacity: runTextAnim }]}>
            {resultText}
          </Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.resultsDisplay, { opacity: betaContainerAnim }]}>
          <Animated.Text style={[styles.resultText, { opacity: betaTextAnim }]}>
            {betaResultText}
          </Animated.Text>
        </Animated.View>
        {showConfetti && (
          <ConfettiCannon
            count={200}
            origin={{ x: 200, y: -30 }}
            fadeOut
            explosionSpeed={800}
            fallSpeed={4000}
            colors={['rgba(181,21,57,1)', '#fff']}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default Home;

const cornerSize = 22;
const borderWidth = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  rectangleOverlay: { position: 'absolute', top: '20%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  corner: { width: cornerSize, height: cornerSize, position: 'absolute', borderColor: 'white' },
  topLeft: { top: 0, left: 0, borderTopWidth: borderWidth, borderLeftWidth: borderWidth, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: borderWidth, borderRightWidth: borderWidth, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: borderWidth, borderLeftWidth: borderWidth, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: borderWidth, borderRightWidth: borderWidth, borderBottomRightRadius: 12 },
  cameraIcon: { color: 'rgba(255, 255, 255, 0.8)' },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 60,
    paddingHorizontal: 60,
    width: '100%',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { color: 'white', fontSize: 35 },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: { color: 'rgba(255, 255, 255, 0.8)' },
  icon2Container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flash: {
    color: 'white',
    fontSize: 30,
  },

  switchText: { color: 'rgba(255, 255, 255, 0.8)', top: 7, fontSize: 13, fontFamily: 'sans-serif' },
  topMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    height: 80,
  },
  switchContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionIcon: {
    color: 'rgba(255, 255, 255, 1)',
  },

  gallery: {
    color: 'rgba(255,255,255,1)',
    fontSize: 30,
  },
  resultsContainer: {
    position: 'absolute',
    top: '31%',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsDisplay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 180,
    height: 25,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    color: 'white',
    fontSize: 12,
  },
});
