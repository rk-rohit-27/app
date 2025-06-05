import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image as RNImage,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import HTMLParser from 'react-native-html-parser';
import Ionicons from 'react-native-vector-icons/Ionicons';
const { width } = Dimensions.get('window');
const API_URL = 'https://gizmodotech.com/graphql';

/**
 * CompareCard Component
 * Renders a card for a selected device in the comparison view.
 * @param {object} props - Component props.
 * @param {object} props.device - The device object containing title, image, etc.
 * @param {function} props.onRemove - Callback to remove the device from comparison.
 */
const CompareCard = ({ device, onRemove }) => {
  if (!device) return null;

  return (
    <View style={styles.compareCard}>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Ionicons name="close-circle" size={24} color="#EF4444" />
      </TouchableOpacity>
      <RNImage
        source={{ uri: device.featuredImage?.node?.sourceUrl || "https://placehold.co/80x80/EAECEE/A0A0A0?text=NoImage" }}
        style={styles.compareCardImage}
        onError={(e) => console.log('Compare Card Image loading error:', e.nativeEvent.error)}
      />
      <Text style={styles.compareCardTitle} numberOfLines={2}>{device.title}</Text>
    </View>
  );
};


/**
 * Compare Component
 * Main component for device comparison. Allows searching, selecting two devices,
 * and displaying their specifications in a comparative table.
 */
const Compare = () => {
  const router = useRouter();
  const localSearchParams = useLocalSearchParams();
  const { device1: device1SlugParam, device2: device2SlugParam } = localSearchParams;

  // State to hold cached full device details (slug -> device_object)
  const [fetchedDevicesCache, setFetchedDevicesCache] = useState({});

  // State to hold search results based on current query
  const [currentSearchResults, setCurrentSearchResults] = useState([]);

  // States for search inputs
  const [searchQueries, setSearchQueries] = useState(["", ""]); // [searchQuery1, searchQuery2]

  // States for selected devices (full device objects, null if not selected)
  const [selectedDevices, setSelectedDevices] = useState([null, null]); // [selectedDevice1, selectedDevice2]

  // Loading states for individual device details fetch
  const [fetchingIndividualDetails, setFetchingIndividualDetails] = useState([false, false]); // [loadingDevice1, loadingDevice2]

  // Custom debounce implementation using useRef for stable timeout IDs
  const debounceTimeoutRefs = useRef({});
  const customDebounce = useCallback((func, delay) => {
    const debouncedFunc = (...args) => {
      const context = this;
      clearTimeout(debounceTimeoutRefs.current[func.name]);
      debounceTimeoutRefs.current[func.name] = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
    return debouncedFunc;
  }, []);

  // GraphQL Fetcher utility function
  const fetchGraphQL = async (query, variables = {}) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonResponse = await response.json();
      if (jsonResponse.errors) {
        // Log all errors for better debugging
        jsonResponse.errors.forEach(err => console.error("GraphQL Error: ", err.message));
        throw new Error(jsonResponse.errors[0].message || 'GraphQL error');
      }
      return jsonResponse.data;
    } catch (err) {
      console.error("GraphQL Fetch Error: ", err);
      return null;
    }
  };

  // GraphQL Queries
  // Removed ALL_POSTS_QUERY as we will rely solely on SEARCH_POSTS_QUERY for all lookups.
  // This simplifies the data flow, as all initial suggestions and actual searches
  // will go through one endpoint.
  const SEARCH_POSTS_QUERY = `
    query SearchPosts($searchQuery: String!) {
      posts(first: 20, where: { search: $searchQuery, orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          title
          slug
          featuredImage {
            node {
              sourceUrl(size: MEDIUM_LARGE)
            }
          }
        }
      }
    }
  `;

  const GET_POST_BY_SLUG_QUERY = `
    query GetPostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        id
        title
        slug
        content(format: RENDERED)
        featuredImage {
          node {
            sourceUrl(size: MEDIUM_LARGE)
          }
        }
      }
    }
  `;

  /**
   * Performs a search for posts based on the query.
   * Updates `currentSearchResults`.
   * @param {string} query - The search string.
   */
  const searchPosts = useCallback(async (query) => {
    if (!query.trim()) {
      setCurrentSearchResults([]);
      return;
    }
    try {
      const data = await fetchGraphQL(SEARCH_POSTS_QUERY, { searchQuery: query });
      if (data && data.posts && data.posts.nodes) {
        setCurrentSearchResults(data.posts.nodes);
      } else {
        setCurrentSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching posts:", error);
      setCurrentSearchResults([]);
    }
  }, []);

  /**
   * Fetches full device details by slug and updates state.
   * @param {string} deviceSlug - The slug of the device to fetch.
   * @param {number} index - The 0-based index (0 or 1) for the comparison slot.
   */
  const fetchDeviceDetails = useCallback(
    async (deviceSlug, index) => {
      // Check if details are already in the cache
      if (fetchedDevicesCache[deviceSlug]) {
        setSelectedDevices(prev => {
          const newSelected = [...prev];
          newSelected[index] = fetchedDevicesCache[deviceSlug];
          return newSelected;
        });
        return;
      }

      setFetchingIndividualDetails(prev => {
        const newFetching = [...prev];
        newFetching[index] = true;
        return newFetching;
      });

      try {
        const data = await fetchGraphQL(GET_POST_BY_SLUG_QUERY, { slug: deviceSlug });
        const post = data?.post;

        if (post) {
          setFetchedDevicesCache(prev => ({ ...prev, [deviceSlug]: post }));
          setSelectedDevices(prev => {
            const newSelected = [...prev];
            newSelected[index] = post;
            return newSelected;
          });
        } else {
          console.error(`No details found for ${deviceSlug}`);
          setSelectedDevices(prev => {
            const newSelected = [...prev];
            newSelected[index] = null;
            return newSelected;
          });
        }
      } catch (err) {
        console.error(`Error fetching details for ${deviceSlug}:`, err);
        setSelectedDevices(prev => {
          const newSelected = [...prev];
          newSelected[index] = null;
          return newSelected;
        });
      } finally {
        setFetchingIndividualDetails(prev => {
          const newFetching = [...prev];
          newFetching[index] = false;
          return newFetching;
        });
      }
    },
    [fetchedDevicesCache]
  );

  // Auto-select devices from URL params on component mount or URL change
  useEffect(() => {
  const slugs = [device1SlugParam, device2SlugParam];
  slugs.forEach((slug, idx) => {
    // If a slug is in the URL param and it's different from the currently selected device's slug in state
    if (slug && (!selectedDevices[idx] || selectedDevices[idx].slug !== slug)) {
      fetchDeviceDetails(slug, idx);
    } else if (!slug && selectedDevices[idx]) {
      // If the URL param for this slot is now empty, but a device is still selected in state, clear the state.
      // This handles cases where the URL param is manually removed or becomes undefined.
      setSelectedDevices(prev => {
        const newSelected = [...prev];
        newSelected[idx] = null;
        return newSelected;
      });
    }
  });
}, [device1SlugParam, device2SlugParam, selectedDevices, fetchDeviceDetails]);
  /**
   * Handles text input changes for search and triggers debounced search.
   * @param {string} text - The current text in the search input.
   * @param {number} index - The 0-based index of the search input.
   */
  const handleSearchInputChange = (text, index) => {
    setSearchQueries(prev => {
      const newQueries = [...prev];
      newQueries[index] = text;
      return newQueries;
    });
    // Trigger debounced search only if text is not empty.
    // If text is empty, clear search results immediately.
    if (text.trim()) {
      debouncedSearchHandler(text);
    } else {
      setCurrentSearchResults([]);
    }
  };

  // Debounced search handler for the main search bar logic
  const debouncedSearchHandler = useCallback(
    customDebounce((query) => searchPosts(query), 500),
    [customDebounce, searchPosts]
  );

  /**
   * Selects a device from search results or initial list.
   * @param {object} device - The selected device object.
   * @param {number} index - The 0-based index of the comparison slot.
   */
  const handleSelectDevice = (device, index) => {
    const slug = device.slug;

    fetchDeviceDetails(slug, index);

    // Clear the search query for the selected slot and search results
    setSearchQueries(prev => {
      const newQueries = [...prev];
      newQueries[index] = "";
      return newQueries;
    });
    setCurrentSearchResults([]); // Clear global search results

    // Update URL parameters
    const newQuery = { ...localSearchParams };
    newQuery[`device${index + 1}`] = slug;
    // Clean up unnecessary parameters for 2-device comparison (if present)
    if (newQuery.device3) delete newQuery.device3;
    router.setParams(newQuery);
  };

  /**
   * Handles removing a selected device from the comparison.
   * @param {number} index - The 0-based index of the device to remove.
   */
  const handleRemoveDevice = useCallback((index) => {
    // Update selectedDevices state first
    setSelectedDevices(prev => {
      const newSelected = [...prev];
      newSelected[index] = null;
      return newSelected;
    });

    // Update URL parameters to reflect the removal
    const newQuery = { ...localSearchParams };
    // Explicitly set the parameter to undefined to ensure it's removed from the URL
    newQuery[`device${index + 1}`] = undefined; 
    
    // Clean up unnecessary parameters for 2-device comparison (if present) - this might be redundant now but good to keep
    if (newQuery.device3) delete newQuery.device3; 
    
    router.setParams(newQuery);
    
    // Also, clear the search query for this slot immediately after removal
    // This ensures that if the user removes a device, they can immediately search for a new one
    setSearchQueries(prev => {
      const newQueries = [...prev];
      newQueries[index] = "";
      return newQueries;
    });
    // And clear global search results if they were populated
    setCurrentSearchResults([]);
  }, [localSearchParams, router]);

  /**
   * Renders search results for a specific input field.
   * @param {string} query - The current search query for the input.
   * @param {number} index - The 0-based index of the input field.
   * @returns {JSX.Element|null} - Search results list or null.
   */
  const renderSearchResults = (query, index) => {
    // Don't render results if input is empty or a device is already selected
    if (!query || selectedDevices[index]) return null;

   
    const filteredResults = currentSearchResults.filter((device) =>
      device.title.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <View style={styles.searchResultsContainer}>
        {fetchingIndividualDetails[index] ? ( // Use the correct loading state
          <ActivityIndicator size="small" color="#3B82F6" style={styles.loadingSpinner} />
        ) : filteredResults.length > 0 ? (
          <ScrollView
        style={{ maxHeight: 220 }} 
        contentContainerStyle={{ paddingBottom: 10 }}
        keyboardShouldPersistTaps="handled"
      >
            {filteredResults.map((device) => (
              <TouchableOpacity
                key={device.id}
                onPress={() => handleSelectDevice(device, index)}
                style={styles.searchResultItem}
              >
                <RNImage
                  style={styles.searchResultImage}
                  source={{ uri: device.featuredImage?.node?.sourceUrl || "https://placehold.co/40x40/EAECEE/A0A0A0?text=NoImage" }}
                  onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                />
                <Text style={styles.searchResultText}>{device.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noResultsText}>No results found.</Text>
        )}
      </View>
    );
  };

 const cleanHTMLContent = (content) => {
  if (typeof content !== 'string') return '';
  return content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
};

const extractSpecifications = (content) => {
  if (typeof content !== 'string') return {};

  const regex =
    /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>\s*<figure[^>]*>\s*<table[^>]*>([\s\S]+?)<\/table>\s*<\/figure>/g;

  const specifications = {};
  let matches;

  while ((matches = regex.exec(content)) !== null) {
    const rawHeading = matches[1];
    const category = cleanHTMLContent(rawHeading);
    const tableHTML = `<table>${matches[2]}</table>`;

    const doc = new HTMLParser.DOMParser().parseFromString(tableHTML, 'text/html');
    const rows = doc.getElementsByTagName('tr');

    const categoryDetails = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      const cells = row.getElementsByTagName('td');
      if (cells.length === 2) {
        categoryDetails.push({
          specification: cleanHTMLContent(cells.item(0).textContent),
          value: cleanHTMLContent(cells.item(1).textContent),
        });
      }
    }

    if (categoryDetails.length > 0) {
      specifications[category] = categoryDetails;
    }
  }

  return specifications;
};
  /**
   * Renders the comparison table for the two selected devices.
   */
  const renderComparisonTable = () => {
    const categories = [
      "General", "Display", "Hardware", "Camera", "Software",
      "Connectivity", "Sensors", "Battery",
    ];

    const device1Specs = selectedDevices[0] ? extractSpecifications(selectedDevices[0].content || "") : {};
    const device2Specs = selectedDevices[1] ? extractSpecifications(selectedDevices[1].content || "") : {};

    // Collect all unique specifications across both selected devices for consistent rows
    const allSpecs = new Set();
    categories.forEach(category => {
      (device1Specs[category] || []).forEach(spec => allSpecs.add(spec.specification));
      (device2Specs[category] || []).forEach(spec => allSpecs.add(spec.specification));
    });
    const sortedAllSpecs = Array.from(allSpecs).sort(); // Sort for consistent order

    // Helper to get spec value for a given device, category, and spec name
    const getSpecValue = (deviceSpecMap, category, specName) => {
      const categorySpecs = deviceSpecMap[category] || [];
      const found = categorySpecs.find(s => s.specification === specName);
      return found ? found.value : "N/A";
    };

    const isAnyDeviceSelected = selectedDevices[0] || selectedDevices[1];

    return (
      <View style={styles.comparisonTableContainer}>
        {isAnyDeviceSelected ? (
          <ScrollView horizontal style={styles.tableScrollView}>
            <View>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.tableCell, styles.headerCell, styles.specColumn]}>Specifications</Text>
                <Text style={[styles.tableCell, styles.headerCell, styles.deviceColumn]}>{selectedDevices[0]?.title || "Device 1"}</Text>
                <Text style={[styles.tableCell, styles.headerCell, styles.deviceColumn]}>{selectedDevices[1]?.title || "Device 2"}</Text>
              </View>

              {/* Table Body - iterate through categories and their specs */}
              {categories.map((category) => {
                // Filter specs that actually exist in at least one device for this category
                const categorySpecsInUse = sortedAllSpecs.filter(specName =>
                  (device1Specs[category] || []).some(s => s.specification === specName) ||
                  (device2Specs[category] || []).some(s => s.specification === specName)
                );

                if (categorySpecsInUse.length === 0) return null; // Don't render empty categories

                return (
                  <View key={category}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    {categorySpecsInUse.map((specName, idx) => (
                      <View style={styles.tableRow} key={idx}>
                        <Text style={[styles.tableCell, styles.specColumn]}>{specName}</Text>
                        <Text style={[styles.tableCell, styles.deviceColumn]}>{getSpecValue(device1Specs, category, specName)}</Text>
                        <Text style={[styles.tableCell, styles.deviceColumn]}>{getSpecValue(device2Specs, category, specName)}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.noComparisonText}>Select devices above to compare their specifications.</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.searchSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareInputsContainer}>
            {[0, 1].map((index) => ( // Loop for 2 devices (0 and 1)
              <View key={index} style={styles.compareInputWrapperTwoDevices}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQueries[index]}
                  onChangeText={(text) => handleSearchInputChange(text, index)}
                  autoCapitalize="none"
                  placeholder={`Search Device ${index + 1}`} // Display 1-based index to user
                  placeholderTextColor="#9CA3AF"
                  clearButtonMode="while-editing" // Adds a clear button for better UX
                />
                {fetchingIndividualDetails[index] ? (
                  <View style={styles.loadingCardContainer}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={styles.loadingCardText}>Loading...</Text>
                  </View>
                ) : selectedDevices[index] ? (
                  <View style={styles.compareCardWrapper}>
                    <CompareCard
                      device={selectedDevices[index]}
                      onRemove={() => handleRemoveDevice(index)}
                    />
                  </View>
                ) : (
                  searchQueries[index] ? ( // Only render search results if query is not empty
                    renderSearchResults(searchQueries[index], index)
                  ) : null
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {renderComparisonTable()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  container: {
    paddingHorizontal: 8,
    paddingVertical: 24,
  },
  searchSection: {
    marginBottom: 24,
    width: '100%',
  },
  compareInputsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    
  },
  compareInputWrapperTwoDevices: {
    width: width * 0.45,
    marginHorizontal: 8,
    position: 'relative',
    minHeight: 100,
    flexShrink: 0,
    flexGrow: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    
    },
  searchResultsContainer: {
    position: 'relative',
    top: 10, 
    left: 0,
    width: "100%",
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "white",
    shadowColor: '#000',
    height: 250,
   
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
    resizeMode: 'contain',
  },
  searchResultText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    flexWrap: 'wrap',
  },
  noResultsText: {
    padding: 10,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  loadingSpinner: {
    padding: 10,
  },
  loadingCardContainer: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  loadingCardText: {
    marginTop: 10,
    color: '#6B7280',
  },
  compareCardWrapper: {
    marginTop: 10,
    flex: 1
  },
  compareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    position: 'relative',
    minHeight: 150,
    justifyContent: 'center',
     flex: 1
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 1,
    padding: 5,
  },
  compareCardImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  compareCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
  },
  comparisonTableContainer: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    flex: 1,
    marginTop: 20,
    
  },
  tableScrollView: {
    width: '100%',
    flex: 1,
    maxHeight: "100%", 
    overflow: 'scroll'
  },
  tableRow: {
    flexDirection: 'row',
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 10,
  },
  tableHeaderRow: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    width: "100%",
    position: "sticky",
    top: 1,
    overflowY: "auto"

  },
  tableCell: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    fontSize: 14,
    width: "100%",
    color: '#374151',
    
   
  },
  headerCell: {
    fontWeight: '600',
    color: '#1F2937',
  },
  specColumn: {
    width: 110,
    fontWeight: '600',
  },
  deviceColumn: { 
    width: 220, 
    textAlign: 'left',
   
    
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  noComparisonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
});

export default Compare;