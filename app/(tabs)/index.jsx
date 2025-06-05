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

// Icon and color mapping for dynamic categories
const categoryIconMap = {
  'Mobiles': { icon: 'phone-portrait-outline', color: '#3B82F6', bgColor: '#EBF5FF' },
  'Compare': { icon: 'scale-outline', color: '#10B981', bgColor: '#E6FFF5' },
  'Tech News': { icon: 'newspaper-outline', color: '#8B5CF6', bgColor: '#F5EBFF' },
  'Reviews': { icon: 'star-outline', color: '#F59E0B', bgColor: '#FFFBEB' },
  'Gadgets': { icon: 'headset-outline', color: '#EF4444', bgColor: '#FEECEC' },
  'Software': { icon: 'cube-outline', color: '#6366F1', bgColor: '#EEF2FF' },
  'Games': { icon: 'game-controller-outline', color: '#EC4899', bgColor: '#FDEFF8' },
  'Hardware': { icon: 'build-outline', color: '#06B6D4', bgColor: '#E0F7FA' },
  'How-to': { icon: 'bulb-outline', color: '#F97316', bgColor: '#FFF7ED' },
  'Guides': { icon: 'book-outline', color: '#A855F7', bgColor: '#F3E8FF' },
  'Uncategorized': { icon: 'folder-outline', color: '#6B7280', bgColor: '#F3F4F6' },
};

const index = () => {
  const [latestPosts, setLatestPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryPosts, setCategoryPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // Will store slug
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const LATEST_POSTS_QUERY = `
    query GetLatestPosts {
      posts(first: 5, where: { orderby: { field: DATE, order: DESC } }) {
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

  const CATEGORIES_QUERY = `
    query GetCategories {
      categories(first: 20) {
        nodes {
          name
          slug
        }
      }
    }
  `;

  const POSTS_BY_CATEGORY_QUERY = `
    query GetPostsByCategory($categorySlug: String!) {
      posts(first: 10, where: { categoryName: $categorySlug, orderby: { field: DATE, order: DESC } }) {
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const [latestData, categoriesData] = await Promise.all([
        fetchGraphQL(LATEST_POSTS_QUERY),
        fetchGraphQL(CATEGORIES_QUERY),
      ]);

      if (latestData && latestData.posts && latestData.posts.nodes) {
        setLatestPosts(latestData.posts.nodes);
      }

      if (categoriesData && categoriesData.categories && categoriesData.categories.nodes) {
        const fetchedCategories = categoriesData.categories.nodes;
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0].slug);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const getCategoryPosts = async () => {
      if (!selectedCategory) return;
      setLoading(true);
      setCategoryPosts([]);
      const data = await fetchGraphQL(POSTS_BY_CATEGORY_QUERY, { categorySlug: selectedCategory });
      if (data && data.posts && data.posts.nodes) {
        setCategoryPosts(data.posts.nodes);
      }
      setLoading(false);
    };

    getCategoryPosts();
  }, [selectedCategory]);

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

  if (loading && latestPosts.length === 0 && categories.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading content...</Text>
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>
            Welcome to GizmodoTech!
          </Text>
          <Text style={styles.subtitleText}>
            Your source for the latest tech news, reviews, and comparisons.
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Latest Articles</Text>
          {latestPosts.length > 0 ? (
            <FlatList
              horizontal
              data={latestPosts}
              renderItem={renderPostCard}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSliderContent}
              pagingEnabled
              snapToInterval={width * 0.8 + 20} // Card width + margin
              decelerationRate="fast"
            />
          ) : (
            <Text style={styles.noContentText}>No latest articles found.</Text>
          )}
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsScroll}>
            {categories.map((category) => {
              const iconData = categoryIconMap[category.name] || categoryIconMap['Uncategorized'];
              const isSelected = selectedCategory === category.slug;
              return (
                <TouchableOpacity
                  key={category.slug}
                  style={[
                    styles.categoryTabItem,
                    isSelected && styles.categoryTabItemSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.slug)}
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: iconData.bgColor }]}>
                    <Ionicons name={iconData.icon} size={24} color={iconData.color} />
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

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? categories.find(cat => cat.slug === selectedCategory)?.name : 'Selected'} Posts
          </Text>
          {categoryPosts.length > 0 ? (
            <FlatList
              data={categoryPosts}
              renderItem={renderPostCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoryPostsList}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noContentText}>
              No posts found for "{selectedCategory ? categories.find(cat => cat.slug === selectedCategory)?.name : 'this category'}".
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
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
    fontSize: 16,
    color: '#D9534F',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingLeft: 10,
  },
  horizontalSliderContent: {
    paddingRight: 10,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginRight: 20,
    width: width * 0.8,
    marginBottom: 15,
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
  noContentText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  categoriesSection: {
    marginBottom: 30,
  },
  categoryTabsScroll: {
    paddingVertical: 5,
    paddingRight: 10,
  },
  categoryTabItem: {
    alignItems: 'center',
    marginRight: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
  },
  categoryTabItemSelected: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  categoryIconCircle: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#546A7A',
  },
  categoryTabLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryPostsList: {
    paddingBottom: 20,
  },
});

export default index;
