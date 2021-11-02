<script>
	import { onMount } from "svelte";
	import Gallery from "./pages/Gallery.svelte";
	import AboutMe from "./pages/AboutMe.svelte";
	import BestArt from "./pages/BestArt.svelte";
	import Timeline from "./pages/Timeline.svelte";
	import Statement from "./pages/Statement.svelte";
	import Secret from "./pages/Secret.svelte";

	let background;
	let main_wrapper;
	onMount(()=>{ 
		background = document.getElementById("background"); 
		main_wrapper = document.getElementById("main-wrapper"); 
		// toggle_background();
	});
	
	let background_out = false;

	let bind_show0 = false;
	let bind_show1 = false;
	let bind_show2 = false;
	let bind_show3 = false;
	let bind_show4 = false;
	let bind_show5 = false;

	let show0 = false;
	let show1 = false;
	let show2 = false;
	let show3 = false;
	let show4 = false;
	let show5 = false;

	const toggle_background = ()=>{
		if (background_out) background.style.clipPath = "circle(2% at 75% 50%)";
		else background.style.clipPath = "circle(100% at 75% 50%)";
		
		background_out = !background_out;
	}
	const enter_background = ()=>{
		if (!background_out) background.style.clipPath = "circle(3% at 75% 50%)";
	}
	const leave_background = ()=>{
		if (!background_out) background.style.clipPath = "circle(2% at 75% 50%)";
	}
	const load_menu = (num)=>{
		if (num == 0) bind_show0 = true;
		else if (num == 1) bind_show1 = true;
		else if (num == 2) bind_show2 = true;
		else if (num == 3) bind_show3 = true;
		else if (num == 4) bind_show4 = true;
		else if (num == 5) bind_show5 = true;

		if (num == 0) show0 = true;
		else if (num == 1) show1 = true;
		else if (num == 2) show2 = true;
		else if (num == 3) show3 = true;
		else if (num == 4) show4 = true;
		else if (num == 5) show5 = true;

		main_wrapper.style.transform = "translate(-100%, 0)";
		// setTimeout(() => { toggle_background(); }, 300);
	}

	// setTimeout(() => { toggle_background(); load_menu(0); }, 500);
	const hide_component = (num)=>{
		if (num == 0) bind_show0 = false;
		else if (num == 1) bind_show1 = false;
		else if (num == 2) bind_show2 = false;
		else if (num == 3) bind_show3 = false;
		else if (num == 4) bind_show4 = false;
		else if (num == 5) bind_show5 = false;

		setTimeout(() => {
			if (num == 0) show0 = false;
			else if (num == 1) show1 = false;
			else if (num == 2) show2 = false;
			else if (num == 3) show3 = false;
			else if (num == 4) show4 = false;
			else if (num == 5) show5 = false;
		}, 510);

		main_wrapper.style.transform = "translate(0, 0)";
	}

	const handle_key_down = (e)=>{
		if (e.key != "Escape") return;
		bind_show0 = false;
		bind_show1 = false;
		bind_show2 = false;
		bind_show3 = false;
		bind_show4 = false;
		bind_show5 = false;
		main_wrapper.style.transform = "translate(0, 0)";
	}
</script>

<svelte:window on:keydown={handle_key_down}/>

<main id="main-wrapper">
	<h1 id="title">Jacoby's Art Porfolio</h1>
	<div id="background" on:click|self={toggle_background} on:mouseenter={enter_background} on:mouseleave={leave_background}>
		<div id="menu-txt-wrapper">
			<div class="menu-txt" on:click={()=>load_menu(0)}>Gallery</div>
			<div class="menu-txt" on:click={()=>load_menu(1)}>Best Art</div>
			<div class="menu-txt" on:click={()=>load_menu(2)}>About Me</div>
			<div class="menu-txt" on:click={()=>load_menu(3)}>Artist Statement</div>
			<div class="menu-txt" on:click={()=>load_menu(4)}>Art History Timeline</div>
			<div class="secret-txt" on:click={()=>load_menu(5)}>Secret</div>
		</div>
	</div>
</main>

{#if show0} <Gallery   shown={bind_show0} on:click={()=>hide_component(0)}/> {/if}
{#if show1} <BestArt   shown={bind_show1} on:click={()=>hide_component(1)}/> {/if}
{#if show2} <AboutMe   shown={bind_show2} on:click={()=>hide_component(2)}/> {/if}
{#if show3} <Statement shown={bind_show3} on:click={()=>hide_component(3)}/> {/if}
{#if show4} <Timeline  shown={bind_show4} on:click={()=>hide_component(4)}/> {/if}
{#if show5} <Secret  shown={bind_show5} on:click={()=>hide_component(5)}/> {/if}

<style>
	#main-wrapper {
		-moz-user-select: none;
		-webkit-user-select: none;
		transition-duration: 0.5s;
		/* transition-timing-function: linear; */
		position: absolute;
		width: 100%; height: 100%;
	}
	#title {
		position: absolute;
		left: 50%; top: 50%;
		transform: translate(-50%, -50%);
		font-size: 3rem;
		color: white;
	}
	#background {
		position: absolute;
		background-color: #495b6f;
		width: 100%; height: 100%;
		clip-path: circle(2% at 75% 50%);
		transition-duration: 0.3s;
		display: grid;
		justify-items: center;
		align-items: center;
	}
	#menu-txt-wrapper {
		display: grid;
		width: max-content;
	}
	.menu-txt {
		padding: 1rem;
		font-weight: bold;
		font-size: 3rem;
		text-align: center;
		transition-duration: 0.2s;
		color: white;
	}
	.menu-txt:hover {
		font-size: 3.5rem;
	}

	.secret-txt {
		position: absolute;
		top: 0;
		left: 0;
		font-size: 1rem;

		padding: 1rem;
		font-weight: bold;
		text-align: center;
		transition-duration: 0.2s;
		color: white;
	}
	.secret-txt:hover {
		font-size: 1.2rem;
		padding: 0.8rem;
	}
</style>