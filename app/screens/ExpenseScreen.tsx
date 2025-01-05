import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ExpenseScreen = ({ route, navigation }) => {
  const { receipt } = route.params;
  const [imageDownloaded, setImageDownloaded] = useState(false);
  const uploadedBy = "Jean Dupont";

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'POOL AFRICA',
      headerStyle: {
        backgroundColor: '#000',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerRight: () => (
        <View style={styles.liveContainer}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      ),
    });
  }, [navigation]);

  const handleDownload = () => {
    setImageDownloaded(true);
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{receipt.description}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, styles.modifierBadge]}>
              <Text style={styles.badgeText}>MODIFIER</Text> 
            </View>
            <View style={[styles.badge, styles.badgeSpacing, styles.supprimerBadge]}>
              <Text style={styles.badgeText}>SUPPRIMER</Text> 
            </View>
          </View>
          
          <View style={styles.amountSection}>
            <Text style={styles.amount}>${receipt.amount.toLocaleString()}</Text>
            <Text style={styles.date}>{formatDate(receipt.date)}</Text>
          </View>
        </View>

        <View style={styles.missionsSection}>
          <Text style={styles.sectionTitle}>MISSIONS</Text>
          <View style={styles.missionItem}>
            <Icon name="flight-takeoff" size={20} color="#0EA5E9" />
            <View style={styles.missionInfo}>
              <Text style={styles.missionName}>Savanna Research Mission</Text>
              <Text style={styles.missionLocation}>Tanzania</Text>
            </View>
            <Text style={styles.missionCount}>2 receipts</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Icon name="event" size={20} color="#666" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>DATE</Text>
              <Text style={styles.detailValue}>{formatDate(receipt.date)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Icon name="category" size={20} color="#666" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>CATÉGORIE</Text>
              <Text style={styles.detailValue}>Fournitures de bureau</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Icon name="payment" size={20} color="#666" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>MODE DE PAIEMENT</Text>
              <Text style={styles.detailValue}>Carte Bancaire société</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Icon name="person" size={20} color="#666" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>UPLOADED BY</Text>
              <Text style={styles.detailValue}>{uploadedBy}</Text>
            </View>
          </View>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.imageSectionTitle}>EXPENSE RECEIPT</Text>
          {!imageDownloaded ? (
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
              <Icon name="file-download" size={24} color="#0EA5E9" />
              <Text style={styles.downloadText}>Download Receipt Image</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: '/api/placeholder/300/400' }}
                style={styles.receiptImage}
              />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  content: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  modifierBadge: {
    backgroundColor: '#0EA5E9',
  },
  supprimerBadge: {
    backgroundColor: '#0EA5E9',
  },
  badgeSpacing: {
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  amount: {
    color: '#0EA5E9',
    fontSize: 28,
    fontWeight: 'bold',
  },
  date: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
  },
  missionsSection: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 16,
  },
  missionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    padding: 12,
    borderRadius: 8,
  },
  missionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  missionName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  missionLocation: {
    color: '#0EA5E9',
    fontSize: 14,
    marginTop: 2,
  },
  missionCount: {
    color: '#666666',
    fontSize: 14,
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailText: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
  },
  imageSection: {
    margin: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
  },
  imageSectionTitle: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222222',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  downloadText: {
    color: '#0EA5E9',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222222',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default ExpenseScreen;