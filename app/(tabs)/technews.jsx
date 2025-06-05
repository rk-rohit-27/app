import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image, // Import Image component
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const API_URL = 'https://gizmodotech.com/graphql';
const POSTS_PER_PAGE = 5; // Define how many posts to load per page

const TechNewsPage = () => {
  const [techNewsPosts, setTechNewsPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [endCursor, setEndCursor] = useState(null); // Cursor for pagination
  const [hasMorePosts, setHasMorePosts] = useState(true); // Indicates if there are more posts to load
  const [loadingMore, setLoadingMore] = useState(false); // State specifically for loading more

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

  // GraphQL query to get posts specifically from the 'technews' custom post type
  // Now includes 'featuredImage' and pagination arguments 'first' and 'after'
  const TECH_NEWS_POSTS_QUERY = `
    query GetTechNewsCustomPosts($first: Int!, $after: String) {
      techNews(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          title
          date
          content
          featuredImage {
            node {
              sourceUrl(size: MEDIUM_LARGE)
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `;

  const loadTechNews = async () => {
    if (!hasMorePosts && techNewsPosts.length > 0) {
      // If we already loaded all posts and it's not the initial load, do nothing
      return;
    }

    // Determine if it's the initial load or loading more
    const isInitialLoad = techNewsPosts.length === 0;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    const data = await fetchGraphQL(TECH_NEWS_POSTS_QUERY, {
      first: POSTS_PER_PAGE,
      after: isInitialLoad ? null : endCursor,
    });

    if (data && data.techNews && data.techNews.nodes) {
      setTechNewsPosts((prevPosts) => [...prevPosts, ...data.techNews.nodes]);
      setEndCursor(data.techNews.pageInfo.endCursor);
      setHasMorePosts(data.techNews.pageInfo.hasNextPage);
    } else {
      // If no data, ensure we set hasMorePosts to false to prevent infinite loading
      setTechNewsPosts([]);
      setHasMorePosts(false);
    }

    if (isInitialLoad) {
      setLoading(false);
    } else {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadTechNews(); // Initial load when component mounts
  }, []);

  const handleLoadMore = () => {
    if (hasMorePosts && !loading && !loadingMore) {
      loadTechNews();
    }
  };

  const renderPostCard = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => console.log("Navigating to post ID:", item.id)}
    >
      {item.featuredImage && item.featuredImage.node && item.featuredImage.node.sourceUrl ? (
        <Image
          source={{ uri: item.featuredImage.node.sourceUrl }}
          style={styles.postCardImage}
        />
      ) : (
        <View style={styles.postCardImagePlaceholder}>
          <Ionicons name="image-outline" size={50} color="#E0E0E0" />
          <Text style={styles.postCardImagePlaceholderText}>No Image Available</Text>
        </View>
      )}
      <View style={styles.postCardContent}>
        <Text style={styles.postCardTitle} numberOfLines={2}>{item.title}</Text>
        {item.content && (
            <Text style={styles.postCardContentPreview} numberOfLines={4}>
                {item.content.replace(/<[^>]+>/g, '')}
            </Text>
        )}
        <Text style={styles.postCardDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  if (loading && techNewsPosts.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading tech news...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorText}>Please check your network connection or API endpoint.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={techNewsPosts}
        renderItem={renderPostCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsListContainer} // Renamed for clarity
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Load more when user is halfway to the end
        ListHeaderComponent={() => (
          <View style={styles.headerSection}>
            <Text style={styles.title}>Tech News</Text>
            <Text style={styles.subtitle}>Stay updated with the latest in technology.</Text>
          </View>
        )}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading && !loadingMore && techNewsPosts.length === 0 && (
          <Text style={styles.noContentText}>No tech news posts found.</Text>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  postsListContainer: { // New style for FlatList content container
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 15,
    color: '#D9534F',
    textAlign: 'center',
    marginBottom: 15,
  },
  headerSection: {
    marginBottom: 25,
    alignItems: 'center',
    width: '100%', // Ensure header takes full width within FlatList
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingLeft: 10,
  },
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
  postCardContentPreview: {
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
  noContentText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  footerLoadingContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TechNewsPage;
