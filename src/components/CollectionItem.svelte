<script lang="ts">
    import { Collection } from '@/types/index';

    export let collection: Collection;

    function handleMouseEnter(): void {
        let sunOneAnimate = document.getElementById('sun-one-animate');
        let sunTwoAnimate = document.getElementById('sun-two-animate');

        sunOneAnimate.setAttribute('from', sunOneAnimate.getAttribute('to'));
        sunOneAnimate.setAttribute('to', collection.colors[0]);
        sunTwoAnimate.setAttribute('from', sunTwoAnimate.getAttribute('to'));
        sunTwoAnimate.setAttribute('to', collection.colors[1]);

        if (sunOneAnimate instanceof SVGAnimationElement && sunTwoAnimate instanceof SVGAnimationElement) {
            sunOneAnimate.beginElement();
            sunTwoAnimate.beginElement();
        }
    }
</script>

<div class="py-1 overflow-hidden">
    <a
        on:mouseenter={handleMouseEnter}
        href={`/${collection.slug}`}
        class="uppercase cursor-pointer text-slate-400 text-[120px] leading-tight hover:text-slate-50"
    >
        <p class="mo-text">{collection.name}</p>
    </a>
</div>
