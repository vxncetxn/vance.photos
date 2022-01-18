<script>
    export let collection;

	function handleMouseEnter() {
		let suns = [...document.querySelectorAll(".sun")]
        suns.forEach((sun, i) => {
            sun.style.background = `radial-gradient(ellipse at top, ${collection.colors[i]}, transparent)`
        })
	}
</script>

<a href={`/${collection.slug}`} class="mt-10 text-6xl text-transparent cursor-pointer text-stroke hover:text-white">{collection.name}</a>