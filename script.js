document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('to');
    const greetingElement = document.getElementById('guest-name');

    if (guestParam) {
        // Убираем подчеркивания. ?to=Иван_и_Елена -> Иван и Елена
        const formattedName = guestParam.replace(/_/g, ' ');
        greetingElement.textContent = `Дорогие ${formattedName}!`;
    }
});