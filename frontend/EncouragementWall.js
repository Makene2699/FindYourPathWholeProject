// Colour classes used for the cards
const colorClasses = ['blue-card', 'green-card', 'yellow-card', 'orange-card', 'bright-blue-card', 'dark-blue-card'];

/**
 * Builds one card element from a post saved in Supabase.
 * The colour is picked from the post id, so a card keeps
 * the same colour every time the page is reloaded.
 */
function buildCard(post) {
    const card = document.createElement('div');
    card.className = 'wall-card card';
    card.classList.add(colorClasses[post.id % colorClasses.length]);
    card.dataset.fromDb = 'true'; // marks cards that came from Supabase

    const cardText = document.createElement('p');
    cardText.textContent = post.message; // textContent stops script injection

    const cardAuthor = document.createElement('span');
    cardAuthor.className = 'card-author';
    cardAuthor.textContent = '-by ' + (post.name || 'Anonymous');

    card.appendChild(cardText);
    card.appendChild(cardAuthor);
    return card;
}

/**
 * Loads all posts from Supabase and shows them at the
 * top of the grid (newest first).
 */
async function loadCards() {
    const cardsGrid = document.getElementById('cardsGrid');

    const { data, error } = await window.sb
        .from('encouragement_posts')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200);

    if (error) {
        console.error('Could not load cards:', error);
        return;
    }

    // Remove previously loaded Supabase cards so nothing shows twice
    cardsGrid.querySelectorAll('[data-from-db="true"]').forEach(c => c.remove());

    // Oldest first + prepend = newest ends up on top
    data.forEach(post => cardsGrid.prepend(buildCard(post)));
}

/**
 * Reads the input, saves the message to Supabase,
 * then refreshes the wall.
 */
async function addCard() {
    const inputField = document.getElementById('newCardText');

    // Ignore extra clicks while a post is already being saved
    if (inputField.disabled) return;

    const text = inputField.value.trim();

    // Do nothing if input is empty
    if (!text) return;

    inputField.disabled = true; // stops double-posting while saving

    const { error } = await window.sb
        .from('encouragement_posts')
        .insert({ name: 'Anonymous', message: text });

    inputField.disabled = false;

    if (error) {
        console.error('Could not post:', error);
        alert('Sorry, your message could not be posted: ' + error.message);
        return;
    }

    inputField.value = '';
    loadCards();
}

// Let the Enter key post as well
document.getElementById('newCardText').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addCard();
});

// Show existing posts when the page opens
loadCards();