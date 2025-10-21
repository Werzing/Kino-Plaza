
const supabaseUrl = 'https://syqlznhvvqfadbbqeltk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cWx6bmh2dnFmYWRiYnFlbHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzU5MzAsImV4cCI6MjA3NTMxMTkzMH0.JjFICdfFnFwp0_jfSxKIOn1Je87ZtMRPSTFvjxYF3-k'

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)
console.log('Supabase клиент создан')


let movies = [];
let genres = [];
let directors = [];
let currentSlide = 0;
let slideInterval;


async function loadAllData() {
    try {
        console.log('Начинаем загрузку данных...')
        
        // Загружаем фильмы с информацией о жанрах и режиссерах
        const { data: moviesData, error: moviesError } = await supabase
            .from('movies')
            .select(`
                *,
                genres(name),
                directors(full_name)
            `)
            .order('rating', { ascending: false })
        
        if (moviesError) {
            console.error('Ошибка загрузки фильмов:', moviesError)
            return;
        }
        
        // Загружаем жанры для фильтра
        const { data: genresData, error: genresError } = await supabase
            .from('genres')
            .select('*')
            .order('name')
        
        if (genresError) {
            console.error('Ошибка загрузки жанров:', genresError)
        } else {
            genres = genresData;
            populateGenreFilter();
        }
        
        // Сохраняем фильмы
        movies = moviesData || [];
        
        // Создаем слайдер с топ-5 фильмами по рейтингу
        createSlider(movies.slice(0, 5));
        
        // Заполняем фильтр годов
        populateYearFilter();
        
        // Заполняем фильтр стран
        populateCountryFilter();
        
        // Отображаем фильмы
        displayMovies(movies);
        
        console.log('Данные успешно загружены:', movies.length, 'фильмов')
        
    } catch (err) {
        console.error('Ошибка при загрузке данных:', err)
        document.getElementById('moviesContainer').innerHTML = 
            '<div class="loading">Ошибка при загрузке данных: ' + err.message + '</div>'
    }
}

// Функция для создания слайдера
function createSlider(featuredMovies) {
    const sliderContainer = document.getElementById('sliderContainer');
    const sliderNav = document.getElementById('sliderNav');
    
    if (!featuredMovies || featuredMovies.length === 0) {
        document.getElementById('slider').style.display = 'none';
        return;
    }
    
    // Создаем слайды
    sliderContainer.innerHTML = featuredMovies.map(movie => `
        <div class="slide">
            <img src="${movie.poster || 'https://via.placeholder.com/1200x500/222222/cccccc?text=No+Poster'}" 
                 alt="${movie.title}" 
                 class="slide-image"
                 onerror="this.src='https://via.placeholder.com/1200x500/222222/cccccc?text=No+Poster'">
            <div class="slide-overlay">
                <div class="slide-title">${movie.title}</div>
                <div class="slide-info">
                    <span>${movie.release_year}</span>
                    <span>${movie.genres?.name || 'Не указан'}</span>
                    <span>★ ${movie.rating || 'N/A'}</span>
                    <span>${movie.duration_minutes || '??'} мин.</span>
                </div>
                <div class="slide-description">
                    ${movie.plot || 'Описание отсутствует.'}
                </div>
            </div>
        </div>
    `).join('');
    
    // Создаем навигационные точки
    sliderNav.innerHTML = featuredMovies.map((_, index) => 
        `<div class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
    ).join('');
    
    // Запускаем автоматическую смену слайдов
    startSlider();
}

// Функция для запуска слайдера
function startSlider() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
}

// Функция для перехода к следующему слайду
function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
}

// Функция для перехода к предыдущему слайду
function prevSlide() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider();
}

// Функция для обновления отображения слайдера
function updateSlider() {
    const sliderContainer = document.getElementById('sliderContainer');
    const dots = document.querySelectorAll('.slider-dot');
    
    sliderContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

// Функция для заполнения фильтра жанров
function populateGenreFilter() {
    const genreFilter = document.getElementById('genreFilter');
    
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreFilter.appendChild(option);
    });
}

// Функция для заполнения фильтра годов
function populateYearFilter() {
    const yearFilter = document.getElementById('yearFilter');
    const years = [...new Set(movies.map(movie => movie.release_year))].sort((a, b) => b - a);
    
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Функция для заполнения фильтра стран
function populateCountryFilter() {
    const countryFilter = document.getElementById('countryFilter');
    const countries = [...new Set(movies.map(movie => movie.country))].sort();
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
}

// Функция для отображения фильмов
function displayMovies(moviesToDisplay) {
    const container = document.getElementById('moviesContainer');
    
    if (!moviesToDisplay || moviesToDisplay.length === 0) {
        container.innerHTML = '<div class="loading">Фильмы не найдены</div>';
        return;
    }
    
    container.innerHTML = moviesToDisplay.map(movie => `
        <div class="movie-card">
            <div class="poster-container">
                <img src="${movie.poster || 'https://via.placeholder.com/300x400/222222/cccccc?text=No+Poster'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.src='https://via.placeholder.com/300x400/222222/cccccc?text=No+Poster'">
            </div>
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-meta">
                    <span>${movie.release_year}</span>
                    <span>${movie.genres?.name || 'Не указан'}</span>
                    <div class="movie-rating">
                        <span>★</span> ${movie.rating || 'N/A'}
                    </div>
                </div>
                <div class="movie-description">
                    ${movie.plot || 'Описание отсутствует.'}
                </div>
                <div class="movie-details">
                    <span>${movie.duration_minutes || '??'} мин.</span>
                    <span>${movie.directors?.full_name || 'Режиссер не указан'}</span>
                </div>
                <div class="movie-details">
                    <span>${movie.country || 'Страна не указана'}</span>
                    <span>${movie.age_rating || 'Возрастной рейтинг не указан'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Функция для фильтрации фильмов
function filterMovies() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const genreId = document.getElementById('genreFilter').value;
    const year = document.getElementById('yearFilter').value;
    const country = document.getElementById('countryFilter').value;
    
    let filteredMovies = movies;
    
    // Применяем фильтры
    if (searchTerm) {
        filteredMovies = filteredMovies.filter(movie => 
            movie.title.toLowerCase().includes(searchTerm) ||
            (movie.plot && movie.plot.toLowerCase().includes(searchTerm))
        );
    }
    
    if (genreId) {
        filteredMovies = filteredMovies.filter(movie => movie.genre_id == genreId);
    }
    
    if (year) {
        filteredMovies = filteredMovies.filter(movie => movie.release_year == year);
    }
    
    if (country) {
        filteredMovies = filteredMovies.filter(movie => movie.country === country);
    }
    
    // Отображаем отфильтрованные фильмы
    displayMovies(filteredMovies);
}

// Назначаем обработчики событий для фильтров
document.getElementById('searchInput').addEventListener('input', filterMovies);
document.getElementById('genreFilter').addEventListener('change', filterMovies);
document.getElementById('yearFilter').addEventListener('change', filterMovies);
document.getElementById('countryFilter').addEventListener('change', filterMovies);

// Назначаем обработчики событий для слайдера
document.getElementById('prevSlide').addEventListener('click', () => {
    prevSlide();
    startSlider(); // Перезапускаем таймер при ручном управлении
});

// Показываем ссылку на админку (можно убрать в продакшене)
document.addEventListener('DOMContentLoaded', function() {
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        adminLink.style.display = 'block';
        adminLink.addEventListener('click', function() {
            window.location.href = 'admin.html';
        });
    }
});

document.getElementById('nextSlide').addEventListener('click', () => {
    nextSlide();
    startSlider(); // Перезапускаем таймер при ручном управлении
});

// Назначаем обработчики для навигационных точек
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('slider-dot')) {
        currentSlide = parseInt(e.target.dataset.index);
        updateSlider();
        startSlider(); // Перезапускаем таймер при ручном управлении
    }
});

// Загружаем данные при загрузке страницы
document.addEventListener('DOMContentLoaded', loadAllData);