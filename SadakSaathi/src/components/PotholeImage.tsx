import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, StyleProp } from 'react-native';

// ─── PUBLIC DOMAIN POTHOLE REFERENCE IMAGES (Wikimedia Commons) ──────────────
// Swap any of these with your own local require() once you have photos
const FALLBACK_IMAGES = [
  'https://imgs.search.brave.com/0XOuP6Jq2s_pEZlTUv9tBcHx2LrCRxDwcNqAMA2MzSs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTAw/MjM5MTgyMi9waG90/by9uYXZpLW11bWJh/aS1pbmRpYS10aGUt/cmVjZW50LWhlYXZ5/LXNwZWxsLW9mLXNo/b3dlcnMtaGF2ZS1p/bmNyZWFzZWQtdGhl/LXByb2JsZW0tb2Yt/Y29tbXV0ZXJzLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz02/MFhHUzFwOEFvdHdh/V1hiSzY2YTdXbnVW/dFB4VllNN0RLa1lP/TFpHYUFFPQ',
  'https://imgs.search.brave.com/5d5sJhCiuzunB9XSNtanTPhNpMFqkuZSsTPsqykjlVw/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/dHJpYnVuZWluZGlh/LmNvbS9zb3J0ZC1z/ZXJ2aWNlL2ltYWdp/bmFyeS92MjItMDEv/d2VicC9tZWRpdW0v/aGlnaD91cmw9ZEdo/bGRISnBZblZ1WlMx/emIzSjBaQzF3Y204/dGNISnZaQzF6YjNK/MFpDOXRaV1JwWVdF/eFpXRTVZVE13TFRa/bVpqWXRNVEZtTUMx/aE1XUTVMVEk1T0RV/MFpXTTJNRE01Tmk1/cWNHYz0',
  'https://imgs.search.brave.com/SSrM-EerJTP2ETB-leQxobq_6ekBPda0F_GBRnc2da8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5uZXdpbmRpYW5l/eHByZXNzLmNvbS9u/ZXdpbmRpYW5leHBy/ZXNzLzIwMjYtMDIt/MDYvbDYwM3lyZ24v/cG90aG9sZS5qcGc_/dz00ODAmYXV0bz1m/b3JtYXQsY29tcHJl/c3MmZml0PW1heA',
  'https://imgs.search.brave.com/NJsG0Bdn8teyS-N6388xbVKqzKMzofPoSeC-yRdSL9M/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zMy5p/bmRpYS5jb20vd3At/Y29udGVudC91cGxv/YWRzLzIwMjAvMDEv/Ty0xLmpwZz9pbXBv/bGljeT1NZWRpdW1f/V2lkdGhvbmx5Jnc9/MzIw',
  'https://imgs.search.brave.com/cu25QVe7DRxht2f-V-DbIGWoOiFVCXM5EzbFqKD747s/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jYXNz/ZXR0ZS5zcGhkaWdp/dGFsLmNvbS5zZy9p/bWFnZS9zdHJhaXRz/dGltZXMvZDYxMTFm/ZDk0MzkzZDYxNTA2/OWU4YTE4NGUxMzQ1/ZTQ0MDIyZGM5NWFk/NjE0YmRlYmEzMjc3/Y2ZhMTFlOGY4Mw',
  'https://imgs.search.brave.com/rbcBZipUxG8wm4XFSFl34KFDalN64FX2GT-kZyiIato/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMjE1/OTkzNjg5OS9waG90/by9uZXctZGVsaGkt/aW5kaWEtcG90aG9s/ZXMtYW5kLXNsdXNo/LXNlZW4tb3Zlci1z/aGFuaS1iYXphYXIt/YmFuZGgtcm9hZC1h/ZnRlci1yYWlucy1h/dC1zYW5nYW0uanBn/P3M9NjEyeDYxMiZ3/PTAmaz0yMCZjPWhU/NUR2NnluT3VHRU1Q/VFF5a2RoMkNzTDlf/am5MNF9RY3R3ZG5j/OThoR0E9',
];


// Once you add pothole-1.jpg ... pothole-6.jpg to assets/potholes/,
// replace FALLBACK_IMAGES entries above with require() calls like:
//   require('../../assets/potholes/pothole-1.jpg'),

interface Props {
  index: number;           // 0-based
  style?: StyleProp<ImageStyle>;
  showLabel?: boolean;
  severity?: string;
  confidence?: number;
}

export default function PotholeImage({ index, style, showLabel = true, severity, confidence }: Props) {
  const [errored, setErrored] = useState(false);
  const src = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

  return (
    <View style={styles.wrapper}>
      {!errored ? (
        <Image
          source={{ uri: src }}
          style={[styles.img, style]}
          resizeMode="cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <View style={[styles.placeholder, style]}>
          <Text style={styles.placeholderIcon}>🕳</Text>
          <Text style={styles.placeholderText}>IMAGE UNAVAILABLE</Text>
        </View>
      )}
      {showLabel && (
        <View style={styles.overlay}>
          {severity && (
            <View style={[styles.sevBadge, { backgroundColor: severityBg(severity) }]}>
              <Text style={styles.sevText}>{severity}</Text>
            </View>
          )}
          {confidence != null && (
            <Text style={styles.confText}>{(confidence * 100).toFixed(0)}% CONF</Text>
          )}
        </View>
      )}
    </View>
  );
}

function severityBg(sev: string) {
  if (sev === 'S3') return '#EF4444';
  if (sev === 'S2') return '#F97316';
  return '#F59E0B';
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden' },
  img: { width: '100%', height: 140, borderRadius: 8 },
  placeholder: { width: '100%', height: 140, borderRadius: 8, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 32, marginBottom: 8 },
  placeholderText: { color: '#333', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2 },
  overlay: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  sevText: { color: '#fff', fontSize: 9, fontFamily: 'monospace', fontWeight: '800' },
  confText: { color: '#fff', fontSize: 9, fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
});
