import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const AddExpenseScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    id: Date.now().toString(),
    description: '',
    amount: '',
    date: new Date(),
    category: '',
    subcategory: '',
    paymentMethod: 'Carte Bancaire société',
    image: null
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [errors, setErrors] = useState({});

  // Categories based on the provided images
  const categories = {
    "Virement société": ["Prélèvement société"],
    "Carte Bancaire société": ["Chèque société"],
    "Régl. personnel": ["Incertain"],
    "Fournitures de bureau": [
      "Fournitures de petit matériel/équipement",
      "Fournitures administratives/bureau"
    ],
    "Entretien matériel": [
      "Entretien matériel transport",
      "Entretien matériel de bureau"
    ],
    "Frais d'achat et contentieux": [
      "Assurances et sinistres (général)",
      "Déplacements professionnels (général, restaurants, parking, hotels...)"
    ],
    "Frais postaux": [
      "Internet",
      "Mobile",
      "Téléphone"
    ],
    "Sous-traitance montage": ["Maintenance"],
    "Locations mobilières": ["Primes d'assurance"],
    "Location diverse société": ["Honoraires comptables"],
    "Honoraires juridiques": ["Cabinet fisc, etc etc"],
    "Cotisations": ["Vente de voiture"]
  };

  const handleInputChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('date', selectedDate);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      handleInputChange('image', result.assets[0].uri);
    }
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!formData.description) {
      newErrors.description = 'Description required';
      isValid = false;
    }

    if (!formData.amount || isNaN(formData.amount)) {
      newErrors.amount = 'Valid amount required';
      isValid = false;
    }

    if (!formData.category) {
      newErrors.category = 'Category required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Here you would typically save to your database
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ADD EXPENSE</Text>
          </View>
          <View style={styles.liveContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, errors.description && styles.inputError]}
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
          placeholder="Enter expense description"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={[styles.input, errors.amount && styles.inputError]}
          value={formData.amount}
          onChangeText={(text) => handleInputChange('amount', text)}
          placeholder="Enter amount"
          keyboardType="numeric"
        />
        {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity 
          style={styles.dateButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {formData.date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Category *</Text>
        <Picker
          selectedValue={formData.category}
          style={[styles.picker, errors.category && styles.pickerError]}
          onValueChange={(value) => handleInputChange('category', value)}
        >
          <Picker.Item label="Select a category" value="" />
          {Object.keys(categories).map((category) => (
            <Picker.Item key={category} label={category} value={category} />
          ))}
        </Picker>

        {formData.category && (
          <>
            <Text style={styles.label}>Subcategory</Text>
            <Picker
              selectedValue={formData.subcategory}
              style={styles.picker}
              onValueChange={(value) => handleInputChange('subcategory', value)}
            >
              <Picker.Item label="Select a subcategory" value="" />
              {categories[formData.category]?.map((subcategory) => (
                <Picker.Item key={subcategory} label={subcategory} value={subcategory} />
              ))}
            </Picker>
          </>
        )}

        <Text style={styles.label}>Receipt Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePickerText}>Tap to select receipt image</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Expense</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: '#111111',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
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
  formContainer: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    color: '#FFFFFF',
  },
  picker: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    marginBottom: 16,
    color: '#FFFFFF',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#222222',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePickerText: {
    color: '#666666',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  pickerError: {
    borderColor: '#FF6B6B',
  },
});

export default AddExpenseScreen;