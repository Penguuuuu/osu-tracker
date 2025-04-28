const roundToPixels = () => {
    document.querySelectorAll('*').forEach(el => {
        if (el.textContent.trim() !== '') {
            el.style.marginLeft = '0px';
            el.style.marginTop = '0px';
            const rect = el.getBoundingClientRect();
            const [dx, dy] = [Math.round(rect.left) - rect.left, Math.round(rect.top) - rect.top];
            if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
                el.style.marginLeft = `${dx}px`;
                el.style.marginTop = `${dy}px`;
            } else {
                el.style.marginLeft = '';
                el.style.marginTop = '';
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
