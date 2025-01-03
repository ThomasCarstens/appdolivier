import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ExpenseScreen = ({ route }) => {
  const { receipt } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Icon name="shield" size={24} color="#FFD700" />
            <Text style={styles.logoText}>RAPID OPS</Text>
          </View>
          <View style={styles.liveContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <Text style={styles.title}>{receipt.description}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AUTHORIZED • {receipt.date}</Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>AMOUNT</Text>
          <Text style={styles.amount}>${receipt.amount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Icon name="event" size={20} color="#666" />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>DATE</Text>
            <Text style={styles.detailValue}>{receipt.date}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Icon name="description" size={20} color="#666" />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>REFERENCE ID</Text>
            <Text style={styles.detailValue}>#{receipt.id}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#FFD700',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 20,
  },
  badgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  amountCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  amountLabel: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 4,
  },
  amount: {
    color: '#FFD700',
    fontSize: 28,
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
});

export default ExpenseScreen;