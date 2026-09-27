/**
 * Function to add a new card to the Encouragement Wall.
 * It reads the input, creates a new card element with random colors,
 * and adds it to the grid.
 */
function addCard() {
    const inputField = document.getElementById('newCardText');
    const text = inputField.value.trim();

    // Do nothing if input is empty
    if (!text) return;

    const cardsGrid = document.getElementById('cardsGrid');

    // Create the new card structure
    const newCard = document.createElement('div');
    newCard.className = 'wall-card card';

    // Apply a random color class for visual variation
    const colorClasses = ['blue-card', 'green-card', 'yellow-card', 'orange-card', 'bright-blue-card', 'dark-blue-card'];
    const randomClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];
    newCard.classList.add(randomClass);

    // Create the text paragraph
    const cardText = document.createElement('p');
    cardText.innerText = text;

    // Create the author signature
    const cardAuthor = document.createElement('span');
    cardAuthor.className = 'card-author';
    cardAuthor.innerText = '-by you'; // Set default author

    // Assemble the card
    newCard.appendChild(cardText);
    newCard.appendChild(cardAuthor);

    // Add to grid and clear the input
    cardsGrid.prepend(newCard); // Add new card to the beginning
    inputField.value = '';
}
