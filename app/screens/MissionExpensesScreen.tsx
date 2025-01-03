// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Dimensions } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// const { width } = Dimensions.get('window');
// const SIDE_BAR_WIDTH = width * 0.3; // 30% of screen width
// // Sample mission data
const missions = [
  {
    id: 1,
    name: "Operation Sahel Support",
    location: "Mali",
    date: "Jan 15, 2024",
    receipts: [
      { id: 1, description: "Local Transport", amount: 250.00, date: "Jan 16, 2024" },
      { id: 2, description: "Equipment Supplies", amount: 1500.00, date: "Jan 17, 2024" },
      { id: 3, description: "Team Accommodation", amount: 800.00, date: "Jan 18, 2024" },
    ]
  },
  {
    id: 2,
    name: "Project Lake Victoria",
    location: "Uganda",
    date: "Mar 3, 2024",
    receipts: [
      { id: 1, description: "Medical Supplies", amount: 2000.00, date: "Mar 4, 2024" },
      { id: 2, description: "Boat Rental", amount: 400.00, date: "Mar 5, 2024" },
    ]
  },
  {
    id: 3,
    name: "Atlas Mountains Operation",
    location: "Morocco",
    date: "May 20, 2024",
    receipts: [
      { id: 1, description: "Climbing Gear", amount: 3000.00, date: "May 21, 2024" },
      { id: 2, description: "Local Guide", amount: 500.00, date: "May 22, 2024" },
      { id: 3, description: "Emergency Equipment", amount: 1200.00, date: "May 23, 2024" },
    ]
  },
  {
    id: 4,
    name: "Desert Shield Initiative",
    location: "Niger",
    date: "Feb 10, 2024",
    receipts: [
      { id: 1, description: "Water Supplies", amount: 1800.00, date: "Feb 11, 2024" },
      { id: 2, description: "Vehicle Maintenance", amount: 900.00, date: "Feb 12, 2024" },
      { id: 3, description: "Communication Equipment", amount: 2500.00, date: "Feb 13, 2024" },
    ]
  },
  {
    id: 5,
    name: "Coastal Protection Project",
    location: "Senegal",
    date: "Apr 5, 2024",
    receipts: [
      { id: 1, description: "Marine Equipment", amount: 4000.00, date: "Apr 6, 2024" },
      { id: 2, description: "Local Staff Training", amount: 1200.00, date: "Apr 7, 2024" },
    ]
  },
  {
    id: 6,
    name: "Savanna Research Mission",
    location: "Tanzania",
    date: "Jun 15, 2024",
    receipts: [
      { id: 1, description: "Research Tools", amount: 2800.00, date: "Jun 16, 2024" },
      { id: 2, description: "Field Equipment", amount: 1600.00, date: "Jun 17, 2024" },
      { id: 3, description: "Transportation", amount: 700.00, date: "Jun 18, 2024" },
    ]
  },
  {
    id: 7,
    name: "Highland Conservation",
    location: "Ethiopia",
    date: "Mar 25, 2024",
    receipts: [
      { id: 1, description: "Conservation Supplies", amount: 3500.00, date: "Mar 26, 2024" },
      { id: 2, description: "Community Outreach", amount: 800.00, date: "Mar 27, 2024" },
      { id: 3, description: "Equipment Rental", amount: 1100.00, date: "Mar 28, 2024" },
    ]
  },
  {
    id: 8,
    name: "Delta Operations",
    location: "Egypt",
    date: "May 8, 2024",
    receipts: [
      { id: 1, description: "Water Testing Equipment", amount: 2200.00, date: "May 9, 2024" },
      { id: 2, description: "Local Transportation", amount: 600.00, date: "May 10, 2024" },
    ]
  },
  {
    id: 9,
    name: "Rainforest Initiative",
    location: "Congo",
    date: "Apr 18, 2024",
    receipts: [
      { id: 1, description: "Survey Equipment", amount: 2900.00, date: "Apr 19, 2024" },
      { id: 2, description: "Guide Services", amount: 700.00, date: "Apr 20, 2024" },
      { id: 3, description: "Camp Supplies", amount: 1300.00, date: "Apr 21, 2024" },
    ]
  }
];
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const SIDE_BAR_WIDTH = width * 0.35;

const MissionExpensesScreen = ({ navigation }) => {
  const [selectedMission, setSelectedMission] = useState(missions[0]);
  const [slideAnim] = useState(new Animated.Value(0));
  // adb5bd
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: '🌍 POOL AFRICA  / /',
      headerStyle: {
        backgroundColor: '#adb5bd',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);
  const formatDate = (mission) => {
    if (!mission || !mission.date) return '';
    
    const dates = [new Date(mission.date)];
    if (mission.receipts && Array.isArray(mission.receipts)) {
      dates.push(...mission.receipts.map(r => new Date(r.date)));
    }
    
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));
    
    if (startDate.getFullYear() !== endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    
    if (startDate.getMonth() !== endDate.getMonth()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getFullYear()}`;
    }
    
    return startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  const handleMissionSelect = (mission) => {
    setSelectedMission(mission);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 30,
      friction: 7,
    }).start();
  };

  const getTotalExpenses = (receipts) => 
    receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          {/* <View style={styles.headerLogo}>
            <Icon name="shield" size={22} color="#00E5FF" />
            <Text style={styles.logoText}>RAPID OPS</Text>
          </View> */}
          <View style={styles.liveStatus}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <ScrollView style={styles.missionList}>
          {missions.map((mission) => (
            <TouchableOpacity
              key={mission.id}
              style={[styles.missionItem, selectedMission?.id === mission.id && styles.activeMission]}
              onPress={() => handleMissionSelect(mission)}
            >
              <Icon 
                name="flight-takeoff" 
                size={18} 
                color={selectedMission?.id === mission.id ? '#00E5FF' : '#555'} 
              />
              <View style={styles.missionDetails}>
                <Text style={[styles.missionName, selectedMission?.id === mission.id && styles.activeText]}>
                  {mission.name}
                </Text>
                <View style={styles.missionMeta}>
                  <Text style={styles.missionLocation}>{mission.location}</Text>
                  <Text style={styles.missionTime}>T+{Math.floor(Math.random() * 72)}h</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Animated.View style={[styles.mainContent, { transform: [{ translateX: slideAnim }] }]}>
        {selectedMission && (
          <>
            <View style={styles.mainHeader}>
              <View style={styles.headerContent}>
                <Text style={styles.mainTitle}>{selectedMission.name}</Text>
               
              </View>
              <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>{selectedMission.location} • {formatDate(selectedMission)} </Text>
                </View>
              <Text style={styles.headerSubtitle}>
                 • EXPENDITURE REPORT 
              </Text>
              <View style={styles.expenseCard}>
                <Text style={styles.expenseLabel}>TOTAL EXPENSES</Text>
                <Text style={styles.expenseTotal}>
                  ${getTotalExpenses(selectedMission.receipts).toLocaleString()}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.receiptsList}>
              {selectedMission.receipts.map((receipt) => (
                <TouchableOpacity
                  key={receipt.id}
                  style={styles.receiptItem}
                  onPress={() => navigation.navigate('Expense', { receipt })}
                >
                  <View style={styles.receiptHeader}>
                    <Text style={styles.receiptTitle}>{receipt.description}</Text>
                    <Text style={styles.receiptAmount}>${receipt.amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptMeta}>
                    <Icon name="event" size={14} color="#666" />
                    <Text style={styles.receiptDate}>{formatDate(receipt.date)}</Text>
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
        <Icon name="add" size={30} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111',
  },
  sidebar: {
    width: SIDE_BAR_WIDTH,
    backgroundColor: '#1a1a1a',
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  sidebarHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#00E5FF',
    letterSpacing: 1,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    letterSpacing: 1,
  },
  missionList: {
    flex: 1,
  },
  missionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeMission: {
    backgroundColor: '#111',
  },
  missionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  missionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  missionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionLocation: {
    fontSize: 12,
    color: '#666',
  },
  missionTime: {
    fontSize: 12,
    color: '#00E5FF',
    fontWeight: '500',
  },
  activeText: {
    color: '#fff',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#111',
  },
  mainHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  priorityBadge: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 16,
  },
  expenseCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
  },
  expenseLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  expenseTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00E5FF',
  },
  receiptsList: {
    padding: 16,
  },
  receiptItem: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  receiptAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00E5FF',
  },
  receiptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    letterSpacing: 1,
  },
  monthHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#adb5bd',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  priorityBadge: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  priorityText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default MissionExpensesScreen;