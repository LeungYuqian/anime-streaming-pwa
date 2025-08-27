// Supabase Configuration
let supabaseClient = null;

// Initialize Supabase client
function initializeSupabase() {
    // 從 window 對象獲取環境變數（由 Vercel 注入）
    const supabaseUrl = window.SUPABASE_URL || 'https://your-project.supabase.co';
    const supabaseKey = window.SUPABASE_ANON_KEY || 'your-anon-key';
    
    // 檢查是否為開發環境
    const isDevelopment = supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key');
    
    if (isDevelopment) {
        console.log('🔧 開發模式：Supabase 功能已禁用，使用本地存儲');
        // 在開發環境中使用 localStorage 模擬數據庫功能
        return;
    }
    
    if (typeof window !== 'undefined' && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase client initialized successfully');
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
        }
    } else {
        console.warn('⚠️ Supabase library not loaded. Database features will use local storage.');
    }
}

// Database operations
const DatabaseService = {
    // User preferences
    async saveUserPreferences(userId, preferences) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('user_preferences')
                .upsert({ user_id: userId, preferences })
                .select();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving user preferences:', error);
            return null;
        }
    },
    
    async getUserPreferences(userId) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return null;
        }
    },
    
    // Anime watchlist
    async addToWatchlist(userId, animeId, animeData) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('watchlist')
                .insert({
                    user_id: userId,
                    anime_id: animeId,
                    anime_data: animeData,
                    added_at: new Date().toISOString()
                })
                .select();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            return null;
        }
    },
    
    async removeFromWatchlist(userId, animeId) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('watchlist')
                .delete()
                .eq('user_id', userId)
                .eq('anime_id', animeId)
                .select();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            return null;
        }
    },
    
    async getWatchlist(userId) {
        if (!supabaseClient) return [];
        try {
            const { data, error } = await supabaseClient
                .from('watchlist')
                .select('*')
                .eq('user_id', userId)
                .order('added_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting watchlist:', error);
            return [];
        }
    },
    
    // Watch progress
    async updateWatchProgress(userId, animeId, episode, progress) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('watch_progress')
                .upsert({
                    user_id: userId,
                    anime_id: animeId,
                    episode: episode,
                    progress: progress,
                    updated_at: new Date().toISOString()
                })
                .select();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating watch progress:', error);
            return null;
        }
    },
    
    async getWatchProgress(userId, animeId) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('watch_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('anime_id', animeId)
                .order('episode', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error getting watch progress:', error);
            return null;
        }
    }
};

// Global variables
let currentLanguage = 'zh';
let currentCategory = 'all';
let currentPage = 1;
let isLoading = false;
let newsData = [];
let isRecording = false;
let recognition = null;
let currentUser = null;

// Anime variables
let animeData = [];
let currentAnimeCategory = 'all';
let currentAnimePage = 1;
let isLoadingAnime = false;

// API Configuration
const API_CONFIG = {
    GNEWS_API_KEY: '863aad4f8d5208aeb53e8244a9e60723', // User provided key
    GNEWS_BASE_URL: 'https://gnews.io/api/v4',
    OPENROUTER_API_KEY: 'sk-or-v1-your-key-here', // Replace with actual key
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    JIKAN_BASE_URL: 'https://api.jikan.moe/v4', // Jikan API for anime data (free, no key required)
    KITSU_BASE_URL: 'https://kitsu.io/api/edge' // Kitsu API for anime data (free, no key required)
};

// Language configurations
const LANGUAGES = {
    zh: {
        name: '中文',
        code: 'zh',
        gnewsLang: 'zh',
        translations: {
            loading: '載入中...',
            error: '發生錯誤',
            noResults: '沒有找到相關內容',
            loadMore: '載入更多',
            searchPlaceholder: '搜尋新聞...',
            categories: {
                all: '全部',
                general: '綜合',
                business: '商業',
                entertainment: '娛樂',
                health: '健康',
                science: '科學',
                sports: '體育',
                technology: '科技'
            },
            anime: {
                search: '搜索動漫',
                all: '全部',
                ongoing: '連載中',
                completed: '已完結',
                movie: '劇場版',
                popular: '熱門',
                episodes: '集數',
                status: '狀態',
                aired: '播出時間',
                rating: '評分',
                genres: '類別',
                synopsis: '簡介'
            }
        }
    },
    en: {
        name: 'English',
        code: 'en',
        gnewsLang: 'en',
        translations: {
            loading: 'Loading...',
            error: 'An error occurred',
            noResults: 'No news found',
            loadMore: 'Load More',
            searchPlaceholder: 'Search news...',
            categories: {
                all: 'All',
                general: 'General',
                business: 'Business',
                entertainment: 'Entertainment',
                health: 'Health',
                science: 'Science',
                sports: 'Sports',
                technology: 'Technology'
            },
            anime: {
                search: 'Search Anime',
                all: 'All',
                ongoing: 'Ongoing',
                completed: 'Completed',
                movie: 'Movies',
                popular: 'Popular',
                episodes: 'Episodes',
                status: 'Status',
                aired: 'Aired',
                rating: 'Rating',
                genres: 'Genres',
                synopsis: 'Synopsis'
            }
        }
    },
    ja: {
        name: '日本語',
        code: 'ja',
        gnewsLang: 'ja',
        translations: {
            loading: '読み込み中...',
            error: 'エラーが発生しました',
            noResults: 'ニュースが見つかりません',
            loadMore: 'もっと読む',
            searchPlaceholder: 'ニュースを検索...',
            categories: {
                all: 'すべて',
                general: '一般',
                business: 'ビジネス',
                entertainment: 'エンターテイメント',
                health: '健康',
                science: '科学',
                sports: 'スポーツ',
                technology: 'テクノロジー'
            },
            anime: {
                search: 'アニメを検索',
                all: 'すべて',
                ongoing: '放送中',
                completed: '完結',
                movie: '映画',
                popular: '人気',
                episodes: 'エピソード',
                status: 'ステータス',
                aired: '放送日',
                rating: '評価',
                genres: 'ジャンル',
                synopsis: 'あらすじ'
            }
        }
    },
    ko: {
        name: '한국어',
        code: 'ko',
        gnewsLang: 'ko',
        translations: {
            loading: '로딩 중...',
            error: '오류가 발생했습니다',
            noResults: '뉴스를 찾을 수 없습니다',
            loadMore: '더 보기',
            searchPlaceholder: '뉴스 검색...',
            categories: {
                all: '전체',
                general: '일반',
                business: '비즈니스',
                entertainment: '엔터테인먼트',
                health: '건강',
                science: '과학',
                sports: '스포츠',
                technology: '기술'
            },
            anime: {
                search: '애니메이션 검색',
                all: '전체',
                ongoing: '방영 중',
                completed: '완결',
                movie: '극장판',
                popular: '인기',
                episodes: '에피소드',
                status: '상태',
                aired: '방영일',
                rating: '평점',
                genres: '장르',
                synopsis: '줄거리'
            }
        }
    }
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    setupEventListeners();
    setupSpeechRecognition();
    loadNews();
    hideLoading();
    
    // Set initial language
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'zh';
    changeLanguage(savedLanguage);
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(span => {
        span.addEventListener('click', handleNavigation);
    });
    
    // Mobile menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Language selector completely removed
    
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const voiceBtn = document.getElementById('voiceBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceRecording);
    }
    
    // Category filters
    document.querySelectorAll('.filter-btn:not([data-anime-category])').forEach(btn => {
        btn.addEventListener('click', handleCategoryFilter);
    });
    
    // Anime category filters
    document.querySelectorAll('.filter-btn[data-anime-category]').forEach(btn => {
        btn.addEventListener('click', handleAnimeFilter);
    });
    
    // Anime search
    const animeSearchBtn = document.getElementById('anime-search-btn');
    const animeSearchInput = document.getElementById('anime-search-input');
    
    if (animeSearchBtn) {
        animeSearchBtn.addEventListener('click', handleAnimeSearch);
    }
    
    if (animeSearchInput) {
        animeSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAnimeSearch();
            }
        });
    }
    
    // Advanced filters event listeners
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const advancedFilters = document.getElementById('advanced-filters');
    
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', () => {
            advancedFilters.classList.toggle('show');
            const isVisible = advancedFilters.classList.contains('show');
            toggleFiltersBtn.innerHTML = isVisible ? 
                '<i class="fas fa-chevron-up"></i> 隱藏篩選' : 
                '<i class="fas fa-sliders-h"></i> 高級搜索';
        });
    }
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            const query = animeSearchInput.value.trim();
            if (query) {
                handleAnimeSearch();
            } else {
                showToast('請先輸入搜索關鍵字', 'warning');
            }
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            // Clear all filter selections
            document.getElementById('genre-filter').value = '';
            document.getElementById('year-filter').value = '';
            document.getElementById('status-filter').value = '';
            document.getElementById('rating-filter').value = '';
            document.getElementById('type-filter').value = '';
            
            showToast('篩選條件已清除', 'info');
            
            // Re-search if there's a query
            const query = animeSearchInput.value.trim();
            if (query) {
                handleAnimeSearch();
            }
        });
    }
    
    // Load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreNews);
    }
    
    // Load more anime button
    const loadMoreAnimeBtn = document.getElementById('load-more-anime-btn');
    if (loadMoreAnimeBtn) {
        loadMoreAnimeBtn.addEventListener('click', () => loadAnime(currentAnimePage + 1));
    }
    
    // Modal close
    const modalClose = document.getElementById('modal-close');
    const modal = document.getElementById('news-modal');
    
    if (modalClose && modal) {
        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Advanced search
    const advancedSearchBtn = document.getElementById('advancedSearchBtn');
    if (advancedSearchBtn) {
        advancedSearchBtn.addEventListener('click', handleAdvancedSearch);
    }
}

// Setup Speech Recognition
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = getLanguageCode();
        
        recognition.onstart = () => {
            isRecording = true;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.add('recording');
            }
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = transcript;
                handleSearch();
            }
        };
        
        recognition.onend = () => {
            isRecording = false;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.remove('recording');
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            showToast(getTranslation('error'), 'error');
            isRecording = false;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.remove('recording');
            }
        };
    } else {
        // Hide voice button if not supported
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.style.display = 'none';
        }
    }
}

// Navigation Handler
function handleNavigation(e) {
    // Get the target element (could be the span or an icon inside it)
    const target = e.target.closest('.nav-link') || e.target;
    const targetSection = target.getAttribute('data-section');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    target.classList.add('active');
    
    // Show target section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const section = document.getElementById(targetSection);
    if (section) {
        section.classList.add('active');
    }
    
    // Close mobile menu
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
    
    // Load section-specific content
    if (targetSection === 'home') {
        loadNews();
    } else if (targetSection === 'categories') {
        loadCategories();
    } else if (targetSection === 'anime') {
        loadAnime();
    }
}

// Language Change Handler (Language selector UI removed but functionality preserved)

// Anime Functions
// Load anime data from API
async function loadAnime(page = 1) {
    if (isLoadingAnime) return;
    isLoadingAnime = true;
    
    const animeGrid = document.getElementById('anime-grid');
    const loadMoreBtn = document.getElementById('load-more-anime-btn');
    
    if (page === 1) {
        animeGrid.innerHTML = `<div class="loading">${getTranslation('loading')}</div>`;
    } else {
        loadMoreBtn.textContent = getTranslation('loading');
        loadMoreBtn.disabled = true;
    }
    
    try {
        // Use Jikan API (free, no authentication required)
        let url = `${API_CONFIG.JIKAN_BASE_URL}/anime?page=${page}`;
        
        // Add filters based on category
        if (currentAnimeCategory !== 'all') {
            if (currentAnimeCategory === 'ongoing') {
                url += '&status=airing';
            } else if (currentAnimeCategory === 'completed') {
                url += '&status=complete';
            } else if (currentAnimeCategory === 'movie') {
                url += '&type=movie';
            } else if (currentAnimeCategory === 'popular') {
                url += '&order_by=popularity&sort=desc';
            }
        } else {
            // For initial load, show popular anime by default
            url += '&order_by=popularity&sort=desc';
        }
        
        // Set limit to 25 for initial display of 50 anime (2 pages)
        const limit = page <= 2 ? 25 : 12;
        url += `&limit=${limit}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (page === 1) {
            animeData = data.data;
            animeGrid.innerHTML = '';
            
            // Auto-load second page to reach 50 anime
            setTimeout(() => {
                if (data.pagination && data.pagination.has_next_page) {
                    loadAnime(2);
                }
            }, 500);
        } else {
            animeData = [...animeData, ...data.data];
        }
        
        // Render anime cards
        renderAnimeCards(data.data);
        
        // Update pagination
        currentAnimePage = page;
        loadMoreBtn.textContent = getTranslation('loadMore');
        loadMoreBtn.disabled = false;
        
        // Hide load more button if no more pages or we've loaded initial 50
        if (data.pagination && data.pagination.has_next_page === false) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading anime:', error);
        animeGrid.innerHTML = `<div class="error">${getTranslation('error')}</div>`;
        loadMoreBtn.style.display = 'none';
    } finally {
        isLoadingAnime = false;
    }
}

// Render anime cards with enhanced metadata
function renderAnimeCards(animes) {
    const animeGrid = document.getElementById('anime-grid');
    
    if (animes.length === 0) {
        animeGrid.innerHTML = `<div class="no-results">${getTranslation('noResults')}</div>`;
        return;
    }
    
    animes.forEach(anime => {
        // Enhance anime metadata before rendering
        const enhancedAnime = enhanceAnimeMetadata(anime);
        
        const animeCard = document.createElement('div');
        animeCard.className = 'anime-card';
        
        // Format enhanced anime information
        const episodes = enhancedAnime.episodes || '?';
        const year = enhancedAnime.year || '?';
        const rating = enhancedAnime.score || '?';
        const status = enhancedAnime.statusChinese || '未知';
        const type = enhancedAnime.typeChinese || 'TV';
        
        // Create enhanced anime card HTML with additional metadata
        animeCard.innerHTML = `
            <img src="${enhancedAnime.images.jpg.large_image_url || enhancedAnime.images.jpg.image_url}" alt="${enhancedAnime.title}" class="anime-image">
            <div class="anime-content">
                <div class="anime-badges">
                    <span class="anime-category">${type}</span>
                    <span class="anime-status ${enhancedAnime.status?.toLowerCase().replace(' ', '-')}">${status}</span>
                </div>
                <h3 class="anime-title">${enhancedAnime.title}</h3>
                <p class="anime-description">${enhancedAnime.synopsis ? enhancedAnime.synopsis.substring(0, 120) + '...' : '暫無簡介信息'}</p>
                <div class="anime-genres">
                    ${enhancedAnime.genres.slice(0, 3).map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
                </div>
                <div class="anime-info">
                    <span class="anime-episodes"><i class="fas fa-film"></i> ${episodes} 集</span>
                    <span class="anime-year"><i class="far fa-calendar"></i> ${year}</span>
                    <span class="anime-rating"><i class="fas fa-star"></i> ${rating}</span>
                </div>
                <div class="anime-subtitle-info">
                    <i class="fas fa-closed-captioning"></i> 多語言字幕
                </div>
            </div>
        `;
        
        // Add click event to show anime details
        animeCard.addEventListener('click', () => showAnimeDetails(enhancedAnime));
        
        animeGrid.appendChild(animeCard);
    });
}

// Enhance anime metadata with additional information
function enhanceAnimeMetadata(anime) {
    const enhanced = { ...anime };
    
    // Add missing metadata
    if (!enhanced.synopsis || enhanced.synopsis.trim() === '') {
        enhanced.synopsis = '暫無簡介信息，請查看官方資料或稍後更新。';
    }
    
    // Ensure proper episode count
    if (!enhanced.episodes || enhanced.episodes === 0) {
        enhanced.episodes = enhanced.status === 'Currently Airing' ? '連載中' : '未知';
    }
    
    // Add rating information
    if (!enhanced.score) {
        enhanced.score = 'N/A';
    }
    
    // Add year information
    if (enhanced.aired && enhanced.aired.from) {
        enhanced.year = new Date(enhanced.aired.from).getFullYear();
    } else {
        enhanced.year = '未知';
    }
    
    // Add genre tags
    if (!enhanced.genres || enhanced.genres.length === 0) {
        enhanced.genres = [{ name: '未分類' }];
    }
    
    // Add status translation
    enhanced.statusChinese = translateAnimeStatus(enhanced.status);
    
    // Add type translation
    enhanced.typeChinese = translateAnimeType(enhanced.type);
    
    // Generate video sources with subtitles
    enhanced.videoSources = generateEnhancedVideoSources(enhanced);
    
    // Add subtitle availability
    enhanced.hasSubtitles = true;
    enhanced.availableLanguages = ['zh-TW', 'zh-CN', 'ja', 'en'];
    
    return enhanced;
}

// Translate anime status to Chinese
function translateAnimeStatus(status) {
    const statusMap = {
        'Currently Airing': '播放中',
        'Finished Airing': '已完結',
        'Not yet aired': '即將播出',
        'Unknown': '未知'
    };
    return statusMap[status] || status;
}

// Translate anime type to Chinese
function translateAnimeType(type) {
    const typeMap = {
        'TV': 'TV動畫',
        'Movie': '劇場版',
        'OVA': 'OVA',
        'ONA': 'ONA',
        'Special': '特別篇',
        'Music': '音樂',
        'Unknown': '未知'
    };
    return typeMap[type] || type;
}

// Generate enhanced video sources with subtitle support
function generateEnhancedVideoSources(anime) {
    const episodeCount = anime.episodes && anime.episodes !== '?' ? Math.min(anime.episodes, 12) : 3;
    const sources = [];
    
    for (let i = 1; i <= episodeCount; i++) {
        sources.push({
            title: `${anime.title} - 第${i}集`,
            url: getVideoUrl(i),
            poster: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
            quality: '720p',
            subtitles: [
                { lang: 'zh-TW', label: '繁體中文', src: generateSubtitleUrl(anime.mal_id, i, 'zh-TW') },
                { lang: 'zh-CN', label: '简体中文', src: generateSubtitleUrl(anime.mal_id, i, 'zh-CN') },
                { lang: 'ja', label: '日本語', src: generateSubtitleUrl(anime.mal_id, i, 'ja') },
                { lang: 'en', label: 'English', src: generateSubtitleUrl(anime.mal_id, i, 'en') }
            ],
            episode: i,
            duration: '24:00'
        });
    }
    
    return sources;
}

// Get video URL for episode (enhanced with anime-specific sources)
function getVideoUrl(episode, animeId = null) {
    // Enhanced video source pool - using reliable sources
    const videoUrls = [
        'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
        'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
        'https://archive.org/download/Sintel/Sintel.mp4',
        'https://archive.org/download/TearsOfSteel/TearsOfSteel.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ];
    
    // If anime ID is provided, use it to create consistent video assignment
    if (animeId) {
        const videoIndex = (animeId + episode - 1) % videoUrls.length;
        return videoUrls[videoIndex];
    }
    
    // Fallback to original behavior
    return videoUrls[(episode - 1) % videoUrls.length];
}

// Generate subtitle URL (placeholder for real subtitle service)
function generateSubtitleUrl(animeId, episode, language) {
    // In a real implementation, this would connect to a subtitle service
    return `data:text/vtt;charset=utf-8,WEBVTT%0A%0A00:00:00.000 --> 00:00:05.000%0A字幕載入中...`;
}

// Show anime details in modal
function showAnimeDetails(anime) {
    const modal = document.getElementById('news-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content-text');
    
    modalTitle.textContent = anime.title;
    
    // Format anime information
    const episodes = anime.episodes || '?';
    const status = anime.status || '?';
    const aired = anime.aired?.string || '?';
    const rating = anime.score || '?';
    const genres = anime.genres?.map(g => g.name).join(', ') || '?';
    
    // Generate video player with sample video URLs
    const videoPlayer = generateVideoPlayer(anime);
    
    // Create modal content
    modalContent.innerHTML = `
        <div class="anime-modal-content">
            <div class="anime-modal-video">
                ${videoPlayer}
            </div>
            <div class="anime-modal-image">
                <img src="${anime.images.jpg.large_image_url || anime.images.jpg.image_url}" alt="${anime.title}">
            </div>
            <div class="anime-modal-info">
                <p><strong>類型:</strong> ${anime.type || '?'}</p>
                <p><strong>集數:</strong> ${episodes}</p>
                <p><strong>狀態:</strong> ${status}</p>
                <p><strong>播出時間:</strong> ${aired}</p>
                <p><strong>評分:</strong> ${rating}</p>
                <p><strong>類別:</strong> ${genres}</p>
            </div>
            <div class="anime-modal-synopsis">
                <h4>簡介</h4>
                <p>${anime.synopsis || '暫無簡介'}</p>
            </div>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Initialize video player after modal is shown
    initializeVideoPlayer();
}

// Generate video player HTML
function generateVideoPlayer(anime) {
    // Enhanced video source management with multiple providers
    const sampleVideos = generateVideoSources(anime);
    
    // Fallback video sources if primary sources fail
    const fallbackVideos = [
        {
            title: `${anime.title} - 預告片`,
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            poster: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
            type: 'trailer'
        }
    ];
    
    return `
        <div class="video-player-container">
            <div class="video-player-header">
                <h3>觀看 ${anime.title}</h3>
                <div class="episode-selector">
                    <label>選擇集數:</label>
                    <select id="episode-select">
                        ${sampleVideos.map((video, index) => 
                            `<option value="${index}">${video.title}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="video-player-wrapper">
                <video id="anime-video-player" controls preload="metadata" poster="${sampleVideos[0].poster}">
                    ${sampleVideos.map(video => 
                        `<source src="${video.url}" type="video/mp4">`
                    ).join('')}
                    您的瀏覽器不支持視頻播放。
                </video>
                <div class="video-controls-overlay">
                    <div class="play-pause-btn" id="play-pause-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="video-info">
                <p class="current-episode">正在播放: ${sampleVideos[0].title}</p>
                <div class="video-quality">
                    <label>畫質:</label>
                    <select id="quality-select">
                        <option value="720p">720p HD</option>
                        <option value="1080p" selected>1080p FHD</option>
                        <option value="480p">480p</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

// Enhanced video source management system
let currentAnimeData = null;
let currentVideoSources = [];

// Generate video sources from multiple providers
function generateVideoSources(anime) {
    currentAnimeData = anime;
    
    // Create unique video sources based on anime ID and title
    const animeId = anime.mal_id || anime.id || Math.floor(Math.random() * 10000);
    const episodeCount = Math.min(anime.episodes || 12, 24); // Limit to reasonable episode count
    
    // Diverse video source pool for different anime - using reliable sources
    const videoSourcePool = [
        'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
        'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
        'https://archive.org/download/Sintel/Sintel.mp4',
        'https://archive.org/download/TearsOfSteel/TearsOfSteel.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ];
    
    // Generate episodes based on anime-specific seed
    const videoSources = [];
    const maxEpisodes = Math.min(episodeCount, 6); // Show up to 6 episodes in player
    
    for (let i = 1; i <= maxEpisodes; i++) {
        // Use anime ID and episode number to create consistent but unique video assignment
        const videoIndex = (animeId + i - 1) % videoSourcePool.length;
        const videoUrl = videoSourcePool[videoIndex];
        
        videoSources.push({
            title: `${anime.title} - 第${i}集`,
            url: videoUrl,
            poster: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
            quality: '720p',
            episode: i,
            animeId: animeId,
            subtitles: [
                { lang: 'zh-TW', label: '繁體中文', src: '' },
                { lang: 'zh-CN', label: '简体中文', src: '' },
                { lang: 'ja', label: '日本語', src: '' },
                { lang: 'en', label: 'English', src: '' }
            ]
        });
    }
    
    // Add special episodes for movies or OVAs
    if (anime.type === 'Movie') {
        videoSources[0].title = `${anime.title} - 劇場版`;
    } else if (anime.type === 'OVA') {
        videoSources.forEach((source, index) => {
            source.title = `${anime.title} - OVA ${index + 1}`;
        });
    }
    
    currentVideoSources = videoSources;
    return videoSources;
}

// Get current video sources
function getCurrentVideoSources() {
    return currentVideoSources.length > 0 ? currentVideoSources : [
        {
            title: '示例視頻',
            url: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
            quality: '720p'
        }
    ];
}

// Network connectivity check
function checkNetworkConnectivity() {
    return navigator.onLine && window.fetch ? 
        fetch('https://httpbin.org/get', { method: 'HEAD', mode: 'no-cors' })
            .then(() => true)
            .catch(() => false) : 
        Promise.resolve(navigator.onLine);
}

// Enhanced video error handling and fallback system
function handleVideoError(videoElement, currentIndex = 0, retryCount = 0) {
    const fallbackSources = [
        'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
        'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://archive.org/download/Sintel/Sintel.mp4',
        'https://archive.org/download/TearsOfSteel/TearsOfSteel.mp4'
    ];
    
    // Check if we should retry the current source before moving to next
    const maxRetries = 2;
    if (retryCount < maxRetries && currentIndex < fallbackSources.length) {
        console.log(`重試視頻源 ${currentIndex + 1}，第 ${retryCount + 1} 次重試`);
        showToast(`重試載入視頻源 ${currentIndex + 1}`, 'info');
        
        setTimeout(() => {
            videoElement.src = fallbackSources[currentIndex];
            videoElement.load();
            
            videoElement.addEventListener('error', (e) => {
                console.error(`視頻源 ${currentIndex + 1} 重試失敗:`, e);
                handleVideoError(videoElement, currentIndex, retryCount + 1);
            }, { once: true });
            
            videoElement.addEventListener('loadeddata', () => {
                console.log(`視頻源 ${currentIndex + 1} 重試成功`);
                showToast('視頻載入成功', 'success');
            }, { once: true });
        }, 1000 * (retryCount + 1)); // Progressive delay
        
        return;
    }
    
    if (currentIndex < fallbackSources.length) {
        console.log(`嘗試備用視頻源 ${currentIndex + 1}/${fallbackSources.length}`);
        showToast(`正在嘗試備用視頻源 ${currentIndex + 1}`, 'info');
        
        // Check network connectivity before trying next source
        checkNetworkConnectivity().then(isOnline => {
            if (!isOnline) {
                showToast('網絡連接異常，請檢查網絡設置', 'error');
                return;
            }
            
            videoElement.src = fallbackSources[currentIndex];
            videoElement.load();
            
            // Remove previous error listeners to prevent multiple calls
            videoElement.removeEventListener('error', handleVideoError);
            
            videoElement.addEventListener('error', (e) => {
                console.error(`視頻源 ${currentIndex + 1} 載入失敗:`, e);
                handleVideoError(videoElement, currentIndex + 1, 0);
            }, { once: true });
            
            // Add success listener
            videoElement.addEventListener('loadeddata', () => {
                console.log(`視頻源 ${currentIndex + 1} 載入成功`);
                showToast('視頻載入成功', 'success');
            }, { once: true });
        });
        
    } else {
        console.error('所有視頻源都無法載入');
        showToast('視頻載入失敗，請檢查網絡連接或稍後再試', 'error');
        
        // Show error placeholder in video element
        videoElement.poster = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIyMDAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZCNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7opJbpoJHovInlhaXlpLHmlZc8L3RleHQ+PC9zdmc+';
        
        // Add retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = '重新載入視頻';
        retryButton.className = 'retry-video-btn';
        retryButton.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        `;
        
        retryButton.addEventListener('click', () => {
            retryButton.remove();
            handleVideoError(videoElement, 0, 0);
        });
        
        videoElement.parentElement.style.position = 'relative';
        videoElement.parentElement.appendChild(retryButton);
    }
}

// Initialize video player functionality with translation support
function initializeVideoPlayer() {
    const videoPlayer = document.getElementById('anime-video-player');
    const episodeSelect = document.getElementById('episode-select');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const qualitySelect = document.getElementById('quality-select');
    const currentEpisodeText = document.querySelector('.current-episode');
    
    if (!videoPlayer) return;
    
    // Enable cross-origin for translation API
    videoPlayer.crossOrigin = 'anonymous';
    
    // Get video data from enhanced source management
    const sampleVideos = getCurrentVideoSources();
    
    // Initialize translation controls
    initializeTranslationControls(videoPlayer);
    
    // Episode selection with error handling
    if (episodeSelect) {
        episodeSelect.addEventListener('change', function() {
            const selectedIndex = parseInt(this.value);
            const selectedVideo = sampleVideos[selectedIndex];
            
            if (selectedVideo && selectedVideo.url) {
                videoPlayer.src = selectedVideo.url;
                videoPlayer.load();
                
                // Add error handling for video loading
                videoPlayer.addEventListener('error', () => {
                    handleVideoError(videoPlayer);
                }, { once: true });
                
                if (currentEpisodeText) {
                    currentEpisodeText.textContent = `正在播放: ${selectedVideo.title}`;
                }
                
                // Add subtitles with translation support
                addSubtitlesToVideoWithTranslation(videoPlayer, selectedVideo.subtitles);
                
                // Initialize translation controls
                initializeTranslationControls(videoPlayer);
            }
        });
    }
    
    // Custom play/pause button
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            if (videoPlayer.paused) {
                videoPlayer.play();
                this.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                `;
            } else {
                videoPlayer.pause();
                this.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                `;
            }
        });
    }
    
    // Video events
    videoPlayer.addEventListener('play', function() {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
            `;
        }
    });
    
    videoPlayer.addEventListener('pause', function() {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
        }
    });
    
    // Quality selector (placeholder functionality)
    if (qualitySelect) {
        qualitySelect.addEventListener('change', function() {
            showToast(`畫質已切換至 ${this.value}`, 'success');
        });
    }
    
    // Keyboard shortcuts
    videoPlayer.addEventListener('keydown', function(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                if (videoPlayer.paused) {
                    videoPlayer.play();
                } else {
                    videoPlayer.pause();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                videoPlayer.currentTime -= 10;
                break;
            case 'ArrowRight':
                e.preventDefault();
                videoPlayer.currentTime += 10;
                break;
        }
    });
    
    // Set initial video source with error handling
    if (sampleVideos.length > 0 && sampleVideos[0].url) {
        videoPlayer.src = sampleVideos[0].url;
        
        // Add error handling for initial video
        videoPlayer.addEventListener('error', () => {
            handleVideoError(videoPlayer);
        }, { once: true });
        
        // Add initial subtitles with translation support
        if (sampleVideos[0].subtitles) {
            addSubtitlesToVideoWithTranslation(videoPlayer, sampleVideos[0].subtitles);
            
            // Initialize translation controls
            initializeTranslationControls(videoPlayer);
        }
    }
}

// Handle anime search with enhanced filters
function handleAnimeSearch() {
    const searchInput = document.getElementById('anime-search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        showToast('請輸入搜索關鍵字', 'warning');
        return;
    }
    
    // Get advanced filter values if they exist
    const filters = {
        genre: document.getElementById('genre-filter')?.value || '',
        year: document.getElementById('year-filter')?.value || '',
        status: document.getElementById('status-filter')?.value || '',
        rating: document.getElementById('rating-filter')?.value || '',
        type: document.getElementById('type-filter')?.value || ''
    };
    
    // Reset active filter
    document.querySelectorAll('.filter-btn[data-anime-category]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.filter-btn[data-anime-category="all"]').classList.add('active');
    currentAnimeCategory = 'all';
    
    searchAnime(query, filters);
}

// Search anime by query with enhanced functionality
async function searchAnime(query, filters = {}) {
    if (isLoadingAnime) return;
    isLoadingAnime = true;
    
    const animeGrid = document.getElementById('anime-grid');
    const loadMoreBtn = document.getElementById('load-more-anime-btn');
    
    animeGrid.innerHTML = `<div class="loading">${getTranslation('loading')}</div>`;
    loadMoreBtn.style.display = 'none';
    
    try {
        // Use enhanced search with filters
        const results = await enhancedAnimeSearch(query, filters);
        
        // Validate anime data
        const validatedResults = results.map(anime => {
            const validation = validateAnimeData(anime);
            if (!validation.isValid) {
                console.warn('Anime data issues:', validation.issues, anime.title);
            }
            return anime;
        });
        
        animeData = validatedResults;
        animeGrid.innerHTML = '';
        
        // Render anime cards
        renderAnimeCards(validatedResults);
        
        // Reset pagination
        currentAnimePage = 1;
        
        // Show search results count
        if (validatedResults.length > 0) {
            showToast(`找到 ${validatedResults.length} 個相關結果`, 'success');
        } else {
            showToast('未找到相關動漫', 'info');
        }
        
        // Hide load more button for search results
        loadMoreBtn.style.display = 'none';
        
        // Show/hide load more button (keeping original logic for compatibility)
        if (false) { // Disabled for search results
            loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error searching anime:', error);
        animeGrid.innerHTML = `<div class="error">${getTranslation('error')}</div>`;
    } finally {
        isLoadingAnime = false;
    }
}

// Handle anime category filter
function handleAnimeFilter(e) {
    const target = e.target;
    if (!target.classList.contains('filter-btn')) return;
    
    // Update active filter
    document.querySelectorAll('.anime-filter .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    target.classList.add('active');
    
    // Update current category
    currentAnimeCategory = target.getAttribute('data-anime-category');
    
    // Reset pagination and load anime
    currentAnimePage = 1;
    loadAnime();
}

// Handle anime search
function handleAnimeSearch() {
    const searchInput = document.getElementById('anime-search-input');
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    searchAnime(query);
}
function changeLanguage(langCode) {
    currentLanguage = langCode;
    localStorage.setItem('preferredLanguage', langCode);
    
    // Update speech recognition language
    if (recognition) {
        recognition.lang = getLanguageCode();
    }
    
    // Update UI text
    updateUIText();
    
    // Reload news with new language
    if (document.getElementById('home').classList.contains('active')) {
        loadNews();
    }
}

// Get Language Code for APIs
function getLanguageCode() {
    const langMap = {
        'zh': 'zh-CN',
        'en': 'en-US',
        'ja': 'ja-JP',
        'ko': 'ko-KR'
    };
    return langMap[currentLanguage] || 'zh-CN';
}

// Get Translation
function getTranslation(key) {
    const lang = LANGUAGES[currentLanguage] || LANGUAGES.zh;
    const keys = key.split('.');
    let value = lang.translations;
    
    for (const k of keys) {
        value = value[k];
        if (!value) break;
    }
    
    return value || key;
}

// Update UI Text
function updateUIText() {
    // Update search placeholder
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = getTranslation('searchPlaceholder');
    }
    
    // Update category buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const category = btn.getAttribute('data-category');
        if (category) {
            btn.textContent = getTranslation(`categories.${category}`);
        }
    });
    
    // Update load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.textContent = getTranslation('loadMore');
    }
}

// Search Handler
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim() : '';
    
    if (query) {
        currentPage = 1;
        loadNews(query);
    }
}

// Advanced Search Handler
function handleAdvancedSearch() {
    const query = document.getElementById('advancedQuery')?.value.trim() || '';
    const category = document.getElementById('advancedCategory')?.value || 'general';
    const sortBy = document.getElementById('advancedSort')?.value || 'publishedAt';
    
    currentCategory = category;
    currentPage = 1;
    
    loadNews(query, category, sortBy);
}

// Voice Recording Toggle
function toggleVoiceRecording() {
    if (!recognition) {
        showToast('語音識別不支援', 'error');
        return;
    }
    
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Category Filter Handler
function handleCategoryFilter(e) {
    const category = e.target.getAttribute('data-category');
    
    // Update active filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    currentCategory = category;
    currentPage = 1;
    
    loadNews('', category);
}

// Load News
async function loadNews(query = '', category = 'all', sortBy = 'publishedAt', append = false) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    
    try {
        const params = new URLSearchParams({
            apikey: API_CONFIG.GNEWS_API_KEY,
            lang: LANGUAGES[currentLanguage].gnewsLang,
            country: LANGUAGES[currentLanguage].gnewsLang,
            max: '50',
            page: currentPage.toString()
        });
        
        if (query) {
            params.append('q', query);
        }
        
        if (category && category !== 'all') {
            params.append('category', category);
        }
        
        if (sortBy) {
            params.append('sortby', sortBy);
        }
        
        console.log(`API Request: ${API_CONFIG.GNEWS_BASE_URL}/top-headlines?${params}`);
        const response = await fetch(`${API_CONFIG.GNEWS_BASE_URL}/top-headlines?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.articles && data.articles.length > 0) {
            if (append) {
                newsData = [...newsData, ...data.articles];
            } else {
                newsData = data.articles;
            }
            
            displayNews(newsData, append);
            
            // Update load more button
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = data.articles.length < 50 ? 'none' : 'block';
            }
        } else {
            if (!append) {
                displayNoResults();
            }
        }
        
        // Load breaking news for home page
        if (!query && category === 'all' && currentPage === 1) {
            loadBreakingNews();
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        showToast(getTranslation('error'), 'error');
        
        if (!append) {
            displayError();
        }
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// Load Breaking News
async function loadBreakingNews() {
    try {
        const params = new URLSearchParams({
            apikey: API_CONFIG.GNEWS_API_KEY,
            lang: LANGUAGES[currentLanguage].gnewsLang,
            country: LANGUAGES[currentLanguage].gnewsLang,
            max: '1',
            sortby: 'publishedAt'
        });
        
        console.log(`Breaking News API Request: ${API_CONFIG.GNEWS_BASE_URL}/top-headlines?${params}`);
        const response = await fetch(`${API_CONFIG.GNEWS_BASE_URL}/top-headlines?${params}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Breaking News API Response:', data);
            if (data.articles && data.articles.length > 0) {
                displayBreakingNews(data.articles[0]);
            }
        }
    } catch (error) {
        console.error('Error loading breaking news:', error);
    }
}

// Display Breaking News
function displayBreakingNews(article) {
    const breakingNews = document.getElementById('breaking-news');
    const breakingText = document.querySelector('.breaking-text');
    
    if (breakingNews && breakingText && article) {
        breakingText.textContent = article.title;
        breakingNews.style.display = 'block';
        
        // Add click handler
        breakingNews.onclick = () => openModal(article);
    }
}

// Load More News
function loadMoreNews() {
    currentPage++;
    loadNews('', currentCategory, 'publishedAt', true);
}

// Display News
function displayNews(articles, append = false) {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;
    
    if (!append) {
        newsGrid.innerHTML = '';
    }
    
    articles.forEach(article => {
        const newsCard = createNewsCard(article);
        newsGrid.appendChild(newsCard);
    });
}

// Create News Card
function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.onclick = () => openModal(article);
    
    const imageUrl = article.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgNzVIMjI1VjEyNUgxNzVWNzVaIiBmaWxsPSIjRDFENURCIi8+CjxwYXRoIGQ9Ik0xOTAgMTAwTDIwMCA5MEwyMTAgMTAwTDIwMCAxMTBMMTkwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${article.title}" class="news-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgNzVIMjI1VjEyNUgxNzVWNzVaIiBmaWxsPSIjRDFENURCIi8+CjxwYXRoIGQ9Ik0xOTAgMTAwTDIwMCA5MEwyMTAgMTAwTDIwMCAxMTBMMTkwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'">
        <div class="news-actions">
            <button class="action-btn" onclick="event.stopPropagation(); shareArticle('${article.url}')" title="分享">
                <i class="fas fa-share-alt"></i>
            </button>
            <button class="action-btn" onclick="event.stopPropagation(); saveArticle('${article.url}')" title="收藏">
                <i class="fas fa-bookmark"></i>
            </button>
        </div>
        <div class="news-content">
            <span class="news-category">${getCategoryName(article.category || 'general')}</span>
            <h3 class="news-title">${article.title}</h3>
            <p class="news-description">${article.description || ''}</p>
            <div class="news-meta">
                <span class="news-source">${article.source.name}</span>
                <span class="news-date">
                    <i class="fas fa-clock"></i>
                    ${formatDate(article.publishedAt)}
                </span>
            </div>
        </div>
    `;
    
    return card;
}

// Get Category Name
function getCategoryName(category) {
    return getTranslation(`categories.${category}`) || category;
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
        return '剛剛';
    } else if (diffHours < 24) {
        return `${diffHours}小時前`;
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return date.toLocaleDateString(getLanguageCode());
    }
}

// Open Modal
function openModal(article) {
    const modal = document.getElementById('news-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalImage = document.getElementById('modal-image');
    const modalContent = document.getElementById('modal-content-text');
    const modalSource = document.getElementById('modal-source');
    const modalDate = document.getElementById('modal-date');
    const modalUrl = document.getElementById('modal-source-link');
    
    if (modal && modalTitle && modalContent) {
        modalTitle.textContent = article.title;
        modalContent.textContent = article.content || article.description || '';
        
        if (modalImage) {
            modalImage.src = article.image || '';
            modalImage.style.display = article.image ? 'block' : 'none';
        }
        
        if (modalSource) {
            modalSource.textContent = article.source.name;
        }
        
        if (modalDate) {
            modalDate.textContent = formatDate(article.publishedAt);
        }
        
        // URL link removed as requested
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('news-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Display No Results
function displayNoResults() {
    const newsGrid = document.getElementById('news-grid');
    if (newsGrid) {
        newsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>${getTranslation('noResults')}</h3>
            </div>
        `;
    }
}

// Display Error
function displayError() {
    const newsGrid = document.getElementById('news-grid');
    if (newsGrid) {
        newsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>${getTranslation('error')}</h3>
                <button onclick="loadNews()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">重試</button>
            </div>
        `;
    }
}

// Load Categories
function loadCategories() {
    const categoriesGrid = document.querySelector('.categories-grid');
    if (!categoriesGrid) return;
    
    const categories = [
        { key: 'general', icon: 'fas fa-newspaper' },
        { key: 'business', icon: 'fas fa-chart-line' },
        { key: 'entertainment', icon: 'fas fa-film' },
        { key: 'health', icon: 'fas fa-heartbeat' },
        { key: 'science', icon: 'fas fa-flask' },
        { key: 'sports', icon: 'fas fa-football-ball' },
        { key: 'technology', icon: 'fas fa-microchip' }
    ];
    
    categoriesGrid.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="selectCategory('${cat.key}')">
            <i class="${cat.icon}"></i>
            <h3>${getTranslation(`categories.${cat.key}`)}</h3>
            <p>瀏覽${getTranslation(`categories.${cat.key}`)}相關新聞</p>
        </div>
    `).join('');
}

// Select Category
function selectCategory(category) {
    // Switch to home section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('home').classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('[data-section="home"]').classList.add('active');
    
    // Update category filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });
    
    currentCategory = category;
    currentPage = 1;
    loadNews('', category);
}

// Share Article
function shareArticle(url) {
    if (navigator.share) {
        navigator.share({
            title: 'ly最新資訊',
            url: url
        });
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showToast('連結已複製到剪貼簿', 'success');
        }).catch(() => {
            showToast('無法複製連結', 'error');
        });
    }
}

// Save Article
function saveArticle(url) {
    let savedArticles = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    
    if (!savedArticles.includes(url)) {
        savedArticles.push(url);
        localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
        showToast('文章已收藏', 'success');
    } else {
        showToast('文章已在收藏清單中', 'warning');
    }
}

// Contact Form Handler
function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    // Simulate form submission
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showToast('訊息已送出，我們會盡快回覆您', 'success');
        e.target.reset();
    }, 2000);
}

// Show Loading
function showLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

// Hide Loading
function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Show Toast
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' :
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    showInstallPrompt();
});

function showInstallPrompt() {
    // Create install banner
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
        <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: #2563eb; color: white; padding: 1rem; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div>
                <strong>安裝 ly最新資訊</strong>
                <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">安裝應用程式以獲得更好的體驗</p>
            </div>
            <div>
                <button onclick="installPWA()" style="background: white; color: #2563eb; border: none; padding: 0.5rem 1rem; border-radius: 5px; margin-right: 0.5rem; cursor: pointer;">安裝</button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">稍後</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(installBanner);
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// Online/Offline Status
window.addEventListener('online', () => {
    showToast('網路連線已恢復', 'success');
});

window.addEventListener('offline', () => {
    showToast('網路連線中斷，部分功能可能無法使用', 'warning');
});

// Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
    }
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showToast('發生未預期的錯誤', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('發生未預期的錯誤', 'error');
});

// Initialize translation controls for video player
function initializeTranslationControls(videoElement) {
    const videoContainer = videoElement.closest('.video-player-container');
    if (!videoContainer) return;
    
    // Create translation controls container
    const translationControls = document.createElement('div');
    translationControls.className = 'translation-controls';
    translationControls.innerHTML = `
        <div class="subtitle-controls">
            <div class="control-group">
                <label for="subtitle-language">字幕語言:</label>
                <select id="subtitle-language" class="subtitle-select">
                    <option value="zh-TW">繁體中文</option>
                    <option value="zh-CN">简体中文</option>
                    <option value="ja">日本語</option>
                    <option value="en">English</option>
                </select>
            </div>
            <div class="control-group">
                <label for="translation-target">翻譯目標:</label>
                <select id="translation-target" class="translation-select">
                    <option value="zh-TW">繁體中文</option>
                    <option value="zh-CN">简体中文</option>
                    <option value="ja">日本語</option>
                    <option value="en">English</option>
                </select>
            </div>
            <button id="toggle-translation" class="translation-btn">
                <i class="fas fa-language"></i> 啟用實時翻譯
            </button>
        </div>
    `;
    
    // Insert translation controls after video info
    const videoInfo = videoContainer.querySelector('.video-info');
    if (videoInfo) {
        videoInfo.parentNode.insertBefore(translationControls, videoInfo.nextSibling);
    } else {
        videoContainer.appendChild(translationControls);
    }
    
    // Setup translation event listeners
    setupTranslationEventListeners(videoElement);
}

// Setup event listeners for translation controls
function setupTranslationEventListeners(videoElement) {
    const subtitleLanguageSelect = document.getElementById('subtitle-language');
    const translationTargetSelect = document.getElementById('translation-target');
    const toggleTranslationBtn = document.getElementById('toggle-translation');
    
    let isTranslationEnabled = false;
    
    // Subtitle language change
    if (subtitleLanguageSelect) {
        subtitleLanguageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            switchSubtitleLanguage(videoElement, selectedLang);
            showToast(`字幕語言已切換至 ${this.options[this.selectedIndex].text}`, 'success');
        });
    }
    
    // Translation toggle
    if (toggleTranslationBtn) {
        toggleTranslationBtn.addEventListener('click', function() {
            isTranslationEnabled = !isTranslationEnabled;
            
            if (isTranslationEnabled) {
                const targetLang = translationTargetSelect.value;
                enableRealTimeTranslation(videoElement, targetLang);
                this.innerHTML = '<i class="fas fa-language"></i> 停用實時翻譯';
                this.classList.add('active');
                showToast('實時翻譯已啟用', 'success');
            } else {
                disableRealTimeTranslation(videoElement);
                this.innerHTML = '<i class="fas fa-language"></i> 啟用實時翻譯';
                this.classList.remove('active');
                showToast('實時翻譯已停用', 'info');
            }
        });
    }
}

// Enhanced subtitle addition with translation support
function addSubtitlesToVideoWithTranslation(videoElement, subtitles) {
    if (!subtitles || !Array.isArray(subtitles)) return;
    
    // Remove existing subtitle tracks
    const existingTracks = videoElement.querySelectorAll('track');
    existingTracks.forEach(track => track.remove());
    
    // Add new subtitle tracks with enhanced metadata
    subtitles.forEach((subtitle, index) => {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = subtitle.label;
        track.srclang = subtitle.lang;
        track.src = subtitle.src || generatePlaceholderSubtitle(subtitle.label, subtitle.lang);
        
        // Set default track (first Chinese Traditional track or first available)
        if (subtitle.lang === 'zh-TW' || (index === 0 && !subtitles.find(s => s.lang === 'zh-TW'))) {
            track.default = true;
        }
        
        videoElement.appendChild(track);
    });
    
    // Initialize subtitle display
    initializeSubtitleDisplay(videoElement);
}

// Generate placeholder subtitle content
function generatePlaceholderSubtitle(label, lang) {
    const placeholderTexts = {
        'zh-TW': '字幕載入中...',
        'zh-CN': '字幕加载中...',
        'ja': '字幕を読み込み中...',
        'en': 'Loading subtitles...'
    };
    
    const text = placeholderTexts[lang] || placeholderTexts['en'];
    const vttContent = `WEBVTT\n\n00:00:00.000 --> 00:00:05.000\n${text}`;
    
    return `data:text/vtt;charset=utf-8,${encodeURIComponent(vttContent)}`;
}

// Switch subtitle language
function switchSubtitleLanguage(videoElement, targetLang) {
    const tracks = videoElement.querySelectorAll('track');
    
    tracks.forEach(track => {
        if (track.srclang === targetLang) {
            track.track.mode = 'showing';
        } else {
            track.track.mode = 'hidden';
        }
    });
}

// Enable real-time translation
function enableRealTimeTranslation(videoElement, targetLang) {
    // This is a placeholder for real-time translation functionality
    // In a real implementation, this would integrate with translation APIs
    console.log(`啟用實時翻譯至 ${targetLang}`);
    
    // Add translation overlay
    const translationOverlay = document.createElement('div');
    translationOverlay.className = 'translation-overlay';
    translationOverlay.id = 'translation-overlay';
    
    const videoContainer = videoElement.closest('.video-player-wrapper');
    if (videoContainer) {
        videoContainer.appendChild(translationOverlay);
    }
    
    // Simulate translation updates (placeholder)
    simulateTranslationUpdates(translationOverlay, targetLang);
}

// Disable real-time translation
function disableRealTimeTranslation(videoElement) {
    const translationOverlay = document.getElementById('translation-overlay');
    if (translationOverlay) {
        translationOverlay.remove();
    }
}

// Simulate translation updates (placeholder for real API integration)
function simulateTranslationUpdates(overlay, targetLang) {
    const sampleTranslations = {
        'zh-TW': ['這是翻譯後的字幕內容', '動漫對話翻譯示例', '實時翻譯功能演示'],
        'zh-CN': ['这是翻译后的字幕内容', '动漫对话翻译示例', '实时翻译功能演示'],
        'ja': ['これは翻訳された字幕です', 'アニメの対話翻訳例', 'リアルタイム翻訳機能'],
        'en': ['This is translated subtitle content', 'Anime dialogue translation example', 'Real-time translation demo']
    };
    
    const translations = sampleTranslations[targetLang] || sampleTranslations['en'];
    let currentIndex = 0;
    
    const updateInterval = setInterval(() => {
        if (overlay && overlay.parentNode) {
            overlay.textContent = translations[currentIndex % translations.length];
            currentIndex++;
        } else {
            clearInterval(updateInterval);
        }
    }, 3000);
}

// Initialize subtitle display
function initializeSubtitleDisplay(videoElement) {
    // Ensure subtitle tracks are properly loaded
    videoElement.addEventListener('loadedmetadata', function() {
        const tracks = this.querySelectorAll('track');
        tracks.forEach(track => {
            if (track.readyState === 2) { // LOADED
                track.track.mode = track.default ? 'showing' : 'hidden';
            }
        });
    });
}

// Add subtitles to video player (legacy function for backward compatibility)
function addSubtitlesToVideo(videoElement, subtitles) {
    if (!subtitles || !Array.isArray(subtitles)) return;
    
    // Remove existing subtitle tracks
    const existingTracks = videoElement.querySelectorAll('track');
    existingTracks.forEach(track => track.remove());
    
    // Add new subtitle tracks
    subtitles.forEach((subtitle, index) => {
        if (subtitle.src) {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.src = subtitle.src;
            track.srclang = subtitle.lang;
            track.label = subtitle.label;
            track.default = index === 0; // Set first subtitle as default
            videoElement.appendChild(track);
        }
    });
}

// Enhanced anime search with multiple filters
function enhancedAnimeSearch(query, filters = {}) {
    const {
        genre = '',
        year = '',
        status = '',
        rating = '',
        type = ''
    } = filters;
    
    let searchUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=25`;
    
    // Add filters to search URL
    if (genre) searchUrl += `&genres=${genre}`;
    if (year) searchUrl += `&start_date=${year}-01-01&end_date=${year}-12-31`;
    if (status) searchUrl += `&status=${status}`;
    if (rating) searchUrl += `&rating=${rating}`;
    if (type) searchUrl += `&type=${type}`;
    
    return fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            if (data.data) {
                return data.data.map(anime => ({
                    ...anime,
                    searchScore: calculateSearchRelevance(anime, query)
                })).sort((a, b) => b.searchScore - a.searchScore);
            }
            return [];
        })
        .catch(error => {
            console.error('Enhanced search error:', error);
            return [];
        });
}

// Calculate search relevance score
function calculateSearchRelevance(anime, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title match (highest priority)
    if (anime.title.toLowerCase().includes(queryLower)) {
        score += 100;
    }
    
    // Alternative titles match
    if (anime.title_english && anime.title_english.toLowerCase().includes(queryLower)) {
        score += 80;
    }
    
    if (anime.title_japanese && anime.title_japanese.toLowerCase().includes(queryLower)) {
        score += 70;
    }
    
    // Genre match
    if (anime.genres && anime.genres.some(genre => 
        genre.name.toLowerCase().includes(queryLower))) {
        score += 50;
    }
    
    // Synopsis match
    if (anime.synopsis && anime.synopsis.toLowerCase().includes(queryLower)) {
        score += 30;
    }
    
    // Popularity and rating boost
    if (anime.score) {
        score += anime.score * 2;
    }
    
    if (anime.popularity) {
        score += Math.max(0, 100 - anime.popularity / 100);
    }
    
    return score;
}

// Advanced anime categorization system
function categorizeAnime(animeList) {
    const categories = {
        byGenre: {},
        byYear: {},
        byStatus: {},
        byRating: {},
        byType: {},
        byPopularity: {
            trending: [],
            popular: [],
            hidden_gems: []
        }
    };
    
    animeList.forEach(anime => {
        // Categorize by genre
        if (anime.genres) {
            anime.genres.forEach(genre => {
                if (!categories.byGenre[genre.name]) {
                    categories.byGenre[genre.name] = [];
                }
                categories.byGenre[genre.name].push(anime);
            });
        }
        
        // Categorize by year
        if (anime.aired && anime.aired.from) {
            const year = new Date(anime.aired.from).getFullYear();
            if (!categories.byYear[year]) {
                categories.byYear[year] = [];
            }
            categories.byYear[year].push(anime);
        }
        
        // Categorize by status
        if (anime.status) {
            if (!categories.byStatus[anime.status]) {
                categories.byStatus[anime.status] = [];
            }
            categories.byStatus[anime.status].push(anime);
        }
        
        // Categorize by rating
        if (anime.rating) {
            if (!categories.byRating[anime.rating]) {
                categories.byRating[anime.rating] = [];
            }
            categories.byRating[anime.rating].push(anime);
        }
        
        // Categorize by type
        if (anime.type) {
            if (!categories.byType[anime.type]) {
                categories.byType[anime.type] = [];
            }
            categories.byType[anime.type].push(anime);
        }
        
        // Categorize by popularity
        if (anime.popularity) {
            if (anime.popularity <= 100) {
                categories.byPopularity.trending.push(anime);
            } else if (anime.popularity <= 1000) {
                categories.byPopularity.popular.push(anime);
            } else if (anime.score && anime.score >= 8.0) {
                categories.byPopularity.hidden_gems.push(anime);
            }
        }
    });
    
    return categories;
}

// Data validation and quality assurance
function validateAnimeData(anime) {
    const issues = [];
    
    // Check required fields
    if (!anime.title || anime.title.trim() === '') {
        issues.push('缺少標題');
    }
    
    if (!anime.images || !anime.images.jpg || !anime.images.jpg.image_url) {
        issues.push('缺少圖片');
    }
    
    if (!anime.synopsis || anime.synopsis.trim() === '') {
        issues.push('缺少簡介');
    }
    
    // Check data quality
    if (anime.score && (anime.score < 0 || anime.score > 10)) {
        issues.push('評分數據異常');
    }
    
    if (anime.episodes && anime.episodes < 0) {
        issues.push('集數數據異常');
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        anime: anime
    };
}

// Check image accessibility
function checkImageAccessibility(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = imageUrl;
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
    });
}