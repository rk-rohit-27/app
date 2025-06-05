import { useRouter } from 'expo-router'; // Import useRouter for navigation
import React, { useState } from 'react';
import { Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AppHeader = ({ onBurgerPress }) => {
  const [isMenuVisible, setMenuVisible] = useState(false);
  const router = useRouter(); // Initialize router for navigation

  const toggleMenu = () => {
    setMenuVisible(!isMenuVisible);
    if (onBurgerPress) {
      onBurgerPress();
    }
  };

  // Function to handle menu item press and navigate
  const handleMenuItemPress = (screenName) => {
    toggleMenu(); // Close the menu
    router.push(`/${screenName}`); // Navigate to the specified screen
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        {/* Logo on the left side */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          onError={(e) => console.log('Logo loading error:', e.nativeEvent.error)}
        />

        {/* Burger menu icon on the right side */}
        <TouchableOpacity onPress={toggleMenu} style={styles.burgerIcon}>
          <Ionicons name="menu-outline" size={30} color="#2C3E50" />
        </TouchableOpacity>
      </View>

      {/* Full-width Menu Modal */}
      <Modal
        animationType="none" // Set to "none" for no animation
        transparent={true}
        visible={isMenuVisible}
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            {/* Menu Header with Close (X) icon */}
            <View style={styles.menuHeader}>
             
              <TouchableOpacity onPress={toggleMenu} style={styles.menuCloseIcon}>
                <Ionicons name="close-outline" size={30} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress('reviews')}>
              <Text style={styles.menuItemText}>Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress('technews')}>
              <Text style={styles.menuItemText}>Tech News</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress('gadgets')}>
              <Text style={styles.menuItemText}>Gadgets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress('howto')}>
              <Text style={styles.menuItemText}>How-to's</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logoImage: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  burgerIcon: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingTop: 80,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    width: '100%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  menuCloseIcon: {
    padding: 5,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 17,
    color: '#333333',
    fontWeight: '500',
  },
});

export default AppHeader;
