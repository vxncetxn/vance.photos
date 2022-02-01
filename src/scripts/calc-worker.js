import * as Comlink from 'comlink';

function lerp(p1, p2, t) {
    return p1 + (p2 - p1) * t;
}

const process = (scroll, cursor) => {
    let newScrollCurrent, newDirection, newCursorCurrent;
    newScrollCurrent = lerp(scroll.current, scroll.target, scroll.ease);
    if (newScrollCurrent > scroll.last) {
        newDirection = 'right';
    } else {
        newDirection = 'left';
    }

    newCursorCurrent = lerp(cursor.current, cursor.target, cursor.ease);

    return { newScrollCurrent, newDirection, newCursorCurrent };
};

Comlink.expose(process);
