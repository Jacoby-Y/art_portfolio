<script>
    export let shown = false;

    let wrapper;

    $: {
        if (wrapper != null) {
            if (shown) {
                wrapper.style.transform = "translate(0, 0)";
            } else {
                wrapper.style.transform = "translate(100%, 0)";
            }
        }
    }

</script>

<main bind:this={wrapper} class="comp-main">
    <div class="home" on:click><h3>Back</h3></div>
</main>

<style>
    main {
        display: grid;
        grid-template-columns: 7rem auto 7rem;
    }
</style>