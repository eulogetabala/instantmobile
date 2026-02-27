import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcConnection,
  IRtcEngineEventHandler,
  RenderModeType,
  RtcSurfaceView,
} from 'react-native-agora';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface AgoraVideoPlayerProps {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  onClose?: () => void;
  title?: string;
}

export const AgoraVideoPlayer: React.FC<AgoraVideoPlayerProps> = ({
  appId,
  channelName,
  token,
  uid,
  onClose,
  title,
}) => {
  const engine = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initAgora = useCallback(async () => {
    try {
      if (engine.current) return;

      // Vérifier si nous sommes sous Expo Go car Agora ne peut pas y fonctionner (natif)
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        setError("Le streaming nécessite un 'Development Build' (npx expo run:android/ios). Agora ne fonctionne pas dans Expo Go.");
        setIsLoading(false);
        return;
      }

      // Sécurité : vérifier si le SDK Agora est bien lié (évite le crash si non lié)
      if (typeof createAgoraRtcEngine !== 'function') {
        setError("Le module natif Agora n'est pas chargé. Erreur de liaison native.");
        setIsLoading(false);
        return;
      }

      // Créer l'instance de l'engine
      engine.current = createAgoraRtcEngine();
      engine.current.initialize({
        appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      // Enregistrer les handlers d'événements
      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
          console.log('✅ Rejoint le canal Agora avec succès:', connection.channelId);
          setJoined(true);
          setIsLoading(false);
        },
        onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
          console.log('👤 Un utilisateur (streamer) a rejoint:', remoteUid);
          setRemoteUid(remoteUid);
        },
        onUserOffline: (connection: RtcConnection, remoteUid: number, reason: number) => {
          console.log('👤 Un utilisateur a quitté:', remoteUid);
          setRemoteUid(null);
        },
        onError: (err: number, msg: string) => {
          console.error('❌ Erreur Agora:', err, msg);
          setError(`Erreur Agora: ${msg}`);
        },
      });

      // Activer la vidéo
      engine.current.enableVideo();
      
      // Rejoindre en tant que spectateur
      engine.current.joinChannel(token, channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleAudience,
      });
    } catch (e) {
      console.error('Erreur initialisation Agora:', e);
      setError('Impossible d\'initialiser le lecteur de streaming');
    }
  }, [appId, channelName, token, uid]);

  useEffect(() => {
    initAgora();

    return () => {
      if (engine.current) {
        try {
          engine.current.leaveChannel();
          engine.current.release();
        } catch (e) {
          console.warn('Erreur lors de la libération d\'Agora:', e);
        }
        engine.current = null;
      }
    };
  }, [initAgora]);

  if (error) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {remoteUid ? (
        <View style={styles.videoContainer}>
          {/* Rendu vidéo du streamer (remoteUid) */}
          <RtcSurfaceView
             canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }}
             style={styles.video}
          />
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#FF6B35" />
          ) : (
            <Ionicons name="videocam-off" size={48} color="#666" />
          )}
          <Text style={styles.placeholderText}>
            {isLoading ? 'Connexion au flux...' : 'En attente du flux direct...'}
          </Text>
        </View>
      )}

      {/* Barre de titre simple */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title || 'Live Stream'}</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>DIRECT</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFF',
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
    fontFamily: 'Montserrat-Medium',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
