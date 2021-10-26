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
    <iframe 
        id="slides"
        title="Best artwork"
        src="https://docs.google.com/presentation/d/e/2PACX-1vQB_4gWFfBFnah6zQt0qnuSUKiOnIiLViX_1qyNY1jVNpVrAKmMxXTdhvCfgmXTCgScQox9xaQOT4Hn/embed?start=false&loop=false&delayms=3000" 
        frameborder="0" 
        allowfullscreen="true" 
        mozallowfullscreen="true" 
        webkitallowfullscreen="true"
    ></iframe>
</main>

<style>
    main {
        display: grid;
        justify-items: center;
        align-items: center;
    }
    #slides {
        width: 90%;
        height: 90%;
    }
</style>