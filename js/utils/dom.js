export function getElement(selector, parent = document) {
    return parent.querySelector(selector);
}

export function getAllElements(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

export function createElement(tagName, classes = [], attributes = {}) {
    const el = document.createElement(tagName);
    if (classes.length) {
        el.classList.add(...classes);
    }
    for (const key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
    return el;
}