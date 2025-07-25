document.addEventListener('DOMContentLoaded', function() {
    const addBookForm = document.getElementById('addBookForm');
    const booksContainer = document.getElementById('booksContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const emptyState = document.getElementById('emptyState');
    const toast = document.getElementById('toast');
    const bookCount = document.getElementById('bookCount');
    const bookModal = document.getElementById('bookModal');
    const modalDeleteBtn = document.getElementById('modalDeleteBtn');
    const closeModalButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    
    // Form validation
    addBookForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('title');
        const authorInput = document.getElementById('author');
        const titleError = document.getElementById('titleError');
        const authorError = document.getElementById('authorError');
        
        let isValid = true;
        
        // Validate title
        if (!titleInput.value.trim()) {
            titleError.textContent = 'Title is required';
            titleError.style.display = 'block';
            isValid = false;
        } else if (titleInput.value.trim().length < 2) {
            titleError.textContent = 'Title must be at least 2 characters';
            titleError.style.display = 'block';
            isValid = false;
        } else {
            titleError.style.display = 'none';
        }
        
        // Validate author
        if (!authorInput.value.trim()) {
            authorError.textContent = 'Author is required';
            authorError.style.display = 'block';
            isValid = false;
        } else if (authorInput.value.trim().length < 2) {
            authorError.textContent = 'Author must be at least 2 characters';
            authorError.style.display = 'block';
            isValid = false;
        } else {
            authorError.style.display = 'none';
        }
        
        if (isValid) {
            addBook({
                title: titleInput.value.trim(),
                author: authorInput.value.trim()
            });
        }
    });
    
    // Close modal event listeners
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            bookModal.classList.remove('show');
        });
    });
    
    // Close modal when clicking outside
    bookModal.addEventListener('click', function(e) {
        if (e.target === bookModal) {
            bookModal.classList.remove('show');
        }
    });
    
    // Load books when page loads
    loadBooks();
    
    // Function to show toast message
    function showToast(message, isSuccess = true) {
        const toastIcon = toast.querySelector('.toast-icon i');
        const toastMessage = toast.querySelector('.toast-message');
        
        toastMessage.textContent = message;
        
        if (isSuccess) {
            toastIcon.className = 'fas fa-check-circle';
            toast.classList.remove('error');
        } else {
            toastIcon.className = 'fas fa-exclamation-circle';
            toast.classList.add('error');
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Function to load books from API
    async function loadBooks() {
        try {
            loadingIndicator.style.display = 'flex';
            emptyState.style.display = 'none';
            
            const response = await fetch('/books');
            if (!response.ok) throw new Error('Failed to load books');
            
            const books = await response.json();
            
            bookCount.textContent = `${books.length} ${books.length === 1 ? 'book' : 'books'}`;
            
            if (books.length === 0) {
                emptyState.style.display = 'flex';
                booksContainer.innerHTML = '';
                booksContainer.appendChild(emptyState);
            } else {
                renderBooks(books);
            }
        } catch (error) {
            console.error('Error loading books:', error);
            showToast('Failed to load books', false);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Function to render books in the UI
    function renderBooks(books) {
        const booksGrid = document.createElement('div');
        booksGrid.className = 'books-grid';
        
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.innerHTML = `
                <h3>${book.title}</h3>
                <p>By ${book.author}</p>
                <div class="book-actions">
                    <button class="btn view-btn" data-id="${book.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn delete-btn" data-id="${book.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            booksGrid.appendChild(bookCard);
        });
        
        booksContainer.innerHTML = '';
        booksContainer.appendChild(booksGrid);
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const bookId = this.getAttribute('data-id');
                deleteBook(bookId);
            });
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const bookId = this.getAttribute('data-id');
                showBookDetails(bookId);
            });
        });
    }
    
    // Function to show book details in modal
    async function showBookDetails(bookId) {
        try {
            const response = await fetch(`/books/${bookId}`);
            if (!response.ok) throw new Error('Failed to load book details');
            
            const book = await response.json();
            
            // Populate modal with book data
            document.getElementById('modalBookTitle').textContent = book.title;
            document.getElementById('modalBookAuthor').textContent = `By ${book.author}`;
            document.getElementById('modalBookId').textContent = book.id;
            
            // Format and display creation date
            if (book.createdAt) {
                const date = new Date(book.createdAt);
                const options = { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                const formattedDate = date.toLocaleDateString('en-US', options);
                document.getElementById('modalBookDate').textContent = formattedDate;
            } else {
                document.getElementById('modalBookDate').textContent = 'Unknown';
            }
            
            // Set up delete button in modal
            modalDeleteBtn.onclick = function() {
                if (confirm('Are you sure you want to delete this book?')) {
                    deleteBook(book.id);
                }
            };
            
            // Show modal
            bookModal.classList.add('show');
        } catch (error) {
            console.error('Error showing book details:', error);
            showToast('Failed to load book details', false);
        }
    }
    
    // Function to add a new book
    async function addBook(bookData) {
        try {
            const response = await fetch('/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData)
            });
            
            if (!response.ok) throw new Error('Failed to add book');
            
            const newBook = await response.json();
            showToast('Book added successfully!');
            
            addBookForm.reset();
            loadBooks();
        } catch (error) {
            console.error('Error adding book:', error);
            showToast('Failed to add book', false);
        }
    }
    
    // Function to delete a book
    async function deleteBook(bookId) {
        try {
            const response = await fetch(`/books/${bookId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete book');
            
            showToast('Book deleted successfully!');
            loadBooks();
            bookModal.classList.remove('show');
        } catch (error) {
            console.error('Error deleting book:', error);
            showToast('Failed to delete book', false);
        }
    }
});