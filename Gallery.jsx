import React, { useRef, useEffect, useContext, useState } from 'react';
import {useEvent} from 'expo';
import Video, { VideoRef } from 'react-native-video';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Button
} from 'react-native';
import { useNavigate } from 'react-router-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { GlobalArrayContext } from './Home';

export default function Gallery() {

  const slideValue = useRef(new Animated.Value(1.2*Dimensions.get('window').height)).current;

  const videoName = useContext(GlobalArrayContext);
  const videoRef = useRef<VideoRef>(null);
  const videoSource = `${videoName.current}`

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(slideValue, {
        toValue: 0,
        duration: 800,
        easing: Easing.bezier(0.0, 0.0, 0.2, 1),
        useNativeDriver: true,
    }).start()
    }, 1000)
    }, []);


  return (
    <Animated.View style={[styles.overlay, {transform: [{translateY: slideValue}]}]}>
    <View style={styles.topRow}>
      <Icon style={styles.icon} name="close-circle-outline" size={32} />
      {/* <Text style={styles.heading}>Sends</Text> */}
    </View>
    <View style={styles.contentContainer}>
      <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture contentFit='contain' nativeControls={true}/>
    </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,1)', 
    zIndex: 100,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  contentContainer: {
    bottom: 20,
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  topRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    top: '6%',
    left: '2%',
    justifyContent: 'space-between',
    width: '100%',
  },
  icon: {
    marginTop: '1%',
    zIndex: 200,
    color: 'white',
  },
  heading: {
    marginRight: '8%',
    fontFamily: 'Cal-Sans',
    fontSize: 28,
    zIndex: 200,
    color: 'white'
  }
});