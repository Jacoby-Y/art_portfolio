<script>
    import { onMount } from "svelte";

    export let shown = false;

    let content;
    let content_index = 0;
    const index_length = 4;
    let in_transition = false;
    
    let gallary_wrapper;
    onMount(()=>{ 
		// gallary_wrapper = document.getElementById("gallary-wrapper"); 
        // console.log(gallary_wrapper);
	});

    $: {
        gallary_wrapper = document.getElementById("gallary-wrapper");
        if (gallary_wrapper != null) {
            if (shown) {
                gallary_wrapper.style.transform = "translate(0, 0)";
            } else {
                gallary_wrapper.style.transform = "translate(100%, 0)";
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

<main id="gallary-wrapper" bind:this={gallary_wrapper}>
    <div id="home" on:click><h3>Back</h3></div>
    <div id="prev" class="arrow-wrapper" on:click={()=>next_item(-1)}><h3 class="arrow">&lt;</h3></div>
    <div id="content" bind:this={content}>
        {#if content_index == 0}
            <div class="content-t1" style="background-color: red;"></div>
        {:else if content_index == 1}
            <div id="content-test2"></div>
        {:else if content_index == 2}
            <div id="content-test3"></div>
        {:else if content_index == 3}
            <div id="content-test4"></div>
        {/if}
    </div>
    <div id="next" class="arrow-wrapper" on:click={()=>next_item(1)}><h3 class="arrow">&gt;</h3></div>
</main>

<style>
    #gallary-wrapper {
        position: absolute;
        width: 100%; height: 100%;
        transform: translate(100%, 0);
        transition-duration: 0.5s;
        /* transition-timing-function: linear; */
        display: grid;
        grid-template-columns: 7rem auto 7rem;
    }
    #home {
        border: none;
        /* background-color: #f1304d; */
        background-color: rgba(0,0,0, 0.9);
        width: 7rem;
        position: absolute;
    }
    #home h3 {
        color: white;
        padding: 0.5rem 0.7rem;
        font-size: 1.5rem;
        text-align: center;
        cursor: pointer;
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
        align-items: center;
        transition-duration: 0.3s;
        transform: rotateY(0deg);
        transition-timing-function: linear;
    }
    .content-t1 {
        width: 90%;
        height: 90%;
    }
    
</style>