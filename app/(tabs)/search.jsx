import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const API_URL = 'https://gizmodotech.com/graphql';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // To show "No results" only after a search attempt

  // Function to fetch GraphQL data
  const fetchGraphQL = async (query, variables = {}) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();

      if (jsonResponse.errors) {
        throw new Error(jsonResponse.errors[0].message || 'GraphQL error');
      }

      return jsonResponse.data;
    } catch (err) {
      console.error("GraphQL Fetch Error: ", err);
      setError(err.message);
      return null;
    }
  };

  // GraphQL query for searching posts
  const SEARCH_POSTS_QUERY = `
    query SearchPosts($search: String!) {
      posts(first: 20, where: { search: $search }) {
        nodes {
          id
          title
          excerpt(format: RENDERED)
          featuredImage {
            node {
              sourceUrl(size: MEDIUM_LARGE)
            }
          }
          uri
          date
        }
      }
    }
  `;

  const handleSearch = async () => {
    Keyboard.dismiss(); // Dismiss keyboard when search is initiated
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true); // Mark that a search has been attempted

    const data = await fetchGraphQL(SEARCH_POSTS_QUERY, { search: searchQuery });

    if (data && data.posts && data.posts.nodes) {
      setSearchResults(data.posts.nodes);
    } else {
      setSearchResults([]);
    }
    setLoading(false);
  };

  const renderPostCard = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => console.log("Navigating to post URI:", item.uri)}
    >
      {item.featuredImage && item.featuredImage.node && item.featuredImage.node.sourceUrl ? (
        <Image
          source={{ uri: item.featuredImage.node.sourceUrl }}
          style={styles.postCardImage}
        />
      ) : (
        <View style={styles.postCardImagePlaceholder}>
          <Ionicons name="image-outline" size={50} color="#E0E0E0" />
          <Text style={styles.postCardImagePlaceholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.postCardContent}>
        <Text style={styles.postCardTitle} numberOfLines={2}>{item.title}</Text>
        {item.excerpt && (
            <Text style={styles.postCardExcerpt} numberOfLines={3}>
                {item.excerpt.replace(/<[^>]+>/g, '')}
            </Text>
        )}
        <Text style={styles.postCardDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Search GizmodoTech</Text>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for articles..."
            placeholderTextColor="#95A5A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch} // Trigger search on keyboard "done" or "search"
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="search-outline" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {hasSearched && !loading && searchResults.length === 0 && !error && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="document-text-outline" size={60} color="#BDC3C7" />
            <Text style={styles.noResultsText}>No results found for "{searchQuery}".</Text>
            <Text style={styles.noResultsSubText}>Try a different search term.</Text>
          </View>
        )}

        {loading && searchResults.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!loading && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            renderItem={renderPostCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled" // Keep keyboard from dismissing immediately
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 25,
    paddingRight: 5, // Space for button
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#34495E',
    paddingHorizontal: 15,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#D9534F',
    textAlign: 'center',
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resultsList: {
    paddingBottom: 20,
  },
  // Reused styles from home page for post cards
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  postCardImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  postCardImagePlaceholder: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#EAECEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCardImagePlaceholderText: {
    color: '#A0A0A0',
    marginTop: 5,
    fontSize: 14,
  },
  postCardContent: {
    padding: 15,
  },
  postCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 24,
  },
  postCardExcerpt: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 10,
    lineHeight: 18,
  },
  postCardDate: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'right',
  },
});

export default SearchPage;
