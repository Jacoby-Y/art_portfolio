<script>
    export let shown = false;

    let wrapper;

    $: {
        if (wrapper != null) {
            if (shown) {
                setTimeout(() => { wrapper.style.transform = "translate(0, 0)"; }, 10);
            } else {
                wrapper.style.transform = "translate(100%, 0)";
            }
        }
    }

    $: { if (wrapper != undefined) { if (shown) wrapper.style.opacity = "1"; else wrapper.style.opacity = "0"; } }

</script>

<main bind:this={wrapper} class="comp-main">
    <div class="home" on:click><h3>Back</h3></div>
    <!-- svelte-ignore a11y-missing-attribute -->
    <iframe 
        src="https://docs.google.com/presentation/d/e/2PACX-1vTEtC6AKf75Hf6b-iZOveZYoYdUi6JowmEURVbUsIdh2wbianTBTnr9jRFwBHL1MUKP2SJ4SGuFMWzr/embed?start=false&loop=false&delayms=3000" 
        frameborder="0" 
        width="85%" 
        height="90%" 
        allowfullscreen="true" 
        mozallowfullscreen="true" 
        webkitallowfullscreen="true"></iframe>
</main>

<style>
    main {
        display: grid;
        justify-items: center;
        align-items: center;
    }
</style>