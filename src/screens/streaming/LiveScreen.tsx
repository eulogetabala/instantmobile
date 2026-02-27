import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '../../components/streaming/VideoPlayer';
import { AgoraVideoPlayer } from '../../components/streaming/AgoraVideoPlayer';
import { useChat } from '../../hooks/useChat';
import { streamingService } from '../../services/streaming';
import { useAuth } from '../../contexts/AuthContext';

interface LiveScreenProps {
  route: {
    params: {
      eventId: string;
      eventTitle: string;
    };
  };
}

const LiveScreen: React.FC<LiveScreenProps> = ({ route }) => {
  const { eventId, eventTitle } = route.params;
  const { user } = useAuth();
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [agoraConfig, setAgoraConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook pour le chat
  const {
    messages,
    sendMessage,
    addReaction,
    isLoading: chatLoading,
    error: chatError,
  } = useChat(eventId);

  useEffect(() => {
    loadStreamInfo();
  }, [eventId]);

  const loadStreamInfo = async () => {
    try {
      setIsLoading(true);
      const info = await streamingService.getStreamInfo(eventId);
      setStreamInfo(info);
      
      const isLive = info.event?.streaming?.isLive || info.streamStats?.isLive;
      
      if (isLive) {
        try {
          const agoraData = await streamingService.getAgoraToken(eventId);
          setAgoraConfig(agoraData);
        } catch (agoraErr) {
          console.warn('⚠️ Échec récupération token Agora, repli sur HLS:', agoraErr);
          const url = await streamingService.getStreamUrl(eventId);
          setStreamUrl(url.hlsUrl || url.dashUrl || '');
        }
      } else {
        const url = await streamingService.getStreamUrl(eventId);
        setStreamUrl(url.hlsUrl || url.dashUrl || '');
      }
    } catch (err) {
      console.error('Erreur chargement stream:', err);
      setError('Impossible de charger le stream');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la réaction');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={32} color="#FF6B35" />
        <Text style={styles.loadingText}>Chargement du stream...</Text>
      </View>
    );
  }

  if (error || !streamInfo) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error || 'Stream non disponible'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStreamInfo}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!streamInfo.event?.streaming?.isLive && !streamInfo.streamStats?.isLive) {
    return (
      <View style={styles.notLiveContainer}>
        <Ionicons name="radio" size={48} color="#666666" />
        <Text style={styles.notLiveTitle}>Diffusion terminée</Text>
        <Text style={styles.notLiveText}>
          Cette diffusion n'est plus en direct.
        </Text>
        <TouchableOpacity style={styles.replayButton}>
          <Text style={styles.replayButtonText}>Voir le replay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLive = streamInfo.event?.streaming?.isLive || streamInfo.streamStats?.isLive;

  return (
    <View style={styles.container}>
      {/* Lecteur vidéo (Agora pour le live, VideoPlayer pour le replay/HLS) */}
      {agoraConfig && isLive ? (
        <View style={{ height: 250 }}>
          <AgoraVideoPlayer
            appId={agoraConfig.agoraAppId}
            channelName={agoraConfig.channelName}
            token={agoraConfig.token}
            uid={parseInt(agoraConfig.uid)}
            title={eventTitle}
            onClose={() => setAgoraConfig(null)}
          />
        </View>
      ) : (
        <VideoPlayer
          streamUrl={streamUrl}
          title={eventTitle}
          isLive={isLive}
          onError={(error) => setError(error)}
        />
      )}

      {/* Informations du stream */}
      <View style={styles.streamInfo}>
        <View style={styles.streamStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={16} color="#FF6B35" />
            <Text style={styles.statText}>
              {(streamInfo.event?.streaming?.currentViewers || streamInfo.streamStats?.currentViewers) || 0} spectateurs
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="radio" size={16} color="#FF0000" />
            <Text style={styles.statText}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* Chat en temps réel */}
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Chat en direct</Text>
          <Text style={styles.chatSubtitle}>
            {messages.length} messages
          </Text>
        </View>

        <ScrollView style={styles.messagesContainer}>
          {messages.map((message) => (
            <View key={message.id} style={styles.messageItem}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageAuthor}>
                  {message.user.firstName} {message.user.lastName}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
                </Text>
              </View>
              
              <Text style={styles.messageText}>{message.message}</Text>
              
              {message.reactions && message.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                  {message.reactions.map((reaction, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.reactionButton}
                      onPress={() => handleAddReaction(message.id, reaction.emoji)}
                    >
                      <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                      <Text style={styles.reactionCount}>{reaction.count}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Zone de saisie du message */}
        <View style={styles.messageInput}>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              Alert.prompt(
                'Nouveau message',
                'Tapez votre message',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { 
                    onPress: (text: string | undefined) => text && handleSendMessage(text)
                  },
                ]
              );
            }}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
    fontFamily: 'Montserrat-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'Montserrat-Medium',
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  notLiveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  notLiveTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    fontFamily: 'Montserrat-Bold',
  },
  notLiveText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'Montserrat-Medium',
  },
  replayButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  replayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  streamInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
  },
  streamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Montserrat-Medium',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  chatSubtitle: {
    color: '#CCCCCC',
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAuthor: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  messageTime: {
    color: '#999999',
    fontSize: 10,
    fontFamily: 'Montserrat-Regular',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  reactionEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  reactionCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Montserrat-Medium',
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LiveScreen;