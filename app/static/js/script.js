let inputFocused = false;

document.addEventListener('focusin', (event) => {
    if (event.target.tagName === 'INPUT') {
        inputFocused = true;
        document.addEventListener('click', handleOutsideClick);
    }
});

document.addEventListener('focusout', (event) => {
    if (event.target.tagName === 'INPUT') {
        inputFocused = false;
        document.removeEventListener('click', handleOutsideClick);
    }
});

function handleOutsideClick(event) {
    const inputs = document.querySelectorAll('input');
    if (!event.target.closest('input') && inputFocused) {
        inputs.forEach(input => input.blur());
    }
}

function navigateTo(page) {
    window.location.href = page;
}

function confirmNavigation() {
    if (confirm("관리 페이지를 나가시겠습니까?")) {
        window.location.href = '/';
    }
}