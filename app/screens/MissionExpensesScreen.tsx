

const missions = [
  {
    id: "2024-01-15T00:00:00Z",
    name: "Operation Sahel Support",
    location: "Mali"
  },
  {
    id: "2024-03-03T00:00:00Z",
    name: "Project Lake Victoria",
    location: "Uganda",
  },
  {
    id: "2024-05-20T00:00:00Z",
    name: "Atlas Mountains Operation",
    location: "Morocco",
  },
  {
    id: "2024-02-10T00:00:00Z",
    name: "Desert Shield Initiative",
    location: "Niger",
  },
  {
    id: "2024-04-05T00:00:00Z",
    name: "Coastal Protection Project",
    location: "Senegal",
  },
  {
    id: "2024-06-15T00:00:00Z",
    name: "Savanna Research Mission",
    location: "Tanzania",
  },
  {
    id: "2024-03-25T00:00:00Z",
    name: "Highland Conservation",
    location: "Ethiopia",
  },
  {
    id: "2024-05-08T00:00:00Z",
    name: "Delta Operations",
    location: "Egypt",
  },
  {
    id: "2024-04-18T00:00:00Z",
    name: "Rainforest Initiative",
    location: "Congo",
  }
];
const updatedReceipts = [
  { 
    description: "Local Transport", 
    amount: 250.00, 
    date: "2024-01-16", 
    mission_id: "2024-01-15T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Local_Transport.png"
  },
  { 
    description: "Equipment Supplies", 
    amount: 1500.00, 
    date: "2024-01-17", 
    mission_id: "2024-01-15T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Equipment_Supplies.png"
  },
  { 
    description: "Team Accommodation", 
    amount: 800.00, 
    date: "2024-01-18", 
    mission_id: "2024-01-15T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Team_Accommodation.png"
  },
  { 
    description: "Medical Supplies", 
    amount: 2000.00, 
    date: "2024-03-04", 
    mission_id: "2024-03-03T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Medical_Supplies.png"
  },
  { 
    description: "Boat Rental", 
    amount: 400.00, 
    date: "2024-03-05", 
    mission_id: "2024-03-03T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Boat_Rental.png"
  },
  { 
    description: "Climbing Gear", 
    amount: 3000.00, 
    date: "2024-05-21", 
    mission_id: "2024-05-20T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Climbing_Gear.png"
  },
  { 
    description: "Local Guide", 
    amount: 500.00, 
    date: "2024-05-22", 
    mission_id: "2024-05-20T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Local_Guide.png"
  },
  { 
    description: "Emergency Equipment", 
    amount: 1200.00, 
    date: "2024-05-23", 
    mission_id: "2024-05-20T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Emergency_Equipment.png"
  },
  { 
    description: "Water Supplies", 
    amount: 1800.00, 
    date: "2024-02-11", 
    mission_id: "2024-02-10T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Water_Supplies.png"
  },
  { 
    description: "Vehicle Maintenance", 
    amount: 900.00, 
    date: "2024-02-12", 
    mission_id: "2024-02-10T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Vehicle_Maintenance.png"
  },
  { 
    description: "Marine Equipment", 
    amount: 4000.00, 
    date: "2024-04-06", 
    mission_id: "2024-04-05T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Marine_Equipment.png"
  },
  { 
    description: "Local Staff Training", 
    amount: 1200.00, 
    date: "2024-04-07", 
    mission_id: "2024-04-05T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Local_Staff_Training.png"
  },
  { 
    description: "Research Tools", 
    amount: 2800.00, 
    date: "2024-06-16", 
    mission_id: "2024-06-15T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Research_Tools.png"
  },
  { 
    description: "Field Equipment", 
    amount: 1600.00, 
    date: "2024-06-17", 
    mission_id: "2024-06-15T00:00:00Z", 
    category: "Fournitures de bureau",
    payment_method: "Carte Bancaire société",
    uploaded_by: "Jean Dupont",
    google_storage_path: "gs://your-bucket-name/receipts/Field_Equipment.png"
  }
];

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Modal,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const getTotalExpenses = (receipts) => 
  receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

const generateMonthList = () => {
  const months = [];
  const years = [2024, 2025];
  
  years.forEach(year => {
    for (let month = 0; month < 12; month++) {
      months.push({
        id: `${year}-${String(month + 1).padStart(2, '0')}`,
        name: new Date(year, month).toLocaleString('default', { month: 'long' }),
        year: year
      });
    }
  });
  
  return months;
};

const MissionExpensesScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Mission');
  const [selectedMission, setSelectedMission] = useState(missions[0]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newMissionName, setNewMissionName] = useState('');
  
  const monthsList = useMemo(() => generateMonthList(), []);

  // Calculate receipt counts for missions
  const missionReceiptCounts = useMemo(() => {
    return missions.reduce((acc, mission) => {
      acc[mission.id] = updatedReceipts.filter(receipt => 
        receipt.mission_id === mission.id
      ).length;
      return acc;
    }, {});
  }, []);

  // Calculate receipt counts for months
  const monthReceiptCounts = useMemo(() => {
    return monthsList.reduce((acc, month) => {
      acc[month.id] = updatedReceipts.filter(receipt => {
        const receiptDate = new Date(receipt.date);
        const receiptMonthYear = `${receiptDate.getFullYear()}-${String(receiptDate.getMonth() + 1).padStart(2, '0')}`;
        return receiptMonthYear === month.id;
      }).length;
      return acc;
    }, {});
  }, [monthsList]);

  const filteredReceipts = useMemo(() => {
    if (activeTab === 'Mission' && selectedMission) {
      return updatedReceipts.filter(receipt => receipt.mission_id === selectedMission.id);
    } else if (activeTab === 'Mois' && selectedMonth) {
      return updatedReceipts.filter(receipt => {
        const receiptDate = new Date(receipt.date);
        const receiptMonthYear = `${receiptDate.getFullYear()}-${String(receiptDate.getMonth() + 1).padStart(2, '0')}`;
        return receiptMonthYear === selectedMonth.id;
      });
    }
    return [];
  }, [activeTab, selectedMission, selectedMonth]);

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

  const renderSidebarContent = () => {
    if (activeTab === 'Mission') {
      return (
        <>
          <TouchableOpacity
            style={styles.addMissionItem}
            onPress={() => setIsModalVisible(true)}
          >
            <Icon name="add" size={24} color="#00E5FF" />
          </TouchableOpacity>
          
          {missions.map((mission) => (
            <TouchableOpacity
              key={mission.id}
              style={[styles.missionItem, selectedMission?.id === mission.id && styles.activeMission]}
              onPress={() => setSelectedMission(mission)}
            >
              <View style={styles.iconCountContainer}>
                <Icon 
                  name="flight-takeoff" 
                  size={20} 
                  color={selectedMission?.id === mission.id ? '#00E5FF' : '#555'} 
                />
                <Text style={styles.receiptCount}>{missionReceiptCounts[mission.id] || 0}</Text>
              </View>
              <View style={styles.missionDetails}>
                <Text style={[styles.missionName, selectedMission?.id === mission.id && styles.activeText]}>
                  {mission.name}
                </Text>
                <Text style={styles.missionLocation}>{mission.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      );
    } else {
      return monthsList.map((month) => (
        <TouchableOpacity
          key={month.id}
          style={[styles.missionItem, selectedMonth?.id === month.id && styles.activeMission]}
          onPress={() => setSelectedMonth(month)}
        >
          <View style={styles.iconCountContainer}>
            <Icon 
              name="calendar-today" 
              size={20} 
              color={selectedMonth?.id === month.id ? '#00E5FF' : '#555'} 
            />
            <Text style={styles.receiptCount}>{monthReceiptCounts[month.id] || 0}</Text>
          </View>
          <View style={styles.missionDetails}>
            <Text style={[styles.missionName, selectedMonth?.id === month.id && styles.activeText]}>
              {month.name}
            </Text>
            <Text style={styles.missionLocation}>{month.year}</Text>
          </View>
        </TouchableOpacity>
      ));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.sidebar}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Mission' && styles.activeTab]}
            onPress={() => {
              setActiveTab('Mission');
              setSelectedMonth(null);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'Mission' && styles.activeTabText]}>
              Mission
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Mois' && styles.activeTab]}
            onPress={() => {
              setActiveTab('Mois');
              setSelectedMission(null);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'Mois' && styles.activeTabText]}>
              Mois
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.missionList}>
          {renderSidebarContent()}
        </ScrollView>
      </View>

      <Animated.View style={[styles.mainContent, { transform: [{ translateX: slideAnim }] }]}>
        {(selectedMission || selectedMonth) && (
          <>
            <View style={styles.mainHeader}>
              <Text style={styles.mainTitle}>
                {activeTab === 'Mission' ? selectedMission?.name : `${selectedMonth?.name} ${selectedMonth?.year}`}
              </Text>
              <View style={styles.locationBadge}>
                <Text style={styles.locationText}>
                  {activeTab === 'Mission' ? selectedMission?.location : 'Monthly Report'}
                </Text>
              </View>
              <View style={styles.expenseCard}>
                <Text style={styles.totalCount}>
                  {filteredReceipts.length} {filteredReceipts.length === 1 ? 'receipt' : 'receipts'}
                </Text>
                <Text style={styles.expenseTotal}>
                  ${getTotalExpenses(filteredReceipts).toLocaleString()}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.receiptsList}>
              {filteredReceipts.map((receipt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.receiptItem}
                  onPress={() => navigation.navigate('Expense', { receipt })}
                >
                  <Text style={styles.receiptTitle}>{receipt.description}</Text>
                  <View style={styles.receiptMeta}>
                    <Icon name="event" size={14} color="#666" />
                    <Text style={styles.receiptDate}>{receipt.date}</Text>
                    <Text style={styles.receiptAmount}>${receipt.amount.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </Animated.View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AjoutExpense')}
      >
        <Icon name="receipt" size={30} color="#000" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Créer une nouvelle mission</Text>
            <TextInput
              style={styles.input}
              value={newMissionName}
              onChangeText={setNewMissionName}
              placeholder="Nom de la mission"
              placeholderTextColor="#666"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={() => {
                  setIsModalVisible(false);
                  navigation.navigate('AjoutMission');
                }}
              >
                <Text style={styles.buttonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: '#000',
    },
    sidebar: {
      width: width * 0.44,
      backgroundColor: '#000',
      borderRightWidth: 1,
      borderRightColor: '#222',
    },
    tabContainer: {
      flexDirection: 'row',
      padding: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    activeTab: {
      backgroundColor: '#1a53ff',
    },
    tabText: {
      color: '#fff',
      textAlign: 'center',
      fontSize: 12,
    },
    activeTabText: {
      color: '#fff',
      fontWeight: '600',
    },
    addMissionItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#222',
      alignItems: 'center',
    },
    missionList: {
      flex: 1,
    },

    activeMission: {
      backgroundColor: '#111',
    },
    missionName: {
      fontSize: 14,
      color: '#fff',
      marginBottom: 4,
    },
    missionLocation: {
      fontSize: 12,
      color: '#00E5FF',
    },
    mainContent: {
      flex: 1,
      backgroundColor: '#000',
    },
    mainHeader: {
      padding: 20,
    },
    mainTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: '#fff',
      marginBottom: 8,
    },
    locationBadge: {
      backgroundColor: '#00E5FF',
      alignSelf: 'flex-start',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginBottom: 8,
    },
    locationText: {
      color: '#000',
      fontSize: 12,
      fontWeight: '600',
    },
    headerSubtitle: {
      fontSize: 13,
      color: '#666',
      marginBottom: 16,
    },
    expenseTotal: {
      fontSize: 28,
      fontWeight: '700',
      color: '#00E5FF',
    },
    receiptsList: {
      padding: 16,
    },
    receiptItem: {
      backgroundColor: '#111',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
    },
    receiptTitle: {
      fontSize: 16,
      color: '#fff',
      marginBottom: 8,
    },
    receiptMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    receiptDate: {
      fontSize: 12,
      color: '#666',
      marginLeft: 6,
      flex: 1,
    },
    receiptAmount: {
      fontSize: 14,
      color: '#00E5FF',
      fontWeight: '500',
    },
    addButton: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      backgroundColor: '#111',
      borderRadius: 8,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      color: '#fff',
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      backgroundColor: '#222',
      borderRadius: 4,
      padding: 12,
      color: '#fff',
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 4,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#333',
    },
    createButton: {
      backgroundColor: '#00E5FF',
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
    },
    badgeContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    badge: {
      backgroundColor: '#FFD700',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
    },
    badgeSpacing: {
      marginLeft: 8,
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
    receiptCountContainer: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      minWidth: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },

    totalCount: {
      color: '#666',
      fontSize: 14,
      marginBottom: 4,
    },
    iconCountContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
      marginRight: 12,
    },
    
    receiptCount: {
      color: '#00E5FF',
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
    
    missionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#222',
    },
    
    missionDetails: {
      flex: 1,
    },
  });
export default MissionExpensesScreen;