document.addEventListener('DOMContentLoaded', () => {
  const postBtn = document.getElementById('postBtn');
  const postInput = document.getElementById('postInput');
  const feedContainer = document.getElementById('feedContainer');

  // Function to create and append a new post
  function createPost() {
    const text = postInput.value.trim();
    if (text === '') return;

    const newCard = document.createElement('article');
    newCard.className = 'feed-card new-post';

    newCard.innerHTML = `
      <div class="feed-header">
        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Angle M." class="feed-avatar">
        <div class="feed-user-info">
          <h4>Angle M.</h4>
          <p>Youth | Cape Town</p>
        </div>
      </div>
      <div class="feed-body">
        ${text}
      </div>
    `;

    // Insert the new post right before the post creation input bar
    const createPostBox = document.querySelector('.create-post-card');
    feedContainer.insertBefore(newCard, createPostBox);

    // Clear the input field
    postInput.value = '';
  }

  // Event listener for button click
  postBtn.addEventListener('click', createPost);

  // Event listener for pressing "Enter" key
  postInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      createPost();
    }
  });
});