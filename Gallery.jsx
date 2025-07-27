import React, { useRef, useEffect, useContext, useState } from 'react';
import {useEvent} from 'expo';
import Video, { VideoRef } from 'react-native-video';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
    }, 400)
    }, []);


  return (
    <Animated.View style={[styles.overlay, {transform: [{translateY: slideValue}]}]}>
    <LinearGradient
      colors={['#0a0909ff', '#0a0909ff', '#0a0909ff']}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
    <View style={styles.topRow}>
      <Text style={styles.heading}>Routes 🧩</Text>
      <TouchableOpacity>
        <Icon style={styles.closeIcon} name="close-circle-outline" size={28} />
      </TouchableOpacity>
    </View>
    <View style={styles.interactionContainer}>
      <Icon style={styles.likeIcon} name="heart-outline" size={32}></Icon>
      <Icon style={styles.likeIcon} name="chatbubble-ellipses-outline" size={32}></Icon>
      <Icon style={styles.likeIcon} name="share-social-outline" size={32}></Icon>
    </View>
    <View style={styles.contentContainer}>
      <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture contentFit='contain' nativeControls={false}/>
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
    borderRadius: 200,
    overflow: 'hidden',

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
    color: 'white'
  },
  interactionContainer: {
    right: '6%',
    top: '50%',
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  likeIcon: {
    zIndex: 205,
    color: 'white',
  },
});