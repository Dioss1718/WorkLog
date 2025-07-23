document.addEventListener('DOMContentLoaded', () => {
  const goBackButton = document.getElementById('goBackButton');

  if (goBackButton) {
    goBackButton.addEventListener('click', () => {
      window.history.back();
    });
  }
});