<script>
    import { onMount } from "svelte";

    export let shown = false;

    let gallary_wrapper;
    onMount(()=>{ 
		gallary_wrapper = document.getElementById("gallary-wrapper"); 
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
</script>

<main id="gallary-wrapper">
    <div id="home" on:click><h3>Back</h3></div>
    <div id="prev"></div>
    <div id="content"></div>
    <div id="next"></div>
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
    div {
        border: 2px solid #f1304d;
    }
    #home {
        border: none;
        background-color: #f1304d;
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
    
</style>