import * as Comlink from "comlink";

export function initTransferHandler() {
  Comlink.transferHandlers.set("event", {
    canHandle(ev) {
      return ev instanceof Event;
    },
    serialize(ev) {
      return [
        {
          detail: ev && ev.detail,
          wheelDelta: ev && ev.wheelDelta,
          wheelDeltaY: ev && ev.wheelDeltaY,
          wheelDeltaX: ev && ev.wheelDeltaX,
          deltaY: ev && ev.deltaY,
          deltaX: ev && ev.deltaX,
          deltaMode: ev && ev.deltaMode,
          clientY: ev && ev.clientY,
          pathname: ev && ev.pathname,
          domImages: ev && ev.domImages,
        },
        [],
      ];
    },
    deserialize(ev) {
      return ev;
    },
  });
}
