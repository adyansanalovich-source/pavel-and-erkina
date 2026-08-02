document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('to');
    const greetingElement = document.getElementById('guest-name');

    if (guestParam) {
        // Убираем подчеркивания. ?to=Иван_и_Елена -> Иван и Елена
        const formattedName = guestParam.replace(/_/g, ' ');
        greetingElement.textContent = `Дорогие ${formattedName}!`;
    }// Управление фоновой музыкой
const musicBtn = document.getElementById('music-btn');
const bgMusic = document.getElementById('bg-music');

if (musicBtn && bgMusic) {
    musicBtn.addEventListener('click', function() {
        if (bgMusic.paused) {
            bgMusic.play();
            musicBtn.innerHTML = '⏸ ';
        } else {
            bgMusic.pause();
            musicBtn.innerHTML = '🎵 ';
        }
    });
}
});
