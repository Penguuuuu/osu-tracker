document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('settings-gamemode-dropdown');
    if (!dropdown) return;
    const selected = dropdown.querySelector('.selected');
    const options = dropdown.querySelector('.dropdown-options');
    const optionDivs = dropdown.querySelectorAll('.option');

    dropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('option')) return;
        dropdown.classList.toggle('open');
        dropdown.setAttribute('aria-expanded', dropdown.classList.contains('open'));
    });

    optionDivs.forEach(option => {
        option.addEventListener('click', () => {
            selected.textContent = option.textContent;
            dropdown.classList.remove('open');
            dropdown.dataset.value = option.dataset.value;
            dropdown.setAttribute('aria-expanded', 'false');
            dropdown.dispatchEvent(new CustomEvent('gamemodechange', { detail: option.dataset.value }));
        });
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                option.click();
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
            dropdown.setAttribute('aria-expanded', 'false');
        }
    });
});