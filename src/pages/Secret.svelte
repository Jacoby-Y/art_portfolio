<script>
    import { onMount } from "svelte";

    export let shown = false;

    let wrapper;
    onMount(()=>{});

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
    <iframe class="tetris" src="http://sandywalker.github.io/Tetris/" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>

</main>

<style>
    main {
        display: grid;
        justify-items: center;
        align-items: center;
    }
    .tetris {
        width: 35.5rem;
        height: 98vh;

        max-width: 35.5rem;
        max-height: 43.7rem;
    }
</style>