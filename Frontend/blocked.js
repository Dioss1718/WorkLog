document.addEventListener('DOMContentLoaded', () => {
  // Get the 'go back' button element from the page.
  const goBackButton = document.getElementById('goBackButton');

  // If the button exists, add a click event listener to it.
  if (goBackButton) {
    goBackButton.addEventListener('click', () => {
      // Go back to the previous page in the browser's history.
      window.history.back();
    });
  }
});