import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const API_URL = 'https://gizmodotech.com/graphql';
const POSTS_PER_PAGE = 5; // Define how many posts to load per page

// This map provides specific Ionicons and colors for categories.
// It is static because the GraphQL API for WordPress typically does not
// provide icon names or specific UI colors directly for categories.
// This allows you to customize the visual representation of categories
// within your app's UI independently of the backend data structure.
// I've added a few more specific icons/colors for the new brands.
const categoryIconMap = {
  'Mobiles': { icon: 'phone-portrait-outline', color: '#3B82F6', bgColor: '#EBF5FF' },
  'Android': { icon: 'logo-android', color: '#3DDC84', bgColor: '#E8FBF2' },
  'iOS': { icon: 'logo-apple', color: '#A2AAAD', bgColor: '#F6F6F6' },
  'Samsung': { icon: 'phone-portrait-outline', color: '#1B2C65', bgColor: '#E2E5F2' },
  'iPhone': { icon: 'phone-portrait-outline', color: '#000000', bgColor: '#EFEFEF' },
  'Budget Phones': { icon: 'cash-outline', color: '#F97316', bgColor: '#FFF7ED' },
  'Flagship Phones': { icon: 'star-outline', color: '#F59E0B', bgColor: '#FFFBEB' },
  'Smartphones': { icon: 'phone-landscape-outline', color: '#10B981', bgColor: '#E6FFF5' },
  'News': { icon: 'newspaper-outline', color: '#8B5CF6', bgColor: '#F5EBFF' },
  'Reviews': { icon: 'document-text-outline', color: '#D9534F', bgColor: '#FEECEC' },
  'Comparison': { icon: 'scale-outline', color: '#0EA5E9', bgColor: '#E0F2FE' },
  'realme': { icon: 'cube-outline', color: '#FABE29', bgColor: '#FFFCEB' },
  'Oppo': { icon: 'phone-portrait-outline', color: '#FF7F00', bgColor: '#FFF5E0' },
  'OnePlus': { icon: 'aperture-outline', color: '#EB0029', bgColor: '#FEE5E7' },
  'Nothing': { icon: 'flash-outline', color: '#000000', bgColor: '#F6F6F6' },
  'Motorola': { icon: 'walk-outline', color: '#5C3893', bgColor: '#EEF0F5' },
  'Lava': { icon: 'flame-outline', color: '#E4282B', bgColor: '#FCEAEA' },
  'Google': { icon: 'logo-google', color: '#4285F4', bgColor: '#E8F0FE' },
  'Asus': { icon: 'laptop-outline', color: '#000000', bgColor: '#EAEAEA' },
  'Apple': { icon: 'logo-apple', color: '#A2AAAD', bgColor: '#F6F6F6' },
  'Vivo': { icon: 'camera-outline', color: '#467BFF', bgColor: '#EDF2FF' },
  'Xiaomi': { icon: 'cube-outline', color: '#FF6700', bgColor: '#FFF2E0' },
  'Uncategorized': { icon: 'folder-outline', color: '#6B7280', bgColor: '#F3F4F6' },
};

const MobilePage = () => {
  const [mobilePosts, setMobilePosts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState(null);
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

  // GraphQL query to get posts by category with pagination support
  const POSTS_BY_CATEGORY_QUERY = `
    query GetPostsByCategory($categorySlug: String!, $first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { categoryName: $categorySlug, orderby: { field: DATE, order: DESC } }) {
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
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `;

  const ALL_CATEGORIES_QUERY = `
    query GetAllCategories {
      categories(first: 50) {
        nodes {
          name
          slug
        }
      }
    }
  `;

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    setMobilePosts([]); // Clear posts for initial load
    setEndCursor(null); // Reset cursor
    setHasMorePosts(true); // Assume more posts initially

    const [categoriesData, initialMobilePostsData] = await Promise.all([
      fetchGraphQL(ALL_CATEGORIES_QUERY),
      fetchGraphQL(POSTS_BY_CATEGORY_QUERY, { categorySlug: 'mobile', first: POSTS_PER_PAGE, after: null }),
    ]);

    if (categoriesData && categoriesData.categories && categoriesData.categories.nodes) {
      setAllCategories(categoriesData.categories.nodes);

      const brandSlugsAndNames = [
        'realme', 'oppo', 'oneplus', 'nothing', 'motorola', 'lava', 'google', 'asus',
        'apple', 'samsung', 'vivo', 'xiaomi', 'android', 'ios', 'smartphones', 'mobile',
        'phone', 'budget-phones', 'flagship-phones', 'reviews', 'comparison'
      ];

      const filtered = categoriesData.categories.nodes.filter(cat =>
        brandSlugsAndNames.includes(cat.slug) ||
        brandSlugsAndNames.some(term => cat.name.toLowerCase().includes(term))
      );
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      setFilteredCategories(filtered);
    }

    if (initialMobilePostsData && initialMobilePostsData.posts && initialMobilePostsData.posts.nodes) {
      setMobilePosts(initialMobilePostsData.posts.nodes);
      setEndCursor(initialMobilePostsData.posts.pageInfo.endCursor);
      setHasMorePosts(initialMobilePostsData.posts.pageInfo.hasNextPage);
    } else {
      setMobilePosts([]);
      setHasMorePosts(false);
    }
    setSelectedSubCategorySlug('mobile');

    setLoading(false);
  };

  const fetchPostsForSelectedCategory = async (categorySlug, currentCursor = null, append = false) => {
    if (!hasMorePosts && append) { // Don't load more if no more posts exist
        return;
    }
    
    // If it's a new category selection, reset state first
    if (!append) {
        setLoading(true);
        setMobilePosts([]);
        setEndCursor(null);
        setHasMorePosts(true);
    } else {
        setLoadingMore(true);
    }
    setError(null);

    const data = await fetchGraphQL(POSTS_BY_CATEGORY_QUERY, {
      categorySlug: categorySlug,
      first: POSTS_PER_PAGE,
      after: currentCursor,
    });

    if (data && data.posts && data.posts.nodes) {
      setMobilePosts((prevPosts) => append ? [...prevPosts, ...data.posts.nodes] : data.posts.nodes);
      setEndCursor(data.posts.pageInfo.endCursor);
      setHasMorePosts(data.posts.pageInfo.hasNextPage);
    } else {
      setMobilePosts(append ? mobilePosts : []); // Keep existing posts if appending fails, or clear if new category
      setHasMorePosts(false);
    }

    if (!append) {
        setLoading(false);
    } else {
        setLoadingMore(false);
    }
  };


  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSubCategorySlug) {
      fetchPostsForSelectedCategory(selectedSubCategorySlug, null, false); // Fetch new category, not appending
    }
  }, [selectedSubCategorySlug]); // Runs when selectedSubCategorySlug changes

  const handleLoadMore = () => {
    if (hasMorePosts && !loading && !loadingMore) {
      fetchPostsForSelectedCategory(selectedSubCategorySlug, endCursor, true);
    }
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

  const renderFooter = () => {
    if (!loadingMore && !hasMorePosts) return null; // No more posts and not loading
    if (loadingMore) {
        return (
            <View style={styles.footerLoadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading more...</Text>
            </View>
        );
    }
    // Only show "Load More" button if there are more posts and not currently loading
    if (hasMorePosts && !loading && !loadingMore) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (loading && mobilePosts.length === 0 && filteredCategories.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading mobile content...</Text>
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
      {/* Changed to FlatList to handle its own scrolling for pagination */}
      <FlatList
        data={mobilePosts}
        renderItem={renderPostCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsListContainer} // Renamed for FlatList
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Trigger when 50% from the end
        ListHeaderComponent={() => (
          <>
            <View style={styles.headerSection}>
              <Text style={styles.title}>All Mobiles</Text>
              <Text style={styles.subtitle}>Explore the latest smartphones and mobile tech.</Text>
            </View>

            {filteredCategories.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Filter by Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsScroll}>
                  {filteredCategories.map((category) => {
                    const iconData = categoryIconMap[category.name] || categoryIconMap['Uncategorized'];
                    const isSelected = selectedSubCategorySlug === category.slug;
                    return (
                      <TouchableOpacity
                        key={category.slug}
                        style={[
                          styles.categoryTabItem,
                          isSelected && styles.categoryTabItemSelected,
                        ]}
                        onPress={() => setSelectedSubCategorySlug(category.slug)}
                      >
                        <View style={[styles.categoryIconCircle, { backgroundColor: iconData.bgColor }]}>
                          <Ionicons name={iconData.icon} size={20} color={iconData.color} />
                        </View>
                        <Text style={[
                          styles.categoryTabLabel,
                          isSelected && styles.categoryTabLabelSelected
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {selectedSubCategorySlug ? allCategories.find(cat => cat.slug === selectedSubCategorySlug)?.name : 'Mobiles'}
              </Text>
              {/* Removed the FlatList from here, as the main FlatList now renders posts */}
            </View>
          </>
        )}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading && !loadingMore && mobilePosts.length === 0 && (
          <Text style={styles.noContentText}>
            No posts found for "{selectedSubCategorySlug ? allCategories.find(cat => cat.slug === selectedSubCategorySlug)?.name : 'mobiles'}".
          </Text>
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
    paddingTop: 0, // Header is now part of ListHeaderComponent
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
    width: '100%',
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
    width: '100%', // Ensure it takes full width for proper layout within FlatList
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
  categoryTabsScroll: {
    paddingRight: 10,
    paddingVertical: 5,
  },
  categoryTabItem: {
    alignItems: 'center',
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  categoryTabItemSelected: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  categoryIconCircle: {
    padding: 7,
    borderRadius: 15,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#546A7A',
  },
  categoryTabLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    resizeMode: 'contain',
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

export default MobilePage;
