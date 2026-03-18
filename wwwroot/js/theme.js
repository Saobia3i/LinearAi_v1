(function () {
    const root = document.documentElement;
    const skeleton = document.getElementById('globalSkeleton');

    const getTheme = () => localStorage.getItem('theme') || 'dark';

    const setTheme = (theme) => {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        document.querySelectorAll('[data-theme-icon]').forEach(icon => {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        });
    };

    setTheme(getTheme());

    document.querySelectorAll('[data-theme-toggle]').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    });

    window.addEventListener('load', () => {
        if (skeleton) {
            skeleton.classList.add('hidden');
        }
    });
})();
