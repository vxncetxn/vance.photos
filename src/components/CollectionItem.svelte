<script>
    export let collection;

    function handleMouseEnter() {
        let sunOneAnimate = document.getElementById('sun-one-animate');
        let sunTwoAnimate = document.getElementById('sun-two-animate');

        sunOneAnimate.setAttribute('from', sunOneAnimate.getAttribute('to'));
        sunOneAnimate.setAttribute('to', collection.colors[0]);
        sunTwoAnimate.setAttribute('from', sunTwoAnimate.getAttribute('to'));
        sunTwoAnimate.setAttribute('to', collection.colors[1]);

        sunOneAnimate.beginElement();
        sunTwoAnimate.beginElement();
    }
</script>

<a
    on:mouseenter={handleMouseEnter}
    href={`/${collection.slug}`}
    class="mt-10 text-6xl text-transparent cursor-pointer text-stroke hover:text-white">{collection.name}</a
>
