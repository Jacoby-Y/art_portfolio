<script>
    import { onMount } from "svelte";

    export let shown = false;

    let wrapper;
    onMount(()=>{});

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

<main class="comp-main" bind:this={wrapper}>
    <div class="home" on:click><h3>Back</h3></div>

</main>

<style>
    main {
        display: grid;
        justify-items: center;
        align-items: center;
    } 
</style>