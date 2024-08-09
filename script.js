document.addEventListener("DOMContentLoaded", () => {
    const postList = document.querySelector(".post-list");
    const postListContainer = postList.querySelector(".post-list-container");
    const pagination = postList.querySelector(".pagination");
    const prevButton = pagination.querySelector(".prev");
    const nextButton = pagination.querySelector(".next");
    const firstButton = pagination.querySelector(".first");
    const lastButton = pagination.querySelector(".last");
    const pageNumberElement = pagination.querySelector(".page-numbers");
    const showingElement = postList.querySelector(".showing");
    const sortOptionsElement = postList.querySelector(".sort-options");
    const itemsPerPageElement = postList.querySelector(".items-per-page-options");
    const toggleButton = document.querySelector(".navbar-toggle");
    const navbarNav = document.querySelector(".navbar-nav");

    let itemsPerPage = parseInt(itemsPerPageElement.value, 10);
    let currentPage = 1;
    let totalItems = 0;
    let posts = [];

    toggleButton.addEventListener("click", () => {
        navbarNav.classList.toggle("active");
    })

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const fetchPosts = (page, sortOption) => {
        const sortParam = sortOption === "newest" ? '&sort=-published_at' : (sortOption === "oldest" ? '&sort=published_at' : '');
        const apiUrl = `https://suitmedia-backend.suitdev.com/api/ideas?page[number]=${page}&page[size]=${itemsPerPage}${sortParam}`;

        fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                totalItems = data.meta.total;
                posts = data.data.map(item => ({
                    thumbnail: extractThumbnailFromContent(item.content),
                    title: item.title,
                    published_at: item.published_at
                }));
                renderPosts(posts);
            })
            .catch(error => console.error('Error fetching data:', error));
    };

    const extractThumbnailFromContent = (content) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const imgElement = doc.querySelector('img');
        return imgElement && imgElement.src ? imgElement.src : 'img/default-thumbnail.jpg';
    };

    const renderPosts = (posts) => {
        postListContainer.innerHTML = posts.map(post => `
            <div class="post">
                <img class="post-thumbnail lazy" data-src="${post.thumbnail}" alt="Post Thumbnail" onerror="this.src='img/default-thumbnail.jpg';">
                <div class="post-details">
                    <p class="post-date">${formatDate(post.published_at)}</p>
                    <h2 class="post-title">${post.title}</h2>
                </div>
            </div>
        `).join('');

        renderPagination();
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(start + itemsPerPage - 1, totalItems);
        showingElement.textContent = `Showing ${start} - ${end} of ${totalItems}`;

        lazyLoadImages();
    };

    const renderPagination = () => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        pageNumberElement.innerHTML = "";

        const createButton = (page, content) => {
            const button = document.createElement("button");
            button.innerHTML = content;
            button.disabled = page === currentPage;
            button.addEventListener("click", () => goToPage(page));
            return button;
        };

        firstButton.classList.toggle("inactive", currentPage === 1);
        prevButton.classList.toggle("inactive", currentPage === 1);
        nextButton.classList.toggle("inactive", currentPage === totalPages);
        lastButton.classList.toggle("inactive", currentPage === totalPages);

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (endPage - startPage < 4) {
            if (startPage === 1) {
                endPage = Math.min(5, totalPages);
            } else if (endPage === totalPages) {
                startPage = Math.max(totalPages - 4, 1);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const button = createButton(i, i);
            if (i === currentPage) {
                button.classList.add("active");
            }
            pageNumberElement.appendChild(button);
        }
    };

    const goToPage = (page) => {
        currentPage = page;
        fetchPosts(currentPage, sortOptionsElement.value);
    };

    const nextPage = () => {
        if (currentPage < Math.ceil(totalItems / itemsPerPage)) goToPage(currentPage + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) goToPage(currentPage - 1);
    };

    const FirstPage = () => {
        if (currentPage > 1) goToPage(1);
    };

    const LastPage = () => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) goToPage(totalPages);
    };

    const lazyLoadImages = () => {
        const lazyImages = document.querySelectorAll('.lazy');
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy');
                    imageObserver.unobserve(lazyImage);
                }
            });
        }, options);

        lazyImages.forEach(image => {
            image.src = '';
            imageObserver.observe(image);
        });
    };

    firstButton.addEventListener("click", FirstPage);
    lastButton.addEventListener("click", LastPage);
    prevButton.addEventListener("click", prevPage);
    nextButton.addEventListener("click", nextPage);

    sortOptionsElement.addEventListener("change", () => fetchPosts(currentPage, sortOptionsElement.value));
    itemsPerPageElement.addEventListener("change", () => {
        itemsPerPage = parseInt(itemsPerPageElement.value, 10);
        fetchPosts(currentPage, sortOptionsElement.value);
    });

    fetchPosts(currentPage, sortOptionsElement.value);
});

// PARALLAX ZOOM
const parallaxZoom = () => {
    const bannerImage = document.querySelector('.banner-image');
    const scrollPosition = window.scrollY;
    const scaleFactor = 1 + scrollPosition / 1500;
    bannerImage.style.transform = `scale(${scaleFactor})`;
};

window.addEventListener('scroll', () => requestAnimationFrame(parallaxZoom));
