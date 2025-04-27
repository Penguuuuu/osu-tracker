const roundToPixels = () => {
    document.querySelectorAll('*').forEach(el => {
        if (el.textContent.trim() !== '') {
            const rect = el.getBoundingClientRect();
            const [dx, dy] = [Math.round(rect.left) - rect.left, Math.round(rect.top) - rect.top];
            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                const transform = getComputedStyle(el).transform.replace(/translate\([^)]+\)/, '').replace('none', '');
                el.style.transform = `${transform} translate(${dx}px, ${dy}px)`.trim();
            }
        }
    });
};

window.addEventListener('DOMContentLoaded', () => {
    const update = ((fn, delay = 50) => {
        let timer;
        return () => (clearTimeout(timer), timer = setTimeout(fn, delay));
    })(roundToPixels);

    roundToPixels();
    new ResizeObserver(update).observe(document.body);
    new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
});
