import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import Icon from 'react-native-vector-icons/Ionicons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Switch } from 'react-native-switch';
import { SelectList } from 'react-native-dropdown-select-list';
import { initializeApp } from 'firebase/app';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as VideoThumbnails from 'expo-video-thumbnails';

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

  const [isPressed, setIsPressed] = useState(false);
  const toggleIcon = () => {
    setIsPressed(prev => !prev);
  };

  const [isRecording, setRecording] = useState(false);
  const camRef = useRef(null);
  const [isUploaded, setUploaded] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [resultText, setResultText] = useState('Uploaded Video! Finding Beta...');
  const [betaFound, setBetaFound] = useState(false);

  useEffect(() => {
    if (isUploaded) {
      setResultText('Uploaded Video! Finding Beta...');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 2000,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isUploaded]);

  useEffect(() => {
    if (betaFound) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setResultText('Beta Found! 🎉');
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [betaFound]);

  const recordIcon = async () => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    if (!isRecording) {
      try {
        setRecording(true);

        const { uri } = await camRef.current.recordAsync({ mute: true, maxDuration: 50 });
        console.log('Got video at', uri);

        const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
        uri,
        { time: 1500 }
        );
        console.log('Got picture at', thumbnailUri);

        const response = await fetch(uri);
        const blob = await response.blob()
        const storage = getStorage(app);
        const storageRef1 = ref(storage, `Videos/${Date.now()}.mp4`);
        await uploadBytes(storageRef1, blob);
        const downloadURL = await getDownloadURL(storageRef1);
        console.log('Uploaded video:', downloadURL);

        const thumbResponse = await fetch(thumbnailUri);
        const thumbBlob = await thumbResponse.blob();

        const ID = `${Date.now()}`;

        const thumbRef = ref(storage, `Thumbnails/${ID}.jpg`);
        await uploadBytes(thumbRef, thumbBlob);
        const thumbURL = await getDownloadURL(thumbRef);
        console.log('Uploaded thumbnail:', thumbURL);

        if (isEnabled)
        {
          console.log('Beta')

          const output = await fetch('http://10.14.175.22:5000/upsert', {
          method: 'POST',
          body: JSON.stringify({ID: ID, thumb_url: thumbURL}),
          });
        }
        else
        {
          console.log('Run')

          const output = await fetch('http://10.14.175.22:5000/save-thumb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thumb_url: thumbURL }),
          });
          const data = await output.json();
          console.log('Response from Flask:', data);

          const beta = data.id
          const pictureStorage = getStorage()
          const pictureStorageRef = ref(storage, `Thumbnails/${beta}.jpg`)
          const downloadURL = await getDownloadURL(pictureStoageRef);
        }
        setUploaded(true);

        setTimeout(() => {
          setBetaFound(true);
        }, 4000);

      } catch (e) {
        console.warn('Failed to start recording', e);
        setRecording(false);
      }
    } else {
      try {
        await camRef.current.stopRecording();
        console.log('Recording stopped');
      } catch (e) {
        console.warn('Failed to stop recording', e);
      } finally {
        setRecording(false);
      }
    }
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

  const [selected, setSelected] = useState('');
  const data = [
    { key: '1', value: '🌱  V1  🌱' },
    { key: '2', value: '🍼  V2  🍼' },
    { key: '3', value: '🐣  V3  🐣' },
    { key: '4', value: '🌿  V4  🌿' },
    { key: '5', value: '🪴  V3  🪴' },
    { key: '6', value: '🏆  V6  🏆' },
  ];
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(s => !s);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <CameraView mode="video" style={styles.camera} enableTorch={isPressed} ref={camRef}>
          <View style={styles.topMenu}>
            <View style={styles.switchContainer}>
              <Switch
                value={isEnabled}
                onValueChange={toggleSwitch}
                circleSize={18}
                circleBorderWidth={1.3}
                barHeight={16}
                switchWidthMultiplier={2}
                switchBorderRadius={7}
                backgroundActive="rgba(181,21,57,1)"
                circleActiveColor="#FFFFFF"
                circleInActiveColor="#FFFFFF"
                ios_backgroundColor="#E0E0E0"
                activeText=''
                inActiveText=''
              />
              <Text style={styles.switchText}>{isEnabled ? 'Beta' : 'Run'}</Text>
            </View>
            <SelectList
              setSelected={val => setSelected(val)}
              data={data}
              save="value"
              style={styles.list}
              boxStyles={{ width: 110, padding: 0, borderColor: 'white', top: 22, left: 10 }}
              inputStyles={{ color: 'white' }}
              dropdownStyles={{ width: 110, borderColor: 'white', top: 18, left: 10, height: 90, alignItems: 'center'}}
              dropdownTextStyles={{ color: 'white', fontWeight: 600}}
              placeholder={'V1'}
              search={false}
              arrowicon={<Icon name="chevron-down-outline" size={20} color="white" left={5}/>}
            />
          </View>
          <View style={[styles.rectangleOverlay, { width: rectSize.width, height: rectSize.height, maxHeight: 500, maxWidth: 300 }]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <Icon style={styles.cameraIcon} name="add-outline" size={40} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <PanGestureHandler onGestureEvent={handleGestureBottom} onHandlerStateChange={handleGestureBottom}>
              <View style={[styles.corner, styles.bottomRight]} />
            </PanGestureHandler>
          </View>
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.bottomRow}>
              <View style={styles.iconContainer}>
                <View style={styles.statsContainer}>
                  <Icon style={styles.icon} name="trending-up-outline" size={40} />
                  <Text style={styles.stats}>Trends</Text>
                </View>
              </View>
              <TouchableOpacity onPress={recordIcon}>
                <View style={styles.circleContainer}>
                  <View
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(181, 21, 57, 0.6)',
                      borderWidth: 4,
                      width: 66,
                      height: 66,
                      borderRadius: 33,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: isRecording ? 32 : 54,
                        height: isRecording ? 32 : 54,
                        backgroundColor: 'rgba(181, 21, 57, 1)',
                        borderRadius: isRecording ? 4 : 33,
                      }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.icon2Container}>
                <View style={styles.flashContainer}>
                  <TouchableOpacity onPress={toggleIcon}>
                    <Icon style={styles.flash} name={isPressed ? 'flash-outline' : 'flash-off-outline'} size={40} />
                    <Text style={styles.flashText}>Flash</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
      <View style={styles.resultsContainer}>
        <Animated.View style={[styles.resultsDisplay, { opacity: fadeAnim }]}>
          <Text style={styles.resultText}>{resultText}</Text>
        </Animated.View>
        {betaFound && (
          <ConfettiCannon
            count={50}
            origin={{ x: 200, y: -10 }}
            fadeOut={true}
            explosionSpeed={350}
            fallSpeed={2500}
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
  rectangleOverlay: { position: 'absolute', top: '17%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  corner: { width: cornerSize, height: cornerSize, position: 'absolute', borderColor: 'white' },
  topLeft: { top: 0, left: 0, borderTopWidth: borderWidth, borderLeftWidth: borderWidth, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: borderWidth, borderRightWidth: borderWidth, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: borderWidth, borderLeftWidth: borderWidth, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: borderWidth, borderRightWidth: borderWidth, borderBottomRightRadius: 12 },
  cameraIcon: { color: 'rgba(255, 255, 255, 0.8)' },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 60 },
  iconContainer: { position: 'absolute', right: 100 },
  icon: { color: 'white', fontSize: 35 },
  circleContainer: { justifyContent: 'center', alignItems: 'center' },
  statsContainer: { justifyContent: 'center', alignItems: 'center' },
  stats: { color: 'rgba(255, 255, 255, 0.8)' },
  icon2Container: { left: 105, position: 'absolute' },
  flashContainer: { justifyContent: 'center', alignItems: 'center' },
  flash: { color: 'white', fontSize: 35 },
  flashText: { color: 'rgba(255, 255, 255, 0.8)' },
  switchContainer: { alignSelf: 'flex-start', paddingLeft: 15, paddingTop: 30, paddingBottom: 10, paddingRight: 5, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: 'rgba(255, 255, 255, 0.8)', top: 5, fontSize: 14 },
  topMenu: { flex: 1, flexDirection: 'row' },
  resultsContainer: { position: 'absolute', top: '31%', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  resultsDisplay: { backgroundColor: 'rgba(0,0,0,0.5)', width: 180, height: 25, borderRadius: 33, justifyContent: 'center', alignItems: 'center' },
  resultText: { color: 'white', fontSize: 12 },
});

