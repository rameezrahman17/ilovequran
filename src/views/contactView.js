export default {
    async render(container) {
        container.innerHTML = `
            <div class="contact-container fade-in">
                <div class="contact-header">
                    <h2 class="section-title">Contact Me</h2>
                    <p class="section-subtitle">Your feedback will help us grow</p>
                </div>

                <div class="main-section-divider"></div>

                <div class="contact-content-grid">
                    <div class="feedback-card">
                        <h3 class="feedback-title">Share Your Feedback</h3>
                        <form id="feedbackForm" class="feedback-form">
                            <div class="form-group">
                                <label for="userName">Name</label>
                                <input type="text" id="userName" name="userName" placeholder="Your name" required>
                            </div>
                            <div class="form-group">
                                <label for="userContact">Contact Number</label>
                                <input type="tel" id="userContact" name="userContact" placeholder="Your phone number" required>
                            </div>
                            <div class="form-group">
                                <label for="userEmail">Email</label>
                                <input type="email" id="userEmail" name="userEmail" placeholder="your.email@example.com" required>
                            </div>
                            <div class="form-group">
                                <label>Rate Us</label>
                                <div class="rating-container">
                                    <div class="stars">
                                        <input type="radio" id="star5" name="rating" value="5" />
                                        <label for="star5" title="5 stars">★</label>
                                        <input type="radio" id="star4" name="rating" value="4" />
                                        <label for="star4" title="4 stars">★</label>
                                        <input type="radio" id="star3" name="rating" value="3" />
                                        <label for="star3" title="3 stars">★</label>
                                        <input type="radio" id="star2" name="rating" value="2" />
                                        <label for="star2" title="2 stars">★</label>
                                        <input type="radio" id="star1" name="rating" value="1" />
                                        <label for="star1" title="1 star">★</label>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="userMessage">Message / Feedback</label>
                                <textarea id="userMessage" name="userMessage" rows="5" placeholder="Share your thoughts, suggestions, or feature requests..." required></textarea>
                            </div>
                            <button type="submit" class="btn-primary submit-btn">Send Message</button>
                        </form>
                        <div id="formMessage" class="form-message"></div>
                    </div>
                    <div class="google-form-card">
                        <h3 class="feedback-title">Google Form</h3>
                        <p class="form-text">Do fill the form<br>"Every small input marks a contribution in the path of Sadaqah Jariyah"</p>
                        
                        <div class="qr-container">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://forms.gle/2LhmCHZWep3t6HqP6" alt="Google Form QR Code" class="qr-code">
                        </div>

                        <a href="https://forms.gle/2LhmCHZWep3t6HqP6" target="_blank" rel="noopener noreferrer" class="btn-primary form-link-btn">
                            Open Google Form
                        </a>
                    </div>
                </div>

                </div>
                
                <div id="react-footer-anchor"></div>
            </div>
        `;

        this.setupFormHandler();
    },

    setupFormHandler() {
        const form = document.getElementById('feedbackForm');
        const messageDiv = document.getElementById('formMessage');
        const ratingInputs = document.querySelectorAll('input[name="rating"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get selected rating
            let selectedRating = 0;
            for (const input of ratingInputs) {
                if (input.checked) {
                    selectedRating = input.value;
                    break;
                }
            }

            const formData = {
                name: document.getElementById('userName').value,
                contact: document.getElementById('userContact').value,
                email: document.getElementById('userEmail').value,
                message: document.getElementById('userMessage').value,
                rating: selectedRating
            };

            // Show loading state
            messageDiv.innerHTML = `
                <div class="loading-message">
                    <p>⏳ Sending your feedback...</p>
                </div>
            `;
            messageDiv.style.display = 'block';

            try {
                // Send to backend API
                const response = await fetch('http://localhost:3000/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    // Show success message
                    messageDiv.innerHTML = `
                        <div class="success-message">
                            <p>✅ ${result.message}</p>
                        </div>
                    `;
                    // Reset form
                    form.reset();
                    // Reset stars visuals if needed (browser reset usually handles radio)
                } else {
                    // Show error message
                    messageDiv.innerHTML = `
                        <div class="error-message">
                            <p>❌ ${result.message}</p>
                        </div>
                    `;
                }

            } catch (error) {
                console.error('Error:', error);
                messageDiv.innerHTML = `
                    <div class="error-message">
                        <p>❌ Failed to send message. Please make sure the server is running.</p>
                    </div>
                `;
            }

            // Hide message after 5 seconds
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        });
    }
};
