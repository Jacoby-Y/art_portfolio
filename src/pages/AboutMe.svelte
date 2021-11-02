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
    <div class="about-wrapper abso-cen">
        <!-- <img src="" alt="about me image" class="about-me-img"> -->
        <div class="about-me-img"></div>
        <h3 id="about-me-txt">I am a passionate computer programmer and... that's basically it! Thanks for coming to my TED talk, I'll see you later folks!</h3>
    </div>
</main>

<style>
    main {
        display: grid;
        grid-template-columns: 7rem auto 7rem;
    }
    .about-wrapper {
        top: 40%;
    }
    .about-me-img {
        width: 100%;
        height: 20rem;
        background-image: url("https://lh3.googleusercontent.com/pw/AM-JKLUzIOHRdVaUids9DyEFOj6t429slq4E0eWjOSmvhImM5aqkSWRudgSiEHb84MvYMSrJb6e0dTOkSftlCNxg1ri53Sxz04BLj03po3rHG8dIHCMBIFUNwFwGUa40cfkArjj_JSf8REUaiCaccABgwo8=w1291-h969-no?authuser=0");
        background-position: center;
        background-size: 100%;
        border: 2px solid white;
    }
    #about-me-txt {
        color: white;
        padding: 0.7rem 1rem;
        font-size: 1.4rem;
    }
</style>