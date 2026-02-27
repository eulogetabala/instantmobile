/**
 * Utilitaires pour gérer les vidéos YouTube et Vimeo
 */

export type VideoPlatform = 'youtube' | 'vimeo' | 'unknown';

export interface VideoInfo {
  platform: VideoPlatform;
  videoId: string;
  url: string;
  thumbnailUrl: string;
  embedUrl: string;
}

/**
 * Extrait l'ID d'une vidéo YouTube depuis une URL
 */
export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  
  // Formats supportés:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://youtube.com/watch?v=VIDEO_ID&feature=share
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Extrait l'ID d'une vidéo Vimeo depuis une URL
 */
export const extractVimeoId = (url: string): string | null => {
  if (!url) return null;
  
  // Formats supportés:
  // https://vimeo.com/VIDEO_ID
  // https://player.vimeo.com/video/VIDEO_ID
  // https://vimeo.com/channels/name/VIDEO_ID
  
  const patterns = [
    /vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|album\/\d+\/video\/|)(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Détecte la plateforme vidéo et extrait les informations
 */
export const parseVideoUrl = (url: string | null | undefined): VideoInfo | null => {
  if (!url || typeof url !== 'string') return null;
  
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return {
      platform: 'youtube',
      videoId: youtubeId,
      url,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }
  
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      platform: 'vimeo',
      videoId: vimeoId,
      url,
      thumbnailUrl: `https://vumbnail.com/${vimeoId}.jpg`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }
  
  // Si c'est une URL de streaming (HLS/DASH), retourner null
  // Le VideoPlayer gérera directement l'URL
  return null;
};

/**
 * Détecte le type de stream (YouTube, Vimeo, ou HLS/DASH)
 */
export const getStreamType = (url: string | null | undefined): 'youtube' | 'vimeo' | 'hls' | 'dash' | 'rtmp' | 'unknown' => {
  if (!url || typeof url !== 'string') return 'unknown';
  
  const videoInfo = parseVideoUrl(url);
  if (videoInfo?.platform === 'youtube') return 'youtube';
  if (videoInfo?.platform === 'vimeo') return 'vimeo';
  
  if (url.includes('.m3u8') || url.includes('.m3u')) return 'hls';
  if (url.includes('.mpd')) return 'dash';
  if (url.includes('rtmp://') || url.includes('rtmps://')) return 'rtmp';
  
  return 'unknown';
};

/**
 * Vérifie si une URL est une vidéo (YouTube, Vimeo, ou streaming HLS/DASH)
 */
export const isVideoUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Vérifier si c'est YouTube ou Vimeo
  if (parseVideoUrl(url) !== null) {
    return true;
  }
  
  // Vérifier si c'est une URL de streaming (HLS, DASH, RTMP, etc.)
  const streamingPatterns = [
    /\.m3u8($|\?)/i,           // HLS
    /\.mpd($|\?)/i,            // DASH
    /\.m3u($|\?)/i,            // HLS playlist
    /rtmp:\/\//i,              // RTMP
    /rtmps:\/\//i,             // RTMPS
    /webrtc:\/\//i,            // WebRTC
    /stream\./i,               // URLs contenant "stream."
    /streaming/i,              // URLs contenant "streaming"
    /live/i,                   // URLs contenant "live"
    /hls/i,                    // URLs contenant "hls"
  ];
  
  return streamingPatterns.some(pattern => pattern.test(url));
};

/**
 * Obtient l'URL du thumbnail pour une vidéo
 */
export const getVideoThumbnail = (url: string | null | undefined): string | null => {
  const videoInfo = parseVideoUrl(url);
  return videoInfo?.thumbnailUrl || null;
};

