<script lang="ts">
  import type { Collection } from "../types/index";

  export let collection: Collection;

  function handleMouseEnter(): void {
    let sunOneAnimate = document.getElementById("sun-one-animate");
    let sunTwoAnimate = document.getElementById("sun-two-animate");

    sunOneAnimate.setAttribute("from", sunOneAnimate.getAttribute("to"));
    sunOneAnimate.setAttribute("to", collection.colors[0]);
    sunTwoAnimate.setAttribute("from", sunTwoAnimate.getAttribute("to"));
    sunTwoAnimate.setAttribute("to", collection.colors[1]);

    if (
      sunOneAnimate instanceof SVGAnimationElement &&
      sunTwoAnimate instanceof SVGAnimationElement
    ) {
      sunOneAnimate.beginElement();
      sunTwoAnimate.beginElement();
    }
  }
</script>

<div class="py-1 overflow-hidden">
  <a
    on:mouseenter={handleMouseEnter}
    href={`/${collection.slug}`}
    class="cursor-pointer hover:text-slate-50"
  >
    <p
      class="font-sans text-[36px] mobile:text-[44px] tablet:text-[72px] desktop:text-[104px] capsize text-slate-400 leading-none uppercase mo-text load-in-text"
    >
      {collection.name}
    </p>
  </a>
</div>
