import React, {useState, useEffect, useRef} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import {CameraView, CameraType, useCameraPermissions} from 'expo-camera';
import Icon from 'react-native-vector-icons/Ionicons';

const Home = () => {

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [image, setImage] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus === 'granted');
    })();
  }, []);

  return (
    
    <View style={styles.container}>
      <CameraView style={styles.camera}>
        <View style={styles.rectangleOverlay}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <Icon style={styles.cameraIcon} name="add-outline" size={40} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={styles.overlay}>
          <View style={styles.bottomRow}>
            <View style={styles.iconContainer}>
              <View style={styles.statsContainer}>
                <Icon style={styles.icon} name="trending-up-outline" size={40} />
                <Text style={styles.stats}>Trends</Text>
              </View>

            </View>
            <View style={styles.circleContainer}>
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle}></View>
              </View>
            </View>
          </View>
        </View>
      </CameraView>
    </View>

  );
};

export default Home;

const cornerSize = 22;
const borderWidth = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    margin: 0,
    padding: 0,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(181, 21, 57, 0.6)',
    borderWidth: 4,
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    backgroundColor: 'rgb(181, 21, 57)',
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 90,
  },
  iconContainer: {
    position: 'absolute',
    right: 100,
  },
  icon: {
    color: 'white',
    fontSize: 35,
  },
  rectangleOverlay: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    width: 250,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    width: cornerSize,
    height: cornerSize,
    position: 'absolute',
    borderColor: 'white',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: borderWidth,
    borderLeftWidth: borderWidth,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: borderWidth,
    borderRightWidth: borderWidth,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: borderWidth,
    borderLeftWidth: borderWidth,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: borderWidth,
    borderRightWidth: borderWidth,
    borderBottomRightRadius: 12,
  },

  cameraIcon: {
    color: 'white',
    fontSize: 35,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  statsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  stats: {
    color: 'rgba(255, 255, 255, 0.8)',
  }
});
