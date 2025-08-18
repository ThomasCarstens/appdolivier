import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, FlatList, Animated, Linking, Platform, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Audio, Video } from 'expo-av';

import { auth, firebase, storage, database } from '../../firebase'
import { ref as ref_d, set, get, onValue } from 'firebase/database'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Video Item Component
const VideoFormationItem = ({ item, index, onPress, participantCounts, userDemandes, isAdmin }) => {
  const [videoData, setVideoData] = useState({ 
    id: null, 
    type: null, 
    embedUrl: null, 
    directUrl: null,
    thumbnail: null 
  });
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  
  const videoRef = useRef(null);
  const webViewRef = useRef(null);

  // Video processing functions
  const extractYouTubeVideoData = async (url) => {
    if (!url) return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        
        return {
          id: videoId,
          type: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&showinfo=0&fs=1`,
          directUrl: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
      }
    }
    
    return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
  };

  const extractGoogleDriveVideoData = async (url) => {
    if (!url) return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
    
    const drivePatterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of drivePatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const fileId = match[1];
        
        const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        const thumbnail = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        
        return { 
          id: fileId, 
          type: 'googledrive', 
          embedUrl: embedUrl,
          directUrl: directUrl,
          thumbnail: thumbnail
        };
      }
    }
    
    return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
  };

  const processVideoUrl = async (url) => {
    if (!url) return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
    
    const youtubeData = await extractYouTubeVideoData(url);
    if (youtubeData.id) {
      return youtubeData;
    }
    
    const driveData = await extractGoogleDriveVideoData(url);
    if (driveData.id) {
      return driveData;
    }
    
    if (url.match(/\.(mp4|mov|avi|wmv|flv|webm|m4v)(\?.*)?$/i)) {
      return {
        id: 'direct',
        type: 'direct',
        embedUrl: null,
        directUrl: url,
        thumbnail: item?.image || null
      };
    }
    
    return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
  };

  // Initialize video data
  useEffect(() => {
    if (item.videoUrl) {
      processVideoUrl(item.videoUrl).then(setVideoData);
    }
  }, [item.videoUrl]);

  const onVideoLoad = (status) => {
    if (status.isLoaded) {
      setIsVideoLoading(false);
      setVideoError(false);
    }
  };

  const onVideoError = (error) => {
    console.log('Video Error:', error);
    setVideoError(true);
    setIsVideoLoading(false);
  };

  const getVideoSource = () => {
    if (videoData.type === 'direct' && videoData.directUrl) {
      return { uri: videoData.directUrl };
    }
    
    if (videoData.type === 'youtube') {
      return null; // Force fallback to WebView
    }
    
    if (videoData.type === 'googledrive' && videoData.directUrl) {
      return { uri: videoData.directUrl };
    }
    
    return null;
  };

  const createEmbedHTML = (embedUrl) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              overflow: hidden;
            }
            .video-container {
              position: relative;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe 
              src="${embedUrl}"
              frameborder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>
        </body>
      </html>
    `;
  };

  const renderVideo = () => {
    if (!videoData.id) return null;

    const videoSource = getVideoSource();
    
    // Try expo-av Video first for direct URLs
    if (videoSource && !videoError) {
      return (
        <View style={styles.videoPlayerContainer}>
          <Video
            ref={videoRef}
            source={videoSource}
            style={styles.videoPlayer}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
            onPlaybackStatusUpdate={onVideoLoad}
            onError={onVideoError}
            posterSource={videoData.thumbnail ? { uri: videoData.thumbnail } : undefined}
            isMuted={false}
          />
          {isVideoLoading && (
            <View style={styles.videoLoadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingVideoText}>Chargement de la vidéo...</Text>
            </View>
          )}
        </View>
      );
    }

    // Fallback to WebView for embed URLs
    if (videoData.embedUrl && !videoError) {
      return (
        <View style={styles.videoWrapper}>
          <WebView
            ref={webViewRef}
            style={styles.webView}
            source={{ html: createEmbedHTML(videoData.embedUrl) }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onLoad={() => setIsVideoLoading(false)}
            onError={() => setVideoError(true)}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            scalesPageToFit={false}
            bounces={false}
            scrollEnabled={false}
          />
        </View>
      );
    }

    // Error state
    if (videoError) {
      return (
        <View style={styles.videoErrorContainer}>
          <Text style={styles.videoErrorText}>Impossible de charger la vidéo</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setVideoError(false);
              setIsVideoLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity style={styles.formationItem} onPress={onPress}>
      <View style={styles.formationContent}>
        {/* Video or Image */}
        <View style={styles.mediaContainer}>
          {videoData.id ? (
            renderVideo()
          ) : (
            <Image source={{ uri: item.image }} style={styles.formationImage} />
          )}
        </View>
        
        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          <View style={styles.formationHeader}>
            <Text style={styles.formationTitle}>{item.title}</Text>
            <View style={styles.formationMeta}>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{new Date(item.date).toLocaleDateString('fr-FR')}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{item.lieu}</Text>
              </View>
            </View>
          </View>
          
          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>À partir de</Text>
              <Text style={styles.priceText}>{Math.min(item.tarifEtudiant, item.tarifMedecin)} €</Text>
            </View>
            
            {isAdmin && (
              <TouchableOpacity style={styles.participantsChip}>
                <Ionicons name="people-outline" size={16} color="#1a53ff" />
                <Text style={styles.participantsText}>
                  {participantCounts[item.id] || 0}
                </Text>
              </TouchableOpacity>
            )}
            
            {userDemandes[item.id] && (
              <View style={styles.statusChip}>
                <Text style={styles.statusText}>
                  {userDemandes[item.id].admin === 'Validée' ? '✓' : '⏳'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Tags */}
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.domaine}</Text>
            </View>
            {item.anneeConseillee && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.anneeConseillee}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const RechercheFormationsScreen = (props, { route }) => {
  // All existing state variables...
  const [formations, setFormations] = useState([]);
  const [filteredFormations, setFilteredFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Disponibles');
  const [isFormateur, setIsFormateur] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filterHeight = useState(new Animated.Value(0))[0];
  const [userDemandes, setUserDemandes] = useState({});
  const [participantCounts, setParticipantCounts] = useState({});
  const [allDemandes, setAllDemandes] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    Domaine: '',
    'Année conseillée': '',
    Date: '',
    Lieu: '',
    Region: ''
  });

  const [categoryOptions, setCategoryOptions] = useState([
    "Médecine Manuelle",
    "Médecine Sport", 
    "Rhumatologie",
    "Médecine Physique",
    "Autre"
  ]);
  
  const [lieuOptions, setLieuOptions] = useState([
    "Nîmes GEMMLR",
    "Toulouse AMOPY",
    "Avignon ISTM",
    "Autre"
  ]);
  
  const [regionOptions, setRegionOptions] = useState([
    "PACA",
    "Occitanie",
    "Île-de-France",
    "Grand Est",
    "Bretagne",
    "Auvergne-Rhône-Alpes",
    "Bourgogne-Franche-Comté",
    "Centre-Val de Loire",
    "Corse",
    "Hauts-de-France",
    "Normandie",
    "Nouvelle-Aquitaine",
    "Pays de la Loire",
    "Loire-Atlantique",
    "Autre"
  ]);
  
  const [anneeOptions, setAnneeOptions] = useState([
    "DIU 1",
    "DIU 2",
    "DIU 3",
    "Postgraduate",
    "Autre"
  ]);

  const [monthOptions, setMonthOptions] = useState([
    "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
    "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
  ]);

  const filterOptions = {
    Domaine: categoryOptions,
    'Année conseillée': anneeOptions,
    Date: monthOptions,
    Lieu: lieuOptions,
    Region: regionOptions
  };

  const [activeFilterTab, setActiveFilterTab] = useState(Object.keys(filterOptions)[0]);

  const navigation = useNavigation();

  // Set up audio for iOS video playback
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  }, []);

  useEffect(() => {
    if (props.route.params?.spoofLoggedIn) {
    setIsLoggedIn(props.route.params.spoofLoggedIn);
    }
  }, [props.route.params?.spoofLoggedIn]);
  
  useEffect(() => {
    checkForUpdates();
    downloadFilterOptions();
    fetchFormations();
    fetchUserDemandes();
    checkNotificationPermissions();
  }, []);

  useEffect(() => {
    fetchParticipantCounts();
  }, [allDemandes]);

  useEffect(() => {
    applyFilters(activeTab)
  }, [formations]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Formations',
      headerStyle: {
        backgroundColor: '#1a53ff',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerRight: () => (
        <TouchableOpacity onPress={()=>handleLogout()} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchParticipantCounts = () => {
    const counts = {};
    formations.forEach(formation => {
      let count = 0;
      for (const eachUid in allDemandes) {
        if (allDemandes[eachUid][formation.id] ) {
          count++;
        }
      }
      counts[formation.id] = count;
    });
    setParticipantCounts(counts);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem('userUid');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const fetchFormations = () => {
    setLoading(true);
    const formationsRef = ref_d(database, "formations/");
    onValue(formationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formationsArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setFormations(formationsArray);
        setFilteredFormations(formationsArray);
        setLoading(false);
      } else {
        setError('Aucune formation trouvée');
        setLoading(false);
      }
    }, (error) => {
      setError('Erreur lors du chargement des formations');
      setLoading(false);
    });
  };

  const fetchUserDemandes = () => {
    const demandesRef = ref_d(database, `demandes/${auth.currentUser.uid}`);
    onValue(demandesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserDemandes(data);
      }
    });

    const allDemandesRef = ref_d(database, 'demandes');
    onValue(allDemandesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllDemandes(data);
      }
    });
  };

  const applyFilters = (tab) => {
    let filtered = formations;
    
    if (activeFilters.Domaine) {
      filtered = filtered.filter(f => f.domaine === activeFilters.Domaine);
    }
    if (activeFilters.Lieu) {
      filtered = filtered.filter(f => f.lieu === activeFilters.Lieu);
    }
    if (activeFilters.Region) {
      filtered = filtered.filter(f => f.region === activeFilters.Region);
    }
    if (activeFilters['Année conseillée']) {
      filtered = filtered.filter(f => f.anneeConseillee.includes(activeFilters['Année conseillée']));
    }
    if (activeFilters.Date) {
      const [filterYear, filterMonth] = activeFilters.Date.split('-');
      filtered = filtered.filter(f => {
        const startDate = new Date(f.date);
        const endDate = new Date(f.date_de_fin);
        
        const filterYearMonth = new Date(filterYear, parseInt(filterMonth) - 1);
        const startYearMonth = new Date(startDate.getFullYear(), startDate.getMonth());
        const endYearMonth = new Date(endDate.getFullYear(), endDate.getMonth());
        
        return filterYearMonth >= startYearMonth && filterYearMonth <= endYearMonth;
      });
    }

    if (tab === "J'y suis inscrit") {
      filtered = filtered.filter(f => 
        userDemandes[f.id] && userDemandes[f.id].admin === "Validée"
      );
    } else if (tab === 'Passées') {
      filtered = filtered.filter(f => (new Date(f.date_de_fin) < new Date() && f.active === true));
    } else if (tab === 'Je propose') {
      filtered = filtered.filter(f => (f.status === 'propose'));
    } else if (tab === 'Cachées') {
      filtered = filtered.filter(f => f.active === false);
    } else {
      filtered = filtered.filter(f => (new Date(f.date) > new Date() && f.active === true) );
    }
    
    setFilteredFormations(filtered);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    Animated.timing(filterHeight, {
      toValue: showFilters ? 0 : 300,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const checkForUpdates = async () => {
    // Implementation remains the same...
  };

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const downloadFilterOptions = async () => {
    // Implementation remains the same...
  };

  // Filter Tabs Component
  const FilterTabs = ({ 
    filters, 
    activeFilters, 
    activeTab = Object.keys(filters)[0],
    onTabChange = () => {},
    onFilterChange,
    onApplyFilters 
  }) => {
    const filterTypes = Object.keys(filters);
    const currentIndex = filterTypes.indexOf(activeTab);

    const navigateTab = (direction) => {
      const newIndex = currentIndex + direction;
      if (newIndex >= 0 && newIndex < filterTypes.length) {
        onTabChange(filterTypes[newIndex]);
      }
    };

    const renderFilterContent = (filterType) => {
      const options = filters[filterType];
      const selectedValue = activeFilters[filterType];

      return (
        <ScrollView 
          contentContainerStyle={styles.filterOptionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterOption,
                selectedValue === option && styles.filterOptionSelected
              ]}
              onPress={() => {
                const newFilters = {
                  ...activeFilters,
                  [filterType]: selectedValue === option ? '' : option
                };
                onFilterChange(newFilters);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                selectedValue === option && styles.filterOptionTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigateTab(-1)}
            disabled={filterTypes.indexOf(activeTab) === 0}
            style={styles.arrowButton}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={filterTypes.indexOf(activeTab) === 0 ? '#D1D5DB' : '#1a53ff'} 
            />
          </TouchableOpacity>

          <View style={styles.tabContainer}>
            <Text style={styles.tabText}>{activeTab}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => navigateTab(1)}
            disabled={filterTypes.indexOf(activeTab) === filterTypes.length - 1}
            style={styles.arrowButton}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={filterTypes.indexOf(activeTab) === filterTypes.length - 1 ? '#D1D5DB' : '#1a53ff'} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContent}>
          {renderFilterContent(activeTab)}
        </View>

        <TouchableOpacity 
          style={styles.applyButton}
          onPress={onApplyFilters}
        >
          <Text style={styles.applyButtonText}>Lancer ma recherche</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFormationItem = ({ item, index }) => {
    return (
      <VideoFormationItem
        item={item}
        index={index}
        onPress={() => navigation.navigate('Formation', { 
          formationId: item.id, 
          role: {isAdmin: isAdmin, isFormateur: isFormateur} 
        })}
        participantCounts={participantCounts}
        userDemandes={userDemandes}
        isAdmin={isAdmin}
      />
    );
  };

  const getActiveFilterCount = (filters) => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des formations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}> 
      <View style={styles.topTabContainer}>
        {(isFormateur?['Disponibles', "Passées", 'Cachées']
        :(isLoggedIn?['Disponibles', "Passées", "J'y suis inscrit"]:['Disponibles'])).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => {
              setActiveTab(tab);
              applyFilters(tab)
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.filterToggleButton} onPress={toggleFilters}>
        <View style={styles.filterToggleContent}>
          <Text style={styles.filterToggleButtonText}>
            Filtres de recherche
            {getActiveFilterCount(activeFilters) > 0 && (
              <Text style={styles.activeFilterCount}>
                {` (${getActiveFilterCount(activeFilters)})`}
              </Text>
            )}
          </Text>
        </View>
        <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={24} color="white" />
      </TouchableOpacity>

      <Animated.View style={[styles.filtersContainer, { height: filterHeight }]}>
        <FilterTabs
          filters={filterOptions}
          activeFilters={activeFilters}
          onFilterChange={(newFilters) => {
            setActiveFilters(newFilters);
          }}
          onApplyFilters={() => {
            applyFilters(activeTab);
            toggleFilters();
          }}
          activeTab={activeFilterTab}
          onTabChange={setActiveFilterTab}
        />
      </Animated.View>

      <FlatList
        data={filteredFormations}
        renderItem={renderFormationItem}
        keyExtractor={item => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {isFormateur && (
        <TouchableOpacity 
          style={styles.newFormationButton}
          onPress={() => navigation.navigate('AjoutFormation')}
        >
          <Text style={styles.newFormationButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  topTabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a53ff',
  },
  
  tabText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  
  activeTabText: {
    color: '#1a53ff',
    fontWeight: '600',
  },
  
  filterToggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a53ff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  
  filterToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  filterToggleButtonText: {
    color: 'white',
    fontSize: 16,
  },
  
  activeFilterCount: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  
  filtersContainer: {
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  arrowButton: {
    padding: 8,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  filterContent: {
    flex: 1,
    padding: 12,
  },
  
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
  },
  
  filterOption: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a53ff',
    marginRight: 8,
    marginBottom: 8,
  },
  
  filterOptionSelected: {
    backgroundColor: '#1a53ff',
  },
  
  filterOptionText: {
    color: '#1a53ff',
    fontSize: 14,
  },
  
  filterOptionTextSelected: {
    color: 'white',
  },
  
  applyButton: {
    backgroundColor: 'black',
    margin: 12,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  
  list: {
    flex: 1,
  },
  
  formationItem: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  
  formationContent: {
    flex: 1,
  },
  
  mediaContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#f8f9fa',
  },
  
  formationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  contentOverlay: {
    padding: 16,
  },
  
  formationHeader: {
    marginBottom: 12,
  },
  
  formationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 24,
  },
  
  formationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  metaText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  priceContainer: {
    flex: 1,
  },
  
  priceLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a53ff',
  },
  
  participantsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  
  participantsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a53ff',
    marginLeft: 4,
  },
  
  statusChip: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  tag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  
  // Video-specific styles
  videoPlayerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    position: 'relative',
  },
  
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 2,
  },
  
  loadingVideoText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
  },
  
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  
  videoErrorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  retryButton: {
    backgroundColor: '#1a53ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 10,
  },
  
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  formationDetails: {
    width: '100%',
    paddingHorizontal: 5,
  },
  
  logoutButton: {
    marginRight: 10,
  },
  
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  
  newFormationButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#1a53ff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  newFormationButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default RechercheFormationsScreen;