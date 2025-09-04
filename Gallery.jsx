import React, { useRef, useEffect, useState } from 'react';
import { useEvent } from 'expo';
import Video, { VideoRef } from 'react-native-video';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useVideo } from './Home';

export default function Gallery() {
  const overlaySlideValue = useRef(new Animated.Value(1.2 * Dimensions.get('window').height)).current;
  const contentSlideValue = useRef(new Animated.Value(0)).current;
  
  const { array } = useVideo();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const counter = useRef(0);
  
  const videoName = array[currentIndex]?.videoUrl || '';
  const videoSource = `${videoName}`;
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  const nextVideoName = array[nextIndex]?.videoUrl || '';
  const nextVideoSource = `${nextVideoName}`;
  const nextPlayer = useVideoPlayer(nextVideoSource, player => {
    player.loop = true;
  });
 
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const animateAndLoadNext = () => {
    if (currentIndex >= array.length - 1) return;
    
    nextPlayer.play();
    
    Animated.timing(contentSlideValue, {
      toValue: -1.2 * Dimensions.get('window').height,
      duration: 600,
      easing: Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(prev => prev + 1);
      setNextIndex(prev => (prev + 1 < array.length) ? prev + 1 : prev);
      
      contentSlideValue.setValue(1.2 * Dimensions.get('window').height);
      Animated.timing(contentSlideValue, {
        toValue: 0,
        duration: 600,
        easing: Easing.bezier(0.0, 0.0, 0.2, 1),
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    if (counter.current === 0) {
      setTimeout(() => {
        Animated.timing(overlaySlideValue, {
          toValue: 0,
          duration: 800,
          easing: Easing.bezier(0.0, 0.0, 0.2, 1),
          useNativeDriver: true,
        }).start();
      }, 400);
      counter.current = 1;
    }
  }, []);

  useEffect(() => {
    if (currentIndex + 1 < array.length) {
      setNextIndex(currentIndex + 1);
    }
  }, [currentIndex, array.length]);

  return (
    <Animated.View style={[styles.overlay, { transform: [{ translateY: overlaySlideValue }] }]}>
      <LinearGradient
        colors={['#0a0909ff', '#0a0909ff', '#0a0909ff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.topRow}>
        <TouchableOpacity>
          <Icon style={styles.closeIcon} name="close-circle-outline" size={28} />
        </TouchableOpacity>
        <View style={styles.touch}>
          <TouchableOpacity onPress={animateAndLoadNext}>
            <Text style={{ color: 'white' }}>Scroll 📜</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View style={[styles.contentContainer, { transform: [{ translateY: contentSlideValue }] }]}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          contentFit='contain'
          nativeControls={true}
        />
      </Animated.View>
      
      {nextIndex < array.length && (
        <View style={styles.hiddenVideo}>
          <VideoView
            style={styles.video}
            player={nextPlayer}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            contentFit='contain'
            nativeControls={true}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 100,
  },
  contentContainer: {
    bottom: 20,
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  hiddenVideo: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
  topRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    top: '6%',
    left: '2%',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 100,
  },
  closeIcon: {
    marginTop: '5%',
    marginLeft: '10%',
    zIndex: 200,
    color: 'white',
  },
  heading: {
    left: '3%',
    fontFamily: 'Cal-Sans',
    fontSize: 28,
    zIndex: 200,
    color: 'white',
  },
  touch: {
    backgroundColor: 'black',
    borderColor: 'white',
    borderWidth: 2,
    padding: 10,
    marginRight: '10%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video2: {
    position: 'absolute',
    top: '10%',
  }
});