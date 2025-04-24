window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('min-btn')?.addEventListener('click', () => window.osuAPI.minimize());
    document.getElementById('close-btn')?.addEventListener('click', () => window.osuAPI.close());
});