<script>
    import { onMount } from "svelte";

    export let shown = false;

    let content;
    let content_index = 0;
    const index_length = 4;
    let in_transition = false;
    
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
            <div class="content-t1" style="background-image: url('https://lh3.googleusercontent.com/pw/AM-JKLVJbrL75D_1m6KPob2o-1XxXrn88LrIY9J0v4-2S6t0NflG3Bd_c7ma14_AObqfkmK4GXjxhiLbJasMI8LHuVQOvBogjHLrN9oozza2unxyAZlgJ9rHOiw4UqvOIkhs5D-av1n6uPW-dQmY56v-S2o1=w886-h664-no?authuser=0');"></div>
        {:else if content_index == 1}
            <h3 class="content-title">Still Life</h3>
            <div class="content-t1" style="background-image: url('https://lh3.googleusercontent.com/pw/AM-JKLU-nDYPeyd4MiWH2TzDGnu8_Zr1RggjWbsB27KOOcCpKb3AD40JG7Of09Tdxzqgi2GTBeJ0aUF2Gi5tTrccbQqgY1vHNRpA9m0lLspfuM2740WWqTF8YhBYxKuhS6yws5IFH-N4onXHmzt6bh9e9Du_=w498-h664-no?authuser=0');"></div>
        {:else if content_index == 2}
            <h3 class="content-title">Graffiti Tag</h3>
            <div class="content-t1" style="background-image: url('https://lh3.googleusercontent.com/pw/AM-JKLUxkKdg-9Y4OMqZHzTDM5EI7K3kuMukSnFsJkXW3SPpLEZmQxRMpSNEPzH8kR8BNd4s247YN-CnQn6490aXB5NF1Etuc-085XOyguTXJRreRDwfrMuwGczfppmK1BnuBstwm7vIJn-WTE8o7EjYguf5=w886-h664-no?authuser=0');"></div>
        {:else if content_index == 3}
            <h3 class="content-title">Graffiti Tag</h3>
            <div class="content-t1" style="background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Example_image.svg/600px-Example_image.svg.png');"></div>
        {/if}
    </div>
    <div id="next" class="arrow-wrapper" on:click={()=>next_item(1)}><h3 class="arrow">&gt;</h3></div>
</main>

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