import * as Comlink from "comlink";
import { lerp } from "./lerp";

const api = {
  process(scroll, cursor) {
    let newScrollCurrent, newDirection, newCursorCurrent;

    newScrollCurrent = lerp(scroll.current, scroll.target, scroll.ease);
    if (newScrollCurrent > scroll.last) {
      newDirection = "right";
    } else {
      newDirection = "left";
    }

    newCursorCurrent = lerp(cursor.current, cursor.target, cursor.ease);

    return { newScrollCurrent, newDirection, newCursorCurrent };
  },
};

Comlink.expose(api);
