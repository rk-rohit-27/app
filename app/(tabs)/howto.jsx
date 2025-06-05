import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
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

const HowtoPage = () => {
  const [howtoPosts, setHowtoPosts] = useState([]);
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

  // GraphQL query to get posts specifically from the 'howto' category
  const HOWTO_CATEGORY_POSTS_QUERY = `
    query GetHowtoCategoryPosts($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { categoryName: "how-to", orderby: { field: DATE, order: DESC } }) {
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
          uri
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `;

  const loadHowtoPosts = async () => {
    if (!hasMorePosts && howtoPosts.length > 0) {
      return;
    }

    const isInitialLoad = howtoPosts.length === 0;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    const data = await fetchGraphQL(HOWTO_CATEGORY_POSTS_QUERY, {
      first: POSTS_PER_PAGE,
      after: isInitialLoad ? null : endCursor,
    });

    if (data && data.posts && data.posts.nodes) {
      setHowtoPosts((prevPosts) => [...prevPosts, ...data.posts.nodes]);
      setEndCursor(data.posts.pageInfo.endCursor);
      setHasMorePosts(data.posts.pageInfo.hasNextPage);
    } else {
      setHowtoPosts([]);
      setHasMorePosts(false);
    }

    if (isInitialLoad) {
      setLoading(false);
    } else {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadHowtoPosts(); // Initial load when component mounts
  }, []);

  const handleLoadMore = () => {
    if (hasMorePosts && !loading && !loadingMore) {
      loadHowtoPosts();
    }
  };

  const renderPostCard = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => console.log("Navigating to howto URI:", item.uri)}
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
    if (!loadingMore && !hasMorePosts) return null;
    if (!loadingMore && hasMorePosts) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreButtonText}>Load More How-to's</Text>
        </TouchableOpacity>
      );
    }
    if (loadingMore) {
        return (
            <View style={styles.footerLoadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading more...</Text>
            </View>
        );
    }
    return null;
  };

  if (loading && howtoPosts.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading how-to's...</Text>
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
        data={howtoPosts}
        renderItem={renderPostCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsListContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => (
          <View style={styles.pageHeaderSection}>
            <Text style={styles.pageTitle}>How-to Guides</Text>
            <Text style={styles.pageSubtitle}>Learn how to do anything tech-related with our step-by-step guides.</Text>
          </View>
        )}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading && !loadingMore && howtoPosts.length === 0 && (
          <Text style={styles.noContentText}>No how-to guides found.</Text>
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
  postsListContainer: {
    paddingHorizontal: 16,
    paddingTop: 0,
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
  pageHeaderSection: {
    marginBottom: 25,
    alignItems: 'center',
    width: '100%',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingHorizontal: 20,
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
  loadMoreButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HowtoPage;
