<script>
    import { onMount } from "svelte";

    export let shown = false;

    const def = v => v != null && v != undefined;

    let wrapper;
    let iframe;// = document.createElement("iframe");
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

<main class="comp-main" bind:this={wrapper}>
    <div class="home" on:click><h3>Back</h3></div>
    <iframe bind:this={iframe} 
        src="https://docs.google.com/document/d/e/2PACX-1vRRZUpi1iT5Y985vFjnNGqBZp76ljpfwoerFCHwHGe9sOLooYfrC2TMLxZLyPmX5LU75GSNyCe5kjmT/pub?embedded=true"
        title="Artist Statement" 
        id="statement" ></iframe>
</main>

<style>
    main {
        display: grid;
        justify-items: center;
        align-items: center;
    } 
    #statement {
        /* border: 2px solid white; */
        border: none;
        width: 816px;
        height: 377.2px;
        transform: scale(1.5);
    }
</style>