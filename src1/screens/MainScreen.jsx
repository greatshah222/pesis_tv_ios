import React from 'react';
import {
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import Toast from 'react-native-toast-message';
// import * as MediaLibrary from 'expo-media-library';

import Streamer from '../components/Larix/Streamer';
import { connections } from '../components/Larix/Connections';
import { settings } from '../components/Larix/Settings';
import { LarixUtils } from '../components/Larix/LarixUtils.js';
import { CameraInfo } from '../components/Larix/CameraInfo.js';
import Icon from '../components/common/Icon.js';
import { SETTINGS } from '../constants/routeNames.js';

class MainScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isStreaming: false,
      isWriting: false,
      captureActive: false,
      mute: false,
    };

    settings.loadConfig().then(() => {
      let state = this.getConfigState();
      this.setState(state);
      console.log('loaded config');
    });
    this.streamer = React.createRef();

    settings.onConfigChange = () => {
      console.log('onConfigChange MainScreen');

      let state = this.getConfigState();
      this.setState(state);
      let streamer = this.streamer?.current;
      if (streamer == null || streamer.state.authorized !== true) {
        console.log('No streamer');
        return;
      }
    };

    props.navigation.addListener('focus', (ev) => {
      console.log('Entering main screen');
      SystemNavigationBar.fullScreen(true);

      let streamer = this.streamer?.current;
      streamer?.startCapture();
    });

    props.navigation.addListener('blur', (ev) => {
      SystemNavigationBar.fullScreen(false);

      let streamer = this.streamer?.current;
      if (streamer == null) {
        return;
      }
      this.setState({
        isStreaming: false,
        isWriting: false,
        captureActive: false,
        statistics: undefined,
        statusMessage: undefined,
      });
      console.log('Leaving main screen');
      streamer?.stopCapture();
    });
  }

  takeSnapshot = async () => {
    let streamer = this.streamer?.current;
    if (streamer == null) {
      return;
    }
    //Requesting permission switch app to background which stops streamer,
    // to avoid this need to request permissions on start
    //   MediaLibrary.requestPermissionsAsync(true).then(() => {
    //     streamer.takeSnapshot()
    //   })

    streamer.takeSnapshot();
  };

  getConfigState = () => {
    const videoConfig = settings.getVideoConfig();
    const audioConfig = settings.getAudioConfig();
    const recordConfig = settings.getRecordConfig();
    const pos = videoConfig.cameraPos ?? 'back';
    const cameraId =
      pos == 'front'
        ? videoConfig.defaultFrontCamera
        : videoConfig.defaultBackCamera;
    console.log(`Selected ${pos} camera ${cameraId}`);
    const hasFlash =
      CameraInfo.getInstance()?.isTorchSupported(cameraId) ?? false;
    console.log(`hasFlash: ${hasFlash}`);

    return {
      videoConfig: videoConfig,
      audioConfig: audioConfig,
      recordConfig: recordConfig,
      cameraPos: pos,
      cameraId: cameraId ?? pos,
      hasFlash: hasFlash,
    };
  };

  startSetup = () => {
    const streamer = this.streamer.current;
    if (streamer == null) {
      return;
    }

    // let cameraInfo = streamer.cameraInfo
    this.props.navigation.navigate(SETTINGS); //, {cameraInfo: cameraInfo})
  };

  backToMainPage = () => {
    this.props.navigation.goBack();
  };

  switchCamera = () => {
    // console.log("calling switchCamera");
    // console.log(streamer.state);
    const streamer = this.streamer.current;
    if (streamer == null) {
      return;
    }

    let pos = this.state.cameraPos;
    console.log(`current camera position: ${pos}`);
    camId =
      pos == 'back'
        ? this.state.videoConfig.defaultFrontCamera
        : this.state.videoConfig.defaultBackCamera;
    console.log(`Switching to cameraId: ${camId} from ${this.state.cameraId}`);
    this.setState({ cameraId: camId });
    //streamer.setState({camera: camId})
  };

  startStream = () => {
    const streamer = this.streamer.current;
    if (streamer == null) {
      return;
    }

    if (this.state.isStreaming) {
      streamer.disconnectAll();
    } else {
      const configList = connections.getActiveConfig();
      streamer.connect(configList);
    }
  };

  toggleFlash = () => {
    const streamer = this.streamer.current;
    if (streamer == null) {
      return;
    }

    if (streamer == null) {
      return;
    }
    let cam = streamer.state.camera;
    //console.log("Resolution: " + streamer.props.videoResoution);
    console.log('Current camera:' + cam);
    if (cam == null || cam.startsWith('front')) {
      return;
    }

    var torchOn = streamer.state.torch ?? false;
    console.log('toggle flash: ' + torchOn);
    torchOn = !torchOn;
    streamer.setState({ torch: torchOn });
  };

  toggleMute = () => {
    const streamer = this.streamer.current;
    if (streamer == null) {
      return;
    }
    var isMuted = this.state.mute ?? false;
    isMuted = !isMuted;
    this.setState({ mute: isMuted });
  };

  handleCaptureState = (isActive, message) => {
    console.log(`handleCaptureState: ${isActive}`);
    let state = {
      captureActive: isActive,
      statusMessage: message,
      isStreaming: false,
      isWriting: false,
      statistics: undefined,
      duration: undefined,
    };
    if (isActive) {
      const cameraId = this.state.cameraId;
      const hasFlash =
        CameraInfo.getInstance()?.isTorchSupported(cameraId) ?? false;
      console.log(`hasFlash: ${hasFlash}`);
      state.hasFlash = hasFlash;
    }
    this.setState(state);
  };

  handleStreamingChange = (isActive) => {
    console.log(`handleStreamingChange: ${isActive}`);

    console.log(updState?.duration, this.state.isStreaming);
    if (this.state.isStreaming == isActive) {
      //Already updated
      return;
    }
    let updState = { isStreaming: isActive, statistics: undefined };
    if (!isActive) {
      updState.isWriting = false;
      updState.duration = undefined;
    }
    console.log('active1', isActive);
    if (this.state.isStreaming != true && isActive == true) {
      updState.startTime = new Date();
      updState.duration = '0:00:00';
    }
    this.setState(updState);
  };

  handleCameraChange = (cameraInfo) => {
    if (cameraInfo.error != null) {
      let camId = cameraInfo.id;
      const streamer = this.streamer.current;

      this.setState({ cameraId: camId });
      streamer?.setState({ camera: camId });
      return;
    }
    let pos = cameraInfo.lensFacing;
    let hasFlash = cameraInfo.isTorchSupported ?? false;
    console.log(`hasFlash: ${hasFlash}`);
    if (pos != null) {
      this.setState({ cameraPos: pos, hasFlash: hasFlash });
    }
  };

  updateStats = (stats) => {
    let startTime = this.state.startTime;
    let duration = '';
    console.log('startTime', startTime);
    if (startTime != null) {
      let now = new Date();
      let delta = now.getTime() - startTime.getTime();
      duration = LarixUtils.timeMsToString(delta);
    }
    if (stats == '' && this.state.isWriting == true) {
      stats = 'Writing to file only';
    }
    //let duration = (stats) => this.setState({statistics: stats, duration: duration})
    this.setState({ statistics: stats, duration: duration });
  };

  handleFileOperation = async (info) => {
    // console.log('handleFileOperation');
    // console.log(info);
    // let url = info.url;
    // if (info.status == 'started' && info.type == 'video') {
    //   this.setState({ isWriting: true });
    // }
    // if (info.status == 'success') {
    //   try {
    //     console.log('trying to create asset');
    //     const asset = await MediaLibrary.createAssetAsync(url);
    //     console.log('trying to get album');
    //     const album = await MediaLibrary.getAlbumAsync('Larix');
    //     if (album == null) {
    //       console.log('trying to create album');
    //       await MediaLibrary.createAlbumAsync('Larix', asset);
    //     } else {
    //       console.log('trying to update album');
    //       await MediaLibrary.addAssetsToAlbumAsync([asset], album);
    //     }
    //     let urlParts = url.split('/');
    //     console.log(urlParts);
    //     let filename = urlParts[urlParts.length - 1];
    //     if (info.type == 'video') {
    //       Toast.show({ type: 'info', text1: `Video saved to ${filename}` });
    //     } else {
    //       Toast.show({ type: 'info', text1: `Snapshot saved to ${filename}` });
    //     }
    //   } catch (e) {
    //     //TODO: delete temp file
    //     console.log(e);
    //   }
    // }
  };

  TextView = (props) => {
    if (props.text == null || props.text == '') {
      return null;
    }
    return (
      <View style={props.style}>
        <Text style={{ color: '#ffffff' }}>{props.text}</Text>
      </View>
    );
  };

  RecordIndicator = (props) => {
    if (this.state.isWriting != true) {
      return null;
    }
    return <View style={styles.redDot} />;
  };

  StreamerControls = (props) => {
    if (!this.state.captureActive) {
      return (
        <View style={styles.rightControls}>
          <TouchableOpacity
            onPress={this.backToMainPage}
            style={styles.roundButton}
          >
            <Icon name='exit' type={'ionicon'} size={30} color={'white'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this.startSetup}
            style={styles.roundButton}
          >
            <Image source={require('../assets/images/larixImg/settings.png')} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundButton, styles.disabledStyle]}>
            <Image source={require('../assets/images/larixImg/flash.png')} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundButton, styles.disabledStyle]}>
            <Image source={require('../assets/images/larixImg/start.png')} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundButton, styles.disabledStyle]}>
            <Image source={require('../assets/images/larixImg/mute_on.png')} />
          </TouchableOpacity>
          {/* <TouchableOpacity style={[styles.roundButton, styles.disabledStyle]}>
            <Image source={require('../assets/images/larixImg/capture.png')} />
          </TouchableOpacity> */}
        </View>
      );
    }
    return (
      <>
        <View style={styles.leftControls}>
          <TouchableOpacity
            onPress={this.switchCamera}
            style={styles.roundButton}
          >
            {/* <Image source={require('../assets/images/larixImg/flip.png')} /> */}
            <Image source={require('../assets/images/larixImg/flip.png')} />
          </TouchableOpacity>
        </View>
        <View style={styles.rightControls}>
          <TouchableOpacity
            onPress={this.backToMainPage}
            disabled={this.state.isStreaming}
            style={[
              styles.roundButton,
              this.state.isStreaming
                ? styles.disabledStyle
                : styles.normalStyle,
            ]}
          >
            <Icon name='exit' type={'ionicon'} size={30} color={'white'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this.startSetup}
            disabled={this.state.isStreaming}
            style={[
              styles.roundButton,
              this.state.isStreaming
                ? styles.disabledStyle
                : styles.normalStyle,
            ]}
          >
            <Image source={require('../assets/images/larixImg/settings.png')} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this.toggleFlash}
            disabled={!this.state.hasFlash}
            style={
              this.state.hasFlash
                ? styles.roundButton
                : [styles.roundButton, styles.disabledStyle]
            }
          >
            <Image source={require('../assets/images/larixImg/flash.png')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={this.startStream} style={this.bigButton}>
            <Image
              source={
                this.state.isStreaming
                  ? require('../assets/images/larixImg/stop.png')
                  : require('../assets/images/larixImg/start.png')
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this.toggleMute}
            style={styles.roundButton}
          >
            <Image
              source={
                this.state.mute
                  ? require('../assets/images/larixImg/mute_off.png')
                  : require('../assets/images/larixImg/mute_on.png')
              }
            />
          </TouchableOpacity>
          {/* <TouchableOpacity
            onPress={this.takeSnapshot}
            style={[styles.roundButton, styles.disabledStyle]}
          >
            <Image source={require('../assets/images/larixImg/capture.png')} />
          </TouchableOpacity> */}
        </View>
      </>
    );
  };

  render() {
    if (
      this.state == null ||
      this.state.videoConfig == null ||
      this.state.audioConfig == null
    ) {
      return null;
    }
    return (
      <View style={styles.container}>
        <Streamer
          style={{ flex: 1, width: '100%' }}
          videoConfig={this.state.videoConfig}
          audioConfig={this.state.audioConfig}
          recordConfig={this.state.recordConfig}
          cameraId={this.state.cameraId}
          mute={this.state.mute}
          setBroadcasting={this.handleStreamingChange}
          setCaptureState={this.handleCaptureState}
          setStats={this.updateStats}
          cameraChanged={this.handleCameraChange}
          fileOperation={this.handleFileOperation}
          ref={this.streamer}
        />
        <this.StreamerControls
          active={this.state.captureActive}
          isStreaming={this.state.isStreaming}
        />
        <this.TextView text={this.state.statistics} style={styles.stats} />
        <this.TextView text={this.state.statusMessage} style={styles.status} />
        <View style={styles.duration}>
          <this.TextView
            style={styles.durationText}
            text={this.state.duration}
          />
          <this.RecordIndicator />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftControls: {
    position: 'absolute',
    left: '5%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  rightControls: {
    position: 'absolute',
    right: '2%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  status: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    backgroundColor: 'hsla(0, 0%, 20%, 0.5)',
    padding: 10,
  },
  stats: {
    position: 'absolute',
    bottom: '10%',
    left: '10%',
    backgroundColor: 'hsla(0, 0%, 20%, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  duration: {
    position: 'absolute',
    flexDirection: 'row',
    top: '5%',
    left: '5%',
  },
  durationText: {
    backgroundColor: 'hsla(0, 0%, 20%, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
  roundButton: {
    borderRadius: 40,
    width: 40,
    height: 40,
    backgroundColor: 'hsla(0, 0%, 30%, 0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  normalStyle: {},
  disabledStyle: {
    opacity: 0.5,
    backgroundColor: 'hsla(0, 0%, 10%, 0.3)',
  },

  bigButton: {
    marginTop: 20,
    borderRadius: 50,
    height: 80,
    width: 80,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  redDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'red',
  },
});

export default MainScreen;
