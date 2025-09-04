import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Image, StyleSheet, View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, Animated, Easing, LogBox, Linking, Pressable } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import Icon from 'react-native-vector-icons/Ionicons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Switch } from 'react-native-switch';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useNavigate } from 'react-router-native';
import Gallery from './Gallery'  
import { Dropdown } from 'react-native-element-dropdown';

LogBox.ignoreLogs(['Warning: ...']);

const firebaseConfig = {
  apiKey: "AIzaSyDfJxqVElWXx3UNULE1R-2OG1zX4K5lKGo",
  authDomain: "boulder-4d99a.firebaseapp.com",
  projectId: "boulder-4d99a",
  storageBucket: "boulder-4d99a.firebasestorage.app",
};
const app = initializeApp(firebaseConfig);

const GlobalContext = createContext();

export const GlobalArrayProvider = ({ children }) => {
  const [array, setArray] = useState([]); 

  return (
    <GlobalContext.Provider value={{ array, setArray }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useVideo = () => useContext(GlobalContext);

const colorData = [
  { label: '⚪🤍', value: 'white' },
  { label: '💛🌕', value: 'yellow' },
  { label: '❤️🔴', value: 'red' },
  { label: '💙🔵', value: 'blue' },
  { label: '💚🌱', value: 'green' },
  { label: '🖤⚫', value: 'black' },
];

const DropdownComponent = ({ onColorChange }) => {
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: 'rgba(255,255,255,0.8)' }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        itemTextStyle={styles.itemTextStyle}
        itemContainerStyle={styles.itemContainerStyle}
        containerStyle={styles.dropdownListContainer}
        data={colorData}
        search={false} // Remove search for cleaner look
        maxHeight={200} // Reduce height
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? 'Color' : '...'}
        value={value}
        onFocus={() => setIsFocus(true)}
        activeColor="rgba(255,255,255,0.1)"
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          setValue(item.value);
          setIsFocus(false);
          if (onColorChange) {
            onColorChange(item.value, item.label);
          }
        }}
        renderLeftIcon={() => (
          <View style={[styles.colorIndicator, { backgroundColor: value || 'rgba(255,255,255,0.3)' }]} />
        )}
        renderRightIcon={() => (
          <Icon 
            name={isFocus ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="rgba(255,255,255,0.7)" 
          />
        )}
      />
    </View>
  );
};

const Home = () => {
  const [selectedColor, setSelectedColor] = useState(null);
  const handleColorChange = (colorValue, colorLabel) => {
    setSelectedColor(colorValue);
    console.log('Selected color:', colorValue);
  };
  const navigate = useNavigate()
  const { array, setArray } = useVideo();
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
  const resultFadeInAnim2 = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const loadingMove = useRef(new Animated.Value(10)).current;
  const bottomCornersAnim = useRef(new Animated.Value(0)).current;
  const toggleSwitch = () => setIsEnabled(s => !s);
  const loadingLoop = useRef(null);
  const resultTranslateY = useRef(new Animated.Value(-20)).current;
  const resultTranslateY2 = useRef(new Animated.Value(-20)).current;
  const resultFadeInAnim3 = useRef(new Animated.Value(0)).current;
  const resultTranslateY3 = useRef(new Animated.Value(-20)).current;
  const [videoUrl, setVideoUrl] = useState('');
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const [showGallery, setShowGallery] = useState(false)

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

  const toggleSwitch2 = () => {
    setIsEnabled(prev => {
      const next = !prev;
      if (!next) {
        setBetaFound(false);
        setScanFailed(false);
        setBetaUploaded(false);
      }
      return next;
    });
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
      setShowGallery(true)
    });
  };

  const hideResultContainer2 = () => {
    Animated.parallel([
      Animated.timing(resultFadeInAnim2, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(resultTranslateY2, {
        toValue: 40,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setScanFailed(false);
      setBetaFound(false);
    });
  };

  const hideResultContainer3 = () => {
    Animated.parallel([
      Animated.timing(resultFadeInAnim3, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(resultTranslateY3, {
        toValue: 40,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBetaUploaded(false);
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
          duration: 1000,
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

  const resultFadeIn2 = () => {
  resultTranslateY.setValue(-20);
  Animated.sequence([
    Animated.parallel([
      Animated.timing(resultFadeInAnim2, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(resultTranslateY2, {
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

  const resultFadeIn3 = () => {
  resultTranslateY3.setValue(-20);
  Animated.sequence([
    Animated.parallel([
      Animated.timing(resultFadeInAnim3, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(resultTranslateY3, {
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
    const date = new Date().toISOString().split('T')[0]
    
    setBetaFound(false);
    fadeOutUI();
    setTimeout(() => startLoading(), 0);
    setUploaded(true);
    
    try {
      const thumbResponse = await fetch('http://10.37.19.22:5000/save-thumb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thumb_url: photoURL, color_value: selectedColor}),
      });
      const data = await thumbResponse.json();
      
      for (const id in data) {
        if (/^id\d+$/.test(id)) {
          console.log(id);

          const videoId = data[id];

          const videoRef = ref(storage, `Videos/${videoId}.mp4`);
          const videoUrl = await getDownloadURL(videoRef);
          setVideoUrl(videoUrl);

          setArray(prevVideos => [...prevVideos, { videoUrl }]);
        }
      }

      if (thumbResponse.ok) {
        setTimeout(() => resultFadeIn(), 500);
        setBetaFound(true);
        console.log('Response data:', data);
        console.log('Download URL:', videoUrl);
      }
    } catch (networkError) {
      console.error('Network error in save-thumb:', networkError);
      console.error('Error message:', networkError.message);
      console.error('Error stack:', networkError.stack);
      setTimeout(() => resultFadeIn2(), 500);
      setBetaFound(true);
      setScanFailed(true);
    }
    
  } catch (e) {
    console.error('General error in capturePhoto:', e);
    console.error('Error message:', e.message);
    console.error('Error stack:', e.stack);
    setTimeout(() => resultFadeIn(), 500);
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
        
        await fetch('http://172.28.179.22:5000/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ID, thumb_url: thumbURL }),
        });
        
        console.log("Upserted thumbnail from video");
        setBetaUploaded(true);
        setTimeout(() => resultFadeIn3(), 100);
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

  const pageFadeInAnim = () => {
    Animated.sequence([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start(() => {
      navigate('/gallery')
    })
  };

  return (
    
    <Animated.View 
      style={{
        flex: 1,
        }}
    >
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
                      source={isEnabled ? require('./assets/RockActive.png') : require('./assets/RockActive.png')}
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
              {/* <Icon style={styles.questionIcon} name="help-circle-outline" size={33} /> */}
              <DropdownComponent onColorChange={handleColorChange} />
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
          
          <Animated.View style={{
            position: 'absolute',
            bottom: 150,
            alignSelf: 'center',
            width: 200,
            height: 23,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: fadeAnim
          }}>
            <Animated.Text style={{ color: 'white', fontSize: 12, fontWeight: '500', opacity: fadeAnim }}>
              Find or upload your beta (β)
              <Text style={{ fontStyle: 'italic', fontSize: 12 }}> 🐛🚀</Text>
            </Animated.Text>
          </Animated.View>

          <Animated.View
            pointerEvents={betaFound && !scanFailed ? 'auto' : 'none'}
            style={[
              styles.resultContainer,
              {
                opacity: resultFadeInAnim,
                transform: [{ translateY: resultTranslateY }],
                top: rectPosition.y + rectSize.height + 120,
              },
            ]}
          >
          <Text style={styles.heading}>Great! We found your beta</Text>
          <Text style={styles.subHeading}>We think this beta should work great.</Text>
          <Text style={styles.subHeading2}>Full send your climb! 🪨 🤟</Text>
          <TouchableOpacity style={styles.button} onPress={hideResultContainer}>
            <Text style={styles.buttonText}>View Beta</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          pointerEvents={betaFound && scanFailed ? 'auto' : 'none'}
          style={[
            styles.resultContainer2,
            {
              opacity: resultFadeInAnim2,
              transform: [{ translateY: resultTranslateY2 }],
              top: rectPosition.y + rectSize.height + 150,
            },
          ]}
        >
          <Text style={styles.heading2}>Hmmm, that doesn't look right</Text>
          <Text style={styles.subHeading2_2}>
            Sorry, but we weren't able to find a beta for this route.
          </Text>
          <Text style={styles.subHeading22}>Maybe, try again? 😞</Text>
          <TouchableOpacity style={styles.button2} onPress={hideResultContainer2}>
            <Text style={styles.buttonText2}>Retake photo</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          pointerEvents={betaUploaded && !scanFailed ? 'auto' : 'none'}
          style={[
            styles.resultContainer3,
            {
              opacity: resultFadeInAnim3,
              transform: [{ translateY: resultTranslateY3 }],
              top: rectPosition.y + rectSize.height + 150,
            },
          ]}
        >
          <Text style={styles.heading3}>Uploaded your Beta!</Text>
          <Text style={styles.subHeading3}>
            Thanks so much for helping fellow climbers send their projects.
          </Text>
          <TouchableOpacity style={styles.button3} onPress={hideResultContainer3}>
            <Text style={styles.buttonText3}>Retake photo</Text>
          </TouchableOpacity>
        </Animated.View>

          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.bottomRow}>
            <TouchableOpacity onPress={pageFadeInAnim}>
                <Animated.View style={{ opacity: fadeAnim }}>
                  <Icon style={styles.gallery} name="images-outline" />
                </Animated.View>
              </TouchableOpacity>
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
        {showGallery && <Gallery onClose={() => setShowGallery(false)} />}
      </View>
    </GestureHandlerRootView>
    </Animated.View>
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
    position: 'absolute',
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

  resultContainer2: {
    position: 'absolute',
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
  heading2: { fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center' },
  subHeading2_2: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 5 },
  subHeading22: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 15 },
  button2: { backgroundColor: 'black', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20 },
  buttonText2: { color: 'white', fontWeight: '600', fontSize: 14 },

  resultContainer3: {
    position: 'absolute',
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
  heading3: { fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center' },
  subHeading3: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 15 },
  subHeading33: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 15 },
  button3: { backgroundColor: 'black', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20 },
  buttonText3: { color: 'white', fontWeight: '600', fontSize: 14 },
  dropdownContainer: {
    backgroundColor: 'transparent',
    margin: 16,
  },
  dropdown: {
    height: 30,
    width: 100,
    borderColor: 'white',
    borderWidth: 1.5,
    borderRadius: 15, 
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.2)', 
  },
  placeholderStyle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  selectedTextStyle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  iconStyle: {
    width: 16,
    height: 16,
    tintColor: 'rgba(255,255,255,0.7)',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
    dropdownListContainer: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'white',
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  itemContainerStyle: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    borderBottomWidth: 0, 
  },
  itemTextStyle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
  },
});