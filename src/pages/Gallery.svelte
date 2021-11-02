<script>
    import { onMount } from "svelte";

    export let shown = false;

    let content;
    let content_index = 0;
    const index_length = 6;
    let in_transition = false;
    
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

    const next_item = (num)=>{
        if (in_transition) return;
        in_transition = true;
        content.style.transform = "rotateY(90deg)";
        setTimeout(() => {
            if (content_index + num >= index_length) content_index = 0;
            else if (content_index + num < 0) content_index = index_length-1;
            else content_index += num;
            // Set next content item
            content.style.transform = "rotateY(0deg)";
            setTimeout(() => { in_transition = false; }, 300);
        }, 300);
    }
</script>

<main bind:this={wrapper} class="comp-main">
    <div class="home" on:click><h3>Back</h3></div>
    <div id="prev" class="arrow-wrapper" on:click={()=>next_item(-1)}><h3 class="arrow">&lt;</h3></div>
    <div id="content" bind:this={content}>
        {#if content_index == 0}
            <h3 class="content-title">Sketchbook Cover</h3>
            <iframe class="content-t1" src="https://docs.google.com/presentation/d/e/2PACX-1vS85J7JE5USLCSCVCoYG5fTDK1cu3ptFHAoP8LmrwqfyPmsgpMN3lPmVG714AFXoeooH0jBqLaGyQ8V/embed?start=false&loop=false&delayms=3000" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
        {:else if content_index == 1}
            <h3 class="content-title">Still Life</h3>
            <iframe class="content-t1" src="https://docs.google.com/presentation/d/e/2PACX-1vS6jKySpeou-WNnnurn50VyhgNF5lpL2fDX1kshzhgcUo75I-9htD1TzqEvstwqFcI20rrbsLpvQYHQ/embed?start=false&loop=false&delayms=3000" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
        {:else if content_index == 2}
            <h3 class="content-title">Graffiti Tag</h3>
            <div class="content-t1" style="background-image: url('https://lh3.googleusercontent.com/pw/AM-JKLUxkKdg-9Y4OMqZHzTDM5EI7K3kuMukSnFsJkXW3SPpLEZmQxRMpSNEPzH8kR8BNd4s247YN-CnQn6490aXB5NF1Etuc-085XOyguTXJRreRDwfrMuwGczfppmK1BnuBstwm7vIJn-WTE8o7EjYguf5=w886-h664-no?authuser=0');"></div>
        {:else if content_index == 3}
            <h3 class="content-title">Landscape</h3>
            <iframe class="content-t1" src="https://docs.google.com/presentation/d/e/2PACX-1vQtikX7NdEO0CMtUWLT1R4xkEAutLYAGDFR8zrJ0CAFamzYOBdnKVg2fcpvHbaud1Gzns0mgLppf8Ri/embed?start=false&loop=false&delayms=3000" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
        {:else if content_index == 4}
            <h3 class="content-title">Mini Masterpiece</h3>
            <div class="content-t1" style="background-image: url('https://lh3.googleusercontent.com/pw/AM-JKLVRd-vzpdbhyN2q5-BuNdOlHLJlLpxwi3TIVoGVcFs--0IKAEjF0MucJUBGqgdaog9N_Z84GSsNAMFA5aVZKXTciOp7O3rorj4V6qljisZLkxDqR74rwKkYpBasuvvxdqatCzzbTDSVGMuyEbPyKZo=w726-h968-no?authuser=0');"></div>
        {:else if content_index == 5}
            <h3 class="content-title">Self Portrait</h3>
            <iframe class="content-t1" src="https://docs.google.com/presentation/d/e/2PACX-1vQPxsFNlB7yjelF_J_DyURYz7S_RdiRuxis-kb0lbkWBgQY-4RXyiJmjy2JWtx2RgQuMdbm_vQmPDUo/embed?start=false&loop=false&delayms=3000" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
        {/if}
    </div>
    <div id="next" class="arrow-wrapper" on:click={()=>next_item(1)}><h3 class="arrow">&gt;</h3></div>
</main>
<!-- <iframe src="https://docs.google.com/presentation/d/e/2PACX-1vQPxsFNlB7yjelF_J_DyURYz7S_RdiRuxis-kb0lbkWBgQY-4RXyiJmjy2JWtx2RgQuMdbm_vQmPDUo/embed?start=false&loop=false&delayms=3000" frameborder="0" width="960" height="569" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe> -->
<style>
    main {
        display: grid;
        grid-template-columns: 7rem auto 7rem;
    }
    .arrow-wrapper {
        display: grid;
        justify-items: center;
        align-items: center;
        background-color: rgba(0,0,0, 0.2);
    }
    .arrow-wrapper:hover {
        background-color: rgba(0,0,0, 0.4);
    }
    .arrow-wrapper:active {
        background-color: rgba(0,0,0, 0.7);
    }
    .arrow {
        color: white;
        font-size: 2rem;
    }

    #content {
        display: grid;
        justify-items: center;
        /* align-items: center; */
        transition-duration: 0.3s;
        transform: rotateY(0deg);
        transition-timing-function: linear;
        grid-template-rows: max-content 1fr;
    }
    .content-title {
        color: white;
        font-size: 2rem;
        padding: 1rem;
    }
    .content-t1 {
        width: 90%;
        height: 90%;
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center; 
    }
    
</style>